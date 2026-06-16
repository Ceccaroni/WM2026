import { create } from 'zustand'
import { DEFAULT_SCORING } from './lib/types'
import type {
  Entry,
  EntryKind,
  LiveResult,
  MatchLineup,
  NewsItem,
  PersistedState,
  Profile,
  ScoringConfig,
  Tip
} from './lib/types'

interface AppStore {
  loaded: boolean
  profiles: Profile[]
  activeProfileId: string | null
  scoring: ScoringConfig
  entries: Record<string, Partial<Record<EntryKind, Entry>>>
  /** Letzter bekannter Ergebnisstand (Push vom Main-Poller), Spielnummer → Ergebnis */
  results: Record<number, LiveResult>
  /** Letzter erfolgreicher Abruf — null = noch nie (offline seit Erststart) */
  resultsFetchedAt: string | null
  /** Aufstellungen (Push vom Main-Poller), Spielnummer → beide Teams */
  lineups: Record<number, MatchLineup>
  /** Deutschsprachige Sport-News (Push vom Main-Poller), neueste zuerst */
  news: NewsItem[]
  newsFetchedAt: string | null
  /**
   * Tor-Alarm: macOS-Mitteilung bei jedem Tor laufender Spiele. Default AUS —
   * die Daten-Feeds sind dem TV-Bild oft 30–60 s voraus (Spoiler-Gefahr).
   */
  goalAlarm: boolean
  setGoalAlarm: (on: boolean) => void

  init: () => Promise<void>
  refreshResults: () => Promise<void>
  refreshNews: () => Promise<void>
  createProfile: (name: string, color: string) => Promise<void>
  setActiveProfile: (id: string) => Promise<void>
  /** Optimistisches Update + Auto-Save über IPC (fire-and-forget). */
  setTip: (match: number, tip: Tip | null, entry?: EntryKind) => void
  exportActive: () => Promise<{ ok: boolean; path?: string; error?: string }>
  importFile: () => Promise<{ ok: boolean; imported?: boolean; reason?: string; profileName?: string; error?: string; canceled?: boolean }>
}

let initStarted = false

const apply = (s: PersistedState): Partial<AppStore> => ({
  loaded: true,
  profiles: s.profiles,
  activeProfileId: s.activeProfileId,
  scoring: s.scoring,
  entries: s.entries
})

export const useApp = create<AppStore>((set, get) => ({
  loaded: false,
  profiles: [],
  activeProfileId: null,
  scoring: DEFAULT_SCORING,
  entries: {},
  results: {},
  resultsFetchedAt: null,
  lineups: {},
  news: [],
  newsFetchedAt: null,
  goalAlarm: localStorage.getItem('wm26-goal-alarm') === '1',
  setGoalAlarm: (on) => {
    localStorage.setItem('wm26-goal-alarm', on ? '1' : '0')
    set({ goalAlarm: on })
  },

  init: async () => {
    if (initStarted) return // StrictMode ruft Effekte doppelt auf — synchron abfangen
    initStarted = true
    window.wm26.onResults((snap) => set({ results: snap.results, resultsFetchedAt: snap.fetchedAt }))
    window.wm26.onLineups((snap) => set({ lineups: snap.lineups }))
    window.wm26.onNews((snap) => set({ news: snap.items, newsFetchedAt: snap.fetchedAt }))
    const [state, snap, lineupSnap, newsSnap] = await Promise.all([
      window.wm26.getState(),
      window.wm26.getResults(),
      window.wm26.getLineups(),
      window.wm26.getNews()
    ])
    set({
      ...apply(state),
      results: snap.results,
      resultsFetchedAt: snap.fetchedAt,
      lineups: lineupSnap.lineups,
      news: newsSnap.items,
      newsFetchedAt: newsSnap.fetchedAt
    })
  },

  refreshResults: async () => {
    const snap = await window.wm26.refreshResults()
    set({ results: snap.results, resultsFetchedAt: snap.fetchedAt })
  },

  refreshNews: async () => {
    const snap = await window.wm26.refreshNews()
    set({ news: snap.items, newsFetchedAt: snap.fetchedAt })
  },

  createProfile: async (name, color) => {
    set(apply(await window.wm26.createProfile(name, color)))
  },

  setActiveProfile: async (id) => {
    set({ activeProfileId: id })
    set(apply(await window.wm26.setActiveProfile(id)))
  },

  setTip: (match, tip, entry = 'main') => {
    const { activeProfileId, entries } = get()
    if (!activeProfileId) return
    const profileEntries = entries[activeProfileId] ?? {}
    const tips = { ...(profileEntries[entry]?.tips ?? {}) }
    if (tip) tips[match] = tip
    else delete tips[match]
    set({
      entries: { ...entries, [activeProfileId]: { ...profileEntries, [entry]: { tips } } }
    })
    void window.wm26.setTip(activeProfileId, entry, match, tip)
  },

  exportActive: async () => {
    const id = get().activeProfileId
    if (!id) return { ok: false, error: 'Kein aktives Profil.' }
    return window.wm26.exportProfile(id)
  },

  importFile: async () => {
    const result = await window.wm26.importProfile()
    set(apply(result.state))
    return result
  }
}))

/** Tipps des aktiven Profils für eine Wertungskategorie. */
export const useMyTips = (entry: EntryKind = 'main'): Record<number, Tip> =>
  useApp((s) => (s.activeProfileId ? (s.entries[s.activeProfileId]?.[entry]?.tips ?? EMPTY) : EMPTY))

const EMPTY: Record<number, Tip> = {}

export const useActiveProfile = (): Profile | undefined =>
  useApp((s) => s.profiles.find((p) => p.id === s.activeProfileId))

/** Letztes bekanntes Ergebnis eines Spiels (undefined = noch nichts gemeldet). */
export const useResult = (match: number): LiveResult | undefined => useApp((s) => s.results[match])

/** Aufstellung eines Spiels (undefined = ESPN liefert sie noch nicht, i. d. R. > 1 h vor Anpfiff). */
export const useLineup = (match: number): MatchLineup | undefined => useApp((s) => s.lineups[match])
