import { KO_MATCHES } from './bracket'
import { SCHEDULE } from './data'
import type { TipBracket } from './bracket'
import type { BonusRound } from './scoring'
import type { EntryKind, LiveResult, ScheduledMatch, Tip } from './types'

// KO-Späteinstieg (BRIEFING §3.5): pro Einstiegsrunde eine eigene Wertungskategorie.
// Die Einstiegsrunde ist mit den echten Qualifikanten vorbefüllt; ab dort wird
// durchgetippt wie in der Hauptwertung.

export type LateKind = Exclude<EntryKind, 'main'>

export interface LateEntryDef {
  kind: LateKind
  /** Chip-Beschriftung */
  label: string
  title: string
  /** erste Spielnummer der Kategorie */
  fromMatch: number
  /**
   * Runden mit Teilnehmer-Bonus: die Einstiegsrunde zählt nicht —
   * ihr Feld ist real vorgegeben, kein Tipp.
   */
  bonusRounds: readonly BonusRound[]
}

export const LATE_ENTRIES: LateEntryDef[] = [
  { kind: 'fromR32', label: 'ab 1/16', title: 'Ab Sechzehntelfinale', fromMatch: 73, bonusRounds: ['r16', 'qf', 'sf', 'final'] },
  { kind: 'fromR16', label: 'ab 1/8', title: 'Ab Achtelfinale', fromMatch: 89, bonusRounds: ['qf', 'sf', 'final'] },
  { kind: 'fromQF', label: 'ab VF', title: 'Ab Viertelfinale', fromMatch: 97, bonusRounds: ['sf', 'final'] },
  { kind: 'fromSF', label: 'ab HF', title: 'Ab Halbfinale', fromMatch: 101, bonusRounds: ['final'] }
]

/** Spiele einer Späteinstiegs-Kategorie (Einstiegsrunde bis Finale). */
export const entrySchedule = (def: LateEntryDef): ScheduledMatch[] => SCHEDULE.filter((m) => m.match >= def.fromMatch)

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

  return { ...realBracket, teams, winner, champion: winner[104] }
}
