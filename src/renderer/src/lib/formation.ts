// Spielfeld-Layout: aus ESPN-Aufstellung (Formation + Positionskürzel) deterministische
// Koordinaten ableiten. Die Formation gibt die Reihen vor (3er/4er/5er-Abwehr usw.), das
// Positionskürzel die Tiefe (Reihen-Zuordnung) und die Seite (links/rechts). Bewusst NICHT
// über ESPNs formationPlace (dessen Nummerierung ist verschachtelt und nicht visuell sortiert).
import type { LineupPlayer, TeamLineup } from './types'

export interface PlacedPlayer {
  player: LineupPlayer
  /** 0 = links … 1 = rechts (aus Sicht des nach vorne spielenden Teams) */
  x: number
  /** 0 = eigene Torlinie … 1 = Mittellinie */
  y: number
}

const isKeeper = (pos: string): boolean => {
  const p = pos.toUpperCase()
  return p === 'G' || p.startsWith('GK')
}

/** Formation "4-3-3" → Reihengrößen der Feldspieler [4,3,3]; [] wenn ungültig/uneindeutig. */
function parseFormation(formation: string, outfield: number): number[] {
  const rows = formation
    .split('-')
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n > 0)
  const sum = rows.reduce((a, b) => a + b, 0)
  return rows.length >= 2 && sum === outfield ? rows : []
}

/** Tiefe aus dem Positionskürzel: 0 Abwehr · 1 Sechser · 2 Mittelfeld · 3 Zehner · 4 Sturm. */
function depth(pos: string): number {
  const p = pos.toUpperCase()
  if (p.includes('B') || p.includes('CD') || p.includes('SW')) return 0 // RB/LB/WB/CB/CD/SW
  if (p.includes('DM')) return 1
  if (p.includes('AM')) return 3
  if (p.includes('M')) return 2 // CM/RM/LM
  return 4 // F/ST/CF/W/…
}

/** Links/rechts aus dem Positionskürzel: −2 ganz links … +2 ganz rechts, 0 zentral. */
function horizontal(pos: string): number {
  const p = pos.toUpperCase()
  const core = p.replace(/-/g, '')
  if (/^R/.test(p)) return 2 // RB, RM, RW, RF …
  if (/^L/.test(p)) return -2 // LB, LM, LW, LF …
  if (/R$/.test(core)) return 1 // CD-R, CM-R …
  if (/L$/.test(core)) return -1 // CD-L, CM-L …
  return 0
}

/** Reihen aus den Tiefen-Bändern (Rückfall, wenn die Formation nicht zur Spielerzahl passt). */
function bandRows(sortedOutfield: LineupPlayer[]): number[] {
  const counts = new Map<number, number>()
  for (const p of sortedOutfield) {
    const d = depth(p.pos)
    counts.set(d, (counts.get(d) ?? 0) + 1)
  }
  return [...counts.keys()].sort((a, b) => a - b).map((k) => counts.get(k)!)
}

/**
 * Stellt eine Startelf aufs (halbe) Feld. Koordinaten normiert: Torhüter unten an der eigenen
 * Linie, Sturm oben an der Mittellinie. Das Pitch-Bauteil spiegelt das Auswärtsteam.
 */
export function layoutTeam(team: TeamLineup): PlacedPlayer[] {
  const keepers = team.starters.filter((p) => isKeeper(p.pos))
  const outfield = team.starters.filter((p) => !isKeeper(p.pos))
  const placed: PlacedPlayer[] = []

  keepers.forEach((p, i) => {
    placed.push({ player: p, x: keepers.length === 1 ? 0.5 : (i + 0.5) / keepers.length, y: 0.05 })
  })

  const sorted = [...outfield].sort((a, b) => depth(a.pos) - depth(b.pos))
  let rows = parseFormation(team.formation, outfield.length)
  if (rows.length === 0) rows = bandRows(sorted)

  const lines = rows.length
  let idx = 0
  rows.forEach((size, lineIdx) => {
    const row = sorted.slice(idx, idx + size).sort((a, b) => horizontal(a.pos) - horizontal(b.pos))
    idx += size
    const y = lines <= 1 ? 0.55 : 0.22 + (lineIdx / (lines - 1)) * 0.68
    row.forEach((p, i) => {
      const x = row.length === 1 ? 0.5 : 0.08 + (i / (row.length - 1)) * 0.84
      placed.push({ player: p, x, y })
    })
  })
  return placed
}
