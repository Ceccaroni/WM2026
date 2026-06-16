// Live-Ergebnisse & Aufstellungen im Browser — Web-Variante von src/main/results.ts.
// Pollt ESPN direkt per fetch (CORS-offen, am 16.06. verifiziert), persistiert den letzten
// Stand in IndexedDB (Offline-Start) und pusht an registrierte Listener (statt Electron-IPC).
// Unterschiede zur Main-Version: KEIN fixturedownload-Fallback (liefert keinen CORS-Header),
// KEIN User-Agent-Header (verbotener Header im Browser). Parsing kommt 1:1 aus shared/results.ts.

import scheduleJson from '@data/schedule.json'
import teamsJson from '@data/teams.json'
import {
  espnScoreboardUrl,
  espnSummaryUrl,
  espnToLiveResult,
  mapEspnEvents,
  nextPollDelayMs,
  parseEspnLineups,
  ymd,
  IDLE_POLL_MS,
  LIVE_POLL_MS
} from '../shared/results'
import type { EspnEvent, EspnSummary } from '../shared/results'
import type {
  LineupsSnapshot,
  LiveResult,
  MatchEvent,
  MatchLineup,
  ResultsSnapshot,
  ScheduledMatch,
  Team
} from '../shared/types'
import { idbGet, idbSet } from './idb'

const SCHEDULE = scheduleJson as ScheduledMatch[]
const MATCH_BY_NO = new Map(SCHEDULE.map((m) => [m.match, m]))
const TEAM_IDS: ReadonlySet<string> = new Set((teamsJson as Team[]).map((t) => t.id))
const TOURNAMENT_START = Math.min(...SCHEDULE.map((m) => new Date(m.dateUtc).getTime()))
const TOURNAMENT_END = Math.max(...SCHEDULE.map((m) => new Date(m.dateUtc).getTime()))

const RESULTS_KEY = 'results'
const LINEUP_BEFORE_MS = 75 * 60_000
const LINEUP_AFTER_MS = 160 * 60_000
const LINEUP_MIN_INTERVAL_MS = 4 * 60_000

interface PersistedResults {
  version: 1
  eventMap: Record<string, number>
  results: Record<number, LiveResult>
  lineups?: Record<number, MatchLineup>
  fetchedAt: string | null
}

type Listener<T> = (snap: T) => void

export class WebResultsService {
  private eventMap: Record<string, number> = {}
  private results: Record<number, LiveResult> = {}
  private lineups: Record<number, MatchLineup> = {}
  private fetchedAt: string | null = null
  private timer: ReturnType<typeof setTimeout> | null = null
  private failures = 0
  private polling = false
  private lineupCheckedAt: Record<number, number> = {}
  private resultListeners = new Set<Listener<ResultsSnapshot>>()
  private lineupListeners = new Set<Listener<LineupsSnapshot>>()

  async init(): Promise<void> {
    try {
      const raw = await idbGet<PersistedResults>(RESULTS_KEY)
      if (raw && raw.version === 1) {
        this.eventMap = raw.eventMap ?? {}
        this.results = raw.results ?? {}
        this.lineups = raw.lineups ?? {}
        this.fetchedAt = raw.fetchedAt ?? null
      }
    } catch (err) {
      console.error('[results] IndexedDB-Cache nicht lesbar, starte leer:', err)
    }
  }

  snapshot(): ResultsSnapshot {
    return { results: this.results, fetchedAt: this.fetchedAt }
  }

  lineupsSnapshot(): LineupsSnapshot {
    return { lineups: this.lineups, fetchedAt: this.fetchedAt }
  }

  onResults(cb: Listener<ResultsSnapshot>): () => void {
    this.resultListeners.add(cb)
    return () => this.resultListeners.delete(cb)
  }

  onLineups(cb: Listener<LineupsSnapshot>): () => void {
    this.lineupListeners.add(cb)
    return () => this.lineupListeners.delete(cb)
  }

  start(): void {
    void this.tick()
  }

  /** Manueller Refresh (UI-Button); läuft gerade ein Abruf, genügt dessen Ergebnis. */
  async refresh(): Promise<ResultsSnapshot> {
    if (!this.polling) await this.tick()
    return this.snapshot()
  }

  private broadcast(): void {
    const snap = this.snapshot()
    const lineupSnap = this.lineupsSnapshot()
    for (const cb of this.resultListeners) cb(snap)
    for (const cb of this.lineupListeners) cb(lineupSnap)
  }

  private persist(): void {
    const data: PersistedResults = {
      version: 1,
      eventMap: this.eventMap,
      results: this.results,
      lineups: this.lineups,
      fetchedAt: this.fetchedAt
    }
    void idbSet(RESULTS_KEY, data)
  }

  private async tick(): Promise<void> {
    if (this.polling) return
    this.polling = true
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    let ok = false
    try {
      await this.pollEspn()
      this.failures = 0
      ok = true
    } catch (err) {
      this.failures = Math.min(this.failures + 1, 3)
      console.warn('[results] ESPN-Abruf fehlgeschlagen:', err instanceof Error ? err.message : err)
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
    let delay = Math.min(base * 2 ** this.failures, IDLE_POLL_MS)
    if (this.failures === 0) {
      const lineupWake = this.nextLineupWakeMs(now)
      if (lineupWake !== null) delay = Math.min(delay, lineupWake)
    }
    this.timer = setTimeout(() => void this.tick(), delay)
  }

  private nextLineupWakeMs(now: number): number | null {
    let nextStart = Infinity
    for (const m of SCHEDULE) {
      const ko = new Date(m.dateUtc).getTime()
      const open = ko - LINEUP_BEFORE_MS
      if (now >= open && now <= ko + LINEUP_AFTER_MS) {
        const res = this.results[m.match]
        if (res?.status === 'finished' && this.lineups[m.match]) continue
        return LINEUP_MIN_INTERVAL_MS
      }
      if (open > now && open < nextStart) nextStart = open
    }
    if (nextStart === Infinity) return null
    return Math.max(LIVE_POLL_MS, Math.min(IDLE_POLL_MS, nextStart - now))
  }

  private async pollEspn(): Promise<void> {
    const mappingComplete = Object.keys(this.eventMap).length >= SCHEDULE.length
    const eventsComplete = !SCHEDULE.some((m) => hasGoalGap(this.results[m.match]))
    const now = Date.now()
    const from = mappingComplete && eventsComplete ? ymd(Math.max(now - 36 * 3600_000, TOURNAMENT_START)) : ymd(TOURNAMENT_START)
    const to = mappingComplete ? ymd(Math.min(now + 36 * 3600_000, TOURNAMENT_END)) : ymd(TOURNAMENT_END)
    const res = await fetch(espnScoreboardUrl(from, to), { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as { events?: EspnEvent[] }
    const events = data.events ?? []

    const { map } = mapEspnEvents(events, SCHEDULE, TEAM_IDS, this.eventMap)
    this.eventMap = map

    const nowIso = new Date().toISOString()
    for (const e of events) {
      const matchNo = map[e.id]
      const match = matchNo !== undefined ? MATCH_BY_NO.get(matchNo) : undefined
      if (!match) continue
      const next = espnToLiveResult(e, match, TEAM_IDS, nowIso)
      if (!next) continue
      const prev = this.results[match.match]
      const wasAhead = prev?.status === 'finished' || prev?.status === 'live' || prev?.status === 'ht'
      if (wasAhead && next.status === 'scheduled') continue
      if (!prev || !sameResult(prev, next)) this.results[match.match] = next
    }
    this.fetchedAt = nowIso
  }

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
        const res = await fetch(espnSummaryUrl(eventByMatch[m.match]), { signal: AbortSignal.timeout(15_000) })
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
    return changed
  }
}

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

function sameEvents(a: MatchEvent[] | undefined, b: MatchEvent[] | undefined): boolean {
  if ((a?.length ?? 0) !== (b?.length ?? 0)) return false
  if (!a || !b) return true
  return a.every((e, i) => {
    const o = b[i]
    return e.minute === o.minute && e.side === o.side && e.player === o.player && e.jersey === o.jersey && e.kind === o.kind
  })
}

function hasGoalGap(r: LiveResult | undefined): boolean {
  if (!r || r.status !== 'finished') return false
  const goals = (r.homeScore ?? 0) + (r.awayScore ?? 0)
  const scored = r.events?.filter((e) => e.kind !== 'red').length ?? 0
  return scored < goals
}
