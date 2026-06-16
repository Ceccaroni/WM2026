// Web-Bridge: stellt window.wm26 im Browser bereit — dieselbe Oberfläche wie das Electron-
// Preload (src/preload/index.ts, Typ Wm26Api), aber mit Browser-Mitteln statt IPC. Dadurch
// bleibt der gesamte Renderer (src/renderer/**) unverändert. Wird in src/web/main.tsx VOR dem
// React-Mount aufgerufen. Bewusst gestubbt (Phase 1): News, OTA-Update, Dock-Badge.

import type { Wm26Api, ExportResult, ImportResult } from '../preload/index'
import type { ExchangeFileV1, NewsSnapshot, UpdateSnapshot } from '../shared/types'
import { WebStore } from './store-web'
import { WebResultsService } from './espn-poll'

declare const __APP_VERSION__: string

/** String-Inhalt als Datei-Download anbieten (ersetzt den nativen Save-Dialog). */
function downloadBlob(content: string, filename: string, type = 'application/json'): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const emptyNews = (): NewsSnapshot => ({ items: [], fetchedAt: null })
const emptyUpdate = (): UpdateSnapshot => ({
  currentVersion: __APP_VERSION__,
  manifest: null,
  data: null,
  fetchedAt: null
})

/** Baut window.wm26 für den Browser und startet das ESPN-Polling. */
export async function installWebBridge(): Promise<void> {
  const store = new WebStore()
  const results = new WebResultsService()
  await Promise.all([store.init(), results.init()])

  const api: Wm26Api = {
    // --- Zustand (IndexedDB statt Main-Store) ---
    getState: async () => store.state,
    createProfile: async (name, color) => {
      store.createProfile(name, color)
      return store.state
    },
    setActiveProfile: async (id) => {
      store.setActiveProfile(id)
      return store.state
    },
    setTip: async (profileId, entry, match, tip) => {
      store.setTip(profileId, entry, match, tip)
    },

    // --- Export/Import (.wm26tipp über Blob-Download / File-Input) ---
    exportProfile: async (profileId): Promise<ExportResult> => {
      const data = store.buildExport(profileId)
      if (!data) return { ok: false, error: 'Profil nicht gefunden.' }
      downloadBlob(JSON.stringify(data, null, 2), `${data.profile.name}.wm26tipp`)
      return { ok: true }
    },
    importProfile: (): Promise<ImportResult> =>
      new Promise<ImportResult>((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.wm26tipp,application/json'
        input.oncancel = () => resolve({ ok: true, canceled: true, state: store.state })
        input.onchange = async () => {
          const file = input.files?.[0]
          if (!file) return resolve({ ok: true, canceled: true, state: store.state })
          try {
            const parsed = JSON.parse(await file.text()) as ExchangeFileV1
            if (parsed.formatVersion !== 1 || !parsed.profile?.id) {
              return resolve({ ok: false, error: 'Keine gültige .wm26tipp-Datei.', state: store.state })
            }
            const r = store.importProfile(parsed)
            resolve({
              ok: true,
              imported: r.imported,
              reason: r.reason,
              profileName: parsed.profile.name,
              state: store.state
            })
          } catch {
            resolve({ ok: false, error: 'Datei nicht lesbar.', state: store.state })
          }
        }
        input.click()
      }),

    // --- Live-Ergebnisse & Aufstellungen (ESPN direkt im Browser) ---
    getResults: async () => results.snapshot(),
    refreshResults: () => results.refresh(),
    onResults: (cb) => results.onResults(cb),
    getLineups: async () => results.lineupsSnapshot(),
    onLineups: (cb) => results.onLineups(cb),

    // --- Exporte/UI ---
    exportIcs: async (content, suggestedName): Promise<ExportResult> => {
      downloadBlob(content, suggestedName, 'text/calendar')
      return { ok: true }
    },
    exportChronikPdf: async (): Promise<ExportResult> => {
      window.print()
      return { ok: true }
    },
    setBadge: (count) => {
      // Web-Badging (offene Tipps am Home-Bildschirm-Icon), wo unterstützt — sonst no-op.
      try {
        const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> }
        if (count > 0) void nav.setAppBadge?.(count)
        else void nav.clearAppBadge?.()
      } catch {
        /* Badging nicht verfügbar — egal */
      }
    },
    shotMode: false,

    // --- Bewusste Stubs in Phase 1 ---
    getNews: async () => emptyNews(),
    refreshNews: async () => emptyNews(),
    onNews: () => () => {},
    getUpdate: async () => emptyUpdate(),
    checkUpdate: async () => emptyUpdate(),
    downloadUpdate: async () => {},
    onUpdate: () => () => {}
  }

  window.wm26 = api
  results.start()
}
