// TEMP, read-only: echte R32-Paarungen aus echten Resultaten nachrechnen (App-Logik),
// + Cross-Check gegen die Paarungen, die ESPN bereits mit Teams führt.
import { readFileSync } from 'node:fs'
import { resolveTipBracket } from '../src/renderer/src/lib/bracket'
import { resultsAsTips } from '../src/renderer/src/lib/results'
import type { LiveResult } from '../src/shared/types'

const HOME = process.env.HOME
const resJson = JSON.parse(
  readFileSync(`${HOME}/Library/Application Support/WM26 Tipp/wm26-results.json`, 'utf8')
)

const results: Record<number, LiveResult> = {}
for (const [k, v] of Object.entries<any>(resJson.results)) results[Number(k)] = v as LiveResult

const finished = Object.values(results).filter((r: any) => r.status === 'finished').length
console.log(`Resultate: ${finished} Spiele finished, fetchedAt ${resJson.fetchedAt}\n`)

const rb = resolveTipBracket(resultsAsTips(results))

console.log('allGroupsComplete:', rb.allGroupsComplete)
console.log('officialAllocation (Annexe C exakt):', rb.officialAllocation)
console.log('qualifizierte Dritte:', (rb.qualifiedThirds ?? []).join(', '))
if (rb.thirds) {
  console.log('\nDritten-Rangliste (Top 12):')
  rb.thirds.forEach((t: any, i: number) =>
    console.log(`  ${i + 1}. ${t.group}: ${t.row.team}  ${t.row.points}P ${t.row.gd >= 0 ? '+' : ''}${t.row.gd} (${t.row.gf}:${t.row.ga})`)
  )
}

console.log('\n=== Gruppentabellen (1. / 2. / 3.) ===')
for (const g of Object.keys(rb.tables) as any[]) {
  const t = rb.tables[g]
  console.log(`  ${g}: 1.${t[0].team}  2.${t[1].team}  3.${t[2].team}`)
}

const isTeam = (s: string) => /^[A-Z]{3}$/.test(s)
console.log('\n=== 16 Sechzehntelfinal-Paarungen (App-Auflösung) ===')
let allFixed = true
for (let n = 73; n <= 88; n++) {
  const p = rb.teams[n]
  const fixed = p && isTeam(p.home) && isTeam(p.away)
  if (!fixed) allFixed = false
  const third = rb.thirdAllocation?.[n] ? ` [Dritter ${rb.thirdAllocation[n]}]` : ''
  console.log(`  ${n}: ${p?.home ?? '?'} vs ${p?.away ?? '?'}${third}${fixed ? '' : '  ← NICHT aufgelöst'}`)
}
console.log(`\nr32Fixed (alle 16 real aufgelöst): ${allFixed}`)

console.log('\n=== Cross-Check gegen ESPN-Teams (wo vorhanden) ===')
let mism = 0
for (let n = 73; n <= 88; n++) {
  const espnH = (results[n] as any)?.homeTeam
  const espnA = (results[n] as any)?.awayTeam
  if (!espnH || !espnA) continue
  const p = rb.teams[n]
  const ok = p && p.home === espnH && p.away === espnA
  if (!ok) mism++
  console.log(`  ${n}: ESPN ${espnH} vs ${espnA}  |  App ${p?.home} vs ${p?.away}  ${ok ? '✓' : '✗ ABWEICHUNG'}`)
}
console.log(mism === 0 ? '\n✓ Alle von ESPN genannten Paarungen stimmen mit der App-Auflösung überein.' : `\n✗ ${mism} Abweichung(en) — Drittel-Zuordnung prüfen!`)
