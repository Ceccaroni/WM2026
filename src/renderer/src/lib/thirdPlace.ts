import type { GroupId } from './types'
import type { TableRow } from './tournament'

export interface ThirdRank {
  group: GroupId
  row: TableRow
  /** true = Reihenfolge nur über deterministischen Fallback entschieden */
  coinflip?: boolean
}

/**
 * Rangliste der 12 Gruppendritten: Punkte → Tordifferenz → Tore
 * (Fairplay/FIFA-Ranking nicht abbildbar; Fallback = Gruppenbuchstabe, markiert).
 */
export function rankThirds(thirds: Array<{ group: GroupId; row: TableRow }>): ThirdRank[] {
  const key = (t: { row: TableRow }): number[] => [t.row.points, t.row.gd, t.row.gf]
  const cmp = (a: number[], b: number[]): number => {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]
    return 0
  }
  const sorted = [...thirds].sort((a, b) => cmp(key(b), key(a)) || a.group.localeCompare(b.group))
  return sorted.map((t, i) => {
    const tied =
      (i > 0 && cmp(key(t), key(sorted[i - 1])) === 0) ||
      (i < sorted.length - 1 && cmp(key(t), key(sorted[i + 1])) === 0)
    return tied ? { ...t, coinflip: true } : { ...t }
  })
}

/**
 * Zuordnung der 8 qualifizierten Dritten auf die R32-Spiele.
 * Primär über die offizielle Annexe-C-Tabelle; falls die Kombination dort
 * (noch) fehlt: deterministisches Backtracking über die Kandidatenmengen
 * (gültige, aber inoffizielle Näherung → official: false).
 */
export function allocateThirds(
  qualified: GroupId[],
  candidates: Record<string, GroupId[]>,
  annexC: Record<string, Record<string, GroupId>>
): { allocation: Record<number, GroupId>; official: boolean } | null {
  const k = [...qualified].sort().join('')
  const official = annexC[k]
  if (official) {
    const allocation: Record<number, GroupId> = {}
    for (const [slot, g] of Object.entries(official)) allocation[Number(slot)] = g
    return { allocation, official: true }
  }

  const slots = Object.keys(candidates)
    .map(Number)
    .sort((a, b) => a - b)
  const used = new Set<GroupId>()
  const allocation: Record<number, GroupId> = {}

  const assign = (i: number): boolean => {
    if (i === slots.length) return true
    const slot = slots[i]
    for (const g of candidates[String(slot)]) {
      if (!qualified.includes(g) || used.has(g)) continue
      used.add(g)
      allocation[slot] = g
      if (assign(i + 1)) return true
      used.delete(g)
      delete allocation[slot]
    }
    return false
  }

  return assign(0) ? { allocation, official: false } : null
}
