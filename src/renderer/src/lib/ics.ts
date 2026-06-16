// Spielplan-Export als iCalendar (Kür): VEVENTs in UTC, Stadion als Ort,
// KO-Platzhalter als Klartext ("Sieger A – Zweiter B"). RFC-5545-Basics:
// CRLF-Zeilenenden, Escaping von Komma/Semikolon.
import { ROUND_LABEL, slotInfo, STADIUM_BY_ID } from './data'
import type { ScheduledMatch } from './types'

const esc = (s: string): string => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')

/** "2026-06-11T19:00:00Z" / ISO mit Millis → "20260611T190000Z" */
const dt = (iso: string): string => iso.replace(/\.\d{3}/, '').replace(/[-:]/g, '')

export function buildIcs(matches: ScheduledMatch[], stampIso: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WM26 Tipp//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:FIFA World Cup 26'
  ]
  for (const m of matches) {
    const stadium = STADIUM_BY_ID.get(m.stadium)!
    const end = new Date(Date.parse(m.dateUtc) + 2 * 3600_000).toISOString()
    lines.push(
      'BEGIN:VEVENT',
      `UID:wm26-spiel-${m.match}@wm26tipp.local`,
      `DTSTAMP:${dt(stampIso)}`,
      `DTSTART:${dt(m.dateUtc)}`,
      `DTEND:${dt(end)}`,
      `SUMMARY:${esc(`⚽ ${slotInfo(m.home).name} – ${slotInfo(m.away).name} (Spiel ${m.match})`)}`,
      `LOCATION:${esc(`${stadium.commonName}, ${stadium.city}, ${stadium.country}`)}`,
      `DESCRIPTION:${esc(`${m.group ? `Gruppe ${m.group}` : ROUND_LABEL[m.round]} · FIFA World Cup 26`)}`,
      'END:VEVENT'
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
