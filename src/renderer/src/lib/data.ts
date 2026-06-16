import scheduleJson from '@data/schedule.json'
import stadiumsJson from '@data/stadiums.json'
import teamsJson from '@data/teams.json'
import type { GroupId, Round, ScheduledMatch, Stadium, Team } from './types'

export const TEAMS = teamsJson as Team[]
export const STADIUMS = stadiumsJson as Stadium[]
export const SCHEDULE = (scheduleJson as ScheduledMatch[]).slice().sort((a, b) => a.match - b.match)

export const TEAM_BY_ID = new Map(TEAMS.map((t) => [t.id, t]))
export const STADIUM_BY_ID = new Map(STADIUMS.map((s) => [s.id, s]))

export const GROUPS: GroupId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export const GROUP_TEAMS: Record<GroupId, Team[]> = Object.fromEntries(
  GROUPS.map((g) => [g, TEAMS.filter((t) => t.group === g)])
) as Record<GroupId, Team[]>

export const GROUP_MATCHES: Record<GroupId, ScheduledMatch[]> = Object.fromEntries(
  GROUPS.map((g) => [g, SCHEDULE.filter((m) => m.group === g)])
) as Record<GroupId, ScheduledMatch[]>

export const ROUND_LABEL: Record<Round, string> = {
  group: 'Gruppenphase',
  r32: 'Sechzehntelfinale',
  r16: 'Achtelfinale',
  qf: 'Viertelfinale',
  sf: 'Halbfinale',
  third: 'Spiel um Platz 3',
  final: 'Finale'
}

export interface SlotInfo {
  name: string
  flag?: string
  /** Aufdruck des Platzhalter-Stickers (Gruppenbuchstabe bzw. Spielnummer) */
  badge?: string
  /** true = noch kein konkretes Team (KO-Platzhalter) */
  placeholder: boolean
}

/**
 * Daten-Release-Override (BRIEFING §11.11): korrigiert Anstoßzeiten/Stadien in-place,
 * BEVOR React rendert (Aufruf aus main.tsx-Bootstrap) — GROUP_MATCHES & Co. halten
 * dieselben Objektreferenzen und sehen die Korrektur damit automatisch.
 */
export function patchSchedule(patches: Record<number, { dateUtc?: string; stadium?: string }>): void {
  for (const m of SCHEDULE) {
    const p = patches[m.match]
    if (!p) continue
    if (p.dateUtc) m.dateUtc = p.dateUtc
    if (p.stadium && STADIUM_BY_ID.has(p.stadium)) m.stadium = p.stadium
  }
}

/** Löst eine TeamId oder einen KO-Platzhalter ("2A", "3ABCDF", "W73", "L101") in Anzeige-Infos auf. */
export function slotInfo(slot: string): SlotInfo {
  const team = TEAM_BY_ID.get(slot)
  if (team) return { name: team.name, flag: team.flag, placeholder: false }
  let m: RegExpExecArray | null
  if ((m = /^([12])([A-L])$/.exec(slot))) {
    return { name: `${m[1] === '1' ? 'Sieger' : 'Zweiter'} ${m[2]}`, badge: m[2], placeholder: true }
  }
  if ((m = /^3([A-L]+)$/.exec(slot))) {
    return { name: `3. ${m[1].split('').join('/')}`, badge: '3.', placeholder: true }
  }
  if ((m = /^W(\d+)$/.exec(slot))) return { name: `Sieger Spiel ${m[1]}`, badge: m[1], placeholder: true }
  if ((m = /^L(\d+)$/.exec(slot))) return { name: `Verlierer Spiel ${m[1]}`, badge: m[1], placeholder: true }
  return { name: slot, placeholder: true }
}
