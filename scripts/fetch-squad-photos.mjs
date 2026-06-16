// Holt Spielerfotos für alle Kaderspieler über Wikidata (P18 → Commons):
// Suche nach Namen (Beschreibung muss nach Fußballer aussehen), P18-Bild laden,
// Lizenz/Autor aus Commons-Metadaten, Resize via sips auf 340 px JPEG.
// Bestehende Dateien (z. B. die Star-Fotos) werden übersprungen.
// Aufruf: node scripts/fetch-squad-photos.mjs [TEAMID ...] — ohne Argumente: alle.
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DEST = join(ROOT, 'src/renderer/src/assets/players')
const CREDITS_FILE = join(DEST, 'credits.json')
// Wikimedia-Rate-Limits: seriell, mit Pause und Kontakt im UA (Best Practices)
const UA = { 'User-Agent': 'wm26-tipp/1.0 (private Tippspiel-App; adrian.lanz@me.com)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const FOOTBALLER = /footballer|soccer|fußballspieler|football player/i

// identisch zu lib/info.ts → playerSlug()
const slug = (team, name) =>
  `${team}-${name}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const get = async (url) => {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

async function findImage(name) {
  const search = await get(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&type=item&limit=5&format=json`
  )
  const hit = (search.search ?? []).find((h) => FOOTBALLER.test(h.description ?? ''))
  if (!hit) return null
  const claims = await get(
    `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${hit.id}&property=P18&format=json`
  )
  const file = claims.claims?.P18?.[0]?.mainsnak?.datavalue?.value
  if (!file) return null
  const info = await get(
    `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(file)}&prop=imageinfo&iiprop=extmetadata&format=json`
  )
  const meta = Object.values(info.query?.pages ?? {})[0]?.imageinfo?.[0]?.extmetadata ?? {}
  return {
    file,
    author: stripTags(meta.Artist?.value ?? 'unbekannt'),
    license: meta.LicenseShortName?.value ?? 'siehe Commons'
  }
}

async function download(file, dest) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=400`
  const tmp = `/tmp/wm26-squad-${Math.abs([...dest].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 1e9)}`
  execSync(`curl -sL --max-time 60 -A "wm26-tipp (private Tippspiel-App)" -o "${tmp}" "${url}"`)
  const mime = execSync(`file -b --mime-type "${tmp}"`).toString().trim()
  if (!/^image\/(jpeg|png|webp)$/.test(mime)) {
    rmSync(tmp, { force: true })
    return false
  }
  const w = Number(/pixelWidth: (\d+)/.exec(execSync(`sips -g pixelWidth "${tmp}"`).toString())?.[1] ?? 0)
  if (w < 160) {
    rmSync(tmp, { force: true })
    return false
  }
  execSync(`sips -s format jpeg --resampleWidth 340 -s formatOptions 62 "${tmp}" --out "${dest}" >/dev/null 2>&1`)
  rmSync(tmp, { force: true })
  return existsSync(dest)
}

const teamFilter = process.argv.slice(2)
const squadDir = join(ROOT, 'resources/data/squads')
const teams = readdirSync(squadDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''))
  .filter((id) => teamFilter.length === 0 || teamFilter.includes(id))

const credits = JSON.parse(readFileSync(CREDITS_FILE, 'utf8'))
mkdirSync(DEST, { recursive: true })

let ok = 0
let skipped = 0
let missed = 0
const queue = teams.flatMap((id) =>
  JSON.parse(readFileSync(join(squadDir, `${id}.json`), 'utf8')).map((p) => ({ team: id, name: p.name }))
)
console.log(`${queue.length} Spieler in ${teams.length} Kadern …`)

for (;;) {
  const job = queue.shift()
  if (!job) break
  const s = slug(job.team, job.name)
  const dest = join(DEST, `${s}.jpg`)
  if (existsSync(dest)) {
    skipped++
    continue
  }
  try {
    const img = await findImage(job.name)
    if (img && (await download(img.file, dest))) {
      credits[s] = { author: img.author, license: img.license }
      ok++
    } else {
      missed++
    }
  } catch (err) {
    // Drossel/Netzfehler: einmal zurückstellen und abkühlen lassen
    if (!job.retried) {
      queue.push({ ...job, retried: true })
      console.log(`… Pause nach Fehler (${err instanceof Error ? err.message : err})`)
      await sleep(30_000)
    } else {
      missed++
    }
  }
  await sleep(250)
  if ((ok + missed) % 100 === 0 && ok + missed > 0) console.log(`… ${ok} geladen, ${missed} ohne Bild, ${queue.length} offen`)
}
writeFileSync(CREDITS_FILE, JSON.stringify(credits, null, 2) + '\n')
console.log(`Fertig: ${ok} neu geladen · ${skipped} schon vorhanden · ${missed} ohne freies Bild`)
console.log(`credits.json: ${Object.keys(credits).length} Einträge`)
