// Test des News-Stacks v2 (shared/news.ts): generischer RSS/Atom-Parser mit
// Klartext-Extraktion (HTML/CDATA/Entities), Team-Zuordnung per Namens-Stamm,
// Junk-Filter (Video/Audio/Ticker/TV-Hinweise) und Aggregation. Läuft offline.
import { aggregate, isJunk, matchTeams, parseFeed, stripHtml } from '../src/shared/news'

const assert = (label: string, actual: unknown, expected: unknown): void => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  console.log(`${ok ? '✓' : '✗ FEHLER'} ${label}: ${JSON.stringify(actual)}${ok ? '' : ` — erwartet ${JSON.stringify(expected)}`}`)
  if (!ok) process.exitCode = 1
}

// --- Parser: RSS mit CDATA + HTML, content:encoded hat Vorrang -------------
const rss = `<?xml version="1.0"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>
<item><title><![CDATA[Nati-Auftakt: Yakin setzt auf Embolo]]></title>
<link>https://example.ch/a1</link>
<description><![CDATA[<p>Der Schweizer Coach hat sich festgelegt &amp; setzt vorne auf <b>Embolo</b>.</p><img src="x.jpg"/>]]></description>
<pubDate>Thu, 11 Jun 2026 08:30:00 GMT</pubDate></item>
<item><title>Kurz &amp; knapp</title><link>https://example.ch/a2</link>
<description>Teaser.</description>
<content:encoded><![CDATA[<p>Der lange Meldungstext mit allen Details zur Partie.</p>]]></content:encoded>
<pubDate>Thu, 11 Jun 2026 07:00:00 GMT</pubDate></item>
</channel></rss>`
const rssItems = parseFeed(rss, 'Blick')
assert('RSS: 2 Items', rssItems.length, 2)
assert('RSS: CDATA+HTML → Klartext', rssItems[0].text, 'Der Schweizer Coach hat sich festgelegt & setzt vorne auf Embolo.')
assert('RSS: content:encoded vor description', rssItems[1].text, 'Der lange Meldungstext mit allen Details zur Partie.')
assert('RSS: pubDate → ISO', rssItems[0].publishedAt, '2026-06-11T08:30:00.000Z')

// --- Parser: Atom ------------------------------------------------------------
const atom = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
<entry><title>England testet gegen Costa Rica</title>
<link href="https://example.de/e1"/>
<summary>Tuchels Elf gewinnt die Generalprobe 3:0 in Orlando.</summary>
<updated>2026-06-10T20:00:00Z</updated></entry></feed>`
const atomItems = parseFeed(atom, 'Sportschau')
assert('Atom: Item + summary + href', { n: atomItems.length, id: atomItems[0].id, t: atomItems[0].text }, {
  n: 1,
  id: 'https://example.de/e1',
  t: 'Tuchels Elf gewinnt die Generalprobe 3:0 in Orlando.'
})

// --- stripHtml ----------------------------------------------------------------
assert('stripHtml: Entities doppelt dekodiert', stripHtml('&amp;quot;Zitat&amp;quot; &#8211; fertig'), '"Zitat" – fertig')

// --- Parser: Watson-Stub → description-Fallback --------------------------------
const watson = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
<entry><title>Schärer pfeift den Nati-Auftakt</title>
<link href="https://www.watson.ch/sport/fussball/123-schaerer"/>
<content type="html">&lt;a href="https://www.watson.ch/!123"&gt;(Auf https://www.watson.ch lesen)&lt;/a&gt;</content>
<description>Der Schweizer Schiedsrichter leitet zum WM-Start eine Partie der Gruppe B — ein Novum für die Schweiz.</description>
<updated>2026-06-12T08:00:00Z</updated></entry></feed>`
assert('Watson: Verweis-Stub im content → description gewinnt', parseFeed(watson, 'Watson')[0].text,
  'Der Schweizer Schiedsrichter leitet zum WM-Start eine Partie der Gruppe B — ein Novum für die Schweiz.')

// --- Parser: Sportschau „[ mehr ]"-Suffix ---------------------------------------
const sportschau = `<rss><channel><item><title>WM 2026: Südkorea gewinnt dank Joker Oh</title>
<link>https://www.sportschau.de/fussball/fifa-wm-2026/joker-oh,wm-spielbericht-suedkorea-100.html</link>
<description>Südkorea hat einen Einstand nach Mass hingelegt. Gegen Tschechien gewann das Team nach Rückstand.[ mehr ]</description>
</item></channel></rss>`
assert('Sportschau: „[ mehr ]" gestrippt', parseFeed(sportschau, 'Sportschau')[0].text,
  'Südkorea hat einen Einstand nach Mass hingelegt. Gegen Tschechien gewann das Team nach Rückstand.')

// --- Team-Matching --------------------------------------------------------------
assert('Match: Schweizer → SUI', matchTeams('Die Schweizer Nati vor dem Auftakt', ''), ['SUI'])
assert('Match: Irankunda ≠ IRN, Australien ✓', matchTeams('Irankunda glänzt für Australien', ''), ['AUS'])
assert('Match: iranisch → IRN', matchTeams('', 'Das iranische Team trainiert in Tijuana'), ['IRN'])
assert('Match: mehrere Teams', matchTeams('Deutschland trifft auf Curaçao', ''), ['GER', 'CUW'])
assert('Match: nichts', matchTeams('Formel 1 in Montreal', 'Verstappen siegt'), [])
// Spielbericht: Text erwähnt die nächsten Gruppengegner → nur die Titel-Teams zählen
assert('Match: Gruppenkontext im Text fliegt raus',
  matchTeams('Südkorea dreht Spiel gegen Tschechien', 'In Gruppe A warten nun Mexiko und Südafrika.'), ['KOR', 'CZE'])
// Titel nennt nur einen — der Gegner aus dem Text gehört dazu (insgesamt wenige)
assert('Match: Gegner aus dem Text ergänzt',
  matchTeams('Quiñones schiesst Mexiko zum Sieg', 'Das Eröffnungsspiel gegen Südafrika kippte spät.'), ['MEX', 'RSA'])
// Rundschau ohne Team im Titel und vielen Teams im Text → keinem Team zuordnen
assert('Match: Rundschau bleibt teamlos',
  matchTeams('Das war die WM-Nacht', 'Mexiko siegt, Südkorea dreht gegen Tschechien, Kanada und Brasilien spielen heute.'), [])

// --- Junk-Filter: echte Muster aus dem Feed-Inventar vom 12.06.2026 -------------
const longText = 'Ein ausreichend langer Meldungstext über das Geschehen rund um die Partie, der in der App gut lesbar ist.'
const junkCases: Array<[string, string, string, string]> = [
  ['kicker Video-URL', 'https://www.kicker.de/heber-kontert-1227117/video', 'Frecher Heber kontert Coufals Vorlage', longText],
  ['kicker Video-Text', 'https://www.kicker.de/artikel-1227118/artikel', 'Südkorea dreht Spiel', 'Nur acht Minuten hielt die Führung. Hier gibt es die Highlights im Video.'],
  ['Sportschau Highlights-Titel', 'https://www.sportschau.de/x,wm-highlights-suedkorea-100.html', 'WM 2026: Südkorea gegen Tschechien - die Highlights', longText],
  ['Sportschau Tore-Video-Text', 'https://www.sportschau.de/x,abc-100.html', 'Südkorea gegen Tschechien', 'Alle Tore der Partie im Video.'],
  ['Sportschau Podcast-URL', 'https://www.sportschau.de/podcasts/fussball/rot-und-spiele,audio-rot-100.html', 'Eröffnungsspiel im Aztekenstadion', longText],
  ['Podcast-Titel mit Artikel-URL', 'https://www.sportschau.de/normal-artikel-100.html', 'Sportschau Fussball Podcast: Nach der Liga ist vor der WM', longText],
  ['NZZ Liveticker', 'https://www.nzz.ch/sport/wm-im-liveticker-ld.10010036', 'LIVE-TICKER - Fussball-WM 2026: Südkorea schlägt Tschechien', 'Die wichtigsten Neuigkeiten zur Fussball-WM in Kanada, Mexiko und den USA.'],
  ['NZZ Bildstrecke', 'https://www.nzz.ch/sport/wm-1994-ld.99', 'BILDSTRECKE - Die WM 1994 in elf Bildern', longText],
  ['sport.de TV-Hinweis', 'https://www.sport.de/news/ne1/hier-laeuft-suedkorea-heute-live-im-tv-und-srream/', 'Hier läuft Südkorea gegen Tschechien', longText],
  ['sport.de LIVE-Promo', 'https://www.sport.de/news/ne2/wm-magenta/', 'Alle Spiele der Fussball-WM 2026 LIVE', longText],
  ['t-online Übertragungs-Artikel', 'https://www.t-online.de/sport/id_1/tuerkei-australien.html', 'Türkei - Australien: Übertragung des WM-Spiels live im TV und Stream', longText],
  ['t-online Dauer-Newsblog', 'https://www.t-online.de/sport/id_101289026/blog.html', 'WM 2026: Australien verlängert mit Trainer', 'Die Fussball-WM hat begonnen. Alle wichtigen News rund um das Turnier erfahren Sie hier. Vom 11. Juni bis 19. Juli steigt das grösste Turnier der Geschichte.'],
  ['Blick Dauerticker-URL', 'https://www.blick.ch/sport/alle-news-zur-wm-im-ticker-spanien-star-id22013352.html', 'Alle News zur WM im Ticker: Spanien-Star fällt aus', longText],
  ['Blick Eigenwerbung', 'https://www.blick.ch/sport/wm-newsletter-id1.html', 'Abonniere jetzt den WM-Newsletter', longText],
  ['Watson Tagesticker', 'https://www.watson.ch/sport/wm-tagesticker/1-auftakt', 'Der WM-Auftakt +++ Sommer im Tor', longText],
  ['Leer/SDA-Stub (Text = Titel)', 'https://www.watson.ch/sport/1-iran', 'Iran ohne Testspiel ins WM-Turnier', 'Iran ohne Testspiel ins WM-Turnier'],
  ['ARD Mediathek', 'https://www.ardmediathek.de/video/wm-doku', 'Dokus und Videos zur FIFA WM 2026', longText]
]
for (const [label, link, title, text] of junkCases) assert(`Junk: ${label}`, isJunk(link, title, text), true)

// False-Positive-Guards: echte Artikel, die nur ÜBER Videos/TV/Ticker reden
const okCases: Array<[string, string, string, string]> = [
  ['NZZ Interview-Präfix', 'https://www.nzz.ch/sport/xy-ld.1', 'INTERVIEW - «Ich bin für das Spiel null wichtig»', longText],
  ['Artikel über virales Video', 'https://www.blick.ch/sport/sommer-id2.html', 'Sommers Parade geht viral', 'Ein Video der Parade verbreitet sich rasant — und auch sonst gibt es Nachrichten und Videos im Überblick.'],
  ['Artikel über TV-Panne', 'https://www.t-online.de/sport/id_2/zdf.html', 'ZDF verpasst sieben Minuten der Partie', longText],
  ['Kleingeschriebenes „live" im Titel', 'https://www.blick.ch/sport/erlebnis-id3.html', 'So erlebten die Fans das Spiel live im Stadion', longText],
  ['Spielbericht', 'https://www.stern.de/sport/suedkorea-dreht-wm-auftakt-9684.html', 'Südkorea dreht WM-Auftakt gegen Tschechien', longText]
]
for (const [label, link, title, text] of okCases) assert(`Kein Junk: ${label}`, isJunk(link, title, text), false)

// --- Aggregation -----------------------------------------------------------------
const now = Date.parse('2026-06-11T12:00:00Z')
const agg = aggregate(
  [
    { source: 'Blick', items: rssItems },
    {
      source: 'kicker',
      items: [
        { id: 'k1', title: 'Nati-Auftakt: Yakin setzt auf Embolo', text: 'Duplikat anderer Quelle', publishedAt: '2026-06-11T09:00:00.000Z' },
        { id: 'k2', title: 'Uralte Meldung', text: 'x', publishedAt: '2026-06-01T09:00:00.000Z' }
      ]
    }
  ],
  now
)
assert('Aggregate: Dedupe + Alterslimit', agg.map((i) => i.id), ['https://example.ch/a1', 'https://example.ch/a2'])
assert('Aggregate: Team-Tags gesetzt', agg[0].teamIds, ['SUI'])
assert('Aggregate: Quelle am Item', agg[1].source, 'Blick')

console.log('fertig.')
