// Dodo (Adrians Vater) — fromR32-Erfassung als Telefonat-Werkzeug.
// Dodo tippt nicht selbst am Gerät; seine KO-Neuauflage (echte Paarungen) wird
// hier eingetragen. main-Tipps werden UNVERÄNDERT aus dem echten Store übernommen
// (read-only), fromR32 kommt aus DODO_R32. Export: ~/Desktop/Dodo.wm26tipp.
//
// Ausführen: npx tsx --tsconfig scripts/tsconfig.tools.json scripts/dodo-tips.ts
//   - DODO_R32 leer/teilweise  → zeigt die 16 echten Paarungen + welche noch offen
//     sind (zum Vorlesen am Telefon), KEIN Export.
//   - DODO_R32 vollständig (73–88) → verifiziert + schreibt Dodo.wm26tipp.
import { resolveTipBracket } from '../src/renderer/src/lib/bracket'
import { TEAM_BY_ID } from '../src/renderer/src/lib/data'
import { resultsAsTips } from '../src/renderer/src/lib/results'
import { resolveLateBracket, LATE_ENTRIES, entrySchedule } from '../src/renderer/src/lib/lateEntry'
import { DEFAULT_SCORING } from '../src/shared/types'
import type { ExchangeFileV1, LiveResult, Tip } from '../src/shared/types'
import { writeFileSync, readFileSync } from 'node:fs'

const DODO_ID = 'ec6b40f9-9fd0-4c4f-a06e-e183a214ddf9'

// Dodos am Telefon erfragte Tipps fürs Sechzehntelfinale (73–88) mit den ECHTEN
// Paarungen. Alle 16 Teams stehen fest — Dodo kann direkt alle 16 durchsagen.
const DODO_R32: Record<number, Tip> = {
  // TODO: Dodos Tipps eintragen, z.B.  73: { h: 1, a: 0 }, 74: { h: 2, a: 1 }, ...
}

const HOME = process.env.HOME
const name = (id: string): string => TEAM_BY_ID.get(id)?.name ?? id

// main UNVERÄNDERT aus dem echten Store (read-only)
const store = JSON.parse(readFileSync(`${HOME}/Library/Application Support/WM26 Tipp/wm26-store.json`, 'utf8'))
const dodo = store.profiles.find((p: any) => p.id === DODO_ID)
if (!dodo) throw new Error(`Dodo-Profil ${DODO_ID} nicht im Store gefunden.`)
const mainTips: Record<number, Tip> = store.entries[DODO_ID]?.main?.tips ?? {}
console.log(`Dodo "${dodo.name}" (${dodo.color}) — main: ${Object.keys(mainTips).length} Tipps aus Store`)

// echte Resultate → echte Paarungen (wie die App)
const resJson = JSON.parse(readFileSync(`${HOME}/Library/Application Support/WM26 Tipp/wm26-results.json`, 'utf8'))
const realResults: Record<number, LiveResult> = {}
for (const [k, v] of Object.entries<any>(resJson.results)) realResults[Number(k)] = v as LiveResult
const realBracket = resolveTipBracket(resultsAsTips(realResults))

const lateDef = LATE_ENTRIES.find((d) => d.kind === 'fromR32')!
const koSchedule = entrySchedule(lateDef)
const isTeam = (s: string | undefined): s is string => !!s && /^[A-Z]{3}$/.test(s)
const lateBracket = resolveLateBracket(DODO_R32, realResults, realBracket)

console.log('\n=== Dodos Sechzehntelfinal-Tipps (echte Paarungen) ===')
for (const m of koSchedule) {
  const t = lateBracket.teams[m.match]
  const tip = DODO_R32[m.match]
  const line = `  ${m.match}: ${name(t?.home ?? '?')} vs ${name(t?.away ?? '?')}`
  console.log(tip ? `${line}  → Tipp ${tip.h}:${tip.a}${tip.adv ? ` (adv ${tip.adv})` : ''}` : `${line}  ← offen`)
}

const missing = koSchedule.filter((m) => !DODO_R32[m.match]).map((m) => m.match)
if (missing.length) {
  console.log(`\n⏳ Noch offen (${missing.length}): ${missing.join(', ')} — kein Export. Tipps eintragen, erneut laufen lassen.`)
  process.exit(0)
}

const unresolved = koSchedule.filter((m) => { const t = lateBracket.teams[m.match]; return !isTeam(t?.home) || !isTeam(t?.away) })
if (unresolved.length) throw new Error(`Paarungen nicht voll aufgelöst bei: ${unresolved.map((m) => m.match).join(', ')}`)

const file: ExchangeFileV1 = {
  formatVersion: 1,
  exportedAt: new Date().toISOString(),
  scoring: store.scoring ?? DEFAULT_SCORING,
  profile: { id: dodo.id, name: dodo.name, color: dodo.color },
  entries: { main: { tips: mainTips }, fromR32: { tips: DODO_R32 } }
}
const out = `${HOME}/Desktop/Dodo.wm26tipp`
writeFileSync(out, JSON.stringify(file, null, 2))
console.log('\ngeschrieben:', out, `(main: ${Object.keys(mainTips).length}, fromR32: ${Object.keys(DODO_R32).length})`)
