import { SCHEDULE } from './data'
import type { TipBracket } from './bracket'
import type { RealWorld } from './scoring'
import type { LiveResult, Tip } from './types'

/**
 * Echte Ergebnisse in Tipp-Form (h/a/adv) — damit laufen sie unverändert durch
 * computeGroupTable() und resolveTipBracket(): echte Tabellen und echter Baum sind dieselbe
 * Maschinerie wie die Tipp-Welt. adv = Sieger bei Gleichstand (Elfmeterschießen).
 * Standard: nur Endstände (Wertung!). `includeLive` nimmt laufende Spiele mit ihrem
 * aktuellen Stand dazu — NUR für die „Stand jetzt"-Anzeige (Live-Tabellen/-Baum),
 * nie für die Punkteberechnung.
 */
export function resultsAsTips(results: Record<number, LiveResult>, includeLive = false): Record<number, Tip> {
  const tips: Record<number, Tip> = {}
  for (const r of Object.values(results)) {
    const counts = r.status === 'finished' || (includeLive && (r.status === 'live' || r.status === 'ht'))
    if (!counts || r.homeScore == null || r.awayScore == null) continue
    const tip: Tip = { h: r.homeScore, a: r.awayScore }
    if (r.winner && r.homeScore === r.awayScore) tip.adv = r.winner
    tips[r.match] = tip
  }
  return tips
}

const isTeamId = (slot: string | undefined): slot is string => !!slot && /^[A-Z]{3}$/.test(slot)

/**
 * Echte Turnierfakten für die Wertung: Weiterkommer und Runden-Teilnehmer, soweit bekannt.
 * Teams primär aus ESPN (`LiveResult.homeTeam/awayTeam`, auch vor Anpfiff), sonst aus der
 * eigenen Auflösung der echten Endstände (realBracket = resolveTipBracket(resultsAsTips(...))).
 */
export function buildRealWorld(results: Record<number, LiveResult>, realBracket: TipBracket): RealWorld {
  const real: RealWorld = {
    koWinner: {},
    roundTeams: { r16: new Set(), qf: new Set(), sf: new Set(), final: new Set() }
  }
  for (const m of SCHEDULE) {
    if (m.round === 'group') continue
    const r = results[m.match]
    const resolved = realBracket.teams[m.match]
    const home = isTeamId(r?.homeTeam) ? r.homeTeam : isTeamId(resolved?.home) ? resolved.home : undefined
    const away = isTeamId(r?.awayTeam) ? r.awayTeam : isTeamId(resolved?.away) ? resolved.away : undefined

    if (m.round === 'r16' || m.round === 'qf' || m.round === 'sf' || m.round === 'final') {
      if (home) real.roundTeams[m.round].add(home)
      if (away) real.roundTeams[m.round].add(away)
    }

    if (r?.status === 'finished' && r.winner) {
      const w = r.winner === 'home' ? home : away
      if (w) real.koWinner[m.match] = w
    }
    if (!real.koWinner[m.match] && isTeamId(realBracket.winner[m.match])) {
      real.koWinner[m.match] = realBracket.winner[m.match]!
    }
  }
  real.champion = real.koWinner[104]
  return real
}
