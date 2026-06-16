// Turnier-Chronik („Sammelalbum", BRIEFING-Feature abgenommen 12.06.2026): pro Turniertag
// eine Album-Seite — Spiele, Torschützen, Tagespunkte aller Tipper und der Ranglisten-Stand
// nach dem Tag. Alles deterministisch aus results + tips berechnet, nichts persistiert
// (gleiche Philosophie wie lib/achievements).
import { ROUND_LABEL, SCHEDULE } from './data'
import { resolveTipBracket } from './bracket'
import { buildRealWorld, resultsAsTips } from './results'
import { baseKind, computeBreakdown, scoreMatch } from './scoring'
import type { BaseKind } from './scoring'
import { dayKey, todayKey } from './time'
import type { Entry, EntryKind, LiveResult, Profile, ScheduledMatch, ScoringConfig, Tip } from './types'

/** Eine Tipp-Zeile im Spiel-Vergleich der Chronik: was ein Profil getippt und dafür geholt hat. */
export interface ChronikTip {
  profile: Profile
  /** undefined = dieses Profil hat das Spiel nicht getippt */
  tip?: Tip
  /** Basispunkte (0–4) */
  base: number
  /** KO-Weiterkommer-Bonus dieses Spiels (in der Gruppenphase 0) */
  advance: number
  kind: BaseKind
}

export interface ChronikRow {
  profile: Profile
  /** Punkte, die an diesem Tag dazukamen (inkl. an dem Tag fällig gewordener Boni) */
  dayPts: number
  /** exakte Treffer dieses Tages */
  dayExact: number
  /** Gesamtstand nach diesem Tag */
  total: number
  rank: number
  /** Rang nach dem Vortag — undefined am ersten Turniertag */
  prevRank?: number
}

export interface ChronikDay {
  key: string
  /** Turniertag, 1-basiert (Tag 1 = Eröffnungstag) */
  index: number
  matches: ScheduledMatch[]
  /** Spielnummern mit Endstand */
  finished: Set<number>
  /** alle Spiele des Tages beendet → die Albumseite ist „fertig eingeklebt" */
  complete: boolean
  /** z. B. "Gruppenphase · 1. Spieltag" oder "Achtelfinale" */
  phase: string
  goals: number
  reds: number
  /** nach Rang sortiert */
  rows: ChronikRow[]
  /** höchste Tagespunktzahl (Tagessieger-Markierung, nur wenn > 0) */
  bestPts: number
  /** Tipps aller Profile je beendetem Spiel des Tages, nach Spielpunkten sortiert */
  matchTips: Record<number, ChronikTip[]>
}

function phaseLabel(matches: ScheduledMatch[]): string {
  const rounds = [...new Set(matches.map((m) => m.round))]
  if (rounds.length === 1 && rounds[0] === 'group') {
    const days = [...new Set(matches.map((m) => m.matchday))]
    return days.length === 1 && days[0] ? `Gruppenphase · ${days[0]}. Spieltag` : 'Gruppenphase'
  }
  return rounds.map((r) => ROUND_LABEL[r]).join(' · ')
}

/** Anzahl Turniertage gesamt (für „Seite n/39"). */
export const TOTAL_DAYS = new Set(SCHEDULE.map((m) => dayKey(m.dateUtc))).size

/**
 * Baut die Chronik rückwirkend auf: alle Turniertage bis heute (der heutige nur, sobald
 * dort ein Spiel beendet ist). „Stand nach Tag X" wertet ausschließlich Ergebnisse bis
 * einschließlich Tag X — auch Durchtipp-Boni erscheinen so an dem Tag, an dem die Runde
 * in echt feststand. Tagespunkte = Differenz der Gesamtstände zweier Tage.
 */
export function buildChronik(
  profiles: Profile[],
  entries: Record<string, Partial<Record<EntryKind, Entry>>>,
  results: Record<number, LiveResult>,
  scoring: ScoringConfig
): ChronikDay[] {
  const allDays = [...new Set(SCHEDULE.map((m) => dayKey(m.dateUtc)))].sort()
  const today = todayKey()

  // Tippbäume sind tagesunabhängig — einmal pro Profil auflösen
  const tippers = profiles.map((profile) => {
    const tips = entries[profile.id]?.main?.tips ?? {}
    return { profile, tips, bracket: resolveTipBracket(tips) }
  })

  const days: ChronikDay[] = []
  const cumulative: Record<number, LiveResult> = {}
  let prev = new Map<string, { total: number; exact: number; rank: number }>()

  for (const key of allDays) {
    if (key > today) break
    const matches = SCHEDULE.filter((m) => dayKey(m.dateUtc) === key)
    const finished = new Set(matches.filter((m) => results[m.match]?.status === 'finished').map((m) => m.match))
    if (key === today && finished.size === 0) break

    for (const m of matches) {
      const r = results[m.match]
      if (r) cumulative[m.match] = r
    }
    const snapshot = { ...cumulative }
    const realBracket = resolveTipBracket(resultsAsTips(snapshot))
    const real = buildRealWorld(snapshot, realBracket)

    const unranked = tippers.map(({ profile, tips, bracket }) => {
      const bd = computeBreakdown(tips, bracket, snapshot, real, SCHEDULE, scoring)
      const before = prev.get(profile.id)
      return {
        profile,
        tips,
        bd,
        dayPts: bd.total - (before?.total ?? 0),
        dayExact: bd.exact - (before?.exact ?? 0),
        total: bd.total,
        exact: bd.exact,
        prevRank: before?.rank
      }
    })

    // Wettkampf-Ränge wie in der Rangliste: Tiebreak exakte Treffer, dann Name
    unranked.sort(
      (a, b) => b.total - a.total || b.exact - a.exact || a.profile.name.localeCompare(b.profile.name, 'de')
    )
    const rows: ChronikRow[] = []
    for (const [i, r] of unranked.entries()) {
      const p = rows[i - 1]
      const u = unranked[i - 1]
      const tied = p != null && u != null && u.total === r.total && u.exact === r.exact
      rows.push({
        profile: r.profile,
        dayPts: r.dayPts,
        dayExact: r.dayExact,
        total: r.total,
        rank: tied ? p.rank : i + 1,
        prevRank: r.prevRank
      })
    }
    prev = new Map(rows.map((r, i) => [r.profile.id, { total: r.total, exact: unranked[i].exact, rank: r.rank }]))

    // Tipp-Vergleich je beendetem Spiel: was jedes Profil getippt und dafür geholt hat.
    // Sortiert nach Spielpunkten (Basis + Weiterkommer), dann exakt, dann Getippte vor
    // Nicht-Getippten, dann Name. Fremde Tipps sind hier immer offen (Spiel ist beendet).
    const matchTips: Record<number, ChronikTip[]> = {}
    for (const m of matches) {
      if (!finished.has(m.match)) continue
      const result = results[m.match]
      const tipRows = unranked.map(({ profile, tips, bd }): ChronikTip => {
        const tip = tips[m.match]
        return {
          profile,
          tip,
          base: tip ? scoreMatch(tip, result, scoring) : 0,
          advance: bd.perMatch[m.match]?.advance ?? 0,
          kind: tip ? baseKind(tip, result) : 'none'
        }
      })
      tipRows.sort(
        (a, b) =>
          b.base + b.advance - (a.base + a.advance) ||
          Number(b.kind === 'exact') - Number(a.kind === 'exact') ||
          Number(b.tip != null) - Number(a.tip != null) ||
          a.profile.name.localeCompare(b.profile.name, 'de')
      )
      matchTips[m.match] = tipRows
    }

    const finishedResults = matches.filter((m) => finished.has(m.match)).map((m) => results[m.match])
    days.push({
      key,
      index: days.length + 1,
      matches,
      finished,
      complete: finished.size === matches.length,
      phase: phaseLabel(matches),
      goals: finishedResults.reduce((sum, r) => sum + (r.homeScore ?? 0) + (r.awayScore ?? 0), 0),
      reds: finishedResults.reduce((sum, r) => sum + (r.events?.filter((e) => e.kind === 'red').length ?? 0), 0),
      rows,
      bestPts: Math.max(0, ...rows.map((r) => r.dayPts)),
      matchTips
    })
  }
  return days
}
