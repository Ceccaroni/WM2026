// Live-Ergebnisse: pure Mapping-/Parsing-Logik, geteilt zwischen Main (Poller) und Renderer.
// Quellen: primär ESPN (keyless, am 11.06.2026 verifiziert), Fallback fixturedownload
// (Endstände über FIFA-Spielnummer). Response-Strukturen: research/ergebnis-api.md.
// Fetch + Timer leben in src/main/results.ts.

import type {
  LineupPlayer,
  LiveResult,
  MatchEvent,
  MatchLineup,
  MatchStatus,
  ScheduledMatch,
  TeamLineup
} from './types'

export const FIXTUREDOWNLOAD_FEED = 'https://fixturedownload.com/feed/json/fifa-world-cup-2026'

export function espnScoreboardUrl(fromYmd: string, toYmd: string): string {
  return `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${fromYmd}-${toYmd}&limit=200`
}

/** Detail-Endpoint eines Spiels (Boxscore, Aufstellungen, Tabellen) — ~370 KB, gezielt abrufen. */
export function espnSummaryUrl(eventId: string): string {
  return `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${eventId}`
}

/** ISO-Datum/Timestamp → ESPN-Datumsformat YYYYMMDD (UTC). */
export function ymd(date: string | number): string {
  return new Date(date).toISOString().slice(0, 10).replace(/-/g, '')
}

// Minimal-Typen der Fremd-Feeds (nur die genutzten Felder, alles optional gehalten —
// inoffizielle APIs, wir validieren defensiv statt zu vertrauen).

export interface EspnCompetitor {
  homeAway?: string
  /** Tore als String, inkl. Verlängerung, ohne Elfmeterschießen */
  score?: string
  shootoutScore?: number | string
  winner?: boolean
  team?: { id?: string; abbreviation?: string; displayName?: string }
}

/** Scoreboard-`details`-Eintrag: Tore und Karten mit Minute, Team und Spieler. */
export interface EspnDetail {
  clock?: { value?: number; displayValue?: string }
  team?: { id?: string }
  scoringPlay?: boolean
  redCard?: boolean
  yellowCard?: boolean
  penaltyKick?: boolean
  ownGoal?: boolean
  shootout?: boolean
  athletesInvolved?: Array<{ displayName?: string; jersey?: string }>
}

export interface EspnEvent {
  id: string
  /** Anstoß UTC, z. B. "2026-06-11T19:00Z" */
  date: string
  competitions?: Array<{
    status?: {
      displayClock?: string
      period?: number
      type?: { name?: string; state?: string; completed?: boolean; description?: string }
    }
    competitors?: EspnCompetitor[]
    details?: EspnDetail[]
  }>
}

export interface FxdRow {
  MatchNumber?: number
  HomeTeam?: string
  AwayTeam?: string
  HomeTeamScore?: number | null
  AwayTeamScore?: number | null
  Winner?: string | null
}

/**
 * Ordnet ESPN-Events unseren Spielnummern zu. Bereits bekannte Zuordnungen (`existing`)
 * bleiben bestehen — `event.id` ist stabil, einmal gemappt ist gemappt.
 *
 * Kaskade (am 11.06.2026 gegen den echten Feed verifiziert: 104/104 eindeutig):
 * 1. Teampaar — greift bei allen Spielen mit zwei bekannten FIFA-Trigrammen; nur über noch
 *    freie Spiele, damit ein späteres KO-Wiedersehen zweier Teams nicht das Gruppenspiel trifft.
 * 2. Exakte Anstoßzeit, eindeutig unter den freien Spielen.
 * 3. Gleicher UTC-Tag, nächstgelegene Zeit — fängt verschobene Anstoßzeiten (ESPN führte am
 *    11.06. zwei Spiele 30/60 Min. früher als der FIFA-Spielplan); KO-Anstöße sind nie
 *    gleichzeitig, in der Gruppenphase entscheidet vorher Kaskade 1.
 */
export function mapEspnEvents(
  events: EspnEvent[],
  schedule: ScheduledMatch[],
  teamIds: ReadonlySet<string>,
  existing: Record<string, number> = {}
): { map: Record<string, number>; unmatched: string[] } {
  const map: Record<string, number> = { ...existing }
  const used = new Set(Object.values(map))
  const unmatched: string[] = []
  const t = (iso: string): number => new Date(iso).getTime()
  const day = (iso: string): string => new Date(iso).toISOString().slice(0, 10)

  for (const e of events) {
    if (map[e.id] !== undefined) continue
    const open = schedule.filter((m) => !used.has(m.match))
    let hit: ScheduledMatch | undefined

    const abbrs = (e.competitions?.[0]?.competitors ?? [])
      .map((c) => c.team?.abbreviation)
      .filter((a): a is string => !!a && teamIds.has(a))
    if (abbrs.length === 2) {
      const cand = open.filter(
        (m) => (m.home === abbrs[0] && m.away === abbrs[1]) || (m.home === abbrs[1] && m.away === abbrs[0])
      )
      if (cand.length === 1) hit = cand[0]
    }

    if (!hit) {
      const exact = open.filter((m) => t(m.dateUtc) === t(e.date))
      if (exact.length === 1) hit = exact[0]
    }

    if (!hit) {
      const sameDay = open
        .filter((m) => day(m.dateUtc) === day(e.date))
        .sort((a, b) => Math.abs(t(a.dateUtc) - t(e.date)) - Math.abs(t(b.dateUtc) - t(e.date)))
      if (
        sameDay.length === 1 ||
        (sameDay.length > 1 && Math.abs(t(sameDay[0].dateUtc) - t(e.date)) < Math.abs(t(sameDay[1].dateUtc) - t(e.date)))
      ) {
        hit = sameDay[0]
      }
    }

    if (hit) {
      map[e.id] = hit.match
      used.add(hit.match)
    } else {
      unmatched.push(`${e.id} (${e.date})`)
    }
  }
  return { map, unmatched }
}

/**
 * ESPN-Event → LiveResult. Heim/Auswärts wird an unserem Spielplan orientiert:
 * in der Gruppenphase über das FIFA-Trigramm, bei KO-Platzhaltern über ESPNs homeAway
 * (FIFA-Bracket-Position, ESPN folgt der offiziellen Ansetzung).
 */
export function espnToLiveResult(
  e: EspnEvent,
  match: ScheduledMatch,
  teamIds: ReadonlySet<string>,
  nowIso: string
): LiveResult | null {
  const comp = e.competitions?.[0]
  const type = comp?.status?.type
  const competitors = comp?.competitors ?? []
  if (!type?.state || competitors.length < 2) return null

  let home = competitors.find((c) => c.team?.abbreviation === match.home)
  let away = competitors.find((c) => c.team?.abbreviation === match.away)
  if (!home || !away || home === away) {
    home = competitors.find((c) => c.homeAway === 'home')
    away = competitors.find((c) => c.homeAway === 'away')
  }
  if (!home || !away) return null

  const name = type.name ?? ''
  // ESPN-Zustand 'post' ohne Wertung = beendet, aber nicht gespielt → verschoben/abgesagt
  const postponed = type.state === 'post' && !type.completed
  // Laufendes Spiel, aber unterbrochen (Gewitter o. Ä.): ESPN behält state 'in' und meldet die
  // Verzögerung über name/description. Defensiv per Stichwort — unbekannte Bezeichnung = wie bisher.
  const delayed = type.state === 'in' && /delay|suspend|abandon|interrupt/i.test(`${name} ${type.description ?? ''}`)
  let status: MatchStatus
  if (type.state === 'pre') status = 'scheduled'
  else if (type.state === 'in') status = name === 'STATUS_HALFTIME' ? 'ht' : 'live'
  else if (type.completed) status = 'finished'
  else status = 'scheduled' // post ohne Wertung → wie angesetzt behandeln, aber als verschoben markiert

  const result: LiveResult = { match: match.match, status, updatedAt: nowIso }
  if (postponed) result.postponed = true
  if (delayed) result.delayed = true
  // Echte Teams auch vor Anpfiff übernehmen — so kennt die App KO-Paarungen, sobald ESPN sie kennt
  const homeAbbr = home.team?.abbreviation
  const awayAbbr = away.team?.abbreviation
  if (homeAbbr && teamIds.has(homeAbbr)) result.homeTeam = homeAbbr
  if (awayAbbr && teamIds.has(awayAbbr)) result.awayTeam = awayAbbr
  if (status === 'scheduled') return result

  const num = (s: string | number | undefined): number | undefined => {
    const n = Number(s)
    return Number.isFinite(n) ? n : undefined
  }
  result.homeScore = num(home.score) ?? 0
  result.awayScore = num(away.score) ?? 0
  if (status === 'live' || status === 'ht') result.minute = comp?.status?.displayClock

  // Tore + Platzverweise aus den details — Gelbe Karten und Elfmeterschießen-Schüsse
  // bewusst nicht (Rauschen; das Schießen bildet `pens` ab). Eigentore liefert ESPN dem
  // profitierenden Team zugeordnet (scoreValue zählt für team.id) — Anzeige mit (ET).
  const events: Array<MatchEvent & { at: number }> = []
  for (const d of comp?.details ?? []) {
    if (d.shootout) continue
    const isGoal = d.scoringPlay === true
    const isRed = d.redCard === true
    if (!isGoal && !isRed) continue
    const side = d.team?.id != null && d.team.id === home.team?.id ? 'home' : d.team?.id === away.team?.id ? 'away' : null
    const player = d.athletesInvolved?.[0]?.displayName
    if (!side || !player) continue
    events.push({
      at: d.clock?.value ?? 0,
      minute: d.clock?.displayValue ?? '',
      side,
      player,
      jersey: d.athletesInvolved?.[0]?.jersey,
      kind: isRed ? 'red' : d.ownGoal ? 'og' : d.penaltyKick ? 'pen' : 'goal'
    })
  }
  if (events.length > 0) {
    result.events = events.sort((a, b) => a.at - b.at).map(({ at: _at, ...e }) => e)
  }

  const period = comp?.status?.period ?? 0
  // period 3/4 = Verlängerung, 5 = Elfmeterschießen (das es nur nach Verlängerung gibt)
  if (status === 'finished' && (name === 'STATUS_FINAL_AET' || period >= 3)) result.aet = true
  const pensHome = num(home.shootoutScore)
  const pensAway = num(away.shootoutScore)
  if (pensHome !== undefined && pensAway !== undefined) result.pens = { home: pensHome, away: pensAway }
  if (status === 'finished') {
    if (home.winner) result.winner = 'home'
    else if (away.winner) result.winner = 'away'
  }
  return result
}

/**
 * fixturedownload-Feed → Endstände. Nur Zeilen mit beiden Scores zählen; der Feed kennt
 * weder Live-Status noch Elfmeter-Ergebnis, aber `Winner` bildet auch Elfmeter-Sieger ab.
 * `MatchNumber` 1–104 ist identisch mit unserer Spielnummer — kein Mapping nötig.
 */
export function fxdToLiveResults(
  rows: FxdRow[],
  nowIso: string,
  teamByFeedName: ReadonlyMap<string, string>
): LiveResult[] {
  const out: LiveResult[] = []
  for (const r of rows) {
    if (!r.MatchNumber || r.HomeTeamScore == null || r.AwayTeamScore == null) continue
    const res: LiveResult = {
      match: r.MatchNumber,
      status: 'finished',
      homeScore: r.HomeTeamScore,
      awayScore: r.AwayTeamScore,
      updatedAt: nowIso
    }
    if (r.Winner && r.Winner === r.HomeTeam) res.winner = 'home'
    else if (r.Winner && r.Winner === r.AwayTeam) res.winner = 'away'
    const home = r.HomeTeam && teamByFeedName.get(r.HomeTeam)
    const away = r.AwayTeam && teamByFeedName.get(r.AwayTeam)
    if (home) res.homeTeam = home
    if (away) res.awayTeam = away
    out.push(res)
  }
  return out
}

// --- Aufstellungen (summary-Endpoint) -------------------------------------------------

/**
 * Ein Eintrag im summary-`rosters[].roster` (nur genutzte Felder). ESPN liefert `subbedIn`/
 * `subbedOut` UNEINHEITLICH: mal als Boolean (laufendes Spiel), mal als Objekt `{didSub: bool}`
 * (vor Anpfiff) — beide Formen müssen über `didSub()` ausgewertet werden (ein Objekt ist truthy!).
 */
export interface EspnRosterEntry {
  starter?: boolean
  jersey?: string
  subbedIn?: boolean | { didSub?: boolean }
  subbedOut?: boolean | { didSub?: boolean }
  /** Beim Eingewechselten: für wen (Rückennummer des ersetzten Spielers). */
  subbedInFor?: { jersey?: string }
  formationPlace?: string
  /** Wechsel-/Tor-Plays dieses Spielers; substitution-Play trägt die Minute (clock). */
  plays?: { substitution?: boolean; clock?: { displayValue?: string } }[]
  athlete?: { displayName?: string; shortName?: string; fullName?: string }
  position?: { abbreviation?: string; name?: string }
}

/** Wertet ESPNs Boolean-ODER-`{didSub}`-Form aus. Wichtig: ein leeres Objekt wäre sonst truthy. */
function didSub(v: boolean | { didSub?: boolean } | undefined): boolean {
  if (v === true) return true
  if (v && typeof v === 'object') return v.didSub === true
  return false
}

export interface EspnRoster {
  homeAway?: string
  formation?: string
  team?: { id?: string; abbreviation?: string; displayName?: string }
  roster?: EspnRosterEntry[]
}

export interface EspnSummary {
  rosters?: EspnRoster[]
}

/** Minuten der substitution-Plays dieses Spielers, chronologisch (z. B. ["71'"]). */
function subMinutes(e: EspnRosterEntry): string[] {
  return (e.plays ?? [])
    .filter((p) => p.substitution && p.clock?.displayValue)
    .map((p) => p.clock!.displayValue!)
}

function toLineupPlayer(e: EspnRosterEntry): LineupPlayer | null {
  const a = e.athlete
  const name = a?.shortName || a?.displayName || a?.fullName
  if (!name) return null
  const p: LineupPlayer = {
    no: Number(e.jersey) || 0,
    name,
    fullName: a?.fullName || a?.displayName || name,
    pos: e.position?.abbreviation || e.position?.name || '',
    starter: e.starter === true
  }
  const mins = subMinutes(e)
  if (didSub(e.subbedOut)) {
    p.subbedOut = true
    if (mins.length) p.outMinute = mins[mins.length - 1] // bei Kette: letzter Play = Abgang
  }
  if (didSub(e.subbedIn)) {
    p.subbedIn = true
    if (mins.length) p.inMinute = mins[0] // erster Play = Eintritt
    const forNo = Number(e.subbedInFor?.jersey)
    if (forNo) p.forNo = forNo
  }
  return p
}

function toTeamLineup(r: EspnRoster): TeamLineup | null {
  const entries = r.roster ?? []
  const starters: LineupPlayer[] = []
  const bench: LineupPlayer[] = []
  for (const e of entries) {
    const lp = toLineupPlayer(e)
    if (!lp) continue
    if (lp.starter) starters.push(lp)
    else bench.push(lp) // ganze Bank, nicht nur Eingewechselte
  }
  // Erst sinnvoll, wenn ESPN die Startelf gesetzt hat (vor ~1 h vor Anpfiff leer)
  if (starters.length === 0) return null
  bench.sort((a, b) => a.no - b.no)
  const lineup: TeamLineup = { formation: r.formation || '', starters, bench }
  const abbr = r.team?.abbreviation
  if (abbr) lineup.team = abbr
  return lineup
}

/**
 * ESPN-summary → Aufstellungen beider Teams. Heim/Auswärts wird wie bei espnToLiveResult
 * an unserem Spielplan orientiert: in der Gruppenphase über das FIFA-Trigramm, sonst über
 * ESPNs homeAway (FIFA-Bracket-Position). Gibt null zurück, solange keine Startelf vorliegt.
 */
export function parseEspnLineups(
  summary: EspnSummary,
  match: ScheduledMatch,
  teamIds: ReadonlySet<string>,
  nowIso: string
): MatchLineup | null {
  const rosters = summary.rosters ?? []
  if (rosters.length < 2) return null

  const pick = (side: 'home' | 'away'): EspnRoster | undefined => {
    const want = match[side]
    const byAbbr = teamIds.has(want) ? rosters.find((r) => r.team?.abbreviation === want) : undefined
    return byAbbr ?? rosters.find((r) => r.homeAway === side)
  }

  const home = pick('home')
  const away = pick('away')
  const homeLineup = home ? toTeamLineup(home) : null
  const awayLineup = away ? toTeamLineup(away) : null
  if (!homeLineup && !awayLineup) return null

  const result: MatchLineup = { match: match.match, fetchedAt: nowIso }
  if (homeLineup) result.home = homeLineup
  if (awayLineup) result.away = awayLineup
  return result
}

export const LIVE_POLL_MS = 90_000
/** Enger Takt rund um den Anpfiff: der bunte Live-Rand soll kurz nach dem echten Anstoß
    erscheinen, nicht erst beim nächsten 90-s-Poll. ESPN meldet „live" mit kleinem Verzug. */
export const KICKOFF_POLL_MS = 25_000
export const IDLE_POLL_MS = 60 * 60_000
/** Fenster großzügig vorziehen: ESPN führte Anstöße schon 30–60 Min. vor unserem Spielplan. */
const WINDOW_BEFORE_MS = 60 * 60_000
/** Anstoß + 90 Min. + Pausen + mögliche Verlängerung/Elfmeterschießen. */
const WINDOW_AFTER_MS = 3.5 * 60 * 60_000
/** Anpfiff-Fenster für den schnellen Takt: ab 5 Min vor bis 12 Min nach Plan-Anstoß —
    Puffer für leichte Plan-/ESPN-Abweichungen, damit der Rand zuverlässig früh kommt. */
const KICKOFF_FAST_BEFORE_MS = 5 * 60_000
const KICKOFF_FAST_AFTER_MS = 12 * 60_000

/**
 * Abstand bis zum nächsten Abruf: 25 s im engen Anpfiff-Fenster (damit der Live-Rand zügig
 * erscheint — hat Vorrang, auch wenn parallel schon ein Spiel live ist), sonst 90 s innerhalb
 * eines Spielfensters (oder solange ein Ergebnis live gemeldet ist), sonst bis zum nächsten
 * Fensterbeginn, höchstens 1 h (Plan-/Absagen-Erkennung gemäß BRIEFING §6).
 */
export function nextPollDelayMs(schedule: ScheduledMatch[], nowMs: number, hasLive: boolean): number {
  let nextStart = Infinity
  let inWindow = false
  let nearKickoff = false
  for (const m of schedule) {
    const ko = new Date(m.dateUtc).getTime()
    if (nowMs >= ko - KICKOFF_FAST_BEFORE_MS && nowMs <= ko + KICKOFF_FAST_AFTER_MS) nearKickoff = true
    if (nowMs >= ko - WINDOW_BEFORE_MS && nowMs <= ko + WINDOW_AFTER_MS) inWindow = true
    const start = ko - WINDOW_BEFORE_MS
    if (start > nowMs && start < nextStart) nextStart = start
  }
  if (nearKickoff) return KICKOFF_POLL_MS
  if (hasLive || inWindow) return LIVE_POLL_MS
  if (nextStart === Infinity) return IDLE_POLL_MS
  return Math.max(LIVE_POLL_MS, Math.min(IDLE_POLL_MS, nextStart - nowMs))
}
