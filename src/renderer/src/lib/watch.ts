// Tipp-Wächter: welche heutigen Spiele sind noch tippbar, aber ungetippt?
// Deadline ist der Anstoß (BRIEFING §3.2) — KO-Spiele zählen erst, wenn die
// eigene Tipp-Kette beide Teams aufgelöst hat (vorher sind die Stepper gesperrt).
import { resolveTipBracket } from './bracket'
import { SCHEDULE, TEAM_BY_ID } from './data'
import { dayKey, todayKey } from './time'
import type { ScheduledMatch, Tip } from './types'

export function openTipMatches(tips: Record<number, Tip>, now = Date.now()): ScheduledMatch[] {
  const today = todayKey()
  const candidates = SCHEDULE.filter(
    (m) => dayKey(m.dateUtc) === today && Date.parse(m.dateUtc) > now && tips[m.match] == null
  )
  if (candidates.length === 0 || candidates.every((m) => m.round === 'group')) return candidates
  const bracket = resolveTipBracket(tips)
  return candidates.filter((m) => {
    if (m.round === 'group') return true
    const slots = bracket.teams[m.match]
    return TEAM_BY_ID.has(slots.home) && TEAM_BY_ID.has(slots.away)
  })
}
