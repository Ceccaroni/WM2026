// Baut das Tipp-Rezeptbuch als druckfertiges HTML im Panini-Look (→ Electron rendert PDF).
// Charts werden aus den ECHTEN EV-Zahlen als SVG generiert. Quelle der Mathe: recipe-ev.mjs.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '..')
const OUT_DIR = '/tmp/recipe-build'
mkdirSync(OUT_DIR, { recursive: true })

/* ─────────────────────────── EV-Mathematik (Poisson) ─────────────────────────── */
const CFG = { exact: 4, diff: 3, tendency: 2 }
const MAXG = 12
const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r }
const pois = (k, l) => (Math.exp(-l) * l ** k) / fact(k)
const sgn = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0)
const points = (th, ta, h, a) =>
  th === h && ta === a ? CFG.exact : th - ta === h - a ? CFG.diff : sgn(th - ta) === sgn(h - a) ? CFG.tendency : 0
const probMatrix = (lh, la) => {
  const M = []
  for (let h = 0; h <= MAXG; h++) { M[h] = []; for (let a = 0; a <= MAXG; a++) M[h][a] = pois(h, lh) * pois(a, la) }
  return M
}
const ev = (th, ta, M) => {
  let s = 0
  for (let h = 0; h <= MAXG; h++) for (let a = 0; a <= MAXG; a++) s += M[h][a] * points(th, ta, h, a)
  return s
}
function evGrid(lh, la, n = 6) {
  const M = probMatrix(lh, la)
  const g = []
  let best = { ev: -1 }
  for (let h = 0; h <= n; h++) { g[h] = []; for (let a = 0; a <= n; a++) { const e = ev(h, a, M); g[h][a] = e; if (e > best.ev) best = { h, a, ev: e } } }
  return { g, best, M }
}

/* ─────────────────────────── Farb-Helfer ─────────────────────────── */
const hx = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
const toHex = (r) => '#' + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
const mix = (c1, c2, t) => { const a = hx(c1), b = hx(c2); return toHex(a.map((v, i) => v + (b[i] - v) * t)) }
const lum = (c) => { const [r, g, b] = hx(c).map((v) => v / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const ink = (bg) => (lum(bg) < 0.55 ? '#f2f4f8' : '#1a1d22')

const C = {
  stage: '#0e1116', paper: '#f6f1e7', paperShade: '#eae2d2', blue: '#0b5fa5', baby: '#bfe0f5',
  magenta: '#e62e6b', green: '#1f8a4c', gold: '#d4af37', goldLight: '#f9e27d', goldDark: '#8c6a1d',
  ink: '#1a1d22', inkSoft: '#5a6070'
}

/* ─────────────────────────── SVG-Charts ─────────────────────────── */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

// Heatmap des Tipp-Rasters (Wert je Zelle, Farbskala low→high), optional Optimum hervorheben
function heatmap({ grid, low, high, fmt, title, markBest, best, accent }) {
  const cell = 58, padL = 54, padT = 20, padB = 46, n = grid.length
  const W = padL + n * cell + 16, H = padT + n * cell + padB
  let vmin = Infinity, vmax = -Infinity
  for (const row of grid) for (const v of row) { if (v < vmin) vmin = v; if (v > vmax) vmax = v }
  const norm = (v) => (vmax === vmin ? 0.5 : (v - vmin) / (vmax - vmin))
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Oswald, sans-serif">`
  // Achsentitel
  s += `<text x="${padL + (n * cell) / 2}" y="${H - 10}" text-anchor="middle" font-size="13" letter-spacing="1.5" fill="${C.inkSoft}">GEGNER-TORE  ▸</text>`
  s += `<text x="16" y="${padT + (n * cell) / 2}" text-anchor="middle" font-size="13" letter-spacing="1.5" fill="${C.inkSoft}" transform="rotate(-90 16 ${padT + (n * cell) / 2})">EIGENE TORE  ▸</text>`
  for (let h = 0; h < n; h++) {
    s += `<text x="${padL - 12}" y="${padT + h * cell + cell / 2 + 5}" text-anchor="middle" font-size="15" font-weight="600" fill="${C.ink}">${h}</text>`
  }
  for (let a = 0; a < n; a++) {
    s += `<text x="${padL + a * cell + cell / 2}" y="${padT - 4}" text-anchor="middle" font-size="15" font-weight="600" fill="${C.ink}">${a}</text>`
  }
  for (let h = 0; h < n; h++) for (let a = 0; a < n; a++) {
    const v = grid[h][a], t = norm(v), bg = mix(low, high, t)
    const x = padL + a * cell, y = padT + h * cell
    const isBest = markBest && best && best.h === h && best.a === a
    s += `<rect x="${x + 1.5}" y="${y + 1.5}" width="${cell - 3}" height="${cell - 3}" rx="6" fill="${bg}" stroke="#ffffff" stroke-width="2"/>`
    if (isBest) s += `<rect x="${x + 2}" y="${y + 2}" width="${cell - 4}" height="${cell - 4}" rx="6" fill="none" stroke="${C.gold}" stroke-width="3.5"/>`
    s += `<text x="${x + cell / 2}" y="${y + cell / 2 - 5}" text-anchor="middle" font-size="13" font-weight="600" fill="${ink(bg)}">${esc(h + ':' + a)}</text>`
    s += `<text x="${x + cell / 2}" y="${y + cell / 2 + 13}" text-anchor="middle" font-size="12" fill="${ink(bg)}" opacity="0.9">${esc(fmt(v))}</text>`
    if (isBest) s += `<text x="${x + cell - 9}" y="${y + 16}" text-anchor="middle" font-size="14" fill="${C.gold}">★</text>`
  }
  s += `</svg>`
  return s
}

// horizontale Balken
function bars({ items, max, unit = '', padL = 96 }) {
  const rowH = 40, padR = 56, padT = 8, barW = 400, W = padL + barW + padR, H = padT + items.length * rowH + 8
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Oswald, sans-serif">`
  items.forEach((it, i) => {
    const y = padT + i * rowH, w = (it.value / max) * barW
    const gold = it.gold
    const fill = gold ? `url(#goldgrad)` : it.color || C.blue
    s += `<text x="${padL - 12}" y="${y + rowH / 2 + 5}" text-anchor="end" font-size="14" font-weight="600" fill="${C.ink}">${esc(it.label)}</text>`
    s += `<rect x="${padL}" y="${y + 6}" width="${barW}" height="${rowH - 16}" rx="6" fill="${C.paperShade}"/>`
    s += `<rect x="${padL}" y="${y + 6}" width="${Math.max(2, w)}" height="${rowH - 16}" rx="6" fill="${fill}"/>`
    s += `<text x="${padL + Math.max(2, w) + 8}" y="${y + rowH / 2 + 5}" font-size="14" font-weight="600" fill="${gold ? C.goldDark : C.ink}">${esc(it.value.toFixed(it.dec ?? 2))}${unit}</text>`
  })
  s += `<defs><linearGradient id="goldgrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.goldDark}"/><stop offset="0.5" stop-color="${C.gold}"/><stop offset="1" stop-color="${C.goldLight}"/></linearGradient></defs>`
  s += `</svg>`
  return s
}

/* Daten für die Charts */
const FAV = evGrid(2.0, 0.7) // klarer Favorit
const evHeat = heatmap({
  grid: FAV.g, low: C.paperShade, high: C.blue, fmt: (v) => v.toFixed(2),
  markBest: true, best: FAV.best
})
const probHeat = heatmap({
  grid: FAV.M.slice(0, 7).map((r) => r.slice(0, 7).map((p) => p * 100)),
  low: C.paper, high: C.magenta, fmt: (v) => v.toFixed(0) + '%'
})
const costBars = bars({
  max: 2.0, unit: '', padL: 60,
  items: [
    { label: '1:0', value: ev(1, 0, FAV.M), gold: true },
    { label: '2:1', value: ev(2, 1, FAV.M) },
    { label: '2:0', value: ev(2, 0, FAV.M) },
    { label: '3:1', value: ev(3, 1, FAV.M) },
    { label: '3:0', value: ev(3, 0, FAV.M) },
    { label: '4:0', value: ev(4, 0, FAV.M) }
  ]
})
const bonusBars = bars({
  max: 10, unit: ' P', padL: 132,
  items: [
    { label: 'Weiterkommer', value: 1, dec: 0, color: C.blue },
    { label: 'Achtelfinale', value: 1, dec: 0, color: C.blue },
    { label: 'Viertelfinale', value: 2, dec: 0, color: C.blue },
    { label: 'Halbfinale', value: 3, dec: 0, color: C.green },
    { label: 'Final', value: 4, dec: 0, color: C.green },
    { label: 'WELTMEISTER', value: 10, dec: 0, gold: true }
  ]
})

/* Szenario-Tabelle (durchgerechnet) */
const SCEN = [
  ['Kantersieg-Favorit', 2.6, 0.6, '2:0', '1:0 · 2:1'],
  ['Klarer Favorit', 2.0, 0.7, '1:0', '2:1 · 2:0'],
  ['Leichter Favorit', 1.65, 1.05, '1:0', '2:1'],
  ['Knapper Favorit', 1.4, 1.0, '1:0', '2:1'],
  ['Defensiv-Favorit', 1.4, 0.6, '1:0', '2:1'],
  ['Zähes Low-Scoring', 1.1, 0.8, '1:0', '2:1'],
  ['Ausgeglichen, offensiv', 1.5, 1.5, '2:1 / 1:2', '1:0 / 0:1'],
  ['Ausgeglichen, eng', 1.1, 1.1, '1:0 / 0:1', '1:1']
].map(([name, lh, la, tip, alt]) => {
  const M = probMatrix(lh, la)
  let pH = 0, pD = 0, pA = 0
  for (let h = 0; h <= MAXG; h++) for (let a = 0; a <= MAXG; a++) { if (h > a) pH += M[h][a]; else if (h === a) pD += M[h][a]; else pA += M[h][a] }
  return { name, odds: `${Math.round(pH * 100)} / ${Math.round(pD * 100)} / ${Math.round(pA * 100)}`, tip, alt }
})
const scenRows = SCEN.map((r) => `<tr><td class="nm">${r.name}</td><td class="od">${r.odds}</td><td class="tp">${r.tip}</td><td class="al">${r.alt}</td></tr>`).join('')

/* ─────────────────────────── Fonts (base64) ─────────────────────────── */
const fontFace = (family, weight, file) => {
  const b64 = readFileSync(resolve(ROOT, 'src/renderer/src/assets/fonts', file)).toString('base64')
  return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');}`
}
const FONTS = [
  fontFace('Anton', 400, 'anton-400-latin.woff2'),
  fontFace('Oswald', 500, 'oswald-500-latin.woff2'),
  fontFace('Oswald', 600, 'oswald-600-latin.woff2'),
  fontFace('Oswald', 700, 'oswald-700-latin.woff2'),
  fontFace('Inter', 400, 'inter-400-latin.woff2'),
  fontFace('Inter', 600, 'inter-600-latin.woff2'),
  fontFace('Inter', 700, 'inter-700-latin.woff2')
].join('\n')

/* ─────────────────────────── HTML-Bausteine ─────────────────────────── */
// gestreute „26"-Deko fürs Cover
const scatter = Array.from({ length: 18 }, (_, i) => {
  const top = (i * 53) % 100, left = (i * 37 + 7) % 100, rot = ((i * 47) % 40) - 20, sz = 40 + ((i * 29) % 80)
  return `<span class="n26" style="top:${top}%;left:${left}%;transform:rotate(${rot}deg);font-size:${sz}px;">26</span>`
}).join('')

const sticker = (num, title, body) => `
  <figure class="sticker">
    <span class="snum">Nº ${num}</span>
    ${title ? `<figcaption class="scap">${title}</figcaption>` : ''}
    <div class="sbody">${body}</div>
  </figure>`

const page = (cls, inner, num) => `<section class="page ${cls}">${inner}${num ? `<div class="pfoot"><span>Das Tipp-Rezeptbuch · WM 2026</span><span class="pno">${num}</span></div>` : ''}</section>`

/* ─────────────────────────── Seiten ─────────────────────────── */
const cover = page('cover', `
  <div class="flood"></div>
  <div class="scatter">${scatter}</div>
  <div class="cover-inner">
    <span class="cover-kicker">PANINI-DURCHTIPP-EDITION · WM 2026</span>
    <h1 class="cover-title foil">DAS<br>TIPP-<br>REZEPTBUCH</h1>
    <div class="cover-rule"></div>
    <p class="cover-sub">Buchmacher­mathematik fürs Durchtippen —<br>der erwartungswert-optimale Tipp, durchgerechnet.</p>
    <p class="cover-by">zusammengestellt von <strong>Claude</strong> · aktuell Rang 3, und das mit drei Spielen weniger 😎</p>
  </div>
  <div class="cover-badge">4·3·2</div>
`)

const toc = page('paper', `
  <div class="page-head"><span class="kicker">Übersicht</span><h2 class="h-chap">Inhalt</h2></div>
  <ol class="toc">
    <li><span class="tnum">01</span><span class="ttitle">Die eine Idee dahinter</span><span class="tdots"></span><span class="tpg">3</span></li>
    <li><span class="tnum">02</span><span class="ttitle">Das Punktesystem — was sich auszahlt</span><span class="tdots"></span><span class="tpg">3</span></li>
    <li><span class="tnum">03</span><span class="ttitle">Das Kern-Rezept: Scoreline nach Spieltyp</span><span class="tdots"></span><span class="tpg">4</span></li>
    <li><span class="tnum">04</span><span class="ttitle">Zwei nicht-offensichtliche Wahrheiten</span><span class="tdots"></span><span class="tpg">5</span></li>
    <li><span class="tnum">05</span><span class="ttitle">λ aus den Quoten holen — in 1 Minute</span><span class="tdots"></span><span class="tpg">6</span></li>
    <li><span class="tnum">06</span><span class="ttitle">Die KO-Phase: hier wird gewonnen</span><span class="tdots"></span><span class="tpg">7</span></li>
    <li><span class="tnum">07</span><span class="ttitle">Turnierstrategie & die häufigsten Fehler</span><span class="tdots"></span><span class="tpg">8</span></li>
  </ol>
  <div class="toc-note">Alle Tipp-Empfehlungen sind aus einem Poisson-Modell <em>durchgerechnet</em>, nicht geschätzt.
  Reproduzierbar via <code>node scripts/recipe-ev.mjs</code>.</div>
`, '2')

const p3 = page('paper', `
  <div class="page-head"><span class="kicker">Kapitel 01 + 02</span><h2 class="h-chap">Die Idee & das Punktesystem</h2></div>
  <p class="lead">Du tippst nicht das <em>spannendste</em> Ergebnis, sondern das mit dem höchsten
  <strong>erwarteten Punktegewinn</strong>. Jedes Spiel hat eine Wahrscheinlichkeits­verteilung über alle
  Ergebnisse — die kennt der Buchmacher näherungsweise. Multipliziere jede Ergebnis-Wahrscheinlichkeit mit
  den Punkten, die dein Tipp dort bekäme, summiere → das ist der <strong>Erwartungswert (EV)</strong>.
  Wir suchen den EV-Maximierer. Mehr ist es nicht.</p>

  <div class="tiers">
    <div class="tier"><span class="tpts">4</span><span class="tlab">Exakt</span><span class="tdesc">Ergebnis exakt richtig</span></div>
    <div class="tier"><span class="tpts">3</span><span class="tlab">Tordifferenz</span><span class="tdesc">gleiche Differenz — deckt auch „richtiges Remis, falsches Ergebnis"</span></div>
    <div class="tier"><span class="tpts">2</span><span class="tlab">Tendenz</span><span class="tdesc">nur Sieger/Remis-Richtung richtig</span></div>
    <div class="tier ghost"><span class="tpts">0</span><span class="tlab">Daneben</span><span class="tdesc">falsche Richtung</span></div>
  </div>

  <div class="callout">
    <strong>Beispiel.</strong> Endstand <b>2:1</b> → Tipp <b>2:1</b> = 4 P (exakt) · Tipp <b>3:2</b> = 3 P (Tordiff) ·
    Tipp <b>1:0</b> = 2 P (Tendenz) · Tipp <b>1:1</b> = <b>0 P</b>. Genau hier liegt der Hebel: knappe Siegtipps fangen
    über die Tendenz fast immer etwas auf — Remis-Tipps nicht (Kapitel 04).
  </div>

  <p class="lead small">Dazu in der KO-Phase: <strong>+1</strong> je richtigem Weiterkommer, Durchtipp-Boni je
  korrektem Runden-Teilnehmer (Achtelfinale +1 / Viertelfinale +2 / Halbfinale +3 / Final +4) und
  <strong>Weltmeister +10</strong> — der größte Einzelhebel des ganzen Turniers (Kapitel 06).</p>
`, '3')

const p4 = page('paper', `
  <div class="page-head"><span class="kicker">Kapitel 03</span><h2 class="h-chap">Das Kern-Rezept</h2></div>
  <p class="lead small">Die <b>1/X/2-Spalte</b> ist deine Brücke von den Quoten zum Rezept: implizite Prozente aus den
  1X2-Quoten rechnen, Zeile mit ähnlichem Profil suchen, Tipp ablesen.</p>
  <table class="scen">
    <thead><tr><th>Spieltyp</th><th>1 / X / 2 (%)</th><th>Tipp</th><th>knapp dahinter</th></tr></thead>
    <tbody>${scenRows}</tbody>
  </table>
  <div class="two">
    ${sticker('03·A', 'EV je Tipp — Klarer Favorit (λ 2,0 / 0,7)', `<div class="chart">${evHeat}</div><p class="cap">Dunkelblau = hoher Erwartungswert. Das Optimum (★) liegt beim knappen Sieg, nicht beim Kantersieg.</p>`)}
    ${sticker('03·B', 'Wo die Wahrscheinlichkeit sitzt', `<div class="chart">${probHeat}</div><p class="cap">Die echte Ergebnis-Verteilung desselben Spiels: die Masse klebt an niedrigen Resultaten — darum gewinnen knappe Tipps.</p>`)}
  </div>
  <p class="takeaway"><b>1:0 ist das Arbeitstier.</b> Bei fast jedem Favoritenspiel EV-optimal oder Top-2. <b>2:0</b> nur beim echten Kantersieg, <b>2:1</b> als kaum teurere, weniger fade Alternative.</p>
`, '4')

const p5 = page('paper', `
  <div class="page-head"><span class="kicker">Kapitel 04</span><h2 class="h-chap">Zwei Wahrheiten, die kaum jemand nutzt</h2></div>
  ${sticker('04·A', 'Wahrheit 1 — Remis-Tipps haben kein Sicherheitsnetz', `
    <p>Tippst du <b>1:1</b> und es endet <b>2:1</b>, gibt es <b>0 Punkte</b> — ein Remis-Tipp hat keine
    Tendenz-Auffangstufe (es gibt kein „Remis, knapp daneben"). Ein knapper Siegtipp fängt über die Tendenz
    fast immer 2 Punkte auf. Deshalb ist 1:1 selbst bei 29 % Remis-Wahrscheinlichkeit nur <b>dritte</b> Wahl.</p>
    <div class="netrow">
      <div class="net good"><span class="nt">Tipp 1:0 → Endstand 2:0</span><span class="np">+3 P</span><span class="nx">Tordiff gerettet</span></div>
      <div class="net bad"><span class="nt">Tipp 1:1 → Endstand 2:1</span><span class="np">0 P</span><span class="nx">kein Netz</span></div>
    </div>`)}
  ${sticker('04·B', 'Wahrheit 2 — zu hoch tippen ist der teuerste Fehler', `
    <div class="chart wide">${costBars}</div>
    <p class="cap">Erwartungswert je Tipp beim klaren Favoriten. Jede Stufe „höher" kostet ~0,15–0,20 EV.
    Über ein ganzes Turnier (~64 Spiele) sind das <b>10+ Punkte</b> — ungefähr der Abstand, der bei uns über Platz 1 und Platz 6 entscheidet.</p>`)}
`, '5')

const p6 = page('paper', `
  <div class="page-head"><span class="kicker">Kapitel 05</span><h2 class="h-chap">λ aus den Quoten holen</h2></div>
  <p class="lead">Das Poisson-Modell braucht zwei Zahlen — beide stehen quasi auf dem Wettschein:</p>
  <div class="formula">
    <div class="frow"><span class="fk">Total</span><span class="fv">λ<sub>heim</sub> + λ<sub>gast</sub></span><span class="fd">≈ die <b>Over/Under-2.5-Linie</b>. Fair → ≈ 2,6 · Over billig → 3,0+ · Under billig → ~2,0</span></div>
    <div class="frow"><span class="fk">Supremacy</span><span class="fv">λ<sub>heim</sub> − λ<sub>gast</sub></span><span class="fd">≈ das <b>asiatische Handicap</b>. AH −0,5 → 0,5 · AH −1,0 → 1,0 · AH −1,5 → 1,5</span></div>
    <div class="frow solve"><span class="fk">→ auflösen</span><span class="fv">λ<sub>heim</sub> = (Total + Supremacy) / 2&nbsp;&nbsp;·&nbsp;&nbsp;λ<sub>gast</sub> = (Total − Supremacy) / 2</span></div>
  </div>
  <div class="callout gold">
    <strong>Schnellpfad ohne Rechnen.</strong> Nur die 1X2-Quoten anschauen → implizite Prozente
    (≈ 1/Quote, dann normieren) → in der Tabelle aus Kapitel 03 die Zeile mit dem passenden
    1/X/2-Profil → Tipp ablesen. Reicht für 90 % der Fälle.
  </div>
  <p class="takeaway"><b>Praxis-Warnung 3. Spieltag:</b> Ein bereits qualifizierter Favorit rotiert → sein λ
  sinkt deutlich. Vor MD3 immer Quali-Stand und mutmaßliche Aufstellung checken.</p>
`, '6')

const p7 = page('paper', `
  <div class="page-head"><span class="kicker">Kapitel 06</span><h2 class="h-chap">Die KO-Phase: hier wird gewonnen</h2></div>
  <p class="lead small">In der Gruppenphase sammeln alle ähnlich viele Basispunkte (bei uns aktuell alle 59–61, <b>null</b> Boni).
  Entschieden wird's über die Boni — und die haben sehr unterschiedliche Größe:</p>
  ${sticker('06', 'Die Bonus-Hebel (Punkte je Treffer)', `<div class="chart wide">${bonusBars}</div>`)}
  <div class="lev">
    <div class="levcard"><span class="lh">Weiterkommer +1</span><p>Tipp muss zum gewünschten Sieger passen. Bei Remis-Tipp das <code>adv</code>-Feld (Sieger nach Elfmeter) setzen. KO-Spiele sind enger → 1:0 / 2:1 dominieren noch stärker.</p></div>
    <div class="levcard"><span class="lh">Durchtipp-Boni</span><p>Teilnehmer-Bonus, unabhängig vom Ergebnis. Favoriten möglichst weit durchmarschieren lassen → maximiert die Schnittmenge mit den echten Runden. Späte Runden zählen am meisten.</p></div>
    <div class="levcard gold"><span class="lh">Weltmeister +10</span><p>Der größte Einzelhebel. EV = 10 × P(Titel). <b>Champion = Top-Quotenteam, niemals das Herzensteam</b> — außer du liegst hinten und differenzierst bewusst (Kapitel 07).</p></div>
  </div>
`, '7')

const p8 = page('paper', `
  <div class="page-head"><span class="kicker">Kapitel 07</span><h2 class="h-chap">Turnierstrategie & häufige Fehler</h2></div>
  <p class="lead small">EV-optimal tippen bringt dich <b>zuverlässig nach vorne</b> — aber wenn alle es tun, tippt das halbe Feld
  ähnlich, und es entscheiden Differenzierung + Glück.</p>
  <div class="two">
    <div class="metacard"><span class="mh up">Führst du?</span><p>Bleib beim EV-Optimum. Varianz ist dein Feind. Konsens-Tipps spielen, Vorsprung verwalten.</p></div>
    <div class="metacard"><span class="mh down">Liegst du hinten?</span><p>Erhöhe kontrolliert das Risiko — anderer <b>Champion</b> als die Verfolger, mutigere HF/Final-Besetzung, bei eigenen Meinungen die exakte Scoreline jagen. Risiko ist Werkzeug, kein Selbstzweck.</p></div>
  </div>
  <h3 class="h-sub">Die 5 häufigsten Fehler — deine Chancen, sie zu schlagen</h3>
  <ol class="mistakes">
    <li><b>Zu hoch tippen</b> (3:0, 5:0). Kostet die 3er-Tordiffstufe → ~10+ Punkte / Turnier.</li>
    <li><b>Remis ohne Not.</b> Kein Tendenz-Sicherheitsnetz.</li>
    <li><b>Exakt jagen.</b> Die 4 Punkte sind Beifang, nicht Ziel — unwahrscheinliche Tipps senken den EV.</li>
    <li><b>Herzensteam im Bracket / als Champion.</b> Boni nach Quoten verteilen, nicht nach Liebe.</li>
    <li><b>Rotation am 3. Spieltag ignorieren.</b> Qualifizierter Favorit rotiert → λ sinkt.</li>
  </ol>
  <div class="cheat foil">
    <span class="cheat-k">DER SPICKZETTEL</span>
    <p>Tippe <b>knapp</b>, tippe den <b>Favoriten</b>, tippe <b>nüchtern</b>. Standard = <b>1:0</b>. Kantersieg = <b>2:0</b>.
    Lust auf mehr = <b>2:1</b>. Remis fast nie. In der KO-Phase Favoriten durchmarschieren lassen, Champion = Top-Quotenteam.
    Vorne: safe. Hinten: bei Champion &amp; Halbfinale mutig vom Feld abweichen.</p>
  </div>
`, '8')

/* ─────────────────────────── CSS ─────────────────────────── */
const CSS = `
${FONTS}
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
@page{size:A4;margin:0;}
html,body{background:${C.stage};}
body{font-family:'Inter',sans-serif;color:${C.ink};}
.page{position:relative;width:210mm;height:297mm;overflow:hidden;page-break-after:always;}
.page:last-child{page-break-after:auto;}

/* Papierseiten */
.paper{background:
  radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,.5), transparent 60%),
  linear-gradient(${C.paper},${C.paper});
  padding:20mm 18mm 16mm;}
.paper::before{content:"";position:absolute;inset:9mm;border:1.5px solid ${C.paperShade};border-radius:6px;pointer-events:none;}
.paper::after{content:"";position:absolute;inset:0;opacity:.5;pointer-events:none;
  background-image:radial-gradient(${C.paperShade} .5px, transparent .6px);background-size:7px 7px;mix-blend-mode:multiply;}

.page-head{position:relative;z-index:2;margin-bottom:7mm;border-bottom:3px solid ${C.ink};padding-bottom:3mm;}
.kicker{font-family:'Oswald',sans-serif;font-weight:600;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.magenta};}
.h-chap{font-family:'Anton',sans-serif;font-weight:400;font-size:42px;line-height:.98;letter-spacing:.5px;color:${C.ink};text-transform:uppercase;margin-top:2px;}
.h-sub{font-family:'Oswald',sans-serif;font-weight:700;font-size:18px;text-transform:uppercase;letter-spacing:1px;margin:6mm 0 3mm;color:${C.blue};}

.lead{position:relative;z-index:2;font-size:14.5px;line-height:1.6;color:${C.ink};margin-bottom:5mm;}
.lead.small{font-size:13px;line-height:1.55;color:${C.inkSoft};}
.lead em{font-style:italic;}
.takeaway{position:relative;z-index:2;margin-top:3.5mm;background:${C.baby};border-left:5px solid ${C.blue};padding:3mm 5mm;border-radius:0 8px 8px 0;font-size:12px;line-height:1.45;}

/* Punktestufen */
.tiers{position:relative;z-index:2;display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin:2mm 0 5mm;}
.tier{background:#fff;border:4px solid #fff;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,.18),0 10px 26px rgba(0,0,0,.10);padding:4mm;text-align:center;}
.tier .tpts{display:block;font-family:'Anton',sans-serif;font-size:46px;line-height:1;color:${C.blue};}
.tier .tlab{display:block;font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-size:13px;margin:2mm 0 1mm;}
.tier .tdesc{display:block;font-size:10.5px;color:${C.inkSoft};line-height:1.35;}
.tier.ghost{background:repeating-linear-gradient(45deg,${C.paper},${C.paper} 6px,${C.paperShade} 6px,${C.paperShade} 12px);border-style:dashed;border-color:#cfc6b2;box-shadow:none;}
.tier.ghost .tpts{color:${C.inkSoft};}

.callout{position:relative;z-index:2;background:#fff;border:1px solid ${C.paperShade};border-radius:10px;padding:4mm 5mm;font-size:12.5px;line-height:1.55;box-shadow:0 1px 4px rgba(0,0,0,.08);}
.callout.gold{background:linear-gradient(180deg,#fffdf3,#fff7e0);border-color:${C.gold};}
.callout b{color:${C.ink};}

/* Sticker */
.sticker{position:relative;z-index:2;background:#fff;border:5px solid #fff;border-radius:12px;box-shadow:0 2px 6px rgba(0,0,0,.22),0 12px 30px rgba(0,0,0,.12);padding:5mm;margin:4mm 0;}
.sticker .snum{position:absolute;top:3mm;right:4mm;font-family:'Oswald',sans-serif;font-weight:600;font-size:10px;letter-spacing:1px;color:${C.inkSoft};}
.scap{font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.5px;font-size:13px;color:${C.blue};margin-bottom:3mm;padding-right:16mm;}
.chart{display:flex;justify-content:center;}
.chart svg{width:78%;height:auto;}
.chart.wide svg{width:96%;}
.cap{font-size:10.5px;color:${C.inkSoft};line-height:1.4;margin-top:3mm;text-align:center;}
.two{display:grid;grid-template-columns:1fr 1fr;gap:5mm;}
.two .sticker{margin:3mm 0;padding:4mm;}
.two .scap{margin-bottom:2mm;font-size:12px;}
.two .chart svg{width:94%;}
.two .cap{margin-top:2mm;}

/* Szenario-Tabelle */
table.scen{position:relative;z-index:2;width:100%;border-collapse:separate;border-spacing:0;margin:1mm 0 4mm;font-size:12.5px;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.10);}
table.scen th{background:${C.blue};color:#fff;font-family:'Oswald',sans-serif;font-weight:600;text-transform:uppercase;letter-spacing:.5px;font-size:11px;padding:3mm 4mm;text-align:left;}
table.scen td{padding:1.9mm 4mm;background:#fff;}
table.scen tr:nth-child(even) td{background:${C.paper};}
table.scen td.nm{font-weight:600;}
table.scen td.od{font-family:'Oswald',sans-serif;color:${C.inkSoft};white-space:nowrap;}
table.scen td.tp{font-family:'Oswald',sans-serif;font-weight:700;color:${C.magenta};font-size:14px;}
table.scen td.al{font-family:'Oswald',sans-serif;color:${C.inkSoft};}

/* Netz-Vergleich */
.netrow{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:3mm;}
.net{border-radius:10px;padding:4mm;text-align:center;border:2px solid;}
.net .nt{display:block;font-family:'Oswald',sans-serif;font-weight:600;font-size:12.5px;margin-bottom:1mm;}
.net .np{display:block;font-family:'Anton',sans-serif;font-size:30px;line-height:1;}
.net .nx{display:block;font-size:10.5px;margin-top:1mm;text-transform:uppercase;letter-spacing:1px;}
.net.good{background:#eaf7ef;border-color:${C.green};} .net.good .np,.net.good .nx{color:${C.green};}
.net.bad{background:#fdeef0;border-color:${C.magenta};} .net.bad .np,.net.bad .nx{color:${C.magenta};}

/* Formel */
.formula{position:relative;z-index:2;background:${C.stage};color:${C.text};border-radius:12px;padding:5mm;margin:1mm 0 4mm;box-shadow:0 8px 24px rgba(0,0,0,.2);}
.frow{display:grid;grid-template-columns:90px 200px 1fr;gap:4mm;align-items:baseline;padding:2.5mm 0;border-bottom:1px solid rgba(255,255,255,.08);color:#e9edf3;font-size:12px;}
.frow:last-child{border-bottom:none;}
.frow .fk{font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${C.goldLight};font-size:12px;}
.frow .fv{font-family:'Oswald',sans-serif;font-size:16px;color:#fff;}
.frow .fd{color:#aab3c2;line-height:1.4;}
.frow.solve{grid-template-columns:90px 1fr;} .frow.solve .fv{font-size:14px;}

/* KO-Hebel */
.lev{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm;margin-top:4mm;position:relative;z-index:2;}
.levcard{background:#fff;border:1px solid ${C.paperShade};border-radius:10px;padding:4mm;box-shadow:0 1px 4px rgba(0,0,0,.08);}
.levcard .lh{display:block;font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;font-size:12px;letter-spacing:.5px;color:${C.blue};margin-bottom:2mm;}
.levcard p{font-size:11px;line-height:1.45;color:${C.ink};}
.levcard.gold{background:linear-gradient(180deg,#fffdf3,#fdf0cf);border-color:${C.gold};}
.levcard.gold .lh{color:${C.goldDark};}

/* Meta + Fehler */
.metacard{background:#fff;border:1px solid ${C.paperShade};border-radius:10px;padding:4mm 5mm;box-shadow:0 1px 4px rgba(0,0,0,.08);}
.metacard .mh{display:block;font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;font-size:14px;letter-spacing:.5px;margin-bottom:2mm;}
.metacard .mh.up{color:${C.green};} .metacard .mh.down{color:${C.magenta};}
.metacard p{font-size:12px;line-height:1.5;}
ol.mistakes{position:relative;z-index:2;counter-reset:m;list-style:none;display:grid;gap:2.5mm;}
ol.mistakes li{counter-increment:m;position:relative;padding:3mm 4mm 3mm 13mm;background:#fff;border-radius:8px;border:1px solid ${C.paperShade};font-size:12.5px;line-height:1.45;box-shadow:0 1px 3px rgba(0,0,0,.06);}
ol.mistakes li::before{content:counter(m);position:absolute;left:4mm;top:50%;transform:translateY(-50%);font-family:'Anton',sans-serif;font-size:24px;color:${C.magenta};}

/* Foil */
.foil{background:linear-gradient(110deg,${C.goldDark} 0%,${C.gold} 28%,${C.goldLight} 50%,${C.gold} 72%,${C.goldDark} 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;}
.cheat{position:relative;z-index:2;margin-top:6mm;background:${C.stage};border:2px solid ${C.gold};border-radius:14px;padding:6mm;box-shadow:0 10px 30px rgba(0,0,0,.25);}
.cheat .cheat-k{display:block;font-family:'Oswald',sans-serif;font-weight:700;letter-spacing:3px;font-size:12px;margin-bottom:3mm;
  background:linear-gradient(110deg,${C.goldDark},${C.gold},${C.goldLight},${C.gold});-webkit-background-clip:text;background-clip:text;color:transparent;}
.cheat p{color:#eef1f6;font-size:14px;line-height:1.6;}
.cheat b{color:${C.goldLight};}

/* Fußzeile */
.pfoot{position:absolute;left:18mm;right:18mm;bottom:8mm;display:flex;justify-content:space-between;align-items:center;
  font-family:'Oswald',sans-serif;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:${C.inkSoft};z-index:3;}
.pfoot .pno{font-family:'Anton',sans-serif;font-size:18px;color:${C.ink};}

/* TOC */
ol.toc{list-style:none;position:relative;z-index:2;margin-top:4mm;}
ol.toc li{display:flex;align-items:baseline;gap:4mm;padding:4mm 0;border-bottom:1px solid ${C.paperShade};}
ol.toc .tnum{font-family:'Anton',sans-serif;font-size:24px;color:${C.magenta};width:42px;}
ol.toc .ttitle{font-family:'Oswald',sans-serif;font-weight:600;font-size:16px;color:${C.ink};}
ol.toc .tdots{flex:1;border-bottom:2px dotted ${C.paperShade};transform:translateY(-4px);}
ol.toc .tpg{font-family:'Anton',sans-serif;font-size:20px;color:${C.blue};}
.toc-note{position:relative;z-index:2;margin-top:8mm;font-size:11.5px;color:${C.inkSoft};line-height:1.5;}
.toc-note code{font-family:'Oswald',sans-serif;background:${C.paperShade};padding:1px 5px;border-radius:4px;white-space:nowrap;}

/* Cover */
.cover{background:radial-gradient(120% 90% at 50% -10%, #1b2230 0%, ${C.stage} 60%);color:#fff;}
.flood{position:absolute;inset:0;background:radial-gradient(60% 40% at 50% 8%, rgba(191,224,245,.18), transparent 70%);}
.scatter{position:absolute;inset:0;overflow:hidden;}
.n26{position:absolute;font-family:'Anton',sans-serif;color:rgba(255,255,255,.04);line-height:1;}
.cover-inner{position:absolute;left:20mm;right:20mm;top:54mm;z-index:2;}
.cover-kicker{font-family:'Oswald',sans-serif;font-weight:600;letter-spacing:4px;font-size:12px;text-transform:uppercase;color:${C.baby};}
.cover-title{font-family:'Anton',sans-serif;font-size:96px;line-height:.92;letter-spacing:1px;margin:6mm 0;text-transform:uppercase;
  filter:drop-shadow(0 3px 0 rgba(0,0,0,.35));}
.cover-rule{width:64mm;height:6px;background:${C.magenta};border-radius:3px;margin:2mm 0 6mm;}
.cover-sub{font-family:'Oswald',sans-serif;font-weight:500;font-size:21px;line-height:1.35;color:#eef2f8;max-width:130mm;}
.cover-by{margin-top:14mm;font-size:13px;color:${C.text||'#aeb7c5'};color:#aeb7c5;}
.cover-by strong{color:#fff;}
.cover-badge{position:absolute;right:20mm;bottom:22mm;z-index:2;font-family:'Anton',sans-serif;font-size:30px;color:${C.stage};
  background:linear-gradient(135deg,${C.goldLight},${C.gold} 45%,${C.goldDark});width:34mm;height:34mm;border-radius:50%;
  display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(212,175,55,.35);border:3px solid #fff3cf;letter-spacing:1px;}
`

/* ─────────────────────────── Dokument ─────────────────────────── */
const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Das Tipp-Rezeptbuch</title><style>${CSS}</style></head>
<body>${cover}${toc}${p3}${p4}${p5}${p6}${p7}${p8}</body></html>`

const htmlPath = resolve(OUT_DIR, 'index.html')
writeFileSync(htmlPath, html)
console.log('HTML geschrieben:', htmlPath, `(${(html.length / 1024 / 1024).toFixed(2)} MB, Fonts inline)`)

/* ─────────────────────────── PDF via Chrome-Headless ─────────────────────────── */
// Electron/printToPDF hängt in headless macOS-Sessions (kein WindowServer) — Chrome --headless nicht.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'

const OUT_PDF = process.argv[2] || `${process.env.HOME}/Desktop/Tipp-Rezeptbuch.pdf`
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
if (!existsSync(CHROME)) {
  console.log('⚠︎ Google Chrome nicht gefunden — HTML liegt bereit, PDF bitte manuell rendern:', htmlPath)
} else {
  const profile = `/tmp/chrome-pdf-${process.pid}`
  rmSync(profile, { recursive: true, force: true })
  rmSync(OUT_PDF, { force: true })
  spawnSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profile}`, '--no-pdf-header-footer', '--virtual-time-budget=6000',
    `--print-to-pdf=${OUT_PDF}`, `file://${htmlPath}`
  ], { stdio: 'ignore' })
  rmSync(profile, { recursive: true, force: true })
  if (existsSync(OUT_PDF)) {
    const kb = (execFileSync('stat', ['-f%z', OUT_PDF]).toString().trim() / 1024).toFixed(0)
    console.log('✓ PDF geschrieben:', OUT_PDF, `(${kb} KB, 8 Seiten A4)`)
  } else console.error('✗ PDF-Rendering fehlgeschlagen.')
}
