// TEMP, read-only: echte Rangliste aus echtem Store + echten Resultaten nachrechnen.
import { readFileSync } from 'node:fs'
import { resolveTipBracket } from '../src/renderer/src/lib/bracket'
import { buildRealWorld, resultsAsTips } from '../src/renderer/src/lib/results'
import { computeBreakdown } from '../src/renderer/src/lib/scoring'
import { SCHEDULE } from '../src/renderer/src/lib/data'
import type { LiveResult, Tip } from '../src/shared/types'

const HOME = process.env.HOME
const store = JSON.parse(readFileSync(`${HOME}/Library/Application Support/WM26 Tipp/wm26-store.json`, 'utf8'))
const resJson = JSON.parse(readFileSync(`${HOME}/Library/Application Support/WM26 Tipp/wm26-results.json`, 'utf8'))

const results: Record<number, LiveResult> = {}
for (const [k, v] of Object.entries<any>(resJson.results)) results[Number(k)] = v as LiveResult

const realBracket = resolveTipBracket(resultsAsTips(results)) // nur finished (Wertung)
const real = buildRealWorld(results, realBracket)
const cfg = store.scoring

const finished = Object.values(results).filter((r: any) => r.status === 'finished').length
console.log(`Resultate: ${finished} Spiele finished, gewertet bis Spiel ${Math.max(...Object.values(results).filter((r:any)=>r.status==='finished').map((r:any)=>r.match))}`)

type Row = { name: string; total: number; base: number; adv: number; durch: number; exact: number; diff: number; tend: number }
const rows: Row[] = []
for (const p of store.profiles) {
  const tips: Record<number, Tip> = store.entries[p.id]?.main?.tips ?? {}
  const bd = computeBreakdown(tips, resolveTipBracket(tips), results, real, SCHEDULE, cfg)
  rows.push({ name: p.name, total: bd.total, base: bd.base, adv: bd.advance, durch: bd.durchtippPts, exact: bd.exact, diff: bd.diff, tend: bd.tendency })
}
rows.sort((a, b) => b.total - a.total)
console.log('\nRANG  PROFIL        PKT   (Basis +Weiter +Durchtipp)  exact/diff/tend')
rows.forEach((r, i) => {
  console.log(
    `${String(i + 1).padStart(2)}.  ${r.name.padEnd(12)} ${String(r.total).padStart(4)}   (${r.base} +${r.adv} +${r.durch})        ${r.exact}/${r.diff}/${r.tend}`
  )
})
