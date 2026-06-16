// Spieler-Bausteine, geteilt zwischen Teams-Rubrik und Live-Ereignissen (PlayerPeek):
// gebündelte Fotos/Credits, Positions-Labels und das Matching ESPN-Name → Kader-Karte.
import playerCreditsJson from '../assets/players/credits.json'
import { squad } from './info'
import type { SquadPlayer } from './types'

export const POS_LABEL: Record<SquadPlayer['pos'], string> = {
  TW: 'Torhüter',
  AB: 'Verteidigung',
  MF: 'Mittelfeld',
  ST: 'Sturm'
}

/** Gebündelte Spielerfotos (Wikimedia Commons, frei lizenziert) — Dateiname = playerSlug(). */
const playerFiles = import.meta.glob('../assets/players/*.jpg', { eager: true, import: 'default' }) as Record<
  string,
  string
>
export const PLAYER_PHOTOS = new Map(Object.entries(playerFiles).map(([path, url]) => [path.replace(/.*\/(.+)\.jpg$/, '$1'), url]))
export const PLAYER_CREDITS = playerCreditsJson as Record<string, { author: string; license: string }>

export const initials = (name: string): string => {
  const parts = name.replace(/[«»]/g, '').split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

/** Name → normalisierte Token (lowercase, Diakritika weg, Bindestriche getrennt). */
const tokens = (name: string): string[] =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

/**
 * Findet den Kader-Spieler zu einem ESPN-Ereignis. ESPN und Wikipedia schreiben Namen
 * unterschiedlich (Reihenfolge bei koreanischen Namen, Kurzformen, Diakritika):
 * 1. Token-Mengen-Vergleich (reihenfolgeunabhängig: „Hwang In-Beom" = „In-beom Hwang"),
 * 2. Trikotnummer (offizielle WM-Kadernummer, eindeutig pro Team),
 * 3. Nachname (letztes ESPN-Token), wenn er genau einen Kader-Spieler trifft.
 */
export function findSquadPlayer(teamId: string, espnName: string, jersey?: string): SquadPlayer | undefined {
  const players = squad(teamId)
  if (players.length === 0) return undefined
  const want = tokens(espnName)
  const wantSet = new Set(want)

  const exact = players.filter((p) => {
    const have = tokens(p.name)
    return have.length === wantSet.size && have.every((t) => wantSet.has(t))
  })
  if (exact.length === 1) return exact[0]

  if (jersey) {
    const byNo = players.find((p) => String(p.no) === jersey)
    if (byNo) return byNo
  }

  const last = want[want.length - 1]
  if (last) {
    const byLast = players.filter((p) => tokens(p.name).includes(last))
    if (byLast.length === 1) return byLast[0]
  }
  return undefined
}
