// Veröffentlicht ein Update auf GitHub (Ceccaroni/wm26-tipp-updates, BRIEFING §11.11):
//   data-release.json  — kompletter aktueller Datenstand (Kader, Dossiers, Quoten,
//                        Anstoßzeiten) als Override für alle installierten Apps
//   manifest.json      — App-Version + Daten-Laufnummer (+1 je Veröffentlichung)
// Mit --dmg werden zusätzlich die .dmg aus dist/ als GitHub-Release hochgeladen.
// Aufruf: node scripts/publish-update.mjs [--notes "Text"] [--dmg]
// Voraussetzung: gh CLI eingeloggt (gh auth status).
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const REPO = 'Ceccaroni/wm26-tipp-updates'
const RAW = `https://raw.githubusercontent.com/${REPO}/main`

const args = process.argv.slice(2)
const notes = args.includes('--notes') ? args[args.indexOf('--notes') + 1] : undefined
const withDmg = args.includes('--dmg')

const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'))
const appVersion = readJson('package.json').version

// --- Daten-Release zusammenstellen (kompletter Ist-Stand, idempotent anwendbar) ---
const schedule = Object.fromEntries(
  readJson('resources/data/schedule.json').map((m) => [m.match, { dateUtc: m.dateUtc, stadium: m.stadium }])
)
const collect = (dir) =>
  Object.fromEntries(
    readdirSync(join(ROOT, dir))
      .filter((f) => f.endsWith('.json'))
      .map((f) => [f.replace('.json', ''), readJson(`${dir}/${f}`)])
  )

// aktuelle dataVersion vom Manifest im Repo lesen (404 beim Erstlauf → 0)
let prevVersion = 0
try {
  const res = await fetch(`${RAW}/manifest.json`, { headers: { 'User-Agent': 'wm26-publish' } })
  if (res.ok) prevVersion = (await res.json()).dataVersion ?? 0
} catch {
  /* Erstlauf */
}

const dataRelease = {
  version: prevVersion + 1,
  createdAt: new Date().toISOString(),
  schedule,
  teaminfo: collect('resources/data/teaminfo'),
  stadiuminfo: collect('resources/data/stadiuminfo'),
  odds: readJson('resources/data/odds.json'),
  squads: collect('resources/data/squads'),
  coaches: readJson('resources/data/coaches.json')
}

const manifest = {
  appVersion,
  // stabiler Direkt-Download: zeigt immer auf die arm64-.dmg des NEUESTEN Releases
  // (Klick = Download startet sofort; Intel-Variante liegt daneben auf der Release-Seite)
  downloadUrl: `https://github.com/${REPO}/releases/latest/download/WM26-Tipp-arm64.dmg`,
  ...(notes ? { notes } : {}),
  dataVersion: dataRelease.version,
  dataUrl: `${RAW}/data-release.json`
}

// --- Dateien via gh API ins Repo schreiben (kein lokaler Clone nötig) ---
const putFile = (path, content, message) => {
  let sha
  try {
    sha = JSON.parse(
      execFileSync('gh', ['api', `repos/${REPO}/contents/${path}`], { encoding: 'utf8' })
    ).sha
  } catch {
    /* Datei existiert noch nicht */
  }
  const payload = [
    '-X', 'PUT',
    `repos/${REPO}/contents/${path}`,
    '-f', `message=${message}`,
    '-f', `content=${Buffer.from(content).toString('base64')}`,
    ...(sha ? ['-f', `sha=${sha}`] : [])
  ]
  execFileSync('gh', ['api', ...payload], { stdio: ['ignore', 'ignore', 'inherit'] })
  console.log(`✓ ${path} hochgeladen`)
}

putFile('data-release.json', JSON.stringify(dataRelease), `Daten-Release v${dataRelease.version}`)
putFile('manifest.json', JSON.stringify(manifest, null, 2), `Manifest: App ${appVersion} · Daten v${dataRelease.version}`)

if (withDmg) {
  const dmgs = readdirSync(join(ROOT, 'dist')).filter((f) => f.endsWith('.dmg') && f.includes(appVersion))
  if (dmgs.length === 0) throw new Error(`Keine .dmg für ${appVersion} in dist/ — zuerst npm run dist(:intel)`)
  const tag = `v${appVersion}`
  const files = dmgs.map((f) => join(ROOT, 'dist', f))
  const exists = (() => {
    try {
      execFileSync('gh', ['release', 'view', tag, '--repo', REPO], { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  })()
  if (exists) {
    execFileSync('gh', ['release', 'upload', tag, ...files, '--clobber', '--repo', REPO], { stdio: 'inherit' })
  } else {
    execFileSync(
      'gh',
      ['release', 'create', tag, ...files, '--repo', REPO, '--title', `WM26 Tipp ${appVersion}`, '--notes', notes ?? `Version ${appVersion}`],
      { stdio: 'inherit' }
    )
  }
  // Zusätzlich stabil benannte Kopien — damit /releases/latest/download/WM26-Tipp-arm64.dmg
  // als ewiger Direkt-Download-Link funktioniert (Dateiname = Asset-Name)
  const { copyFileSync, rmSync } = await import('node:fs')
  for (const f of dmgs) {
    const arch = f.includes('arm64') ? 'arm64' : 'x64'
    const stable = `/tmp/WM26-Tipp-${arch}.dmg`
    copyFileSync(join(ROOT, 'dist', f), stable)
    execFileSync('gh', ['release', 'upload', tag, stable, '--clobber', '--repo', REPO], { stdio: 'inherit' })
    rmSync(stable, { force: true })
  }
  console.log(`✓ Release ${tag} mit ${dmgs.length} .dmg (+ stabile Direkt-Download-Namen)`)
}

console.log(`Fertig: Manifest App ${appVersion} · Daten v${dataRelease.version} → ${RAW}/manifest.json`)
if (!existsSync(join(ROOT, 'dist', `WM26 Tipp-${appVersion}-arm64.dmg`)) && !withDmg)
  console.log('Hinweis: dist/ enthält keine .dmg dieser Version — für App-Updates --dmg nach npm run dist nutzen.')
