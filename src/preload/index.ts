import { contextBridge, ipcRenderer } from 'electron'
import type {
  EntryKind,
  LineupsSnapshot,
  NewsSnapshot,
  PersistedState,
  ResultsSnapshot,
  Tip,
  UpdateSnapshot
} from '../shared/types'

export interface ExportResult {
  ok: boolean
  path?: string
  canceled?: boolean
  error?: string
}

export interface ImportResult {
  ok: boolean
  imported?: boolean
  reason?: string
  profileName?: string
  canceled?: boolean
  error?: string
  state: PersistedState
}

const api = {
  getState: (): Promise<PersistedState> => ipcRenderer.invoke('state:get'),
  createProfile: (name: string, color: string): Promise<PersistedState> =>
    ipcRenderer.invoke('profile:create', name, color),
  setActiveProfile: (id: string): Promise<PersistedState> => ipcRenderer.invoke('profile:setActive', id),
  setTip: (profileId: string, entry: EntryKind, match: number, tip: Tip | null): Promise<void> =>
    ipcRenderer.invoke('tip:set', profileId, entry, match, tip),
  exportProfile: (profileId: string): Promise<ExportResult> => ipcRenderer.invoke('profile:export', profileId),
  importProfile: (): Promise<ImportResult> => ipcRenderer.invoke('profile:import'),
  getResults: (): Promise<ResultsSnapshot> => ipcRenderer.invoke('results:get'),
  refreshResults: (): Promise<ResultsSnapshot> => ipcRenderer.invoke('results:refresh'),
  /** Deutschsprachige Sport-News mit Klartext (Polling im Main, alle 15 Min). */
  getNews: (): Promise<NewsSnapshot> => ipcRenderer.invoke('news:get'),
  refreshNews: (): Promise<NewsSnapshot> => ipcRenderer.invoke('news:refresh'),
  /** Push-Updates des News-Pollers; Rückgabe = Abbestellen. */
  onNews: (cb: (snap: NewsSnapshot) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, snap: NewsSnapshot): void => cb(snap)
    ipcRenderer.on('news:update', listener)
    return () => ipcRenderer.removeListener('news:update', listener)
  },
  /** Update-Manifest + letztes Daten-Release (Polling im Main, BRIEFING §11.11). */
  getUpdate: (): Promise<UpdateSnapshot> => ipcRenderer.invoke('update:get'),
  /** „Nach Updates suchen": erzwingt einen cache-busted Sofort-Check und liefert den frischen Snapshot. */
  checkUpdate: (): Promise<UpdateSnapshot> => ipcRenderer.invoke('update:check'),
  /** Update herunterladen (Browser) — die App beendet sich danach selbst, damit die Installation nicht an der laufenden App scheitert. */
  downloadUpdate: (): Promise<void> => ipcRenderer.invoke('update:download'),
  /** Push bei neuem Manifest/Daten-Release; Rückgabe = Abbestellen. */
  onUpdate: (cb: (snap: UpdateSnapshot) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, snap: UpdateSnapshot): void => cb(snap)
    ipcRenderer.on('update:update', listener)
    return () => ipcRenderer.removeListener('update:update', listener)
  },
  /** Tipp-Wächter: Anzahl offener heutiger Tipps → Dock-Badge (macOS). */
  setBadge: (count: number): void => ipcRenderer.send('badge:set', count),
  /** Spielplan als Kalenderdatei sichern (Save-Dialog im Main). */
  exportIcs: (content: string, suggestedName: string): Promise<ExportResult> =>
    ipcRenderer.invoke('ics:export', content, suggestedName),
  /** Turnier-Chronik als PDF sichern — der Renderer steht dabei im Print-Modus (alle Tagesseiten). */
  exportChronikPdf: (): Promise<ExportResult> => ipcRenderer.invoke('chronik:pdf'),
  /** Screenshot-Modus (WM26_SHOT_DIR): deterministisches UI, keine Mitteilungen/Badges. */
  shotMode: !!process.env['WM26_SHOT_DIR'],
  /** Push-Updates des Pollers; Rückgabe = Abbestellen. */
  onResults: (cb: (snap: ResultsSnapshot) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, snap: ResultsSnapshot): void => cb(snap)
    ipcRenderer.on('results:update', listener)
    return () => ipcRenderer.removeListener('results:update', listener)
  },
  /** Aufstellungen (ESPN summary, gezielt im Anstoß-Fenster geholt). */
  getLineups: (): Promise<LineupsSnapshot> => ipcRenderer.invoke('lineups:get'),
  /** Push-Updates der Aufstellungen; Rückgabe = Abbestellen. */
  onLineups: (cb: (snap: LineupsSnapshot) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, snap: LineupsSnapshot): void => cb(snap)
    ipcRenderer.on('lineups:update', listener)
    return () => ipcRenderer.removeListener('lineups:update', listener)
  }
}

contextBridge.exposeInMainWorld('wm26', api)

export type Wm26Api = typeof api
