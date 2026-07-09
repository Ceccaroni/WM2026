// Erwartungswert-optimaler Tipp fürs WM26-Punktesystem (4 exakt / 3 Tordiff / 2 Tendenz).
// Modell: Tore ~ unabhängige Poisson(λ). λ leitet man aus den Quoten ab:
//   Total = λh+λa  (≈ Over/Under-Linie),  Supremacy = λh−λa  (aus 1X2/Handicap).
// Für jedes Spielprofil suchen wir den Tipp (th,ta), der den erwarteten Punktegewinn maximiert.

const CFG = { exact: 4, diff: 3, tendency: 2 }
const MAXG = 12 // Tor-Obergrenze für die Summation (Poisson-Schwanz ist vernachlässigbar)

const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r }
const pois = (k, l) => (Math.exp(-l) * l ** k) / fact(k)
const sign = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0)

function points(th, ta, h, a) {
  if (th === h && ta === a) return CFG.exact
  if (th - ta === h - a) return CFG.diff
  if (sign(th - ta) === sign(h - a)) return CFG.tendency
  return 0
}

// Wahrscheinlichkeitsmatrix P(h,a) für gegebene λ
function probMatrix(lh, la) {
  const M = []
  for (let h = 0; h <= MAXG; h++) { M[h] = []; for (let a = 0; a <= MAXG; a++) M[h][a] = pois(h, lh) * pois(a, la) }
  return M
}

// EV eines konkreten Tipps
function ev(th, ta, M) {
  let s = 0
  for (let h = 0; h <= MAXG; h++) for (let a = 0; a <= MAXG; a++) s += M[h][a] * points(th, ta, h, a)
  return s
}

// besten Tipp + Top-Liste finden
function analyze(lh, la) {
  const M = probMatrix(lh, la)
  const cand = []
  for (let th = 0; th <= 6; th++) for (let ta = 0; ta <= 6; ta++) cand.push({ th, ta, ev: ev(th, ta, M) })
  cand.sort((x, y) => y.ev - x.ev)
  // P(Heimsieg/Remis/Auswärts) zur Einordnung
  let pH = 0, pD = 0, pA = 0
  for (let h = 0; h <= MAXG; h++) for (let a = 0; a <= MAXG; a++) { if (h > a) pH += M[h][a]; else if (h === a) pD += M[h][a]; else pA += M[h][a] }
  return { top: cand.slice(0, 4), pH, pD, pA }
}

const SCEN = [
  ['Kantersieg-Favorit   (Total 3.2, Supr +2.0)', 2.6, 0.6],
  ['Klarer Favorit       (Total 2.7, Supr +1.3)', 2.0, 0.7],
  ['Leichter Favorit     (Total 2.7, Supr +0.6)', 1.65, 1.05],
  ['Knapper Favorit      (Total 2.4, Supr +0.4)', 1.4, 1.0],
  ['Ausgeglichen offensiv(Total 3.0, Supr  0.0)', 1.5, 1.5],
  ['Ausgeglichen eng     (Total 2.2, Supr  0.0)', 1.1, 1.1],
  ['Defensiv-Favorit     (Total 2.0, Supr +0.8)', 1.4, 0.6],
  ['Zähes Low-Scoring     (Total 1.9, Supr +0.3)', 1.1, 0.8]
]

const fmt = (n) => n.toFixed(2)
console.log('SPIELPROFIL                                  λh/λa     1/X/2 (%)        EV-optimaler Tipp   Top-Alternativen (EV)')
console.log('─'.repeat(118))
for (const [name, lh, la] of SCEN) {
  const r = analyze(lh, la)
  const b = r.top[0]
  const odds = `${Math.round(r.pH * 100)}/${Math.round(r.pD * 100)}/${Math.round(r.pA * 100)}`.padEnd(13)
  const alts = r.top.slice(1).map((c) => `${c.th}:${c.ta} (${fmt(c.ev)})`).join('  ')
  console.log(`${name.padEnd(44)} ${fmt(lh)}/${fmt(la)}   ${odds}    ➜  ${b.th}:${b.ta}  (EV ${fmt(b.ev)})    ${alts}`)
}

// Kontrollprobe: was kostet "spektakulär tippen"? EV von 3:0 vs. optimal beim klaren Favoriten
console.log('\nKontrolle „hoch tippen kostet Tordiff" — Klarer Favorit (λ 2.0/0.7):')
const M = probMatrix(2.0, 0.7)
for (const [th, ta] of [[2, 0], [2, 1], [1, 0], [3, 0], [4, 0], [3, 1]]) {
  console.log(`  Tipp ${th}:${ta}  →  EV ${fmt(ev(th, ta, M))}`)
}
