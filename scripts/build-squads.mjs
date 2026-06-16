// Baut resources/data/squads/<ID>.json aus der Wikipedia-Kaderseite
// "2026 FIFA World Cup squads" (alle 48 Kader, {{nat fs g player}}-Templates).
// Aufruf: node scripts/build-squads.mjs — validiert 48 Teams × 26 Spieler.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = 'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads?action=raw'

// Wikipedia-Abschnittstitel (englisch) → FIFA-Trigramm; Basis: feedName aus
// teams.json plus bekannte Abweichungen der Wikipedia-Benennung.
const teams = JSON.parse(readFileSync(join(ROOT, 'resources/data/teams.json'), 'utf8'))
const NAME_TO_ID = new Map(teams.map((t) => [t.feedName.toLowerCase(), t.id]))
const EXTRA = {
  'south korea': 'KOR',
  'korea republic': 'KOR',
  'czech republic': 'CZE',
  iran: 'IRN',
  turkey: 'TUR',
  'ivory coast': 'CIV',
  "côte d'ivoire": 'CIV',
  'dr congo': 'COD',
  'democratic republic of the congo': 'COD',
  'cape verde': 'CPV',
  'united states': 'USA',
  switzerland: 'SUI',
  'bosnia and herzegovina': 'BIH'
}
for (const [k, v] of Object.entries(EXTRA)) NAME_TO_ID.set(k, v)

const POS = { GK: 'TW', DF: 'AB', MF: 'MF', FW: 'ST' }

/** "[[Artikel|Anzeige]]" bzw. "[[Name]]" → Anzeige */
const unlink = (s) => s.replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1').trim()

const field = (block, key) => {
  // Links/Templates zuerst matchen, sonst frisst die Zeichenklasse "[[Club|" bis zum Pipe an
  const m = new RegExp(`\\|\\s*${key}\\s*=((?:\\[\\[[^\\]]*\\]\\]|\\{\\{[^{}]*\\}\\}|[^|{}])*)`).exec(block)
  return m ? m[1].trim() : ''
}

const wiki = readFileSync('/tmp/squads.wiki', 'utf8').length > 100_000
  ? readFileSync('/tmp/squads.wiki', 'utf8')
  : await (await fetch(SOURCE, { headers: { 'User-Agent': 'wm26-tipp (private Tippspiel-App)' } })).text()

// Abschnitte: "===Country===" gefolgt von Spieler-Templates bis zum nächsten Abschnitt
const sections = wiki.split(/===\s*([^=\n]+?)\s*===/)
const squads = new Map()
for (let i = 1; i < sections.length; i += 2) {
  const heading = unlink(sections[i]).toLowerCase()
  const id = NAME_TO_ID.get(heading)
  if (!id) continue
  const body = sections[i + 1]
  const players = [...body.matchAll(/\{\{nat fs g player\s*([\s\S]*?)\}\}\n/g)].map((m) => {
    const b = `|${m[1]}`
    const birth = /birth date and age2\|\d+\|\d+\|\d+\|(\d+)\|(\d+)\|(\d+)/.exec(b)
    const player = {
      no: Number(field(b, 'no')) || 0,
      pos: POS[field(b, 'pos')] ?? 'MF',
      name: unlink(field(b, 'name')),
      born: birth ? `${birth[1]}-${String(birth[2]).padStart(2, '0')}-${String(birth[3]).padStart(2, '0')}` : undefined,
      caps: Number(field(b, 'caps')) || 0,
      goals: Number(field(b, 'goals')) || 0,
      club: unlink(field(b, 'club'))
    }
    if (/\|\s*other\s*=[^|}]*captain/i.test(b)) player.captain = true
    return player
  })
  if (players.length > 0) squads.set(id, players)
}

if (squads.size !== teams.length) {
  const missing = teams.filter((t) => !squads.has(t.id)).map((t) => t.id)
  throw new Error(`Nur ${squads.size}/48 Kader erkannt — fehlend: ${missing.join(', ')}`)
}
const outDir = join(ROOT, 'resources/data/squads')
mkdirSync(outDir, { recursive: true })
let total = 0
for (const [id, players] of squads) {
  if (players.length !== 26) console.warn(`⚠ ${id}: ${players.length} Spieler (erwartet 26)`)
  if (players.some((p) => !p.name || !p.club)) throw new Error(`${id}: Spieler ohne Name/Verein`)
  total += players.length
  writeFileSync(join(outDir, `${id}.json`), JSON.stringify(players, null, 2) + '\n')
}
console.log(`${squads.size} Kader, ${total} Spieler geschrieben (TW/AB/MF/ST gemappt)`)
