import type { TipBracket } from './bracket'
import type { LiveResult, Round, ScheduledMatch, ScoringConfig, Tip } from './types'

// Vollständige Wertung nach BRIEFING.md §5 (bestätigt 11.06.2026):
// Basispunkte 4/3/2 pro Spiel (Score-Vergleich pro Spielnummer, auch KO — die
// team-bezogene Treffsicherheit belohnen Weiterkommer- und Durchtipp-Boni),
// +1 je richtigem KO-Weiterkommer, Runden-Boni je korrekt getipptem
// Achtelfinalisten/…/Weltmeister.

export type BaseKind = 'exact' | 'diff' | 'tendency' | 'none'

/** Wertungsklasse des Basistipps (nur beendete Spiele). */
export function baseKind(tip: Tip, result: LiveResult): BaseKind {
  if (result.status !== 'finished' || result.homeScore == null || result.awayScore == null) return 'none'
  const { homeScore: rh, awayScore: ra } = result
  if (tip.h === rh && tip.a === ra) return 'exact'
  const tipDiff = tip.h - tip.a
  const resDiff = rh - ra
  if (tipDiff === resDiff) return 'diff' // deckt auch "richtiges Unentschieden, falsches Ergebnis" ab
  if (Math.sign(tipDiff) === Math.sign(resDiff)) return 'tendency'
  return 'none'
}

const basePts = (kind: BaseKind, cfg: ScoringConfig): number =>
  kind === 'exact' ? cfg.exact : kind === 'diff' ? cfg.diff : kind === 'tendency' ? cfg.tendency : 0

/** Basispunkte für ein einzelnes Spiel. */
export function scoreMatch(tip: Tip, result: LiveResult, cfg: ScoringConfig): number {
  return basePts(baseKind(tip, result), cfg)
}

/** Echte Turnierfakten, gegen die gewertet wird (Builder: lib/results.ts → buildRealWorld). */
export interface RealWorld {
  /** echter Weiterkommer (TeamId) je KO-Spielnummer, soweit entschieden */
  koWinner: Record<number, string>
  /** echte Teilnehmer je Runde, soweit bekannt (r16 = Achtelfinalisten usw.) */
  roundTeams: { r16: Set<string>; qf: Set<string>; sf: Set<string>; final: Set<string> }
  champion?: string
}

export interface ScoreBreakdown {
  total: number
  /** Summe Basispunkte + Trefferzähler */
  base: number
  exact: number
  diff: number
  tendency: number
  /** KO-Weiterkommer-Boni */
  advance: number
  advanceCount: number
  /** Durchtipp-Boni: Anzahl korrekter Teilnehmer je Runde, champion = Weltmeister korrekt */
  durchtipp: { r16: number; qf: number; sf: number; final: number; champion: boolean }
  durchtippPts: number
  /** Basispunkte je Gruppen-Spieltag */
  byMatchday: Record<1 | 2 | 3, number>
  /** Spielpunkte (Basis + Weiterkommer) je KO-Runde */
  byRound: Partial<Record<Round, number>>
  /** Spielnummer → Punkte dieses Spiels */
  perMatch: Record<number, { base: number; advance: number }>
}

const isTeamId = (slot: string | undefined): slot is string => !!slot && /^[A-Z]{3}$/.test(slot)

export const BONUS_ROUNDS = ['r16', 'qf', 'sf', 'final'] as const
export type BonusRound = (typeof BONUS_ROUNDS)[number]

const bonusPts = (round: BonusRound, cfg: ScoringConfig): number =>
  round === 'r16' ? cfg.bonusR16 : round === 'qf' ? cfg.bonusQF : round === 'sf' ? cfg.bonusSF : cfg.bonusFinal

/**
 * Komplette Wertung eines Tippbogens gegen die echte Welt.
 * tipBracket = resolveTipBracket(tips) des Tippers (Hauptwertung) bzw.
 * resolveLateBracket(...) für Späteinstiegs-Kategorien.
 * schedule = die Spiele der Wertungskategorie (Hauptwertung: alle 104).
 * bonusRounds = Runden mit Teilnehmer-Bonus — bei Späteinstieg zählt die
 * Einstiegsrunde nicht (deren Feld ist real vorgegeben, kein Tipp).
 */
export function computeBreakdown(
  tips: Record<number, Tip>,
  tipBracket: TipBracket,
  results: Record<number, LiveResult>,
  real: RealWorld,
  schedule: ScheduledMatch[],
  cfg: ScoringConfig,
  bonusRounds: readonly BonusRound[] = BONUS_ROUNDS
): ScoreBreakdown {
  const bd: ScoreBreakdown = {
    total: 0,
    base: 0,
    exact: 0,
    diff: 0,
    tendency: 0,
    advance: 0,
    advanceCount: 0,
    durchtipp: { r16: 0, qf: 0, sf: 0, final: 0, champion: false },
    durchtippPts: 0,
    byMatchday: { 1: 0, 2: 0, 3: 0 },
    byRound: {},
    perMatch: {}
  }

  for (const m of schedule) {
    const tip = tips[m.match]
    const result = results[m.match]
    if (!tip || !result) continue

    const kind = baseKind(tip, result)
    const base = basePts(kind, cfg)
    if (kind !== 'none') bd[kind]++
    bd.base += base

    let advance = 0
    if (m.round !== 'group') {
      const mine = tipBracket.winner[m.match]
      const realWinner = real.koWinner[m.match]
      if (mine && realWinner && mine === realWinner) {
        advance = cfg.koAdvance
        bd.advanceCount++
        bd.advance += advance
      }
    }

    if (base + advance > 0) bd.perMatch[m.match] = { base, advance }
    if (m.round === 'group') {
      if (m.matchday) bd.byMatchday[m.matchday] += base
    } else {
      bd.byRound[m.round] = (bd.byRound[m.round] ?? 0) + base + advance
    }
  }

  // Durchtipp-Boni: je korrekt getippter Runden-Teilnehmer (Schnittmenge Tipp-Welt/echte Welt)
  for (const round of bonusRounds) {
    const realTeams = real.roundTeams[round]
    if (realTeams.size === 0) continue
    const tipped = new Set<string>()
    for (const m of schedule) {
      if (m.round !== round) continue
      const t = tipBracket.teams[m.match]
      if (isTeamId(t?.home)) tipped.add(t.home)
      if (isTeamId(t?.away)) tipped.add(t.away)
    }
    for (const team of tipped) {
      if (realTeams.has(team)) {
        bd.durchtipp[round]++
        bd.durchtippPts += bonusPts(round, cfg)
      }
    }
  }
  if (real.champion && tipBracket.champion === real.champion) {
    bd.durchtipp.champion = true
    bd.durchtippPts += cfg.bonusChampion
  }

  bd.total = bd.base + bd.advance + bd.durchtippPts
  return bd
}
