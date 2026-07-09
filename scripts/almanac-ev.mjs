// EV-optimaler Tipp über VERSCHIEDENE Punktesysteme — Grundlage des Tipp-Almanachs.
// Zeigt: hat dein Tippspiel eine Tordifferenz-Stufe → tippe knapp; belohnt es exakt
// extrem stark → ziele aufs wahrscheinlichste exakte Ergebnis.
const MAXG = 12
const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r }
const pois = (k, l) => (Math.exp(-l) * l ** k) / fact(k)
const sgn = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0)
const points = (th, ta, h, a, c) =>
  th === h && ta === a ? c.exact : th - ta === h - a ? c.diff : sgn(th - ta) === sgn(h - a) ? c.tendency : 0
const probMatrix = (lh, la) => {
  const M = []
  for (let h = 0; h <= MAXG; h++) { M[h] = []; for (let a = 0; a <= MAXG; a++) M[h][a] = pois(h, lh) * pois(a, la) }
  return M
}
const ev = (th, ta, M, c) => { let s = 0; for (let h = 0; h <= MAXG; h++) for (let a = 0; a <= MAXG; a++) s += M[h][a] * points(th, ta, h, a, c); return s }
function best(lh, la, c) {
  const M = probMatrix(lh, la); let b = { ev: -1 }
  for (let th = 0; th <= 6; th++) for (let ta = 0; ta <= 6; ta++) { const e = ev(th, ta, M, c); if (e > b.ev) b = { th, ta, ev: e } }
  return b
}

const SYS = [
  ['kicktipp / Super League', { exact: 4, diff: 3, tendency: 2 }, 'Tendenz 2 · Tordiff 3 · Exakt 4'],
  ['Klassische Tipprunde', { exact: 3, diff: 2, tendency: 1 }, 'Tendenz 1 · Tordiff 2 · Exakt 3'],
  ['Nur Ausgang + Exakt', { exact: 3, diff: 1, tendency: 1 }, 'Ausgang 1 · Exakt 3 (KEINE Tordiff-Stufe)'],
  ['Exakt-Jäger', { exact: 6, diff: 1, tendency: 1 }, 'Ausgang 1 · Exakt 6 (exakt extrem belohnt)']
]
const TYPES = [
  ['Kantersieg-Favorit', 2.6, 0.6],
  ['Klarer Favorit', 2.0, 0.7],
  ['Leichter Favorit', 1.65, 1.05],
  ['Ausgeglichen, eng', 1.1, 1.1]
]

for (const [sname, c, desc] of SYS) {
  console.log(`\n■ ${sname}  —  ${desc}`)
  for (const [tname, lh, la] of TYPES) {
    const b = best(lh, la, c)
    console.log(`   ${tname.padEnd(22)} ➜ ${b.th}:${b.ta}`)
  }
}
console.log('\nMerksatz-Check: verschiebt sich der optimale Tipp beim „Klaren Favorit" je nach System?')
for (const [sname, c] of SYS) { const b = best(2.0, 0.7, c); console.log(`   ${sname.padEnd(26)} ➜ ${b.th}:${b.ta}`) }
