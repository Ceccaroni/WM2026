// Erfolgs-Sticker: deterministisch aus Tipps + Ergebnissen abgeleitet (kein eigener
// State, nichts zu persistieren — wer die Bedingung erfüllt, hat den Sticker).
// Gold-Foil nur als Belohnung (Designregel) — verdiente Sticker glänzen, offene sind
// gestrichelte Lücken im Heft, wie fehlende Bilder im Panini-Album.
import { SCHEDULE } from './data'
import { scoreMatch } from './scoring'
import type { ScoreBreakdown } from './scoring'
import { dayKey } from './time'
import type { LiveResult, ScoringConfig, Tip } from './types'

export interface Achievement {
  id: string
  icon: string
  title: string
  /** Bedingung in einem Satz — steht auf dem Sticker bzw. der Lücke */
  desc: string
  earned: boolean
  /** Fortschritt für offene Sticker („3/5") */
  progress?: { now: number; goal: number }
}

const goal = (now: number, target: number): Pick<Achievement, 'earned' | 'progress'> => ({
  earned: now >= target,
  progress: { now: Math.min(now, target), goal: target }
})

/** Alle beendeten Spiele eines MESZ-Tages mit Punkten getroffen (mindestens 3). */
function perfectDay(tips: Record<number, Tip>, results: Record<number, LiveResult>, scoring: ScoringConfig): boolean {
  const byDay = new Map<string, number[]>()
  for (const m of SCHEDULE) {
    if (results[m.match]?.status !== 'finished') continue
    const key = dayKey(m.dateUtc)
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(m.match)
  }
  for (const matches of byDay.values()) {
    if (matches.length < 3) continue
    if (matches.every((n) => tips[n] != null && scoreMatch(tips[n], results[n], scoring) > 0)) return true
  }
  return false
}

export function computeAchievements(
  bd: ScoreBreakdown,
  tips: Record<number, Tip>,
  results: Record<number, LiveResult>,
  scoring: ScoringConfig
): Achievement[] {
  const tipped = Object.keys(tips).length
  const groupTipped = SCHEDULE.filter((m) => m.round === 'group' && tips[m.match] != null).length
  const hits = bd.exact + bd.diff + bd.tendency

  return [
    { id: 'gruppenheft', icon: '📒', title: 'Gruppenheft voll', desc: 'Alle 72 Gruppenspiele getippt', ...goal(groupTipped, 72) },
    { id: 'volles-heft', icon: '🏟️', title: 'Volles Heft', desc: 'Alle 104 Spiele durchgetippt — bis zum Weltmeister', ...goal(tipped, 104) },
    { id: 'erster-stich', icon: '🎯', title: 'Erster Stich', desc: 'Ein Ergebnis exakt getroffen', ...goal(bd.exact, 1) },
    { id: 'scharfschuetze', icon: '🎯', title: 'Scharfschütze', desc: 'Fünf Ergebnisse exakt getroffen', ...goal(bd.exact, 5) },
    { id: 'glasauge', icon: '🔮', title: 'Glasauge', desc: 'Zehn Ergebnisse exakt getroffen', ...goal(bd.exact, 10) },
    { id: 'punktesammler', icon: '🧲', title: 'Punktesammler', desc: 'In zehn Spielen gepunktet', ...goal(hits, 10) },
    {
      id: 'perfekter-tag',
      icon: '☀️',
      title: 'Perfekter Tag',
      desc: 'Alle Spiele eines Tages mit Punkten getroffen (ab 3 Spielen)',
      earned: perfectDay(tips, results, scoring)
    },
    { id: 'prophet', icon: '🧭', title: 'Weiterkommer-Prophet', desc: 'Acht richtige Weiterkommer in der KO-Phase', ...goal(bd.advanceCount, 8) },
    { id: 'achtelauge', icon: '👁️', title: 'Achtel-Auge', desc: 'Acht richtige Achtelfinalisten im Voraus gesehen', ...goal(bd.durchtipp.r16, 8) },
    { id: 'finalriecher', icon: '🏅', title: 'Final-Riecher', desc: 'Einen Finalisten von Anfang an im Baum gehabt', ...goal(bd.durchtipp.final, 1) },
    {
      id: 'glaskugel',
      icon: '🏆',
      title: 'Die Glaskugel',
      desc: 'Den Weltmeister durchgetippt — das goldene Sammelbild',
      earned: bd.durchtipp.champion
    }
  ]
}
