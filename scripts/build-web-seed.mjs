// Backt den echten Tipp-Stand (alle Profile der Gruppe) als Startzustand in den PWA-Build.
// Liest den führenden Mac-Store (nur lesen, nie verändern) und schreibt src/web/seed-state.json.
// Die PWA lädt diesen Seed beim Erststart und frischt ihn bei jedem neuen Build auf (seedVersion).
//
// DATENSCHUTZ: Der Seed enthält Namen + alle Tipps der Gruppe. Wird die PWA öffentlich gehostet
// (z. B. GitHub Pages), sind diese Daten unter der URL abrufbar. Bewusst so gewollt (nur die
// eigene Tippgruppe nutzt die App) — aber kein Geheimnis.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'src/web/seed-state.json')
const src = join(homedir(), 'Library/Application Support/WM26 Tipp/wm26-store.json')

if (!existsSync(src)) {
  console.warn(`[seed] Kein Store gefunden (${src}) — leerer Seed.`)
  writeFileSync(out, JSON.stringify({ seedVersion: null, profiles: [] }))
  process.exit(0)
}

const store = JSON.parse(readFileSync(src, 'utf8'))
const seed = {
  version: store.version,
  profiles: store.profiles ?? [],
  activeProfileId: store.activeProfileId ?? null,
  scoring: store.scoring,
  entries: store.entries ?? {},
  // Build-Zeit als Versionsmarke — die PWA frischt Gruppen-Tipps auf, wenn der Seed neuer ist.
  seedVersion: process.env.SEED_VERSION ?? new Date().toISOString()
}
writeFileSync(out, JSON.stringify(seed))
console.log(`[seed] ${seed.profiles.length} Profile eingebacken → src/web/seed-state.json (v ${seed.seedVersion})`)
