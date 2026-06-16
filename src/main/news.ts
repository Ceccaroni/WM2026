import { app, BrowserWindow } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { aggregate, FEEDS, parseFeed } from '../shared/news'
import type { NewsSnapshot } from '../shared/types'

/** Feed-spezifischer UA möglich (Blick lässt nur curl-UAs durch, siehe shared/news.ts). */
const fetchOpts = (userAgent?: string) => ({
  headers: {
    'User-Agent': userAgent ?? 'wm26-tipp (private Tippspiel-App)',
    Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml'
  }
})

/** „Dauernd aktualisierend": alle 15 Minuten, plus manueller Refresh. */
const POLL_MS = 15 * 60_000
const RETRY_MS = 3 * 60_000

const newsFile = (): string => join(app.getPath('userData'), 'wm26-news.json')

/**
 * Pollt deutschsprachige Sport-Feeds (shared/news.ts → FEEDS) im Main-Prozess,
 * ordnet Meldungen den Teams zu und pusht den Stand per `news:update` an alle
 * Fenster — gleiches Muster wie ResultsService. Stand wird atomar persistiert,
 * damit die App offline mit den letzten News startet.
 */
export class NewsService {
  private snap: NewsSnapshot = { items: [], fetchedAt: null }
  private timer: NodeJS.Timeout | null = null
  private polling = false

  constructor() {
    this.load()
  }

  private load(): void {
    try {
      if (existsSync(newsFile())) {
        const raw = JSON.parse(readFileSync(newsFile(), 'utf8')) as NewsSnapshot & { version: 1 }
        if (raw.version === 1) this.snap = { items: raw.items ?? [], fetchedAt: raw.fetchedAt ?? null }
      }
    } catch (err) {
      console.error('[news] Cache nicht lesbar, starte leer:', err)
    }
  }

  private persist(): void {
    const file = newsFile()
    mkdirSync(dirname(file), { recursive: true })
    const tmp = `${file}.tmp`
    writeFileSync(tmp, JSON.stringify({ version: 1, ...this.snap }))
    renameSync(tmp, file)
  }

  snapshot(): NewsSnapshot {
    return this.snap
  }

  start(): void {
    void this.tick()
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }

  /** Manueller Refresh (UI-Button); läuft gerade ein Abruf, genügt dessen Ergebnis. */
  async refresh(): Promise<NewsSnapshot> {
    if (!this.polling) await this.tick()
    return this.snap
  }

  private async tick(): Promise<void> {
    if (this.polling) return
    this.polling = true
    this.stop()
    let ok = false
    const results = await Promise.allSettled(
      FEEDS.map(async (feed) => {
        const res = await fetch(feed.url, { ...fetchOpts(feed.userAgent), signal: AbortSignal.timeout(15_000) })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return { source: feed.source, items: parseFeed(await res.text(), feed.source) }
      })
    )
    const perFeed = results.flatMap((r, i) => {
      if (r.status === 'fulfilled') return [r.value]
      console.warn(`[news] ${FEEDS[i].source} fehlgeschlagen:`, r.reason instanceof Error ? r.reason.message : r.reason)
      return []
    })
    if (perFeed.length > 0) {
      this.snap = { items: aggregate(perFeed), fetchedAt: new Date().toISOString() }
      this.persist()
      this.broadcast()
      ok = true
      console.log(`[news] ${this.snap.items.length} Meldungen aus ${perFeed.length}/${FEEDS.length} Feeds`)
    }
    this.polling = false
    this.timer = setTimeout(() => void this.tick(), ok ? POLL_MS : RETRY_MS)
  }

  private broadcast(): void {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('news:update', this.snap)
    }
  }
}
