// Deployt den lokal gebauten PWA-Output (dist-web/) in den gh-pages-Branch von origin.
//
// WARUM lokal statt CI: Der Web-Seed (src/web/seed-state.json) wird aus dem führenden
// Mac-Store gebacken (scripts/build-web-seed.mjs). Ein GitHub-Actions-Runner hat diesen
// Store NICHT — deshalb baut die App immer lokal, und nur der fertige dist-web/ geht online.
//
// Ablauf: erst `npm run build:web` (Seed + vite build), dann dieses Script. Bequemer:
// `npm run publish:web` (kettet beides). Pusht einen Orphan-Commit per force → gh-pages hält
// stets genau den aktuellen Build (Deploy-Artefakt-Branch, keine Historie nötig).
import { execFileSync } from 'node:child_process'
import { existsSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist-web')
const gitDir = join(dist, '.git')

if (!existsSync(join(dist, 'index.html'))) {
  console.error('[deploy] dist-web/index.html fehlt — zuerst `npm run build:web`.')
  process.exit(1)
}

// Remote-URL aus dem Hauptrepo übernehmen (origin), damit das Ziel nie auseinanderläuft.
const remote = execFileSync('git', ['-C', root, 'remote', 'get-url', 'origin']).toString().trim()

// GitHub Pages läuft sonst durch Jekyll und schluckt Dateien/Ordner mit führendem "_".
writeFileSync(join(dist, '.nojekyll'), '')

const git = (...args) =>
  execFileSync('git', args, { cwd: dist, stdio: ['ignore', 'inherit', 'inherit'] })

// Frisches temporäres Repo in dist-web (nach dem Push wieder entfernt → kein Nested-Repo).
rmSync(gitDir, { recursive: true, force: true })
git('init', '-q', '-b', 'gh-pages')
git('add', '-A')
git(
  '-c', 'user.name=Ceccaroni',
  '-c', 'user.email=adrian.lanz@me.com',
  'commit', '-qm', `deploy ${new Date().toISOString()}`
)
git('push', '-f', remote, 'gh-pages')
rmSync(gitDir, { recursive: true, force: true })

console.log(`[deploy] gh-pages aktualisiert → ${remote}`)
