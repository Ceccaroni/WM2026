// Torjägerliste („Goldener Schuh") aus den MatchEvents — deterministisch aus results
// gebaut, nichts persistiert (gleiche Philosophie wie lib/chronik / lib/achievements).
import { findSquadPlayer } from './players'
import type { LiveResult, SquadPlayer } from './types'

export interface ScorerEntry {
  teamId: string
  /** Anzeigename: Kader-Name, sonst ESPN-Name */
  name: string
  /** gematchte Kader-Karte → Klick öffnet die Panini-Karte + liefert das Foto */
  squad?: SquadPlayer
  goals: number
  /** davon Elfmeter */
  penalties: number
}

/**
 * Zählt Tore (inkl. verwandelte Elfmeter) je Spieler über alle Spiele. Eigentore zählen
 * NICHT (offizielle Torjäger-Zählung; ESPN ordnet sie ohnehin dem profitierenden Team zu,
 * nicht dem Schützen). Spieler-Identität über die Kader-Karte (Trikotnummer/Name), Fallback
 * roher ESPN-Name. Sortierung: Tore ↓, dann weniger Elfmeter, dann Name.
 */
export function buildScorers(results: Record<number, LiveResult>): ScorerEntry[] {
  const map = new Map<string, ScorerEntry>()
  for (const r of Object.values(results)) {
    if (!r.events) continue
    for (const e of r.events) {
      if (e.kind !== 'goal' && e.kind !== 'pen') continue
      const teamId = e.side === 'home' ? r.homeTeam : r.awayTeam
      if (!teamId) continue
      const squad = findSquadPlayer(teamId, e.player, e.jersey)
      const key = squad ? `${teamId}:${squad.no}` : `${teamId}:${e.player.toLowerCase()}`
      const entry = map.get(key) ?? { teamId, name: squad?.name ?? e.player, squad, goals: 0, penalties: 0 }
      entry.goals++
      if (e.kind === 'pen') entry.penalties++
      map.set(key, entry)
    }
  }
  return [...map.values()].sort(
    (a, b) => b.goals - a.goals || a.penalties - b.penalties || a.name.localeCompare(b.name, 'de')
  )
}
