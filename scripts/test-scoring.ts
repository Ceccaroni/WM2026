// Synthetischer End-to-End-Test der Gesamtwertung (computeBreakdown).
import { SCHEDULE } from '../src/renderer/src/lib/data'
import { resolveTipBracket } from '../src/renderer/src/lib/bracket'
import { buildRealWorld, resultsAsTips } from '../src/renderer/src/lib/results'
import { computeBreakdown } from '../src/renderer/src/lib/scoring'
import { entrySchedule, LATE_ENTRIES, resolveLateBracket } from '../src/renderer/src/lib/lateEntry'
import { DEFAULT_SCORING } from '../src/shared/types'
import type { LiveResult, Tip } from '../src/shared/types'

const allTips = (h: number, a: number): Record<number, Tip> =>
  Object.fromEntries(SCHEDULE.map((m) => [m.match, { h, a }]))

const finished = (h: number, a: number, upTo = 104): Record<number, LiveResult> =>
  Object.fromEntries(
    SCHEDULE.filter((m) => m.match <= upTo).map((m) => [
      m.match,
      { match: m.match, status: 'finished', homeScore: h, awayScore: a, winner: h > a ? 'home' : 'away', updatedAt: 'x' } as LiveResult
    ])
  )

const assert = (label: string, actual: unknown, expected: unknown): void => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  console.log(`${ok ? '✓' : '✗ FEHLER'} ${label}: ${JSON.stringify(actual)}${ok ? '' : ` — erwartet ${JSON.stringify(expected)}`}`)
  if (!ok) process.exitCode = 1
}

// Fall 1: Tipper trifft alles exakt (alle 104 Spiele 1:0, Realität identisch)
{
  const tips = allTips(1, 0)
  const results = finished(1, 0)
  const realBracket = resolveTipBracket(resultsAsTips(results))
  const real = buildRealWorld(results, realBracket)
  const bd = computeBreakdown(tips, resolveTipBracket(tips), results, real, SCHEDULE, DEFAULT_SCORING)
  assert('Volltreffer: exakt', bd.exact, 104)
  assert('Volltreffer: Basis', bd.base, 416)
  assert('Volltreffer: Weiterkommer', [bd.advanceCount, bd.advance], [32, 32])
  assert('Volltreffer: Durchtipp', bd.durchtipp, { r16: 16, qf: 8, sf: 4, final: 2, champion: true })
  assert('Volltreffer: Boni-Punkte', bd.durchtippPts, 16 * 1 + 8 * 2 + 4 * 3 + 2 * 4 + 10)
  assert('Volltreffer: Total', bd.total, 416 + 32 + 62)
}

// Fall 2: nur Gruppenphase beendet → keine KO-/Durchtipp-Boni
{
  const tips = allTips(1, 0)
  const results = finished(1, 0, 72)
  const realBracket = resolveTipBracket(resultsAsTips(results))
  const real = buildRealWorld(results, realBracket)
  const bd = computeBreakdown(tips, resolveTipBracket(tips), results, real, SCHEDULE, DEFAULT_SCORING)
  assert('Gruppenphase: Basis', bd.base, 72 * 4)
  assert('Gruppenphase: keine Boni', [bd.advance, bd.durchtippPts], [0, 0])
  assert('Gruppenphase: Spieltage', bd.byMatchday, { 1: 96, 2: 96, 3: 96 })
  // Achtelfinalisten stehen real fest (R32 beendet) → Tipp-Welt = echte Welt? Nein: upTo 72 heisst R32 NICHT beendet.
  assert('Gruppenphase: R16-Teilnehmer real unbekannt', real.roundTeams.r16.size, 0)
}

// Fall 3: Tipper liegt überall falsch herum (0:1 getippt, real 1:0)
{
  const tips = allTips(0, 1)
  const results = finished(1, 0)
  const realBracket = resolveTipBracket(resultsAsTips(results))
  const real = buildRealWorld(results, realBracket)
  const bd = computeBreakdown(tips, resolveTipBracket(tips), results, real, SCHEDULE, DEFAULT_SCORING)
  assert('Falschtipper: Basis', bd.base, 0)
  assert('Falschtipper: keine Weiterkommer', bd.advanceCount, 0)
  // 5 legitime Bonuspunkte: GER/MEX/USA als echte Achtelfinalisten im (falschen) Baum, MEX auch im VF
  assert('Falschtipper: Durchtipp-Zufallstreffer', bd.durchtipp, { r16: 3, qf: 1, sf: 0, final: 0, champion: false })
  assert('Falschtipper: Total', bd.total, 5)
}

// Fall 4: R32 beendet → 16 echte Achtelfinalisten bekannt, Bonus je korrektem
{
  const tips = allTips(1, 0)
  const results = finished(1, 0, 88)
  const realBracket = resolveTipBracket(resultsAsTips(results))
  const real = buildRealWorld(results, realBracket)
  const bd = computeBreakdown(tips, resolveTipBracket(tips), results, real, SCHEDULE, DEFAULT_SCORING)
  assert('R32 fertig: 16 Achtelfinalisten real', real.roundTeams.r16.size, 16)
  assert('R32 fertig: Weiterkommer', bd.advanceCount, 16)
  assert('R32 fertig: Durchtipp', bd.durchtipp, { r16: 16, qf: 0, sf: 0, final: 0, champion: false })
  assert('R32 fertig: Total', bd.total, 88 * 4 + 16 + 16) // Basis zählt nur beendete Spiele (1–88)
}

// Fall 5: Späteinstieg ab Achtelfinale — Einstiegsrunde gibt keine Teilnehmer-Boni,
// danach normale Wertung; alles exakt getroffen.
{
  const results = finished(1, 0)
  const realBracket = resolveTipBracket(resultsAsTips(results))
  const real = buildRealWorld(results, realBracket)
  const def = LATE_ENTRIES.find((d) => d.kind === 'fromR16')!
  const sched = entrySchedule(def)
  const tips: Record<number, Tip> = Object.fromEntries(sched.map((m) => [m.match, { h: 1, a: 0 }]))
  const late = resolveLateBracket(tips, results, realBracket)
  const bd = computeBreakdown(tips, late, results, real, sched, DEFAULT_SCORING, def.bonusRounds)
  assert('Späteinstieg: Basis', bd.base, 16 * 4)
  assert('Späteinstieg: Weiterkommer', bd.advanceCount, 16)
  assert('Späteinstieg: keine Boni für die Einstiegsrunde', bd.durchtipp, { r16: 0, qf: 8, sf: 4, final: 2, champion: true })
  assert('Späteinstieg: Total', bd.total, 64 + 16 + (16 + 12 + 8 + 10))
}
console.log('fertig.')
