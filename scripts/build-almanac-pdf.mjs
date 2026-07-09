// Baut „Der ultimative Tipp-Almanach für Dummies" als druckfertiges PDF (Panini-Serie, Band II).
// System-übergreifend (EM, Super League, Bürospiele …). Charts aus echten EV-Zahlen.
// Ein Kommando:  node scripts/build-almanac-pdf.mjs   →   ~/Desktop/Tipp-Almanach.pdf
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '..')
const OUT_DIR = '/tmp/almanac-build'
mkdirSync(OUT_DIR, { recursive: true })

/* ─────────── EV-Mathematik über beliebige Punktesysteme ─────────── */
const MAXG = 12
const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r }
const pois = (k, l) => (Math.exp(-l) * l ** k) / fact(k)
const sgn = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0)
const pts = (th, ta, h, a, c) => (th === h && ta === a ? c.exact : th - ta === h - a ? c.diff : sgn(th - ta) === sgn(h - a) ? c.tendency : 0)
const probMatrix = (lh, la) => { const M = []; for (let h = 0; h <= MAXG; h++) { M[h] = []; for (let a = 0; a <= MAXG; a++) M[h][a] = pois(h, lh) * pois(a, la) } return M }
const ev = (th, ta, M, c) => { let s = 0; for (let h = 0; h <= MAXG; h++) for (let a = 0; a <= MAXG; a++) s += M[h][a] * pts(th, ta, h, a, c); return s }
function best(lh, la, c) { const M = probMatrix(lh, la); let b = { ev: -1 }; for (let th = 0; th <= 6; th++) for (let ta = 0; ta <= 6; ta++) { const e = ev(th, ta, M, c); if (e > b.ev) b = { th, ta, ev: e } } return `${b.th}:${b.ta}` }

/* ─────────── Farben (Panini) ─────────── */
const C = {
  stage: '#0e1116', paper: '#f6f1e7', paperShade: '#eae2d2', blue: '#0b5fa5', blueDk: '#073e68', baby: '#bfe0f5',
  magenta: '#e62e6b', green: '#1f8a4c', greenDk: '#155f35', gold: '#d4af37', goldLight: '#f9e27d', goldDark: '#8c6a1d',
  amber: '#e0972a', ink: '#1a1d22', inkSoft: '#5a6070'
}
const ACCENT = C.green // Almanach-Leitakzent (Band II), Rezeptbuch war magenta

/* ─────────── System × Spieltyp-Matrix (echte optimale Tipps) ─────────── */
const SYS = [
  ['kicktipp / Super League', { exact: 4, diff: 3, tendency: 2 }],
  ['Klassische Tipprunde', { exact: 3, diff: 2, tendency: 1 }],
  ['Nur Ausgang + Exakt', { exact: 3, diff: 1, tendency: 1 }],
  ['Exakt extrem belohnt', { exact: 6, diff: 1, tendency: 1 }]
]
const TYP = [
  ['Kantersieg', 2.6, 0.6], ['Klarer Fav.', 2.0, 0.7], ['Leichter Fav.', 1.65, 1.05],
  ['Knapper Fav.', 1.4, 1.0], ['Ausgeglichen', 1.2, 1.15]
]
const TIPCOLOR = { '1:0': C.blue, '2:0': C.blueDk, '2:1': '#14776a', '1:1': C.amber, '0:1': C.magenta, '0:2': '#a01c4d' }

function systemMatrixSVG() {
  const cw = 118, rh = 52, padL = 188, padT = 56, W = padL + TYP.length * cw + 14, H = padT + SYS.length * rh + 16
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Oswald, sans-serif">`
  // Spaltenköpfe
  TYP.forEach(([name], j) => {
    s += `<text x="${padL + j * cw + cw / 2}" y="${padT - 30}" text-anchor="middle" font-size="15" font-weight="600" fill="${C.ink}">${name}</text>`
  })
  s += `<text x="${padL - 16}" y="${padT - 30}" text-anchor="end" font-size="13" font-weight="600" fill="${C.inkSoft}">PUNKTESYSTEM ▾</text>`
  SYS.forEach(([sname, c], i) => {
    const y = padT + i * rh
    s += `<text x="${padL - 16}" y="${y + rh / 2 + 5}" text-anchor="end" font-size="15" font-weight="600" fill="${C.ink}">${sname}</text>`
    TYP.forEach(([, lh, la], j) => {
      const tip = best(lh, la, c), col = TIPCOLOR[tip] || C.inkSoft, x = padL + j * cw
      s += `<rect x="${x + 3}" y="${y + 3}" width="${cw - 6}" height="${rh - 6}" rx="8" fill="${col}" stroke="#fff" stroke-width="2.5"/>`
      s += `<text x="${x + cw / 2}" y="${y + rh / 2 + 8}" text-anchor="middle" font-size="22" font-weight="700" fill="#fff">${tip}</text>`
    })
  })
  s += `</svg>`
  return s
}
const SYS_MATRIX = systemMatrixSVG()

/* ─────────── Fonts (base64) ─────────── */
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

/* ─────────── Bausteine ─────────── */
const scatter = Array.from({ length: 16 }, (_, i) => {
  const top = (i * 57 + 5) % 100, left = (i * 41 + 11) % 100, rot = ((i * 53) % 44) - 22, sz = 38 + ((i * 31) % 78)
  return `<span class="n26" style="top:${top}%;left:${left}%;transform:rotate(${rot}deg);font-size:${sz}px;">26</span>`
}).join('')

const sticker = (num, title, body) => `<figure class="sticker"><span class="snum">Nº ${num}</span>${title ? `<figcaption class="scap">${title}</figcaption>` : ''}<div class="sbody">${body}</div></figure>`
const page = (cls, inner, num) => `<section class="page ${cls}">${inner}${num ? `<div class="pfoot"><span>Der ultimative Tipp-Almanach · für Dummies</span><span class="pno">${num}</span></div>` : ''}</section>`
const head = (kick, title) => `<div class="page-head"><span class="kicker">${kick}</span><h2 class="h-chap">${title}</h2></div>`

/* ─────────── Seiten ─────────── */
const cover = page('cover', `
  <div class="flood"></div><div class="scatter">${scatter}</div>
  <div class="cover-inner">
    <span class="cover-kicker">TIPP-WERKSTATT · BAND II</span>
    <h1 class="cover-title foil">DER<br>TIPP-<br>ALMANACH</h1>
    <div class="cover-rule"></div>
    <p class="cover-sub">Jedes Tippspiel knacken — EM, Super League<br>&amp; der ganze Rest. Die Dummies-Edition.</p>
    <p class="cover-by">von <strong>Claude</strong> · die Universalgesetze, durchgerechnet für jedes Punktesystem</p>
  </div>
  <div class="cover-badge"><span>FÜR</span><b>DUMMIES</b></div>
`)

const toc = page('paper', head('Übersicht', 'Inhalt') + `
  <ol class="toc">
    <li><span class="tnum">01</span><span class="ttitle">In 5 Minuten startklar</span><span class="tdots"></span><span class="tpg">3</span></li>
    <li><span class="tnum">02</span><span class="ttitle">Schritt 0: Welches Spiel spielst du?</span><span class="tdots"></span><span class="tpg">4</span></li>
    <li><span class="tnum">03</span><span class="ttitle">Die 3 Universalgesetze (durchgerechnet)</span><span class="tdots"></span><span class="tpg">5</span></li>
    <li><span class="tnum">04</span><span class="ttitle">Spieltyp erkennen → Standard-Tipp</span><span class="tdots"></span><span class="tpg">6</span></li>
    <li><span class="tnum">05</span><span class="ttitle">Quoten lesen für Dummies</span><span class="tdots"></span><span class="tpg">7</span></li>
    <li><span class="tnum">06</span><span class="ttitle">Liga-Spezial (Super League &amp; Co.)</span><span class="tdots"></span><span class="tpg">8</span></li>
    <li><span class="tnum">07</span><span class="ttitle">Turnier-Spezial (EM / WM)</span><span class="tdots"></span><span class="tpg">9</span></li>
    <li><span class="tnum">08</span><span class="ttitle">Die 7 Todsünden</span><span class="tdots"></span><span class="tpg">10</span></li>
    <li><span class="tnum">09</span><span class="ttitle">Glossar &amp; Spickzettel zum Ausschneiden</span><span class="tdots"></span><span class="tpg">11</span></li>
  </ol>
  <div class="toc-note">Dies ist <b>Band II</b> der Tipp-Werkstatt. Band I („Das Tipp-Rezeptbuch") rechnet dasselbe für das
  WM-2026-Punktesystem im Detail durch. Hier geht's um <em>jedes</em> Tippspiel.</div>
`, '2')

const p3 = page('paper', head('Kapitel 01', 'In 5 Minuten startklar') + `
  <p class="lead">Keine Lust auf Theorie? Diese vier Schritte reichen, um in fast jedem Tippspiel oben mitzuspielen.
  Das <em>Warum</em> kommt danach.</p>
  <div class="steps">
    <div class="step"><span class="sno">1</span><div><h4>Punktesystem checken</h4><p>Gibt es Punkte für die <b>Tordifferenz</b> (nicht nur Tendenz &amp; exakt)? Meistens ja. Das entscheidet alles Weitere.</p></div></div>
    <div class="step"><span class="sno">2</span><div><h4>Favorit finden</h4><p>Wer ist laut <b>Quoten</b> vorn? Die niedrigste der drei 1X2-Quoten = Favorit. Nicht dein Bauch, nicht dein Lieblingsklub.</p></div></div>
    <div class="step"><span class="sno">3</span><div><h4>Knapp tippen</h4><p>Standard-Tipp <b>1:0</b> für den Favoriten. Klarer Klassenunterschied → <b>2:0</b>. Klares Remis → <b>1:1</b>. Fertig.</p></div></div>
    <div class="step"><span class="sno">4</span><div><h4>Nüchtern bleiben</h4><p>Keine 4:1-Spektakel, kein Herzklub, keine Remis-Experimente. Über eine ganze Saison gewinnt die Langeweile.</p></div></div>
  </div>
  <div class="cheatline foil-box"><b>Die Kurzformel:</b> Favorit + knapp + nüchtern. Mehr ist 90 % der Miete.</div>
`, '3')

const p4 = page('paper', head('Kapitel 02', 'Schritt 0: Welches Spiel spielst du?') + `
  <p class="lead">Bevor du <em>irgendetwas</em> tippst: lies die Punkteregeln deiner Runde. Sie entscheiden, wie mutig du
  sein darfst. Fast alle Tippspiele fallen in einen dieser Typen:</p>
  <div class="systypes">
    <div class="systype"><span class="sysh">Tendenz · Tordiff · Exakt</span><span class="sysex">z. B. 2 / 3 / 4 (kicktipp, Super League)</span><p>Der Normalfall. Die mittlere Stufe (Tordifferenz) ist dein Sicherheitsnetz → <b>knapp tippen</b> ist optimal.</p></div>
    <div class="systype"><span class="sysh">Ausgang · Exakt</span><span class="sysex">z. B. 1 / 3 (keine Tordiff-Stufe)</span><p>Ohne Mittelstufe zählt nur „richtig getippt" oder „exakt". Trotzdem: knapp bleiben, denn der Ausgang ist die sichere Bank.</p></div>
    <div class="systype"><span class="sysh">Exakt stark belohnt</span><span class="sysex">z. B. Exakt = 6× Ausgang</span><p>Hier <b>darfst du mutiger</b> aufs wahrscheinlichste exakte Ergebnis zielen — der Volltreffer zahlt richtig.</p></div>
    <div class="systype gold"><span class="sysh">+ Boni &amp; Joker</span><span class="sysex">Champion, Doppel-Spieltage, Joker</span><p>Turniere haben Extra-Hebel (Kap. 07). Merke dir, wo die <b>fetten</b> Punkte liegen — dort lohnt sich Mühe am meisten.</p></div>
  </div>
  <div class="callout"><strong>Die eine Frage, die zählt:</strong> „Bekomme ich Punkte für die richtige <b>Tordifferenz</b>?"
  Ja → tippe knapp (der Normalfall). Nein, und exakt wird stark belohnt → ziele präziser.</div>
`, '4')

const p5 = page('paper', head('Kapitel 03', 'Die 3 Universalgesetze') + `
  <p class="lead small">Wir haben den erwartungswert-optimalen Tipp für vier verschiedene Punktesysteme durchgerechnet.
  Das verblüffende Ergebnis: Er ist <b>fast immer derselbe</b>.</p>
  ${sticker('03', 'Optimaler Tipp je System × Spieltyp (durchgerechnet)', `<div class="chart">${SYS_MATRIX}</div><p class="cap">Egal welches Punktesystem (Zeilen) oder welcher Spieltyp (Spalten) — fast überall steht <b>1:0</b> oder <b>2:0</b>. Die Strategie ist robust.</p>`)}
  <div class="laws">
    <div class="law"><span class="ln">1</span><h4>Tippe den Favoriten</h4><p>Quoten schlagen Bauchgefühl. Immer.</p></div>
    <div class="law"><span class="ln">2</span><h4>Tippe knapp</h4><p>1:0 ist der Dauerbrenner, 2:0 beim Kantersieg.</p></div>
    <div class="law"><span class="ln">3</span><h4>Tippe nüchtern</h4><p>Kein Spektakel, kein Remis ohne Not.</p></div>
  </div>
`, '5')

const p6 = page('paper', head('Kapitel 04', 'Spieltyp erkennen → Standard-Tipp') + `
  <p class="lead small">Schau auf die 1X2-Quoten, ordne das Spiel einem Typ zu, nimm den Tipp. Kochrezept:</p>
  <table class="scen">
    <thead><tr><th>Wenn das Spiel so aussieht …</th><th>Erkennungszeichen</th><th>Tipp</th></tr></thead>
    <tbody>
      <tr><td class="nm">Kantersieg-Favorit</td><td class="od">Favoritenquote ≤ 1,30</td><td class="tp">2:0</td></tr>
      <tr><td class="nm">Klarer Favorit</td><td class="od">Quote ~1,40–1,80</td><td class="tp">1:0</td></tr>
      <tr><td class="nm">Leichter Favorit</td><td class="od">Quote ~1,90–2,40</td><td class="tp">1:0</td></tr>
      <tr><td class="nm">Pari / offen</td><td class="od">alle drei Quoten ähnlich</td><td class="tp">1:0 auf den Heim-/Quoten­favoriten</td></tr>
      <tr><td class="nm">Klares Remis-Spiel</td><td class="od">Remis-Quote am tiefsten</td><td class="tp">1:1</td></tr>
      <tr><td class="nm">Torfestival erwartet</td><td class="od">Over-2.5 sehr billig</td><td class="tp">2:1 / 3:1 (Favorit)</td></tr>
    </tbody>
  </table>
  <div class="two">
    <div class="metacard"><span class="mh up">Die Faustregel fürs Ergebnis</span><p>Nimm das <b>wahrscheinlichste knappe</b> Resultat in Favoritenrichtung. Im Zweifel: 1:0. Du jagst nicht den exakten Treffer — der kommt als Beifang.</p></div>
    <div class="metacard"><span class="mh down">Wann du abweichst</span><p>Nur wenn du echtes Zusatzwissen hast (Verletzungen, Rotation, Wetter) <b>oder</b> bewusst Risiko brauchst, weil du in der Tabelle hinten liegst.</p></div>
  </div>
`, '6')

const p7 = page('paper', head('Kapitel 05', 'Quoten lesen für Dummies') + `
  <p class="lead">Eine Wettquote ist nichts anderes als eine <b>Wahrscheinlichkeit in Verkleidung</b>. Umrechnen ist eine Division:</p>
  <div class="formulabox"><span class="fbk">Wahrscheinlichkeit ≈ 1 ÷ Quote</span><span class="fbd">Beispiel: Quote 2,00 → 1÷2,00 = 50 %. Quote 1,50 → 67 %. Quote 4,00 → 25 %.</span></div>
  <table class="scen tight">
    <thead><tr><th>Quote</th><th>1,25</th><th>1,50</th><th>1,80</th><th>2,00</th><th>2,50</th><th>3,50</th><th>5,00</th></tr></thead>
    <tbody><tr><td class="nm">≈ Chance</td><td>80 %</td><td>67 %</td><td>56 %</td><td>50 %</td><td>40 %</td><td>29 %</td><td>20 %</td></tr></tbody>
  </table>
  <div class="lev">
    <div class="levcard"><span class="lh">Wo finde ich Quoten?</span><p>Jeder Wettanbieter oder Quotenvergleich (oddsportal, bet-o-meter …). Du musst nichts wetten — du liest nur ab.</p></div>
    <div class="levcard"><span class="lh">Welche Quote?</span><p>Die <b>1X2-Quoten</b> (Heimsieg / Remis / Auswärtssieg). Die niedrigste = Favorit. Je tiefer, desto klarer.</p></div>
    <div class="levcard gold"><span class="lh">Profi-Trick</span><p>Die <b>Over/Under-2.5-Quote</b> verrät, ob viele Tore fallen. Over billig → eher 2:1/3:1. Under billig → eher 1:0.</p></div>
  </div>
  <div class="callout"><strong>Achtung Buchmacher-Marge:</strong> Die Prozente aus 1÷Quote summieren sich auf etwas über 100 % — der
  Anbieter rechnet sich einen Vorsprung ein. Für deine Tipp-Zwecke egal: die <em>Rangfolge</em> stimmt trotzdem.</div>
`, '7')

const p8 = page('paper', head('Kapitel 06', 'Liga-Spezial: Super League & Co.') + `
  <p class="lead">Eine Liga ist ein <b>Marathon</b>, kein Sprint. 36 Runden, jede Woche, kein Champion-Bonus. Was hier zählt:</p>
  <div class="tips2">
    <div class="t2"><span class="t2h">Heimvorteil ist real</span><p>In der Super League gewinnt das Heimteam spürbar öfter. Im Zweifel tippt man den Heimfavoriten knapp.</p></div>
    <div class="t2"><span class="t2h">Form &gt; Tabelle</span><p>Die letzten 5 Spiele sagen mehr als der Saisonstand. Ein Absteiger in Topform schlägt einen müden Tabellenführer.</p></div>
    <div class="t2"><span class="t2h">Kenne die Liga</span><p>Tor-arme Liga (viele 1:0/2:1)? Dann erst recht knapp tippen. Die Super League ist offensiv — 2:1 trifft oft.</p></div>
    <div class="t2"><span class="t2h">Dranbleiben zahlt sich aus</span><p>Kein Joker, kein Bonus — der Vorsprung wächst aus <b>Konstanz</b>. Lieber jede Woche solide als einmal mutig.</p></div>
    <div class="t2"><span class="t2h">Saison-Endspurt</span><p>Achtung Sondermotivation: Meister-, Europa- und Abstiegskampf verzerren Quoten. „Nichts mehr zu spielen" → unberechenbar.</p></div>
    <div class="t2"><span class="t2h">Derbys sind Lotterie</span><p>Bei echten Rivalen die Quoten ernst, aber den Tipp defensiv halten (1:1 / 1:0). Hohe Ergebnisse sind selten.</p></div>
  </div>
`, '8')

const p9 = page('paper', head('Kapitel 07', 'Turnier-Spezial: EM / WM') + `
  <p class="lead small">Turniere haben zwei Phasen und Extra-Hebel. Hier wird das Tippspiel wirklich entschieden.</p>
  <div class="tips2">
    <div class="t2"><span class="t2h">Gruppenphase = Fleißarbeit</span><p>Alle tippen ähnlich, alle sammeln solide. Knapp &amp; Favorit, wie immer. Hier holst du keinen großen Vorsprung.</p></div>
    <div class="t2"><span class="t2h">3. Spieltag: Rotation!</span><p>Schon qualifizierte Favoriten schonen Stars → weniger Tore, Überraschungen. Tipp vorsichtiger ansetzen.</p></div>
    <div class="t2"><span class="t2h">K.o.-Phase = enge Kost</span><p>Mehr Vorsicht, mehr 1:0 / 2:1, oft Verlängerung. Tippe, wer <b>weiterkommt</b> — viele Spiele werten das extra.</p></div>
    <div class="t2 gold"><span class="t2h">Der Champion-Tipp (+ fett)</span><p>Meist der größte Einzelhebel. Setz ihn auf das <b>Top-Quotenteam</b>, nicht dein Herz — außer du musst aufholen.</p></div>
    <div class="t2"><span class="t2h">Durchtippen lohnt</span><p>Wo Runden-Teilnehmer Punkte geben: Favoriten weit durchmarschieren lassen. Außenseiter im Bracket kosten dich.</p></div>
    <div class="t2"><span class="t2h">Differenzieren, um zu gewinnen</span><p>Wenn alle ähnlich tippen, entscheidet das Anderssein. Weiche genau dort ab, wo du Edge hast — meist beim Champion.</p></div>
  </div>
`, '9')

const p10 = page('paper', head('Kapitel 08', 'Die 7 Todsünden') + `
  <p class="lead small">Jeder Fehler hier ist ein Geschenk an deine Mitspieler. Vermeide sie — und schlage die, die sie machen.</p>
  <ol class="sins">
    <li><b>Das Herzteam hochtippen.</b> Dein Lieblingsklub gewinnt im Kopf 4:0. Auf dem Zettel kostet dich das.</li>
    <li><b>Zu hoch tippen.</b> 3:0, 4:1, 5:0 — du verschenkst die sichere Tordifferenz-Stufe. Der teuerste Dauerfehler.</li>
    <li><b>Remis aus Feigheit.</b> 1:1 hat kein Sicherheitsnetz: kein Sieger getippt = oft null Punkte.</li>
    <li><b>Den exakten Treffer jagen.</b> Unwahrscheinliche Ergebnisse senken deinen Schnitt. Exakt ist Beifang.</li>
    <li><b>Quoten ignorieren.</b> „Die sind doch fällig" gibt es nicht. Der Markt weiß mehr als dein Gefühl.</li>
    <li><b>Rotation/Verletzungen übersehen.</b> Halbe Mannschaft raus = halbe Torgefahr. Kurz die Aufstellung checken.</li>
    <li><b>Alles auf einen mutigen Spieltag setzen.</b> Tippspiele gewinnt Konstanz, nicht der eine Geniestreich.</li>
  </ol>
`, '10')

const p11 = page('paper', head('Kapitel 09', 'Glossar & Spickzettel') + `
  <div class="two glos-wrap">
    <dl class="glossar">
      <dt>Tendenz</dt><dd>richtiger Ausgang (Sieg/Remis/Niederlage), Ergebnis egal.</dd>
      <dt>Tordifferenz</dt><dd>richtiger Abstand, z. B. Tipp 2:1 bei Endstand 3:2.</dd>
      <dt>Exakt</dt><dd>Ergebnis aufs Tor genau richtig.</dd>
      <dt>1X2</dt><dd>die drei Quoten für Heimsieg / Remis / Auswärtssieg.</dd>
      <dt>Over/Under 2.5</dt><dd>Wette, ob mehr/weniger als 2,5 Tore fallen — verrät die Tor-Erwartung.</dd>
      <dt>Favorit</dt><dd>Team mit der niedrigsten Siegquote.</dd>
      <dt>Erwartungswert</dt><dd>der „im Schnitt"-Punktegewinn eines Tipps. Den maximieren wir.</dd>
    </dl>
    <div class="cheat foil-card">
      <span class="cheat-k">SPICKZETTEL — AUSSCHNEIDEN</span>
      <ul class="check">
        <li>☐ Punktesystem gelesen? Gibt's Tordiff-Punkte?</li>
        <li>☐ Favorit = niedrigste 1X2-Quote</li>
        <li>☐ Standard-Tipp <b>1:0</b> · Kantersieg <b>2:0</b></li>
        <li>☐ Klares Remis-Spiel? Dann <b>1:1</b></li>
        <li>☐ Over 2.5 billig? Dann <b>2:1 / 3:1</b></li>
        <li>☐ Kein Herzteam, kein Spektakel</li>
        <li>☐ Aufstellung/Rotation gecheckt</li>
        <li>☐ Turnier: Champion = Top-Quotenteam</li>
        <li>☐ Hinten? → mutiger. Vorn? → safe.</li>
      </ul>
    </div>
  </div>
  <div class="closing foil">Viel Erfolg — und denk dran: gegen mich tippst du trotzdem an. 😎</div>
`, '11')

/* ─────────── CSS ─────────── */
const CSS = `
${FONTS}
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
@page{size:A4;margin:0;}
html,body{background:${C.stage};}
body{font-family:'Inter',sans-serif;color:${C.ink};}
.page{position:relative;width:210mm;height:297mm;overflow:hidden;page-break-after:always;}
.page:last-child{page-break-after:auto;}
.paper{background:radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,.5), transparent 60%), ${C.paper};padding:20mm 18mm 16mm;}
.paper::before{content:"";position:absolute;inset:9mm;border:1.5px solid ${C.paperShade};border-radius:6px;pointer-events:none;}
.paper::after{content:"";position:absolute;inset:0;opacity:.5;pointer-events:none;background-image:radial-gradient(${C.paperShade} .5px, transparent .6px);background-size:7px 7px;mix-blend-mode:multiply;}

.page-head{position:relative;z-index:2;margin-bottom:6mm;border-bottom:3px solid ${C.ink};padding-bottom:3mm;}
.kicker{font-family:'Oswald',sans-serif;font-weight:600;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};}
.h-chap{font-family:'Anton',sans-serif;font-size:40px;line-height:1;letter-spacing:.5px;color:${C.ink};text-transform:uppercase;margin-top:2px;}
.lead{position:relative;z-index:2;font-size:14.5px;line-height:1.6;margin-bottom:5mm;}
.lead.small{font-size:13px;line-height:1.55;color:${C.inkSoft};}
.lead em{font-style:italic;}

.callout{position:relative;z-index:2;background:#fff;border:1px solid ${C.paperShade};border-radius:10px;padding:4mm 5mm;font-size:12.5px;line-height:1.55;box-shadow:0 1px 4px rgba(0,0,0,.08);margin-top:4mm;}

/* Steps */
.steps{position:relative;z-index:2;display:grid;gap:3.5mm;margin-bottom:5mm;}
.step{display:flex;gap:5mm;align-items:flex-start;background:#fff;border:1px solid ${C.paperShade};border-radius:10px;padding:4mm 5mm;box-shadow:0 1px 4px rgba(0,0,0,.07);}
.step .sno{font-family:'Anton',sans-serif;font-size:38px;line-height:.9;color:${ACCENT};min-width:34px;}
.step h4{font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;font-size:15px;letter-spacing:.5px;margin-bottom:1mm;}
.step p{font-size:12.5px;line-height:1.45;color:${C.ink};}
.cheatline{position:relative;z-index:2;text-align:center;font-size:14px;padding:4mm;border-radius:10px;}
.foil-box{background:linear-gradient(180deg,#fffdf3,#fdf0cf);border:2px solid ${C.gold};color:${C.ink};}
.foil-box b{color:${C.goldDark};}

/* Systemtypen */
.systypes{position:relative;z-index:2;display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-bottom:4mm;}
.systype{background:#fff;border:1px solid ${C.paperShade};border-radius:10px;padding:4mm;box-shadow:0 1px 4px rgba(0,0,0,.07);}
.systype .sysh{display:block;font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;font-size:14px;color:${C.blue};}
.systype .sysex{display:block;font-family:'Oswald',sans-serif;font-size:11.5px;color:${C.inkSoft};margin:1mm 0 2mm;}
.systype p{font-size:12px;line-height:1.45;}
.systype.gold{background:linear-gradient(180deg,#fffdf3,#fdf0cf);border-color:${C.gold};}
.systype.gold .sysh{color:${C.goldDark};}

/* Sticker / Chart */
.sticker{position:relative;z-index:2;background:#fff;border:5px solid #fff;border-radius:12px;box-shadow:0 2px 6px rgba(0,0,0,.22),0 12px 30px rgba(0,0,0,.12);padding:5mm;margin:3mm 0 4mm;}
.sticker .snum{position:absolute;top:3mm;right:4mm;font-family:'Oswald',sans-serif;font-weight:600;font-size:10px;letter-spacing:1px;color:${C.inkSoft};}
.scap{font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.5px;font-size:13px;color:${C.blue};margin-bottom:3mm;padding-right:16mm;}
.chart{display:flex;justify-content:center;}
.chart svg{width:96%;height:auto;}
.cap{font-size:11px;color:${C.inkSoft};line-height:1.45;margin-top:3mm;text-align:center;}

/* Laws */
.laws{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;}
.law{background:${ACCENT};color:#fff;border-radius:10px;padding:4mm;text-align:center;box-shadow:0 6px 18px rgba(31,138,76,.25);}
.law .ln{font-family:'Anton',sans-serif;font-size:36px;line-height:1;opacity:.9;}
.law h4{font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;font-size:14px;margin:1mm 0;}
.law p{font-size:11.5px;line-height:1.4;opacity:.95;}

/* Tabellen */
table.scen{position:relative;z-index:2;width:100%;border-collapse:separate;border-spacing:0;margin:1mm 0 4mm;font-size:12.5px;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.10);}
table.scen th{background:${C.blue};color:#fff;font-family:'Oswald',sans-serif;font-weight:600;text-transform:uppercase;letter-spacing:.5px;font-size:11px;padding:3mm 4mm;text-align:left;}
table.scen td{padding:2.3mm 4mm;background:#fff;}
table.scen tr:nth-child(even) td{background:${C.paper};}
table.scen td.nm{font-weight:600;}
table.scen td.od{font-family:'Oswald',sans-serif;color:${C.inkSoft};}
table.scen td.tp{font-family:'Oswald',sans-serif;font-weight:700;color:${ACCENT};font-size:14px;}
table.scen.tight{text-align:center;} table.scen.tight th{text-align:center;} table.scen.tight td{text-align:center;font-family:'Oswald',sans-serif;}

/* meta + lev */
.two{display:grid;grid-template-columns:1fr 1fr;gap:5mm;}
.metacard{background:#fff;border:1px solid ${C.paperShade};border-radius:10px;padding:4mm 5mm;box-shadow:0 1px 4px rgba(0,0,0,.08);}
.metacard .mh{display:block;font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;font-size:13.5px;margin-bottom:2mm;}
.metacard .mh.up{color:${C.green};} .metacard .mh.down{color:${C.magenta};}
.metacard p{font-size:12px;line-height:1.5;}
.lev{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm;margin:2mm 0;position:relative;z-index:2;}
.levcard{background:#fff;border:1px solid ${C.paperShade};border-radius:10px;padding:4mm;box-shadow:0 1px 4px rgba(0,0,0,.08);}
.levcard .lh{display:block;font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;font-size:12px;color:${C.blue};margin-bottom:2mm;}
.levcard p{font-size:11px;line-height:1.45;}
.levcard.gold{background:linear-gradient(180deg,#fffdf3,#fdf0cf);border-color:${C.gold};} .levcard.gold .lh{color:${C.goldDark};}

/* Formelbox */
.formulabox{position:relative;z-index:2;background:${C.stage};border-radius:12px;padding:5mm;margin:1mm 0 4mm;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.2);}
.formulabox .fbk{display:block;font-family:'Oswald',sans-serif;font-weight:700;font-size:22px;color:${C.goldLight};letter-spacing:.5px;}
.formulabox .fbd{display:block;font-size:12px;color:#aab3c2;margin-top:2mm;}

/* tips2 grid (Liga/Turnier) */
.tips2{position:relative;z-index:2;display:grid;grid-template-columns:1fr 1fr;gap:4mm;}
.t2{background:#fff;border:1px solid ${C.paperShade};border-left:4px solid ${ACCENT};border-radius:8px;padding:4mm;box-shadow:0 1px 4px rgba(0,0,0,.07);}
.t2 .t2h{display:block;font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;font-size:13px;color:${C.ink};margin-bottom:1.5mm;}
.t2 p{font-size:12px;line-height:1.45;}
.t2.gold{border-left-color:${C.gold};background:linear-gradient(180deg,#fffdf3,#fdf0cf);}

/* Sünden */
ol.sins{position:relative;z-index:2;counter-reset:s;list-style:none;display:grid;gap:2.6mm;}
ol.sins li{counter-increment:s;position:relative;padding:3mm 4mm 3mm 14mm;background:#fff;border-radius:8px;border:1px solid ${C.paperShade};font-size:12.5px;line-height:1.45;box-shadow:0 1px 3px rgba(0,0,0,.06);}
ol.sins li::before{content:counter(s);position:absolute;left:4mm;top:50%;transform:translateY(-50%);font-family:'Anton',sans-serif;font-size:26px;color:${C.magenta};width:8mm;text-align:center;}

/* Glossar + Spickzettel */
.glos-wrap{align-items:start;}
dl.glossar{position:relative;z-index:2;}
dl.glossar dt{font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;font-size:13px;color:${C.blue};margin-top:3mm;}
dl.glossar dt:first-child{margin-top:0;}
dl.glossar dd{font-size:12px;line-height:1.45;color:${C.ink};margin-top:.5mm;}
.cheat.foil-card{background:${C.stage};border:2px solid ${C.gold};border-radius:14px;padding:5mm;box-shadow:0 10px 30px rgba(0,0,0,.25);position:relative;z-index:2;}
.cheat .cheat-k{display:block;font-family:'Oswald',sans-serif;font-weight:700;letter-spacing:2px;font-size:12px;margin-bottom:3mm;background:linear-gradient(110deg,${C.goldDark},${C.gold},${C.goldLight},${C.gold});-webkit-background-clip:text;background-clip:text;color:transparent;}
ul.check{list-style:none;}
ul.check li{color:#eef1f6;font-size:12.5px;line-height:1.7;}
ul.check b{color:${C.goldLight};}
.closing{position:relative;z-index:2;margin-top:5mm;text-align:center;font-family:'Oswald',sans-serif;font-weight:700;font-size:16px;}

/* Foil-Text */
.foil{background:linear-gradient(110deg,${C.goldDark} 0%,${C.gold} 28%,${C.goldLight} 50%,${C.gold} 72%,${C.goldDark} 100%);-webkit-background-clip:text;background-clip:text;color:transparent;}

/* Fußzeile */
.pfoot{position:absolute;left:18mm;right:18mm;bottom:8mm;display:flex;justify-content:space-between;align-items:center;font-family:'Oswald',sans-serif;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:${C.inkSoft};z-index:3;}
.pfoot .pno{font-family:'Anton',sans-serif;font-size:18px;color:${C.ink};}

/* TOC */
ol.toc{list-style:none;position:relative;z-index:2;margin-top:3mm;}
ol.toc li{display:flex;align-items:baseline;gap:4mm;padding:3.4mm 0;border-bottom:1px solid ${C.paperShade};}
ol.toc .tnum{font-family:'Anton',sans-serif;font-size:22px;color:${ACCENT};width:40px;}
ol.toc .ttitle{font-family:'Oswald',sans-serif;font-weight:600;font-size:15.5px;color:${C.ink};}
ol.toc .tdots{flex:1;border-bottom:2px dotted ${C.paperShade};transform:translateY(-4px);}
ol.toc .tpg{font-family:'Anton',sans-serif;font-size:19px;color:${C.blue};}
.toc-note{position:relative;z-index:2;margin-top:7mm;font-size:11.5px;color:${C.inkSoft};line-height:1.5;}

/* Cover */
.cover{background:radial-gradient(120% 90% at 50% -10%, #1b2230 0%, ${C.stage} 60%);color:#fff;}
.flood{position:absolute;inset:0;background:radial-gradient(60% 40% at 50% 8%, rgba(31,138,76,.18), transparent 70%);}
.scatter{position:absolute;inset:0;overflow:hidden;}
.n26{position:absolute;font-family:'Anton',sans-serif;color:rgba(255,255,255,.04);line-height:1;}
.cover-inner{position:absolute;left:20mm;right:20mm;top:50mm;z-index:2;}
.cover-kicker{font-family:'Oswald',sans-serif;font-weight:600;letter-spacing:4px;font-size:12px;text-transform:uppercase;color:#9fe0bb;}
.cover-title{font-family:'Anton',sans-serif;font-size:90px;line-height:.92;letter-spacing:1px;margin:6mm 0;text-transform:uppercase;filter:drop-shadow(0 3px 0 rgba(0,0,0,.35));}
.cover-rule{width:64mm;height:6px;background:${ACCENT};border-radius:3px;margin:2mm 0 6mm;}
.cover-sub{font-family:'Oswald',sans-serif;font-weight:500;font-size:20px;line-height:1.35;color:#eef2f8;max-width:130mm;}
.cover-by{margin-top:13mm;font-size:13px;color:#aeb7c5;} .cover-by strong{color:#fff;}
.cover-badge{position:absolute;right:18mm;bottom:20mm;z-index:2;width:38mm;height:38mm;border-radius:50%;background:linear-gradient(135deg,${C.goldLight},${C.gold} 45%,${C.goldDark});display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(212,175,55,.35);border:3px solid #fff3cf;transform:rotate(-8deg);}
.cover-badge span{font-family:'Oswald',sans-serif;font-weight:600;font-size:12px;letter-spacing:2px;color:${C.goldDark};}
.cover-badge b{font-family:'Anton',sans-serif;font-size:19px;color:${C.stage};letter-spacing:.5px;}
`

const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Der ultimative Tipp-Almanach für Dummies</title><style>${CSS}</style></head>
<body>${cover}${toc}${p3}${p4}${p5}${p6}${p7}${p8}${p9}${p10}${p11}</body></html>`

const htmlPath = resolve(OUT_DIR, 'index.html')
writeFileSync(htmlPath, html)
console.log('HTML geschrieben:', htmlPath, `(${(html.length / 1024 / 1024).toFixed(2)} MB)`)

/* ─────────── PDF via Chrome-Headless ─────────── */
const OUT_PDF = process.argv[2] || `${process.env.HOME}/Desktop/Tipp-Almanach.pdf`
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
if (!existsSync(CHROME)) { console.log('⚠︎ Chrome nicht gefunden — HTML bereit:', htmlPath) }
else {
  const profile = `/tmp/chrome-alm-${process.pid}`
  rmSync(profile, { recursive: true, force: true }); rmSync(OUT_PDF, { force: true })
  spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profile}`, '--no-pdf-header-footer', '--virtual-time-budget=6000',
    `--print-to-pdf=${OUT_PDF}`, `file://${htmlPath}`], { stdio: 'ignore' })
  rmSync(profile, { recursive: true, force: true })
  if (existsSync(OUT_PDF)) console.log('✓ PDF geschrieben:', OUT_PDF, `(${(execFileSync('stat', ['-f%z', OUT_PDF]).toString().trim() / 1024).toFixed(0)} KB, 11 Seiten A4)`)
  else console.error('✗ PDF-Rendering fehlgeschlagen.')
}
