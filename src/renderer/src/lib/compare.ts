// „Was hat Reto getippt?" (BRIEFING §3.8): Tipps aller Profile zu einem Spiel.
// Fremde Tipps sind erst ab Anstoß sichtbar (vorher nur „getippt ✓"), damit
// niemand abschreibt — die Tipp-Deadline ist ja genau der Anstoß.
import { useCallback, useMemo } from 'react'
import { SCHEDULE } from './data'
import { resolveTipBracket } from './bracket'
import { buildRealWorld, resultsAsTips } from './results'
import { computeBreakdown } from './scoring'
import { isLocked } from './time'
import type { ScheduledMatch, Tip } from './types'
import { useApp } from '../store'

export interface CompareEntry {
  id: string
  name: string
  color: string
  me: boolean
  hasTip: boolean
  /** undefined = noch verborgen (fremder Tipp vor Anstoß) oder kein Tipp */
  tip?: Tip
  /** Weiterkommer-Bonus dieses Profils für dieses Spiel */
  advance: number
}

/**
 * Liefert eine Funktion match → Vergleichszeilen (Hauptwertung, eigenes Profil zuerst).
 * Die Breakdowns aller Profile werden einmal memoisiert (gleiche Maschinerie wie die Rangliste).
 */
export function useCompare(): (match: ScheduledMatch) => CompareEntry[] {
  const profiles = useApp((s) => s.profiles)
  const entries = useApp((s) => s.entries)
  const results = useApp((s) => s.results)
  const scoring = useApp((s) => s.scoring)
  const activeProfileId = useApp((s) => s.activeProfileId)

  const data = useMemo(() => {
    const realBracket = resolveTipBracket(resultsAsTips(results))
    const real = buildRealWorld(results, realBracket)
    return profiles.map((profile) => {
      const tips = entries[profile.id]?.main?.tips ?? {}
      const bd = computeBreakdown(tips, resolveTipBracket(tips), results, real, SCHEDULE, scoring)
      return { profile, tips, perMatch: bd.perMatch }
    })
  }, [profiles, entries, results, scoring])

  return useCallback(
    (match: ScheduledMatch) => {
      const revealed = isLocked(match.dateUtc)
      return data
        .map(({ profile, tips, perMatch }): CompareEntry => {
          const me = profile.id === activeProfileId
          const tip = tips[match.match]
          return {
            id: profile.id,
            name: profile.name,
            color: profile.color,
            me,
            hasTip: tip != null,
            tip: me || revealed ? tip : undefined,
            advance: perMatch[match.match]?.advance ?? 0
          }
        })
        .sort((a, b) => Number(b.me) - Number(a.me) || a.name.localeCompare(b.name, 'de'))
    },
    [data, activeProfileId]
  )
}
