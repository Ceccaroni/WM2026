import { app, BrowserWindow } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { MANIFEST_URL } from '../shared/update'
import type { DataRelease, UpdateManifest, UpdateSnapshot } from '../shared/types'

const FETCH_OPTS = {
  headers: { 'User-Agent': 'wm26-tipp (private Tippspiel-App)', Accept: 'application/json' }
}

/** Manifest-Check beim Start und danach alle 2 h (Retry 30 min); zusätzlich bei Fenster-Fokus. */
const POLL_MS = 2 * 3600_000
const RETRY_MS = 30 * 60_000
/** Fokus-Re-Check (App wieder aktiv) höchstens alle 15 min — sonst no-op. */
const FOCUS_THROTTLE_MS = 15 * 60_000

const updateFile = (): string => join(app.getPath('userData'), 'wm26-update.json')

/**
 * Pollt das Update-Manifest auf GitHub (BRIEFING §11.11): Daten-Releases werden
 * geladen und persistiert (der Renderer wendet sie beim Start auf die gebündelten
 * Stammdaten an), neuere App-Versionen meldet der Renderer als Download-Banner.
 * Push per `update:update`, Persistenz atomar — offline gilt der letzte Stand.
 */
export class UpdateService {
  private manifest: UpdateManifest | null = null
  private data: DataRelease | null = null
  private fetchedAt: string | null = null
  private timer: NodeJS.Timeout | null = null
  private polling = false
  private lastTickAt = 0

  constructor() {
    this.load()
  }

  private load(): void {
    try {
      if (existsSync(updateFile())) {
        const raw = JSON.parse(readFileSync(updateFile(), 'utf8'))
        if (raw.version === 1) {
          this.manifest = raw.manifest ?? null
          this.data = raw.data ?? null
          this.fetchedAt = raw.fetchedAt ?? null
        }
      }
    } catch (err) {
      console.error('[update] Cache nicht lesbar, starte leer:', err)
    }
  }

  private persist(): void {
    const file = updateFile()
    mkdirSync(dirname(file), { recursive: true })
    const tmp = `${file}.tmp`
    writeFileSync(tmp, JSON.stringify({ version: 1, manifest: this.manifest, data: this.data, fetchedAt: this.fetchedAt }))
    renameSync(tmp, file)
  }

  snapshot(): UpdateSnapshot {
    return { currentVersion: app.getVersion(), manifest: this.manifest, data: this.data, fetchedAt: this.fetchedAt }
  }

  start(): void {
    void this.tick()
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }

  /** Sofort-Check für „Nach Updates suchen": cache-busted (siehe tick), liefert den frischen Snapshot. */
  async checkNow(): Promise<UpdateSnapshot> {
    await this.tick()
    return this.snapshot()
  }

  /** Re-Check, wenn die App wieder Fokus bekommt — gedrosselt, damit Tab-Wechsel keinen Poll-Sturm auslösen. */
  async maybeRefresh(): Promise<void> {
    if (this.polling || Date.now() - this.lastTickAt < FOCUS_THROTTLE_MS) return
    await this.tick()
  }

  private async tick(): Promise<void> {
    if (this.polling) return
    this.polling = true
    this.lastTickAt = Date.now()
    this.stop()
    let ok = false
    try {
      // Cache-Buster: raw.githubusercontent wird über Fastly mit max-age=300 ausgeliefert —
      // ohne eindeutige Query bekäme die App bis zu 5 Min lang das alte Manifest (und der
      // nächste Poll ist erst in 6 h). Eindeutige Query = garantierter Cache-MISS = frisch.
      const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, { ...FETCH_OPTS, signal: AbortSignal.timeout(15_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const manifest = (await res.json()) as UpdateManifest
      this.manifest = manifest
      // Daten-Release nur bei neuerer Laufnummer nachladen
      if (manifest.dataUrl && manifest.dataVersion > (this.data?.version ?? 0)) {
        const dres = await fetch(`${manifest.dataUrl}?t=${Date.now()}`, { ...FETCH_OPTS, signal: AbortSignal.timeout(30_000) })
        if (!dres.ok) throw new Error(`Daten-Release HTTP ${dres.status}`)
        this.data = (await dres.json()) as DataRelease
        console.log(`[update] Daten-Release v${this.data.version} geladen (${manifest.dataUrl})`)
      }
      this.fetchedAt = new Date().toISOString()
      this.persist()
      this.broadcast()
      ok = true
      console.log(`[update] Manifest: App ${manifest.appVersion} · Daten v${manifest.dataVersion} (laufend: ${app.getVersion()})`)
    } catch (err) {
      console.warn('[update] Manifest-Abruf fehlgeschlagen:', err instanceof Error ? err.message : err)
    }
    this.polling = false
    this.timer = setTimeout(() => void this.tick(), ok ? POLL_MS : RETRY_MS)
  }

  private broadcast(): void {
    const snap = this.snapshot()
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('update:update', snap)
    }
  }
}
