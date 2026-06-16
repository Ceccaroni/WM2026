// Kuratierte Daten-Releases (BRIEFING.md §3.6/§3.7/§6): Team-/Stadion-Dossiers und
// Quoten-Snapshot. Dossiers liegen als einzelne JSON-Dateien in resources/data/teaminfo/
// bzw. stadiuminfo/ — fehlt eine Datei, zeigt das UI den Grundzustand ohne Dossier.
import coachesJson from '@data/coaches.json'
import oddsJson from '@data/odds.json'
import type { OddsSnapshot, SquadPlayer, StadiumInfo, TeamInfo } from './types'

export const ODDS = oddsJson as OddsSnapshot

/** Cheftrainer je Team (FIFA-Trigramm → Name). Eigene Datenquelle — ESPN liefert keinen Trainer.
 *  Mutierbare Kopie, damit ein Daten-Release Trainerwechsel OTA überschreiben kann. */
const COACHES: Record<string, string> = { ...(coachesJson as Record<string, string>) }

/** Cheftrainer eines Teams (undefined, wenn nicht gepflegt). */
export const coach = (teamId: string): string | undefined => COACHES[teamId]

const teamInfoFiles = import.meta.glob('@data/teaminfo/*.json', { eager: true, import: 'default' })
const TEAMINFO = new Map((Object.values(teamInfoFiles) as TeamInfo[]).map((i) => [i.id, i]))

const stadiumInfoFiles = import.meta.glob('@data/stadiuminfo/*.json', { eager: true, import: 'default' })
const STADIUMINFO = new Map((Object.values(stadiumInfoFiles) as StadiumInfo[]).map((i) => [i.id, i]))

export const teamInfo = (id: string): TeamInfo | undefined => TEAMINFO.get(id)
export const stadiumInfo = (id: string): StadiumInfo | undefined => STADIUMINFO.get(id)

const squadFiles = import.meta.glob('@data/squads/*.json', { eager: true, import: 'default' })
const SQUADS = new Map(
  Object.entries(squadFiles).map(([path, list]) => [path.replace(/.*\/(.+)\.json$/, '$1'), list as SquadPlayer[]])
)

/** Kompletter 26er-Kader eines Teams (leer, falls noch kein Daten-Release vorliegt). */
export const squad = (teamId: string): SquadPlayer[] => SQUADS.get(teamId) ?? []

/** Daten-Release-Override für Dossiers/Quoten/Kader — vor dem ersten Render anwenden. */
export function applyInfoOverride(data: {
  teaminfo?: Record<string, TeamInfo>
  stadiuminfo?: Record<string, StadiumInfo>
  odds?: OddsSnapshot
  squads?: Record<string, SquadPlayer[]>
  coaches?: Record<string, string>
}): void {
  for (const [id, info] of Object.entries(data.teaminfo ?? {})) TEAMINFO.set(id, info)
  for (const [id, info] of Object.entries(data.stadiuminfo ?? {})) STADIUMINFO.set(id, info)
  for (const [id, list] of Object.entries(data.squads ?? {})) SQUADS.set(id, list)
  for (const [id, name] of Object.entries(data.coaches ?? {})) COACHES[id] = name
  if (data.odds) {
    ODDS.source = data.odds.source
    ODDS.date = data.odds.date
    ODDS.odds = data.odds.odds
  }
}

/** "11.06.2026" aus ISO-Datum — Datumsstempel für kuratierte Inhalte. */
export const standDatum = (iso: string): string => {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

/** Dezimalquote als Anzeige-String, z. B. 5.5 → "5.50", 1001 → "1001" */
export const formatOdds = (q: number): string => (q >= 100 ? String(Math.round(q)) : q.toFixed(2))

/**
 * Dateischlüssel für Spielerfotos (assets/players/<slug>.jpg) — muss mit dem
 * Download-Skript identisch bleiben: lowercase, Diakritika weg, Rest → "-".
 */
export const playerSlug = (teamId: string, name: string): string =>
  `${teamId}-${name}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
