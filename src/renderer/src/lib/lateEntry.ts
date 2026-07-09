import { KO_MATCHES } from './bracket'
import { SCHEDULE } from './data'
import type { TipBracket } from './bracket'
import type { BonusRound } from './scoring'
import type { Entry, EntryKind, LiveResult, ScheduledMatch, Tip } from './types'

// KO-Runden-Tipp: pro KO-Runde eine eigene Wertungskategorie. Es wird NUR die
// jeweilige Runde mit den echten Paarungen getippt (kein Durchtippen bis Finale,
// keine Teilnehmer-Boni, kein eigener Champion). Der Weltmeister-Bonus bleibt allein
// in der Hauptwertung (main), wo er beim Durchtippen ab Spiel 1 schon getippt wurde.

export type LateKind = Exclude<EntryKind, 'main'>

export interface LateEntryDef {
  kind: LateKind
  /** Chip-Beschriftung */
  label: string
  title: string
  /** erste Spielnummer der Kategorie */
  fromMatch: number
  /**
   * Runden mit Teilnehmer-Bonus. Im Runden-Tipp leer ([]): es wird nur die eine
   * Runde getippt, also gibt es keine Durchtipp-/Teilnehmer-Boni. Feld bleibt
   * erhalten, damit die computeBreakdown-Aufrufer unverändert gültig sind.
   */
  bonusRounds: readonly BonusRound[]
}

export const LATE_ENTRIES: LateEntryDef[] = [
  { kind: 'fromR32', label: '1/16', title: 'Sechzehntelfinale', fromMatch: 73, bonusRounds: [] },
  { kind: 'fromR16', label: '1/8', title: 'Achtelfinale', fromMatch: 89, bonusRounds: [] },
  { kind: 'fromQF', label: 'VF', title: 'Viertelfinale', fromMatch: 97, bonusRounds: [] },
  { kind: 'fromSF', label: 'HF', title: 'Halbfinale', fromMatch: 101, bonusRounds: [] }
]

/** Spiele einer KO-Runden-Kategorie: nur die jeweilige Runde selbst (echte Paarungen). */
export const entrySchedule = (def: LateEntryDef): ScheduledMatch[] => {
  const round = SCHEDULE.find((m) => m.match === def.fromMatch)!.round
  return SCHEDULE.filter((m) => m.round === round)
}

const isTeamId = (slot: string | undefined): slot is string => !!slot && /^[A-Z]{3}$/.test(slot)

/**
 * KO-Baum einer Späteinstiegs-Kategorie. Team-Auflösung je Spiel:
 * echte Teams (ESPN, auch vor Anpfiff) → echte Auflösung der Endstände →
 * eigene Tipp-Kette (W/L aus den Kategorie-Tipps) → Platzhalter.
 * Tabellen/Dritte kommen unverändert aus der echten Welt (realBracket).
 */
export function resolveLateBracket(
  tips: Record<number, Tip>,
  results: Record<number, LiveResult>,
  realBracket: TipBracket
): TipBracket {
  const teams: Record<number, { home: string; away: string }> = {}
  const winner: Record<number, string | undefined> = {}
  const loser: Record<number, string | undefined> = {}

  const fromChain = (slot: string): string => {
    let m: RegExpExecArray | null
    if ((m = /^W(\d+)$/.exec(slot))) return winner[Number(m[1])] ?? slot
    if ((m = /^L(\d+)$/.exec(slot))) return loser[Number(m[1])] ?? slot
    return slot
  }

  for (const bm of [...KO_MATCHES].sort((a, b) => a.match - b.match)) {
    const r = results[bm.match]
    const real = realBracket.teams[bm.match]
    const home = isTeamId(r?.homeTeam) ? r.homeTeam : isTeamId(real?.home) ? real.home : fromChain(bm.home)
    const away = isTeamId(r?.awayTeam) ? r.awayTeam : isTeamId(real?.away) ? real.away : fromChain(bm.away)
    teams[bm.match] = { home, away }

    const tip = tips[bm.match]
    if (tip && isTeamId(home) && isTeamId(away)) {
      if (tip.h > tip.a) {
        winner[bm.match] = home
        loser[bm.match] = away
      } else if (tip.h < tip.a) {
        winner[bm.match] = away
        loser[bm.match] = home
      } else if (tip.adv) {
        winner[bm.match] = tip.adv === 'home' ? home : away
        loser[bm.match] = tip.adv === 'home' ? away : home
      }
    }
  }

  // champion bewusst undefined: im Runden-Tipp gibt es keinen Kategorie-Champion
  // (der Weltmeister-Bonus lebt in main). Ohne dieses Überschreiben käme via
  // ...realBracket der ECHTE Champion durch → +10 würde fälschlich immer zählen.
  return { ...realBracket, teams, winner, champion: undefined }
}

// Zuordnung Spielnummer → Kategorie: KO-Spiele einer Späteinstiegs-Runde gehören zu
// deren eigener Wertung (fromR32/fromR16/…), alles andere (Gruppen + Finale/Platz 3
// → keine Späteinstiegs-Runde) zu 'main'. Einmal beim Modulstart gebaut.
const MATCH_KIND = new Map<number, LateKind>()
for (const def of LATE_ENTRIES) for (const m of entrySchedule(def)) MATCH_KIND.set(m.match, def.kind)

/** Anzeige-/Zuordnungskategorie eines Spiels. Gruppen + Finale/Platz 3 → 'main'. */
export const entryKindForMatch = (match: number): EntryKind => MATCH_KIND.get(match) ?? 'main'

/**
 * Anzeige-Tipps über alle Kategorien zusammengeführt: pro Spiel der Tipp aus der
 * ZUSTÄNDIGEN Kategorie — bei einer echten KO-Paarung also der Rundentipp
 * (fromR16 …), sonst der main-Tipp. Damit zeigen Heute/Live/Spielplan bei KO-Spielen
 * den Rundentipp und NICHT den (im Hintergrund weiterlaufenden) Durchtipp aus main.
 * Ein KO-Spiel ohne Rundentipp bleibt bewusst ohne Anzeige-Tipp (kein main-Fallback).
 */
export function mergeDisplayTips(
  entries: Partial<Record<EntryKind, Entry>> | undefined
): Record<number, Tip> {
  const out: Record<number, Tip> = {}
  if (!entries) return out
  for (const [m, tip] of Object.entries(entries.main?.tips ?? {})) {
    if (!MATCH_KIND.has(Number(m))) out[Number(m)] = tip
  }
  for (const def of LATE_ENTRIES) {
    const t = entries[def.kind]?.tips
    if (t) for (const [m, tip] of Object.entries(t)) out[Number(m)] = tip
  }
  return out
}
