// Team-News v2: pure Logik (Feed-Parsing, HTML-Strippen, Team-Zuordnung) — von
// Main und Tests nutzbar, fetcht selbst nichts. Quellen: deutschsprachige
// Sport-RSS-Feeds MIT Textinhalt (Teaser/Meldung), damit die News IN der App
// lesbar sind (aufklappbar, keine externen Tabs). Feed-Liste: verifiziert per
// Recherche am 11.06.2026 (siehe STATUS.md).
import type { NewsItem, TeamId } from './types'

export interface NewsFeed {
  source: string
  url: string
  /** Abweichender User-Agent — Blick (Akamai) lässt seit 12.06. nur noch curl-UAs durch. */
  userAgent?: string
}

/**
 * Verifizierte Feeds (11.06.2026, Volltext-Recherche 12.06.2026): alle deutschsprachig,
 * mit Teaser-/Meldungstext, damit die News IN der App lesbar sind. Volltext-Quellen
 * zuerst — bei Titel-Dubletten gewinnt im Dedupe die Version mit dem meisten Text.
 * stern + t-online liefern dpa-Volltexte inkl. Spielbericht zu jedem WM-Spiel.
 */
export const FEEDS: NewsFeed[] = [
  { source: 'stern', url: 'https://www.stern.de/feed/standard/sport/' },
  { source: 't-online', url: 'https://feeds.t-online.de/rss/fussball-wm' },
  { source: 't-online', url: 'https://feeds.t-online.de/rss/sport' },
  { source: 'Blick', url: 'https://www.blick.ch/sport/fussball/wm/rss.xml', userAgent: 'curl/8.6.0' },
  { source: 'Watson', url: 'https://www.watson.ch/api/2.0/rss/index.xml?tag=Fussball' },
  { source: 'NZZ', url: 'https://www.nzz.ch/sport.rss' },
  { source: 'kicker', url: 'https://newsfeed.kicker.de/news/wm' },
  { source: 'Sportschau', url: 'https://www.sportschau.de/fussball/fifa-wm-2026/index~rss2.xml' },
  { source: 'sport.de', url: 'https://www.sport.de/rss/news/fussball/' }
]

/** Meldungen älter als 72 h fliegen raus; insgesamt max. 300 (neueste zuerst — seit 9 Feeds wird sonst gekappt). */
export const MAX_AGE_MS = 72 * 3600_000
export const MAX_ITEMS = 300

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const decodeEntities = (s: string): string =>
  s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

/** HTML → lesbarer Klartext (Tags raus, Whitespace kollabiert, kein Leerraum vor Satzzeichen). */
export const stripHtml = (s: string): string =>
  decodeEntities(
    decodeEntities(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'))
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:»)])/g, '$1')
    .replace(/([(«])\s+/g, '$1')
    .trim()

const tag = (block: string, name: string): string | undefined => {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i').exec(block)
  return m ? m[1] : undefined
}

/** Atom-<link href="…"/> (selbstschließend) */
const atomLink = (block: string): string | undefined =>
  /<link[^>]*href="([^"]+)"[^>]*\/?>/i.exec(block)?.[1]

interface RawItem {
  id: string
  title: string
  text: string
  publishedAt?: string
}

/** Kein Inhalt, nur Verweis: Watson füllt Atom-<content> teils mit diesem Stub — dann hat <description> den echten Teaser. */
const TEXT_STUB = /^\(Auf https?:\/\/www\.watson\.ch lesen\)$/i

/** Generischer RSS-2.0-/Atom-Parser: title + Klartext (längstes brauchbares Feld gewinnt). */
export function parseFeed(xml: string, source: string): RawItem[] {
  const blocks = [...xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/gi), ...xml.matchAll(/<entry[\s>]([\s\S]*?)<\/entry>/gi)]
  const items: RawItem[] = []
  for (const m of blocks) {
    const b = m[1]
    const title = stripHtml(tag(b, 'title') ?? '')
    // Längster brauchbarer Text gewinnt: Volltext (content:encoded/Atom-content) vor
    // Teaser (description/summary); Verweis-Stubs zählen nicht. „[ mehr ]" (Sportschau) weg.
    const text = [tag(b, 'content:encoded'), tag(b, 'content'), tag(b, 'description'), tag(b, 'summary')]
      .filter((t): t is string => t != null)
      .map((t) => stripHtml(t).replace(/\s*\[ mehr \]$/, ''))
      .filter((t) => !TEXT_STUB.test(t))
      .reduce((best, t) => (t.length > best.length ? t : best), '')
    if (!title) continue
    const link = stripHtml(tag(b, 'link') ?? '') || atomLink(b) || ''
    const pub = tag(b, 'pubDate') ?? tag(b, 'published') ?? tag(b, 'updated') ?? tag(b, 'dc:date')
    const ts = pub ? Date.parse(stripHtml(pub)) : NaN
    items.push({
      id: link || `${source}:${title}`,
      title,
      text,
      publishedAt: Number.isNaN(ts) ? undefined : new Date(ts).toISOString()
    })
  }
  return items
}

// ---------------------------------------------------------------------------
// Team-Zuordnung
// ---------------------------------------------------------------------------

/**
 * Namens-Stämme pro Team (Wortanfang, case-insensitive): "Schweiz" matcht auch
 * "Schweizer"; `\b`-Suffix erzwingt exaktes Wortende (z. B. Iran ≠ Irankunda).
 */
const ALIASES: Record<TeamId, string[]> = {
  MEX: ['Mexik'],
  KOR: ['Südkorea', 'Korea'],
  RSA: ['Südafrik', 'Bafana'],
  CZE: ['Tschech'],
  CAN: ['Kanad'],
  SUI: ['Schweiz', 'Nati\\b'],
  QAT: ['Katar'],
  BIH: ['Bosni'],
  BRA: ['Brasil', 'Seleção'],
  MAR: ['Marokk'],
  SCO: ['Schott'],
  HAI: ['Haiti'],
  USA: ['USA\\b', 'US-Team', 'US-Boys'],
  PAR: ['Paraguay'],
  AUS: ['Australi', 'Socceroos'],
  TUR: ['Türk'],
  GER: ['Deutschland', 'DFB', 'deutsche Elf', 'deutsche Mannschaft', 'deutsche National'],
  ECU: ['Ecuador'],
  CIV: ['Elfenbein', 'Ivorer'],
  CUW: ['Curaçao', 'Curacao'],
  NED: ['Niederlande', 'niederländ', 'Oranje', 'Elftal'],
  JPN: ['Japan'],
  TUN: ['Tunesi'],
  SWE: ['Schwed'],
  BEL: ['Belgi'],
  IRN: ['Iran\\b', 'Irans\\b', 'iranisch'],
  EGY: ['Ägypt'],
  NZL: ['Neuseel', 'All Whites'],
  ESP: ['Spani', 'Furia Roja'],
  URU: ['Uruguay'],
  KSA: ['Saudi'],
  CPV: ['Kap Verde', 'Kapverd', 'Cabo Verde'],
  FRA: ['Frankreich', 'Franzos', 'französ', 'Équipe Tricolore', 'Les Bleus'],
  SEN: ['Senegal'],
  NOR: ['Norweg'],
  IRQ: ['Irak'],
  ARG: ['Argentini', 'Albiceleste', 'Gauchos'],
  AUT: ['Österreich', 'ÖFB'],
  ALG: ['Algeri'],
  JOR: ['Jordani'],
  POR: ['Portug'],
  COL: ['Kolumbi'],
  UZB: ['Usbek'],
  COD: ['Kongo'],
  ENG: ['England', 'Engländer', 'Three Lions'],
  CRO: ['Kroat'],
  PAN: ['Panama'],
  GHA: ['Ghana']
}

const MATCHERS: Array<[TeamId, RegExp]> = Object.entries(ALIASES).map(([id, list]) => [
  id,
  new RegExp(`\\b(?:${list.join('|')})`, 'i')
])

/**
 * Teams eines Artikels: Titel-Treffer sind verlässlich (Journalismus nennt die
 * Hauptakteure im Titel), Text-Treffer nur als Ergänzung, solange insgesamt wenige
 * Teams vorkommen — Rundschau-Artikel (Powerranking, „Das war die WM-Nacht") erwähnen
 * viele Teams und gehören keinem; Spielberichte erwähnen oft die nächsten Gegner.
 */
const MAX_TEAMS = 3
export function matchTeams(title: string, text: string): TeamId[] {
  const inTitle = MATCHERS.filter(([, re]) => re.test(title)).map(([id]) => id)
  const all = MATCHERS.filter(([, re]) => re.test(`${title} ${text}`)).map(([id]) => id)
  if (all.length <= MAX_TEAMS) return all
  return inTitle
}

// ---------------------------------------------------------------------------
// Junk-Filter: Items, deren Inhalt nur im verlinkten Video/Audio/Ticker/TV-Programm
// steckt — in der App ohne externe Links nicht lesbar. Muster-Inventar aller Feeds
// vom 12.06.2026 (Agenten-Recherche, siehe STATUS.md). Bewusst quellenspezifisch
// verankert (URL-Slugs, Titel-Anker) — freie Worttreffer wie „Video"/„live" träfen
// echte Artikel, die nur darüber berichten.
// ---------------------------------------------------------------------------

const JUNK_LINK = new RegExp(
  [
    '/video(?:[#/?]|$)', // kicker …/video, sport.de /video/
    'ardmediathek\\.de|ardsounds\\.de', // ARD-Video/Audio-Portale (Sportschau-Feed)
    '/podcasts?/|,audio-|,video-', // Sportschau-Audio/Video-Slugs, NZZ /podcast/
    ',wm-(?:highlights|tore|beitrag)-', // Sportschau Spiel-Videos + TV-Beiträge
    'watson\\.ch/sport/videos/',
    'liveblog|liveticker|tagesticker|transferticker|-im-ticker-|-pk-(?:live|im-stream)', // Dauer-Ticker
    'hier-laeuft|live-im-tv|live-im-stream|uebertraegt|uebertragung' // TV-Programm-Hinweise
  ].join('|'),
  'i'
)

// bewusst case-sensitiv: „LIVE sehen"/„… LIVE" (sport.de) sind Versalien, ein
// Titel wie „… das Spiel live" bliebe verschont; NZZ-Präfixe nur als Whitelist
// (INTERVIEW/KOMMENTAR sind echte Artikel).
const JUNK_TITLE = new RegExp(
  [
    '^(?:LIVE-TICKER|PODCAST|BILDSTRECKE)\\b', // NZZ-Format-Präfixe
    '- die (?:langen )?(?:Highlights|Tore)$', // Sportschau Spiel-Videos
    'Podcast:', // „Fussball Podcast: …" (auch wenn die URL normal aussieht)
    '^Hier läuft|Wer überträgt|Übertragung .*live im TV|LIVE sehen$| LIVE$|im Free-TV', // TV-Programm
    '\\+\\+\\+', // Ticker-Titel (Watson/NZZ)
    'Newsletter|als bevorzugte Quelle|Wunschelf' // Eigenwerbung (Blick/sport.de)
  ].join('|')
)

const JUNK_TEXT = new RegExp(
  [
    'im Video\\.$|Highlights im Video|Tor gibt es hier im Video', // Video-Begleittexte (kicker/Sportschau)
    '^Die wichtigsten Neuigkeiten zur Fussball-WM', // NZZ-Dauerticker-Standardsatz
    'Alle wichtigen News.{0,80}erfahren Sie hier' // t-online-Dauer-Newsblog
  ].join('|')
)

/** true = Item ist in der App nicht sinnvoll lesbar (Video/Audio/Ticker/TV-Hinweis/Werbung/leer). */
export function isJunk(link: string, title: string, text: string): boolean {
  return (
    JUNK_LINK.test(link) ||
    JUNK_TITLE.test(title) ||
    JUNK_TEXT.test(text) ||
    text.length < 40 || // leer bzw. SDA-Kurz-Stub
    normTitle(text) === normTitle(title) // „Text" ist nur die Titel-Wiederholung
  )
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

const normTitle = (t: string): string => t.toLowerCase().replace(/[^a-zäöüéèà0-9]+/g, ' ').trim()

/** Volltexte auf lesbare Länge kappen (Wortgrenze) — t-online liefert teils ganze Artikel. */
const MAX_TEXT_CHARS = 1200
const clip = (s: string): string =>
  s.length <= MAX_TEXT_CHARS ? s : `${s.slice(0, MAX_TEXT_CHARS).replace(/\s+\S*$/, '')} …`

/** Roh-Items aller Feeds → NewsItems: Junk-Filter, Team-Tags, Dedupe (Titel), neueste zuerst, Alters-/Mengen-Limit. */
export function aggregate(perFeed: Array<{ source: string; items: RawItem[] }>, now = Date.now()): NewsItem[] {
  const seen = new Set<string>()
  const out: NewsItem[] = []
  for (const { source, items } of perFeed) {
    for (const raw of items) {
      if (isJunk(raw.id, raw.title, raw.text)) continue
      const key = normTitle(raw.title)
      if (seen.has(key)) continue
      if (raw.publishedAt && now - Date.parse(raw.publishedAt) > MAX_AGE_MS) continue
      seen.add(key)
      out.push({
        id: raw.id,
        title: raw.title,
        text: clip(raw.text),
        source,
        publishedAt: raw.publishedAt,
        teamIds: matchTeams(raw.title, raw.text)
      })
    }
  }
  out.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
  return out.slice(0, MAX_ITEMS)
}
