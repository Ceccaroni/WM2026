// Zentrales Datenmodell, geteilt zwischen Main, Preload und Renderer.
// Quelle der Wahrheit für Stammdaten: resources/data/*.json. Siehe BRIEFING.md §4, §8.

/** FIFA-Trigramm, z. B. "GER", "SUI" */
export type TeamId = string

export type GroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'

export type Round = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final'

export interface Team {
  id: TeamId
  name: string
  feedName: string
  group: GroupId
  /** flag-icons-/circle-flags-Code, z. B. "de", "gb-sct" */
  flag: string
}

export interface Stadium {
  id: string
  feedName: string
  fifaName: string
  commonName: string
  city: string
  country: string
  countryFlag: string
  capacity: number
  tz: string
  diffMesz: number
  /** Stadion-Standort (WGS84) — für die Lagekarte (VenueMap) */
  lat: number
  lon: number
}

/**
 * Kuratiertes Team-Dossier (resources/data/teaminfo/<ID>.json) — BRIEFING.md §3.6.
 * Inhalte per Tiefenrecherche erstellt; updatedAt = Stand-Datum (sichtbar im UI,
 * Regel: keine Info älter als 4 Monate).
 */
export interface TeamInfo {
  id: TeamId
  updatedAt: string
  /** FIFA-Weltranglistenplatz (null = nicht verifizierbar) */
  fifaRank: number | null
  /** z. B. "21. Teilnahme · 4× Weltmeister (zuletzt 2014)" */
  wcRecord: string
  coach: { name: string; since: string }
  stars: Array<{ name: string; club: string; role: string }>
  form: string
  quali: string
  storylines: string[]
}

/** Kuratiertes Stadion-Dossier (resources/data/stadiuminfo/<id>.json) — BRIEFING.md §3.7. */
export interface StadiumInfo {
  id: string
  updatedAt: string
  blurb: string
  facts: string[]
}

/** Wettquoten-Snapshot Turniersieg (resources/data/odds.json, Dezimalquoten) — BRIEFING.md §3.6. */
export interface OddsSnapshot {
  source: string
  date: string
  odds: Record<TeamId, number | null>
}

/** Kaderspieler (resources/data/squads/<ID>.json — Quelle: Wikipedia-WM-Kaderlisten, 11.06.2026). */
export interface SquadPlayer {
  /** Rückennummer */
  no: number
  pos: 'TW' | 'AB' | 'MF' | 'ST'
  name: string
  /** Geburtsdatum ISO */
  born?: string
  /** Länderspiele */
  caps: number
  /** Länderspiel-Tore */
  goals: number
  club: string
  captain?: boolean
}

/** Eine Meldung aus den deutschsprachigen Sport-Feeds — mit Klartext zum Lesen IN der App. */
export interface NewsItem {
  /** stabiler Schlüssel (Link bzw. Quelle+Titel) */
  id: string
  title: string
  /** Teaser-/Meldungstext aus dem Feed, HTML gestrippt */
  text: string
  source: string
  /** Publikationszeitpunkt (ISO) */
  publishedAt?: string
  /** Teams, denen die Meldung per Namens-Matching zugeordnet ist */
  teamIds: TeamId[]
}

/** Update-Manifest (GitHub Ceccaroni/wm26-tipp-updates/manifest.json) — BRIEFING §11.11. */
export interface UpdateManifest {
  /** neueste verteilte App-Version, z. B. "1.4.0" */
  appVersion: string
  /** Download-Seite der DMGs (GitHub Releases) */
  downloadUrl: string
  notes?: string
  /** Laufnummer des Daten-Release — App lädt dataUrl nur bei neuerer Nummer */
  dataVersion: number
  dataUrl: string
}

/** Daten-Release: Overrides für gebündelte Stammdaten/Dossiers (alle Felder optional). */
export interface DataRelease {
  version: number
  createdAt: string
  /** Spielnummer → korrigierte Anstoßzeit/Stadion (z. B. ESPN-Verschiebungen) */
  schedule?: Record<number, { dateUtc?: string; stadium?: string }>
  teaminfo?: Record<TeamId, TeamInfo>
  stadiuminfo?: Record<string, StadiumInfo>
  odds?: OddsSnapshot
  squads?: Record<TeamId, SquadPlayer[]>
  /** Cheftrainer je Team (FIFA-Trigramm → Name) — OTA-aktualisierbar (ESPN liefert keinen) */
  coaches?: Record<TeamId, string>
}

/** Update-Stand, wie er Main → Renderer wandert (IPC `update:*`). */
export interface UpdateSnapshot {
  /** Version der laufenden App (app.getVersion()) */
  currentVersion: string
  manifest: UpdateManifest | null
  data: DataRelease | null
  fetchedAt: string | null
}

/** Letzter bekannter News-Stand, wie er Main → Renderer wandert (IPC `news:*`). */
export interface NewsSnapshot {
  /** neueste zuerst, dedupliziert */
  items: NewsItem[]
  /** Letzter erfolgreicher Abruf — null, wenn (noch) nichts geladen werden konnte */
  fetchedAt: string | null
}

/**
 * home/away: in der Gruppenphase eine TeamId; in der KO-Phase ein Platzhalter
 * ("2A", "3ABCDF", "W73", "L101"), der erst durch Tipps bzw. echte Ergebnisse
 * zu einer TeamId aufgelöst wird.
 */
export interface ScheduledMatch {
  match: number
  round: Round
  matchday?: 1 | 2 | 3
  group?: GroupId
  dateUtc: string
  stadium: string
  home: string
  away: string
}

/** Ein Tipp; adv ("wer kommt weiter?") nur bei KO-Spielen mit Unentschieden-Tipp. */
export interface Tip {
  h: number
  a: number
  adv?: 'home' | 'away'
}

/** Wertungskategorien: Hauptrunde (ab Spiel 1) + Späteinstiege je KO-Runde (BRIEFING.md §3.5). */
export type EntryKind = 'main' | 'fromR32' | 'fromR16' | 'fromQF' | 'fromSF'

export interface Entry {
  /** Spielnummer (1–104) → Tipp */
  tips: Record<number, Tip>
}

export interface Profile {
  id: string
  name: string
  color: string
  /** true = per .wm26tipp importiert (fremdes Profil, nicht editierbar) */
  imported?: boolean
  /** exportedAt der zuletzt importierten Datei (Konfliktregel: neuer gewinnt) */
  lastExportedAt?: string
}

export interface ScoringConfig {
  exact: number
  diff: number
  tendency: number
  koAdvance: number
  bonusR16: number
  bonusQF: number
  bonusSF: number
  bonusFinal: number
  bonusChampion: number
}

/** Bestätigt am 11.06.2026 (BRIEFING.md §5) — konfigurierbar, wird im Export mitgeführt. */
export const DEFAULT_SCORING: ScoringConfig = {
  exact: 4,
  diff: 3,
  tendency: 2,
  koAdvance: 1,
  bonusR16: 1,
  bonusQF: 2,
  bonusSF: 3,
  bonusFinal: 4,
  bonusChampion: 10
}

/** Persistierter App-Zustand (Atomic-JSON-Store im Main-Prozess). */
export interface PersistedState {
  version: 1
  profiles: Profile[]
  activeProfileId: string | null
  scoring: ScoringConfig
  /** profileId → Wertungskategorie → Tipps */
  entries: Record<string, Partial<Record<EntryKind, Entry>>>
}

/** Austauschdatei .wm26tipp (BRIEFING.md §8) */
export interface ExchangeFileV1 {
  formatVersion: 1
  exportedAt: string
  scoring: ScoringConfig
  profile: Pick<Profile, 'id' | 'name' | 'color'>
  entries: Partial<Record<EntryKind, Entry>>
}

export type MatchStatus = 'scheduled' | 'live' | 'ht' | 'finished'

/** Spielereignis (Tor/Platzverweis) aus den ESPN-details — für den Sofa-Blick in der LiveRow. */
export interface MatchEvent {
  /** Spielminute wie geliefert, z. B. "9'" oder "90'+6'" */
  minute: string
  side: 'home' | 'away'
  /** Spielername (ESPN displayName) */
  player: string
  /** Trikotnummer — stärkstes Signal fürs Matching auf die Panini-Kader-Karte */
  jersey?: string
  /** goal = Tor, pen = Elfmeter verwandelt, og = Eigentor, red = Platzverweis (inkl. Gelb-Rot) */
  kind: 'goal' | 'pen' | 'og' | 'red'
}

export interface LiveResult {
  match: number
  status: MatchStatus
  /** ESPN meldet das Spiel als beendet ohne Wertung (state 'post', completed=false) →
   *  verschoben/abgesagt. Status bleibt 'scheduled', dieses Flag macht es im UI sichtbar. */
  postponed?: boolean
  /** Spiel läuft, ist aber unterbrochen (Gewitter/Verzögerung; ESPN-Status delay/suspend/abandon).
   *  Status bleibt 'live' (Score erhalten), das UI zeigt „Unterbrochen" statt der Minute. */
  delayed?: boolean
  minute?: string
  homeScore?: number
  awayScore?: number
  /** Endstand nach Verlängerung */
  aet?: boolean
  pens?: { home: number; away: number }
  /** Sieger (KO: auch nach Elfmeterschießen; Quelle: ESPN winner-Flag bzw. fixturedownload Winner) */
  winner?: 'home' | 'away'
  /** Tore und Platzverweise chronologisch (nur ESPN; fixturedownload kennt keine Ereignisse) */
  events?: MatchEvent[]
  /**
   * Echte Teams laut ESPN (FIFA-Trigramm) — bei KO-Spielen die Quelle der Wahrheit für die
   * Paarung (unser Spielplan kennt nur Platzhalter, und Tiebreaks wie Fairplay-Punkte können
   * wir nicht selbst nachrechnen). Gesetzt, sobald ESPN die Teams kennt — auch vor Anpfiff.
   */
  homeTeam?: TeamId
  awayTeam?: TeamId
  updatedAt: string
}

/** Letzter bekannter Ergebnisstand, wie er Main → Renderer wandert (IPC `results:*`). */
export interface ResultsSnapshot {
  /** Spielnummer (1–104) → letztes bekanntes Ergebnis */
  results: Record<number, LiveResult>
  /** Letzter erfolgreicher ESPN-Abruf — für die Stale-Anzeige („Stand 21:43") */
  fetchedAt: string | null
}

/**
 * Ein Spieler in einer Aufstellung (ESPN summary-Roster). `pos` ist das rohe ESPN-Positionskürzel
 * (z. B. "CD-L", "RB", "DM") — das Spielfeld-Layout (lib/formation.ts) leitet daraus Reihe und
 * Links/Rechts ab. `place` = ESPN formationPlace (nur als stabiler Tiebreaker).
 */
export interface LineupPlayer {
  /** Rückennummer (0 = unbekannt) */
  no: number
  /** Kurzname fürs Feld, z. B. „U. Simón" */
  name: string
  fullName: string
  /** ESPN-Positionskürzel, z. B. "G", "CD-L", "RB", "DM", "RW" (Bank: "SUB") */
  pos: string
  starter: boolean
  /** ausgewechselt (live) — am Slot rot ▼ markiert, gedimmt */
  subbedOut?: boolean
  /** Minute des Auswechselns, z. B. „71'" */
  outMinute?: string
  /** eingewechselt (live) — am Slot/​auf der Bank grün ▲ markiert */
  subbedIn?: boolean
  /** Minute des Einwechselns, z. B. „71'" */
  inMinute?: string
  /** Rückennummer des Spielers, für den dieser eingewechselt wurde (Slot-Zuordnung) */
  forNo?: number
}

/** Aufstellung eines Teams in einem Spiel. */
export interface TeamLineup {
  /** FIFA-Trigramm laut ESPN (für Flaggen-/Kader-Zuordnung) */
  team?: TeamId
  /** Formation als Klartext, z. B. "4-3-3" */
  formation: string
  /** Startelf (11) */
  starters: LineupPlayer[]
  /** Komplette Bank (alle Nicht-Startelf-Spieler); Eingewechselte tragen subbedIn/inMinute */
  bench: LineupPlayer[]
}

/** Aufstellungen beider Teams eines Spiels (Quelle: ESPN summary-Endpoint). */
export interface MatchLineup {
  match: number
  home?: TeamLineup
  away?: TeamLineup
  /** Letzter erfolgreicher summary-Abruf für dieses Spiel */
  fetchedAt: string
}

/** Letzter bekannter Aufstellungs-Stand, Main → Renderer (IPC `lineups:*`). */
export interface LineupsSnapshot {
  /** Spielnummer → Aufstellungen (nur Spiele, für die ESPN sie schon liefert) */
  lineups: Record<number, MatchLineup>
  fetchedAt: string | null
}
