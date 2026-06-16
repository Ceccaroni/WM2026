import { app, BrowserWindow } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import scheduleJson from '../../resources/data/schedule.json'
import teamsJson from '../../resources/data/teams.json'
import {
  espnScoreboardUrl,
  espnSummaryUrl,
  espnToLiveResult,
  fxdToLiveResults,
  mapEspnEvents,
  nextPollDelayMs,
  parseEspnLineups,
  ymd,
  FIXTUREDOWNLOAD_FEED,
  IDLE_POLL_MS,
  LIVE_POLL_MS
} from '../shared/results'
import type { EspnEvent, EspnSummary, FxdRow } from '../shared/results'
import type {
  LineupsSnapshot,
  LiveResult,
  MatchEvent,
  MatchLineup,
  ResultsSnapshot,
  ScheduledMatch,
  Team
} from '../shared/types'

const SCHEDULE = scheduleJson as ScheduledMatch[]
const MATCH_BY_NO = new Map(SCHEDULE.map((m) => [m.match, m]))
const TEAM_IDS: ReadonlySet<string> = new Set((teamsJson as Team[]).map((t) => t.id))
const TEAM_BY_FEEDNAME: ReadonlyMap<string, string> = new Map((teamsJson as Team[]).map((t) => [t.feedName, t.id]))
const TOURNAMENT_START = Math.min(...SCHEDULE.map((m) => new Date(m.dateUtc).getTime()))
const TOURNAMENT_END = Math.max(...SCHEDULE.map((m) => new Date(m.dateUtc).getTime()))

const FETCH_OPTS = {
  headers: { 'User-Agent': 'wm26-tipp (private Tippspiel-App)', Accept: 'application/json' }
}
const FXD_INTERVAL_MS = 60 * 60_000

/** Aufstellungs-Fenster: ESPN setzt die Startelf ~1 h vor Anpfiff; Verlängerung/Pausen großzügig danach. */
const LINEUP_BEFORE_MS = 75 * 60_000
const LINEUP_AFTER_MS = 160 * 60_000
/** Mindestabstand pro Spiel zwischen zwei summary-Abrufen (~370 KB) — bremst die Last. */
const LINEUP_MIN_INTERVAL_MS = 4 * 60_000

interface PersistedResults {
  version: 1
  /** ESPN event.id → Spielnummer; einmal gemappt, bleibt (event.id ist stabil) */
  eventMap: Record<string, number>
  results: Record<number, LiveResult>
  /** Spielnummer → Aufstellungen (ESPN summary), sobald verfügbar */
  lineups?: Record<number, MatchLineup>
  fetchedAt: string | null
}

const resultsFile = (): string => join(app.getPath('userData'), 'wm26-results.json')

/**
 * Pollt Live-Ergebnisse im Main-Prozess (Renderer fetcht nie selbst): ESPN primär,
 * fixturedownload stündlich als Endstand-Fallback. Stand wird atomar in
 * wm26-results.json persistiert (App startet offline mit letztem bekannten Stand)
 * und per `results:update` an alle Fenster gepusht.
 */
export class ResultsService {
  private eventMap: Record<string, number> = {}
  private results: Record<number, LiveResult> = {}
  private lineups: Record<number, MatchLineup> = {}
  private fetchedAt: string | null = null
  private timer: NodeJS.Timeout | null = null
  private failures = 0
  private fxdDueAt = 0
  private polling = false
  /** Spielnummer → letzter summary-Abruf (ms), nur im Speicher (Throttle) */
  private lineupCheckedAt: Record<number, number> = {}

  constructor() {
    this.load()
  }

  private load(): void {
    try {
      if (existsSync(resultsFile())) {
        const raw = JSON.parse(readFileSync(resultsFile(), 'utf8')) as PersistedResults
        if (raw.version === 1) {
          this.eventMap = raw.eventMap ?? {}
          this.results = raw.results ?? {}
          this.lineups = raw.lineups ?? {}
          this.fetchedAt = raw.fetchedAt ?? null
        }
      }
    } catch (err) {
      console.error('[results] Cache nicht lesbar, starte leer:', err)
    }
  }

  private persist(): void {
    const file = resultsFile()
    mkdirSync(dirname(file), { recursive: true })
    const data: PersistedResults = {
      version: 1,
      eventMap: this.eventMap,
      results: this.results,
      lineups: this.lineups,
      fetchedAt: this.fetchedAt
    }
    const tmp = `${file}.tmp`
    writeFileSync(tmp, JSON.stringify(data))
    renameSync(tmp, file)
  }

  snapshot(): ResultsSnapshot {
    return { results: this.results, fetchedAt: this.fetchedAt }
  }

  lineupsSnapshot(): LineupsSnapshot {
    return { lineups: this.lineups, fetchedAt: this.fetchedAt }
  }

  start(): void {
    void this.tick()
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }

  /** Manueller Refresh (UI-Button); läuft gerade ein Abruf, genügt dessen Ergebnis. */
  async refresh(): Promise<ResultsSnapshot> {
    if (!this.polling) await this.tick()
    return this.snapshot()
  }

  private async tick(): Promise<void> {
    if (this.polling) return
    this.polling = true
    this.stop()
    let ok = false
    try {
      await this.pollEspn()
      this.failures = 0
      ok = true
    } catch (err) {
      this.failures = Math.min(this.failures + 1, 3)
      console.warn('[results] ESPN-Abruf fehlgeschlagen:', err instanceof Error ? err.message : err)
    }
    if (Date.now() >= this.fxdDueAt) {
      try {
        ok = (await this.pollFxd()) || ok
        this.fxdDueAt = Date.now() + FXD_INTERVAL_MS
      } catch (err) {
        this.fxdDueAt = Date.now() + 10 * 60_000
        console.warn('[results] fixturedownload-Abruf fehlgeschlagen:', err instanceof Error ? err.message : err)
      }
    }
    try {
      ok = (await this.pollLineups()) || ok
    } catch (err) {
      console.warn('[results] Aufstellungs-Abruf fehlgeschlagen:', err instanceof Error ? err.message : err)
    }
    if (ok) {
      this.persist()
      this.broadcast()
    }
    this.polling = false

    const now = Date.now()
    const hasLive = Object.values(this.results).some((r) => r.status === 'live' || r.status === 'ht')
    const base = nextPollDelayMs(SCHEDULE, now, hasLive)
    let delay = Math.min(base * 2 ** this.failures, IDLE_POLL_MS) // Backoff nur nach Fehlern
    if (this.failures === 0) {
      const lineupWake = this.nextLineupWakeMs(now)
      if (lineupWake !== null) delay = Math.min(delay, lineupWake)
    }
    this.timer = setTimeout(() => void this.tick(), delay)
    console.log(`[results] nächster Abruf in ${Math.round(delay / 1000)} s`)
  }

  /** Wann muss der Loop fürs Aufstellungs-Fenster (wieder) aufwachen? null = kein Anlass. */
  private nextLineupWakeMs(now: number): number | null {
    let nextStart = Infinity
    for (const m of SCHEDULE) {
      const ko = new Date(m.dateUtc).getTime()
      const open = ko - LINEUP_BEFORE_MS
      if (now >= open && now <= ko + LINEUP_AFTER_MS) {
        const res = this.results[m.match]
        if (res?.status === 'finished' && this.lineups[m.match]) continue // dieses Spiel ist durch
        return LINEUP_MIN_INTERVAL_MS // im Fenster → engmaschig bleiben
      }
      if (open > now && open < nextStart) nextStart = open
    }
    if (nextStart === Infinity) return null
    return Math.max(LIVE_POLL_MS, Math.min(IDLE_POLL_MS, nextStart - now))
  }

  /**
   * Holt Aufstellungen gezielt für Spiele im Anstoß-Fenster (summary-Endpoint, ~370 KB).
   * Pro Spiel höchstens alle LINEUP_MIN_INTERVAL_MS; beendete Spiele mit Aufstellung nie wieder.
   * Gibt true zurück, wenn sich eine Aufstellung geändert hat.
   */
  private async pollLineups(): Promise<boolean> {
    const now = Date.now()
    const eventByMatch: Record<number, string> = {}
    for (const [eventId, matchNo] of Object.entries(this.eventMap)) eventByMatch[matchNo] = eventId

    const due = SCHEDULE.filter((m) => {
      const ko = new Date(m.dateUtc).getTime()
      if (now < ko - LINEUP_BEFORE_MS || now > ko + LINEUP_AFTER_MS) return false
      if (!eventByMatch[m.match]) return false
      if (this.results[m.match]?.status === 'finished' && this.lineups[m.match]) return false
      return now - (this.lineupCheckedAt[m.match] ?? 0) >= LINEUP_MIN_INTERVAL_MS
    })
    if (due.length === 0) return false

    let changed = false
    for (const m of due) {
      this.lineupCheckedAt[m.match] = now
      try {
        const res = await fetch(espnSummaryUrl(eventByMatch[m.match]), {
          ...FETCH_OPTS,
          signal: AbortSignal.timeout(15_000)
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as EspnSummary
        const parsed = parseEspnLineups(data, m, TEAM_IDS, new Date().toISOString())
        if (parsed && !sameLineup(this.lineups[m.match], parsed)) {
          this.lineups[m.match] = parsed
          changed = true
        }
      } catch (err) {
        console.warn(`[results] Aufstellung Spiel ${m.match} fehlgeschlagen:`, err instanceof Error ? err.message : err)
      }
    }
    if (changed) console.log(`[results] Aufstellungen aktualisiert (${due.length} Spiel(e) geprüft)`)
    return changed
  }

  private async pollEspn(): Promise<void> {
    // Normalbetrieb: schmales Fenster gestern–morgen (~20–60 KB). Breiter wird abgefragt,
    // solange (a) das Event-Mapping unvollständig ist (einmalig ganzes Turnier, ~760 KB)
    // oder (b) ein beendetes Spiel weniger Torschützen führt als Tore — etwa Spiele, die
    // vor Einführung des Event-Parsings nur als Endstand gespeichert wurden; dann bis
    // zurück zum Turnierstart, damit ESPN die Torschützen nachreicht (sich selbst heilend).
    const mappingComplete = Object.keys(this.eventMap).length >= SCHEDULE.length
    const eventsComplete = !SCHEDULE.some((m) => hasGoalGap(this.results[m.match]))
    const now = Date.now()
    const from = mappingComplete && eventsComplete ? ymd(Math.max(now - 36 * 3600_000, TOURNAMENT_START)) : ymd(TOURNAMENT_START)
    const to = mappingComplete ? ymd(Math.min(now + 36 * 3600_000, TOURNAMENT_END)) : ymd(TOURNAMENT_END)
    const res = await fetch(espnScoreboardUrl(from, to), { ...FETCH_OPTS, signal: AbortSignal.timeout(15_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as { events?: EspnEvent[] }
    const events = data.events ?? []

    const { map, unmatched } = mapEspnEvents(events, SCHEDULE, TEAM_IDS, this.eventMap)
    if (Object.keys(map).length > Object.keys(this.eventMap).length) {
      console.log(`[results] Event-Mapping: ${Object.keys(map).length}/${SCHEDULE.length} Spiele zugeordnet`)
    }
    if (unmatched.length) console.warn('[results] nicht zugeordnete ESPN-Events:', unmatched.join(', '))
    this.eventMap = map

    const nowIso = new Date().toISOString()
    let changed = 0
    for (const e of events) {
      const matchNo = map[e.id]
      const match = matchNo !== undefined ? MATCH_BY_NO.get(matchNo) : undefined
      if (!match) continue
      const next = espnToLiveResult(e, match, TEAM_IDS, nowIso)
      if (!next) continue
      const prev = this.results[match.match]
      // ESPN-Aussetzer nicht übernehmen: ein bereits beendetes ODER laufendes Spiel darf nicht
      // auf "angesetzt" zurückfallen (kurzzeitiger Feed-Glitch) — heilt sich beim nächsten Poll.
      const wasAhead = prev?.status === 'finished' || prev?.status === 'live' || prev?.status === 'ht'
      if (wasAhead && next.status === 'scheduled') continue
      if (!prev || !sameResult(prev, next)) {
        this.results[match.match] = next
        changed++
      }
    }
    this.fetchedAt = nowIso
    if (changed) console.log(`[results] ESPN: ${changed} Ergebnis(se) aktualisiert`)
  }

  /** Endstand-Fallback: füllt nur Spiele, für die ESPN (noch) nichts Belastbares liefert. */
  private async pollFxd(): Promise<boolean> {
    const res = await fetch(FIXTUREDOWNLOAD_FEED, { ...FETCH_OPTS, signal: AbortSignal.timeout(15_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const rows = (await res.json()) as FxdRow[]
    const nowIso = new Date().toISOString()
    let changed = 0
    for (const r of fxdToLiveResults(rows, nowIso, TEAM_BY_FEEDNAME)) {
      const prev = this.results[r.match]
      if (!prev || prev.status === 'scheduled') {
        this.results[r.match] = r
        changed++
      }
    }
    if (changed) console.log(`[results] fixturedownload: ${changed} Endstand/-stände übernommen`)
    return changed > 0
  }

  private broadcast(): void {
    const snap = this.snapshot()
    const lineupSnap = this.lineupsSnapshot()
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('results:update', snap)
      win.webContents.send('lineups:update', lineupSnap)
    }
  }
}

/** Vergleich zweier Aufstellungen ohne Zeitstempel — verhindert unnötige Broadcasts. */
function sameLineup(a: MatchLineup | undefined, b: MatchLineup): boolean {
  if (!a) return false
  return JSON.stringify([a.home, a.away]) === JSON.stringify([b.home, b.away])
}

function sameResult(a: LiveResult, b: LiveResult): boolean {
  return (
    a.status === b.status &&
    a.postponed === b.postponed &&
    a.delayed === b.delayed &&
    a.minute === b.minute &&
    a.homeScore === b.homeScore &&
    a.awayScore === b.awayScore &&
    a.aet === b.aet &&
    a.winner === b.winner &&
    a.homeTeam === b.homeTeam &&
    a.awayTeam === b.awayTeam &&
    a.pens?.home === b.pens?.home &&
    a.pens?.away === b.pens?.away &&
    sameEvents(a.events, b.events)
  )
}

/**
 * Torschützen/Karten vergleichen — sonst bliebe ein Spiel, dessen Endstand schon stimmt,
 * für immer ohne nachgereichte Ereignisse (ESPN liefert die `details` mitunter verspätet).
 */
function sameEvents(a: MatchEvent[] | undefined, b: MatchEvent[] | undefined): boolean {
  if ((a?.length ?? 0) !== (b?.length ?? 0)) return false
  if (!a || !b) return true
  return a.every((e, i) => {
    const o = b[i]
    return e.minute === o.minute && e.side === o.side && e.player === o.player && e.jersey === o.jersey && e.kind === o.kind
  })
}

/**
 * Beendetes Spiel mit mehr Toren als Tor-Ereignissen → ESPN hat (noch) nicht alle
 * Torschützen geliefert. Rote Karten zählen nicht als Tor.
 */
function hasGoalGap(r: LiveResult | undefined): boolean {
  if (!r || r.status !== 'finished') return false
  const goals = (r.homeScore ?? 0) + (r.awayScore ?? 0)
  const scored = r.events?.filter((e) => e.kind !== 'red').length ?? 0
  return scored < goals
}
