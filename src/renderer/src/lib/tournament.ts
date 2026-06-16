import type { ScheduledMatch, TeamId, Tip } from './types'

export interface TableRow {
  team: TeamId
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
  rank: number
  /** true = Platzierung nur über den deterministischen Fallback entschieden („Losentscheid") */
  coinflip?: boolean
}

interface Stats {
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
}

const emptyStats = (): Stats => ({ played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 })
const pts = (s: Stats): number => s.won * 3 + s.drawn
const gd = (s: Stats): number => s.gf - s.ga

/** Statistiken aus getippten Spielen, beschränkt auf Spiele ZWISCHEN den übergebenen Teams. */
function collectStats(teamIds: TeamId[], matches: ScheduledMatch[], tips: Record<number, Tip>): Map<TeamId, Stats> {
  const stats = new Map(teamIds.map((t) => [t, emptyStats()]))
  for (const m of matches) {
    const tip = tips[m.match]
    const home = stats.get(m.home)
    const away = stats.get(m.away)
    if (!tip || !home || !away) continue
    home.played++
    away.played++
    home.gf += tip.h
    home.ga += tip.a
    away.gf += tip.a
    away.ga += tip.h
    if (tip.h > tip.a) {
      home.won++
      away.lost++
    } else if (tip.h < tip.a) {
      away.won++
      home.lost++
    } else {
      home.drawn++
      away.drawn++
    }
  }
  return stats
}

const cmpArrays = (a: number[], b: number[]): number => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]
  return 0
}

/**
 * Punktgleiche Teams ordnen — offizielle FIFA-Tiebreaker 2026 (BRIEFING.md §4):
 * direkter Vergleich (Punkte → Tordifferenz → Tore) der punktgleichen Teams
 * VOR Gesamt-Tordifferenz → Gesamt-Tore. Fairplay/FIFA-Ranking sind in der
 * Tipp-Welt nicht abbildbar; danach entscheidet ein deterministischer Fallback
 * (Reihenfolge in der Gruppe), markiert als coinflip. Die nochmalige rekursive
 * Anwendung des direkten Vergleichs auf Teil-Untergruppen (FIFA-Detailregel)
 * ist bewusst weggelassen — bei 4er-Gruppen praktisch ohne Relevanz.
 */
function orderCluster(
  cluster: TeamId[],
  matches: ScheduledMatch[],
  tips: Record<number, Tip>,
  overall: Map<TeamId, Stats>
): Array<{ team: TeamId; coinflip?: boolean }> {
  const h2h = collectStats(cluster, matches, tips)
  const key = (t: TeamId): number[] => {
    const h = h2h.get(t)!
    const o = overall.get(t)!
    return [pts(h), gd(h), h.gf, gd(o), o.gf]
  }
  const sorted = [...cluster].sort((a, b) => cmpArrays(key(b), key(a)) || cluster.indexOf(a) - cluster.indexOf(b))
  return sorted.map((team, i) => {
    const tiedPrev = i > 0 && cmpArrays(key(team), key(sorted[i - 1])) === 0
    const tiedNext = i < sorted.length - 1 && cmpArrays(key(team), key(sorted[i + 1])) === 0
    return tiedPrev || tiedNext ? { team, coinflip: true } : { team }
  })
}

/**
 * Gruppentabelle aus Tipps (oder echten Ergebnissen) berechnen.
 * Nicht getippte Spiele zählen nicht — die Tabelle wächst live mit den Tipps.
 */
export function computeGroupTable(matches: ScheduledMatch[], tips: Record<number, Tip>): TableRow[] {
  const teamIds: TeamId[] = []
  for (const m of matches) {
    for (const t of [m.home, m.away]) if (!teamIds.includes(t)) teamIds.push(t)
  }
  const overall = collectStats(teamIds, matches, tips)

  const byPoints = [...teamIds].sort(
    (a, b) => pts(overall.get(b)!) - pts(overall.get(a)!) || teamIds.indexOf(a) - teamIds.indexOf(b)
  )
  const ordered: Array<{ team: TeamId; coinflip?: boolean }> = []
  let i = 0
  while (i < byPoints.length) {
    const p = pts(overall.get(byPoints[i])!)
    const cluster: TeamId[] = []
    while (i < byPoints.length && pts(overall.get(byPoints[i])!) === p) cluster.push(byPoints[i++])
    if (cluster.length === 1) ordered.push({ team: cluster[0] })
    else ordered.push(...orderCluster(cluster, matches, tips, overall))
  }

  return ordered.map((o, idx) => {
    const s = overall.get(o.team)!
    return {
      team: o.team,
      ...s,
      gd: gd(s),
      points: pts(s),
      rank: idx + 1,
      ...(o.coinflip ? { coinflip: true } : {})
    }
  })
}
