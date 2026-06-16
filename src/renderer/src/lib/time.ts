// Alle Anzeigen in Schweizer Lokalzeit (MEZ/MESZ); das Turnier liegt komplett
// in der Sommerzeit (MESZ, UTC+2). BRIEFING.md §11.5
const TZ = 'Europe/Zurich'

const dayFmt = new Intl.DateTimeFormat('de-CH', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ })
const shortFmt = new Intl.DateTimeFormat('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: TZ })
const timeFmt = new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
const keyFmt = new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: TZ })

/** Kalendertag in der Anzeige-Zeitzone, z. B. "2026-06-11" — als Gruppierungsschlüssel. */
export const dayKey = (iso: string): string => keyFmt.format(new Date(iso))

/** z. B. "Donnerstag, 11. Juni" */
export const dayLabel = (iso: string): string => dayFmt.format(new Date(iso))

/** z. B. "Do, 11.06." */
export const dayShort = (iso: string): string => shortFmt.format(new Date(iso))

/** Anstoßzeit, z. B. "21:00" */
export const kickoffTime = (iso: string): string => timeFmt.format(new Date(iso))

export const todayKey = (): string => keyFmt.format(new Date())

/** Tipp-Deadline: ab Anstoß ist das Spiel gesperrt (BRIEFING.md §3.2). */
export const isLocked = (iso: string): boolean => Date.parse(iso) <= Date.now()
