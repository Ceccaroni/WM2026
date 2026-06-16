# Designsystem-Recherche: WM-2026-Tippspiel im Panini-Stil

> macOS-Desktop-App (HTML/CSS/React) · Stand: 11.06.2026
> Designrichtung: **„Digitales Panini-Album bei Flutlicht"** — nostalgische Sammelalbum-Haptik (Papier, weiße Sticker-Ränder, Nummern) trifft auf glossy Foil-Effekte und das schwarz-gold-weiße FIFA-26-Branding.

---

## 1. Panini-Designsprache (Recherche-Ergebnisse)

### Offizielle Panini-Kollektion „FIFA World Cup 2026™"
- **Umfang:** 980 Sticker auf 112 Seiten — die größte WM-Kollektion aller Zeiten (48 Nationen). Veröffentlicht am 01.04.2026.
- **Album-Cover:** überwiegend **weiß**, übersät mit vielen „26"-Ziffern an den Rändern. Ein früher geleaktes Design zeigte das WM-Logo auf einem bunten Hintergrund mit **Magenta** als Hauptfarbe — diese Farbe taugt hervorragend als frecher Akzent.
- **Sticker-Design 2026:**
  - **Babyblauer Hintergrund** mit einer großen „26" hinter dem Spieler, deren Farben den Nationalfarben entsprechen.
  - Spielerfoto auf der „26", rechts daneben **Landesflagge + FIFA-Dreibuchstaben-Code** (GER, ARG, …).
  - Unter dem Spieler ein **blauer Datenbalken**: Name, Geburtsdatum, Größe, Gewicht; zweiter Balken mit dem Verein.
  - Kleines weißes WM-Logo oben links, Spielername in Weiß.
- **Pro Team 20 Sticker:** 1 Wappen-Sticker (glänzend/shiny — diesmal nicht klassisch gold/silber, aber mit Foil-Finish), 1 Teamfoto, 18 Spieler.
- **Album-Seiten:** Hintergrund in den **Landesfarben**; Kopfzeile der ersten Teamseite weiß mit dem Schriftzug **„WE ARE"** + Landesname in Nationalfarben. Gruppen-Layouts für das 48-Team-Format.
- **Parallel-Varianten** (Rarität aufsteigend): weißer, oranger, blauer, roter, violetter, grüner und schwarzer Rand — eine fertige Vorlage für „Seltenheits-Stufen" in der App (z. B. Bonuspunkte-Level oder Tipp-Genauigkeit als Rand-Farbe!).

### Der ikonische, zeitlose Panini-Look (Essenz für die App)
1. **Weißer Sticker-Rand** (ca. 4–6 % der Stickerbreite), leicht gerundete Ecken, harte Außenkante.
2. **Sticker-Nummer** — klein, monospaced/kondensiert, in der Ecke oder unter dem Slot. Die Nummer ist Kult („Brauchst du noch die 347?").
3. **Albumseiten-Raster:** Sticker sitzen in gedruckten **Platzhalter-Rahmen** auf einer Papierseite; das Raster ist sichtbar, auch wenn der Sticker fehlt.
4. **Fehlende Sticker = Grauflächen:** gestrichelter Rahmen oder graue Silhouette mit großer Nummer — das stärkste Sammel-Gefühl überhaupt. In der App: noch nicht getippte Spiele / unbekannte KO-Teams als „fehlender Sticker".
5. **Glanz-Sticker (Foil):** Wappen und Logos als Glitzer-/Prisma-Sticker — der Dopamin-Moment. In der App das Belohnungs-Pattern (richtiger Tipp = Foil-Effekt).
6. **Papier-Haptik:** cremefarbenes Papier, dezente Druck-Texturen, Seitenzahlen, Kapiteltrenner pro Gruppe/Team.

---

## 2. FIFA-WM-2026-Branding als Inspirationsquelle

- **Emblem:** Erstmals der echte **WM-Pokal** im Logo, eingebettet in eine große „**26**". Die „26" besteht aus **48 geometrischen Formen** (Quadrate + Viertelkreise) = 48 Teilnehmer; sie zitieren Spielfeld und Ball.
- **Kernpalette:** bewusst reduziert — **Schwarz, Weiß, Gold**. Eine neutrale Bühne, auf der die bunten Host-City-Farben spielen.
- **Typografie:** Eigenschrift „FWC 26" (inspiriert von Streetsoccer-Ästhetik und Vintage-Postern), Sekundärschrift **Noto Sans**. → Für uns: kondensierte Display-Schrift + cleane Sans (siehe Kap. 5).
- **„WE ARE 26":** Kampagnen-Claim der drei Gastgeber. Sprachmuster für die App übernehmen: „WIR SIND 26", „WE ARE [TEAM]"-Header auf Teamseiten (deckt sich mit dem Panini-Album!).
- **Host-City-System „YOUR CITY. YOUR COLORS.":** Jede der 16 Städte hat eine eigene Farb-/Muster-Identität (LA: Wellen/Strand, San Francisco: Golden Gate, Houston: Blau für Innovation, Kansas City: Jazz + BBQ, …). → Perfekt für **Stadion-Karten**: jede Karte bekommt einen eigenen City-Farbverlauf als Kopf.
- **Designprinzip:** „Einheit durch ein Emblem, Vielfalt durch viele City-Looks" — exakt unser Muster: ein striktes Grundsystem (Tokens), Team-/City-Farben nur als kontrollierte Akzente.

---

## 3. CSS-Techniken für Glossy/Foil (kopierbare Snippets)

Referenz-Goldstandard: das Projekt **pokemon-cards-css** (simeydotme) — Foil via übereinandergelegten Gradients, `mix-blend-mode: color-dodge`, Masken und pointer-gesteuerten Custom Properties; 3D-Tilt über `perspective` + `rotateX/Y`. Die folgenden Snippets sind destillierte, produktionsreife Varianten davon.

### 3.1 Holografischer Foil-Layer (pointer-getrieben)

```css
.sticker-foil {
  position: relative;
  border-radius: var(--radius-sticker);
  overflow: hidden;
  isolation: isolate; /* Blend-Mode bleibt in der Karte */
}

/* Regenbogen-Folie, wandert mit der Maus */
.sticker-foil::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    115deg,
    transparent 20%,
    rgba(255, 222, 120, 0.70) 34%,
    rgba(160, 80, 255, 0.55) 42%,
    rgba(0, 255, 231, 0.55) 50%,
    rgba(255, 64, 170, 0.55) 58%,
    transparent 78%
  );
  background-size: 280% 280%;
  background-position:
    calc(var(--px, 50) * 1%)
    calc(var(--py, 50) * 1%);
  mix-blend-mode: color-dodge;
  opacity: var(--foil-opacity, 0.5);
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.sticker-foil:hover::before { opacity: 0.85; }
```

```tsx
// React-Hook: Pointer-Position → CSS Custom Properties
function useFoilPointer<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const onPointerMove = (e: React.PointerEvent<T>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", String(((e.clientX - r.left) / r.width) * 100));
    el.style.setProperty("--py", String(((e.clientY - r.top) / r.height) * 100));
  };
  return { ref, onPointerMove };
}
```

### 3.2 Shine-Sweep (Glanzstreifen über Pseudo-Element)

```css
.shine {
  position: relative;
  overflow: hidden;
}
.shine::after {
  content: "";
  position: absolute;
  top: 0; bottom: 0;
  left: -120%;
  width: 55%;
  background: linear-gradient(
    105deg,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 30%,
    rgba(255, 255, 255, 0.45) 50%,
    rgba(255, 255, 255, 0.05) 70%,
    transparent 100%
  );
  transform: skewX(-22deg);
  pointer-events: none;
}
.shine:hover::after,
.shine.is-celebrating::after {        /* z. B. bei "Tipp richtig!" */
  animation: shine-sweep 0.9s ease-in-out;
}
@keyframes shine-sweep {
  from { left: -120%; }
  to   { left: 160%; }
}
```

### 3.3 Gold-Foil mit conic-gradient (animierter Folien-Schimmer)

```css
@property --foil-angle {          /* nötig, damit der Winkel animierbar ist */
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

.foil-gold {
  background: conic-gradient(
    from var(--foil-angle),
    #8c6a1d, #d4af37, #f9e27d, #fffbe6,
    #f9e27d, #d4af37, #8c6a1d, #d4af37, #8c6a1d
  );
  animation: foil-spin 7s linear infinite;
  -webkit-background-clip: text;          /* Variante A: Gold-Text */
  background-clip: text;
  color: transparent;
}
/* Variante B: Gold-Fläche (Rahmen/Badge) → background-clip entfernen */

@keyframes foil-spin {
  to { --foil-angle: 360deg; }
}
```

> Tipp: Für einen **Foil-Rahmen** den conic-gradient auf ein Eltern-Element legen und den Inhalt mit `inset: 3px`-Innenfläche überdecken (klassischer „Gradient-Border"-Trick).

```css
.foil-border {
  position: relative;
  border-radius: var(--radius-card);
  padding: 3px;                /* Rahmenstärke */
  background: conic-gradient(from var(--foil-angle),
    #8c6a1d, #f9e27d, #d4af37, #fffbe6, #8c6a1d);
  animation: foil-spin 7s linear infinite;
}
.foil-border > .inner {
  border-radius: calc(var(--radius-card) - 3px);
  background: var(--bg-surface);
}
```

### 3.4 3D-Tilt bei Hover (perspective + rotateX/Y)

```css
.tilt-scene { perspective: 900px; }

.tilt-card {
  transform:
    rotateX(var(--tilt-x, 0deg))
    rotateY(var(--tilt-y, 0deg))
    translateZ(0);
  transform-style: preserve-3d;
  transition: transform 0.12s ease-out;
  will-change: transform;
}
.tilt-scene:not(:hover) .tilt-card {
  transform: rotateX(0) rotateY(0);
  transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1); /* sanftes Zurückfedern */
}
```

```ts
// im selben pointermove-Handler wie 3.1:
const MAX = 8; // Grad — dezent halten, das ist macOS, kein Casino
el.style.setProperty("--tilt-y", `${((x / r.width) - 0.5) * 2 * MAX}deg`);
el.style.setProperty("--tilt-x", `${-(((y / r.height) - 0.5) * 2 * MAX)}deg`);
```

> Kombi-Effekt: 3.1 + 3.2 + 3.4 zusammen auf einer StickerCard = der „Panini-Glanzsticker in der Hand"-Moment. Fertige Alternative: die Mini-Lib **`hover-tilt`** von simeydotme.

### 3.5 Glasmorphismus (Overlays, Live-HUD, Sidebar)

```css
.glass {
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: var(--radius-card);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}
/* helle Albumseiten-Variante */
.glass--light {
  background: rgba(255, 255, 255, 0.55);
  border-color: rgba(14, 17, 22, 0.08);
}
```

### 3.6 „Fehlender Sticker" (Grauflächen-Platzhalter)

```css
.sticker-slot--missing {
  border: 2px dashed rgba(14, 17, 22, 0.22);
  border-radius: var(--radius-sticker);
  background:
    repeating-linear-gradient(45deg,
      #e3e0d8 0 10px, #d9d6cd 10px 20px);
  display: grid;
  place-items: center;
  color: rgba(14, 17, 22, 0.35);
  font-family: var(--font-display);
  font-size: 2rem; /* große Sticker-Nummer */
}
```

### 3.7 Accessibility / macOS-Feinschliff

```css
@media (prefers-reduced-motion: reduce) {
  .foil-gold, .foil-border { animation: none; }
  .shine::after { display: none; }
  .tilt-card { transform: none !important; transition: none; }
}
```
- Blend-Modes (`color-dodge`) auf dunklen Flächen testen — sie „fressen" dunkle Pixel.
- `isolation: isolate` auf Karten verhindert, dass Blend-Modes auf den Seitenhintergrund durchschlagen.
- Foil-Layer immer `pointer-events: none` + `aria-hidden`.
- Performance: Foil/Tilt nur auf der gehoverten Karte aktivieren (Custom Properties lokal setzen), nicht global animieren.

---

## 4. Flaggen-Assets

| Bibliothek | Stil/Formate | Lizenz | npm | Bewertung |
|---|---|---|---|---|
| **flag-icons** (lipis) | Originalgetreue Flaggen, **4:3 und 1:1**, SVG + fertiges CSS (`.fi .fi-de`) | MIT | `flag-icons` | Der Standard. Akkurat, alle FIFA-Nationen abgedeckt. |
| **circle-flags** (HatScripts) | 400+ **runde**, bewusst vereinfachte/stilisierte Flaggen, 1:1 SVG | MIT | `circle-flags` / React-Wrapper `react-circle-flags` | Wie kleine Buttons/Pins — ideal für kompakte UI (Tabellen, Bracket). |

**Empfehlung für die Panini-Wappen-Optik: beide, mit klarer Rollenteilung.**
- **`flag-icons` im 4:3-Format** für die großen Momente: Flagge als „Mini-Sticker" mit weißem Rand (siehe FlagBadge-Komponente) auf Team-Seiten, MatchCards, Album-Headern. Das rechteckige Format + weißer Rand + leichte Eckenrundung = sofort Panini.
- **`circle-flags`** für dichte Flächen: Gruppentabellen, BracketNodes, Rangliste, ScorePills. Rund liest sich in 16–24 px besser als ein Mini-Rechteck.
- Beide nutzen ISO-3166-alpha-2-Codes (`de`, `ar`, …) → eine gemeinsame Mapping-Tabelle FIFA-Code ↔ ISO-Code anlegen (GER→de, ARG→ar, SUI→ch, …).

```css
/* FlagBadge: Flagge als Panini-Mini-Sticker */
.flag-badge {
  display: inline-block;
  padding: 3px;                       /* der weiße Sticker-Rand */
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.06);
  line-height: 0;
}
.flag-badge > .fi { border-radius: 3px; font-size: 1.25rem; }
```

---

## 5. Typografie (frei / Google Fonts)

| Rolle | Font | Warum |
|---|---|---|
| **Hero/Display** („WE ARE 26"-Header, Team-Namen, große Zahlen) | **Anton** | Extrem kondensiert, massiv, Plakat-/Trikot-Charakter — die digitale Antwort auf die FWC-26-Eigenschrift. Nur in Versalien einsetzen. |
| **Zahlen & Subheads** (Spielstände, Sticker-Nummern, Tabellen-Header, Countdown) | **Oswald** (variable) | Der kondensierte Workhorse: mehrere Gewichte, exzellente Ziffern, bleibt auch klein lesbar. `font-variant-numeric: tabular-nums` für Tabellen/Scores setzen. |
| **UI-Text** (Labels, Fließtext, Buttons, Formulare) | **Inter** (variable) | Neutral, hervorragendes Hinting für UI, optische Größen, tabellarische Ziffern verfügbar. |

Alternativen, falls anderer Geschmack: Display **Archivo Black** oder **Bebas Neue**; kondensierte Mitte **Barlow Condensed** oder **Teko**; UI **Noto Sans** (= offizielle FIFA-Sekundärschrift!).

```css
:root {
  --font-display: "Anton", "Arial Narrow", sans-serif;
  --font-numbers: "Oswald", "Avenir Next Condensed", sans-serif;
  --font-ui: "Inter", -apple-system, "SF Pro Text", sans-serif;
}
.score, .table-number, .sticker-number {
  font-family: var(--font-numbers);
  font-variant-numeric: tabular-nums;
}
```

---

## 6. Layout-Konzepte (7 Screens)

Globale Shell: schmale Icon-Sidebar links (macOS-typisch), Inhalt rechts. Dunkler „Stadium Night"-Hintergrund als Bühne; Album-Inhalte (Sticker-Raster, Teamseiten) auf hellen „Papierseiten", die wie ein aufgeschlagenes Album auf der dunklen Bühne liegen.

### (a) Spielplan-Übersicht nach Spieltagen

Vertikale Liste, gruppiert nach Datum; Datums-Header als FoilHeader. Jede MatchCard = querformatiger „Doppel-Sticker".

```
┌────────────────────────────────────────────────────────────┐
│  SPIELPLAN     [Gruppenphase ▾] [Alle Gruppen ▾] [○ nur meine]
├────────────────────────────────────────────────────────────┤
│  ━━ DO 11. JUNI · SPIELTAG 1 ━━━━━━━━━━━━━━━ (Gold-Foil)   │
│  ┌──────────────────────────────────────────────┐          │
│  │ #1 ⚐MEX  MEXIKO   18:00   SÜDAFRIKA  ⚐RSA   │ Gr. A    │
│  │    Estadio Azteca · Mexico City   [Tipp: 2:1]│          │
│  └──────────────────────────────────────────────┘          │
│  ┌──────────────────────────────────────────────┐          │
│  │ #2 ⚐KOR  KOREA    21:00   …                 │ Gr. A    │
│  └──────────────────────────────────────────────┘          │
│  ━━ FR 12. JUNI · SPIELTAG 1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  …                                                          │
└────────────────────────────────────────────────────────────┘
```
- Spielnummer (#1–#104) wie eine Sticker-Nummer.
- Kein Tipp abgegeben → Tipp-Slot als Mini-„fehlender Sticker" (graue Schraffur). Tipp vorhanden → ScorePill; nach Abpfiff Rand-Farbe = Punktqualität (gold/grün/grau, vgl. Panini-Parallel-Ränder).

### (b) „Meine Tipps" — Durchtipp-Ansicht mit Live-Gruppentabellen

Zweispaltig: links die Spiele einer Gruppe zum Durchtippen, rechts die Tabelle, die sich **sofort aus den Tipps neu berechnet**.

```
┌──────────────────────────────┬───────────────────────────┐
│  GRUPPE A   ◀  A B C … L  ▶  │  TABELLE (aus deinen Tipps)│
│  ┌────────────────────────┐  │  # ⚑ Team      S  TD  Pkt │
│  │ ⚐MEX 2 ▲▼ : 1 ▲▼ RSA⚐ │  │  1 ◉ Mexiko    3  +4   7  │
│  └────────────────────────┘  │  2 ◉ Korea     3  +1   5  │
│  ┌────────────────────────┐  │ ─────────── Quali-Linie ── │
│  │ ⚐KOR _ ▲▼ : _ ▲▼ …    │  │  3 ◉ Südafr.   3  -1   2  │
│  └────────────────────────┘  │  4 ◉ …         3  -4   1  │
│  (6 Spiele pro Gruppe)       │  „Beste Dritte"-Hinweis ✓  │
│  [◀ Gruppe L]   [Gruppe B ▶] │                            │
└──────────────────────────────┴───────────────────────────┘
```
- Eingabe: ScoreStepper (Klick ▲▼ **und** Tastatur: Ziffern tippen, Tab springt zum nächsten Feld → „Durchtippen" in unter 2 Minuten pro Gruppe).
- Tabelle animiert bei jeder Änderung (FLIP-Animation der Zeilen). Quali-Plätze grün getönt, Drittplatzierten-Logik (8 beste Dritte bei 12 Gruppen!) als Tooltip + eigene „Beste Dritte"-Übersichtsseite.
- Fortschrittsleiste oben: 12 Gruppen-Punkte wie Album-Seiten („Seite A … L"), gefüllt = fertig getippt.

### (c) KO-Turnierbaum (Round of 32 → Finale, 31 Spiele)

**Problem:** 6 Runden, 16 Spiele allein in der R32 — zu breit für jeden Bildschirm.
**Lösung: gespiegeltes Bracket + Fokus-Mechaniken** (Best Practice aus Sport-UIs):

1. **Mirrored Layout:** linke Turnierhälfte fließt nach rechts, rechte Hälfte nach links, **Finale in der Mitte** — halbiert die Breite (6 statt 11 Spalten: R32 | R16 | VF | HF | FINALE | HF | VF | R16 | R32).
2. **Horizontaler Scroll + Zoom:** Canvas-artiger Container (`overflow: auto`), Pinch/⌘± zoomt (CSS `transform: scale()`), Minimap unten rechts.
3. **Runden-Tabs** als Schnellnavigation: [R32] [R16] [VF] [HF] [Finale] scrollt/zoomt auf die Runde.
4. **Vertikal-Kollaps:** Nicht-fokussierte Runden zeigen kompakte BracketNodes (nur Flagge+Kürzel+Score), die fokussierte Runde volle MatchCards.

```
 R32        R16      VF     HF   FINALE   HF     VF      R16        R32
┌──┐                                                              ┌──┐
│1A├─┐                                                          ┌─┤1B│
└──┘ ├─[..]─┐                                                   │ └──┘
┌──┐ │      ├─[..]─┐        ┌───────────┐        ┌─[..]─┤      ─┘┌──┐
│3C ├─┘      │      ├─[..]──┤  🏆 FINALE ├──[..]─┤       │  …    │..│
└──┘  (8     │ (4   │ (2)   │  19. Juli  │  (2)  │ (4)   │ (8    └──┘
  (16 Spiele  Spiele)Spiele)│  MetLife   │              Spiele) (16 …
   je Hälfte:8)             └───────────┘
       ─── 3. Platz: kleines Match unterhalb des Finales ───
        [Minimap ▣]     [R32][R16][VF][HF][F]  Zoom ─◯──+
```
- Unbekannte Teams (Gruppenphase offen) = BracketNode als **„fehlender Sticker"** mit Platzhalter-Label („Sieger Gr. A", „3. Gr. C/E/F").
- Eigene Tipp-Linie: getippte Sieger-Pfade als goldene Connector-Linien hervorheben — man „sieht" seinen Turnierverlauf.
- Connector-Linien via CSS-Grid + `::before/::after`-Pseudo-Elemente (bewährtes Muster) oder eine SVG-Layer hinter den Nodes.

### (d) Live-Ansicht (echter Spielstand + eigener Tipp)

```
┌────────────────────────────────────────────────────────┐
│ ● LIVE 67'                       Estadio Azteca · Gr. A│
│                                                        │
│   [⚐ Sticker MEX]    2 : 1    [⚐ Sticker RSA]          │
│      MEXIKO        (Anton,        SÜDAFRIKA            │
│                    riesig)                             │
│  ──────────────────────────────────────────────        │
│  ⚽ 23' Lozano  ⚽ 51' Foster  ⚽ 64' Jiménez            │
│  ──────────────────────────────────────────────        │
│  ┌─ Glas-HUD ────────────────────────────────┐         │
│  │ DEIN TIPP  2:1  ✓ exakt → +4 Punkte aktuell│        │
│  │ Adrian 2:1 ✓ · Lisa 1:1 ✗ · Tom 2:0 ~      │        │
│  └────────────────────────────────────────────┘        │
│  [weitere Live-Spiele als kleine Ticker-Pills ▸]       │
└────────────────────────────────────────────────────────┘
```
- Echter Score gigantisch (Anton), darunter Glasmorphismus-HUD (`.glass`) mit dem eigenen Tipp und dem Status aller Mitspieler.
- Tipp-Status live: ✓ exakt (gold + Shine-Sweep!), ~ Tendenz richtig (grün), ✗ falsch (gedimmt). Bei Toren: kurzer Shine-Sweep über die ganze Karte.
- LIVE-Badge pulsiert (rote ScorePill), `prefers-reduced-motion` respektieren.

### (e) Team-Seite als großer Panini-Sticker

```
┌───────────────────────────────────────────────────────┐
│ ════════ WE ARE  ▓GERMANY▓ ════ (Nationalfarben) ═════│
│ ┌─────────────────────┐  GRUPPE E · FIFA-Rang 3       │
│ │ ┌─────────────────┐ │  ┌─ Glas-Panel ─────────────┐ │
│ │ │   große „26"    │ │  │ Nächstes Spiel: vs. …    │ │
│ │ │  in Schwarz-    │ │  │ Bisherige Tipps: …       │ │
│ │ │  Rot-Gold,      │ │  ├──────────────────────────┤ │
│ │ │  Teamfoto/      │ │  │ WETTQUOTEN               │ │
│ │ │  Wappen (Foil!) │ │  │ Turniersieg   5.50  ◆    │ │
│ │ │  ⚐DE GER        │ │  │ Gruppensieg   1.60       │ │
│ │ ├─────────────────┤ │  │ Finale        3.80       │ │
│ │ │ DEUTSCHLAND     │ │  └──────────────────────────┘ │
│ │ │ Trainer · Kader │ │  Kader-Mini-Sticker (Raster)  │
│ │ └─────────────────┘ │  ▦ ▦ ▦ ▦ ▦ ▦                  │
│ │   #DFB · Nr. 412    │  ▦ ▦ ▦ ▦ ▦ ▦                  │
│ └─────────────────────┘                                │
└───────────────────────────────────────────────────────┘
```
- Links der Hero: eine **StickerCard XXL** mit weißem Rand, Sticker-Nummer, Foil-Wappen, 3D-Tilt + Holo-Layer — originalgetreu dem 2026-Sticker-Layout (große „26" in Nationalfarben hinter dem Motiv, Flagge + FIFA-Code rechts, blauer Datenbalken unten).
- „WE ARE GERMANY"-Header in Anton, Hintergrundbalken in Nationalfarben (Panini-Albumseiten-Zitat).
- Quoten als OddsTags; beste Quote mit Gold-Foil-Akzent ◆.

### (f) Stadion-Karten

Grid aus 16 Karten (3–4 Spalten), je Karte oben ein **City-Farbverlauf** („YOUR CITY. YOUR COLORS.").

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│≈≈ LA-Wellen ≈│ │▓ NYC-Skyline▓│ │░ MEX-Muster ░│   ← City-Gradient/Muster
│ SoFi Stadium │ │ MetLife Stad.│ │ Estadio Azteca│
│ Los Angeles  │ │ NY/NJ  🏆FINALE│ Mexico City  │
│ 70 240 Plätze│ │ 82 500 Plätze│ │ 87 523 Plätze│
│ 8 Spiele ▸   │ │ 9 Spiele ▸   │ │ 5 Spiele ▸   │
└──────────────┘ └──────────────┘ └──────────────┘
```
- Klick → Detail mit allen Spielen dort (+ eigene Tipps), Stadt-Fakten, Zeitzone (wichtig bei 3 Ländern!).
- Karten als `.glass--light` auf Albumpapier oder dunkle Glaskarten — Stadion-Silhouette als dezentes Hintergrund-SVG.

### (g) Rangliste mehrerer Tipper

```
┌─────────────────────────────────────────────────────┐
│  RANGLISTE          [Gesamt][Gruppenphase][KO][Heute]│
│ ┌──🥇 Gold-Foil-Rahmen ───────────────────────────┐  │
│ │ 1  Adrian    ▲1   247 Pkt   ●●●○● Form   12× exakt│ │
│ └─────────────────────────────────────────────────┘  │
│  2  Lisa      ▼1   239 Pkt   ●●○●●          9× exakt │
│  3  Tom       —    town 224  ●○●●○          7× exakt │
│ ────────────────────────────────────────────────────│
│  Punkteverlauf (Sparkline pro Tipper) ∿∿∿            │
│  Heute: Adrian +7 · Lisa +4 · Tom +2                 │
└─────────────────────────────────────────────────────┘
```
- Platz 1 mit animiertem `.foil-border` (Gold), Platz 2 Silber, Platz 3 Bronze — die „Glanzsticker" der Rangliste.
- Rangwechsel mit FLIP-Animation + ▲▼-Indikator; Spalten: Punkte (tabular-nums!), exakte Tipps, Tendenzen, Form-Dots der letzten 5 Spiele.
- Jeder Tipper hat einen Avatar als runder Mini-Sticker (weißer Ring).

---

## 7. Das Designsystem (konkret)

### 7.1 Farbpalette

```css
:root {
  /* Basis — FIFA 26: Schwarz/Weiß/Gold */
  --bg-night:        #0E1116;  /* Hintergrund dunkel: "Stadium Night" */
  --bg-surface:      #171C24;  /* Karten/Panels auf dunkel */
  --bg-elevated:     #1F2630;  /* Hover/Popover */
  --bg-paper:        #F6F1E7;  /* Albumseiten-Papier (hell, cremig) */
  --bg-paper-shade:  #EAE3D4;  /* Papier-Schatten/Trennflächen */

  /* Primär & Akzent — Panini 2026 */
  --primary:         #0B5FA5;  /* Panini-Blau (Datenbalken) */
  --primary-soft:    #BFE0F5;  /* Babyblau (Sticker-Hintergrund 2026) */
  --accent:          #E62E6B;  /* Magenta (geleaktes 26-Album-Design) */

  /* Gold-Foil (FIFA-Gold) */
  --gold:            #D4AF37;
  --gold-light:      #F9E27D;
  --gold-deep:       #8C6A1D;
  --gold-sheen:      #FFFBE6;
  --silver:          #C9CDD6;
  --bronze:          #C08A53;

  /* Funktional */
  --pitch-green:     #1F8A4C;  /* Rasen / Tendenz richtig / Quali-Plätze */
  --live-red:        #E5484D;  /* LIVE-Badge, Fehler */
  --exact-gold:      var(--gold); /* exakter Tipp */

  /* Text */
  --text-on-dark:    #F2F4F8;
  --text-on-dark-2:  #9AA4B2;
  --text-on-paper:   #1A1A14;
  --text-on-paper-2: #6E6A5E;

  /* Sticker */
  --sticker-border:  #FFFFFF;  /* der weiße Panini-Rand */
  --slot-missing:    #D9D6CD;  /* Graufläche fehlender Sticker */
}
```

Team-/City-Farben **nur** als kontrollierte Akzente (Header-Balken, „26"-Hintergrund, Gradients) — nie als UI-Funktionsfarben.

### 7.2 Font-Stack

```css
:root {
  --font-display: "Anton", "Arial Narrow", sans-serif;        /* Hero, WE ARE 26 */
  --font-numbers: "Oswald", "Avenir Next Condensed", sans-serif; /* Scores, Nummern */
  --font-ui:      "Inter", -apple-system, "SF Pro Text", sans-serif; /* alles andere */
}
/* Skala */
--text-hero: 64px/0.95;   /* Anton, uppercase */
--text-h1:   34px/1.1;    /* Anton */
--text-h2:   24px/1.2;    /* Oswald 600 */
--text-score:40px/1;      /* Oswald 700, tabular-nums */
--text-body: 14px/1.5;    /* Inter 400 */
--text-label:12px/1.3;    /* Inter 600, letter-spacing .04em, uppercase */
--text-num:  13px/1.3;    /* Oswald 500, tabular-nums (Tabellen, Sticker-Nr.) */
```

### 7.3 Spacing- & Radius-Tokens

```css
:root {
  /* 4er-Raster */
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;
  --space-4: 16px;  --space-5: 24px;  --space-6: 32px;
  --space-7: 48px;  --space-8: 64px;

  --radius-pill:    999px;  /* ScorePill, Badges */
  --radius-sticker: 10px;   /* Sticker-Innenkante */
  --radius-card:    14px;   /* MatchCard, Panels */
  --radius-page:    20px;   /* Albumseiten-Container */

  --sticker-frame:  5px;    /* weißer Panini-Rand */

  --shadow-sticker: 0 2px 6px rgba(0,0,0,.28), 0 0 0 1px rgba(0,0,0,.06);
  --shadow-card:    0 8px 24px rgba(0,0,0,.35);
  --shadow-page:    0 24px 60px rgba(0,0,0,.5); /* Album auf dunkler Bühne */
}
```

### 7.4 Komponentenliste

| Komponente | Beschreibung | Effekte |
|---|---|---|
| **StickerCard** | Generischer Panini-Sticker: weißer Rand (`--sticker-frame`), Inhalt, Sticker-Nummer. Größen S/M/L/XXL. Zustände: `missing` (Schraffur + Nummer), `normal`, `foil` | Tilt + Holo (3.1/3.4) bei `foil` |
| **FoilStickerCard** | StickerCard-Variante für Wappen/Erfolge; Rand-Farbe = Raritätsstufe (weiß→gold→schwarz, Panini-Parallels) | conic-Gold (3.3), Shine (3.2) |
| **MatchCard** | Querformat: FlagBadge + Team links/rechts, Anstoß/Score mittig, Stadion-Zeile, Tipp-Slot | Shine-Sweep bei Punkten |
| **FlagBadge** | Flagge als Mini-Sticker (4:3, weißer Rand) oder rund (`circle-flags`) in `size=sm` | — |
| **ScorePill** | Pill mit Score/Tipp in Oswald tabular; Varianten: `live` (rot, pulsierend), `exact` (gold), `trend` (grün), `wrong` (gedimmt), `empty` (Schraffur) | Puls nur ohne reduced-motion |
| **ScoreStepper** | Tipp-Eingabe ▲▼ + Tastatur-Durchtippen (Tab-Flow) | — |
| **FoilHeader** | Abschnitts-Header mit Gold-conic-Text (3.3, Variante A), z. B. Datums-/Rundentrenner | foil-spin |
| **BracketNode** | Kompakter KO-Knoten: 2 Zeilen (circle-flag, Kürzel, Score), Tipp-Markierung, `missing`-Zustand („Sieger Gr. A") | goldene Pfad-Hervorhebung |
| **BracketConnector** | Grid-/Pseudo-Element-Linien zwischen Runden; `highlighted` für den eigenen Tipp-Pfad | — |
| **GroupTable** | Live aus Tipps berechnete Tabelle, FLIP-Zeilenanimation, Quali-Linien | — |
| **AlbumPage** | Heller Papier-Container (`--bg-paper`, `--radius-page`, `--shadow-page`) mit Seitenzahl | — |
| **StickerSlot** | Platzhalter im Albumraster (gestrichelt/Schraffur, große Nummer) | — |
| **TeamCrest** | Wappen-/„26"-Grafik in Nationalfarben für Teamseiten | Foil optional |
| **LiveTicker** | Horizontale Pill-Leiste laufender Spiele | — |
| **OddsTag** | Wettquote als kleine Plakette; `best` mit Gold-Akzent | — |
| **StadiumCard** | City-Gradient-Kopf, Stadionname, Kapazität, Spielanzahl | glass |
| **LeaderboardRow** | Rang, Avatar-Sticker, Punkte, Δ-Indikator, Form-Dots; Top 3 mit Foil-Border | foil-border Gold/Silber/Bronze |
| **GlassHUD** | Glasmorphismus-Overlay (3.5) für Live-Ansicht & Popover | backdrop-filter |
| **SectionTabs** | Runden-/Filter-Tabs (Spielplan, Bracket, Rangliste) | — |
| **Minimap** | Übersichts-Navigator für das 32er-Bracket | — |

### 7.5 Interaktions-Grundsätze
- **Foil = Belohnung:** Holo/Gold-Effekte sparsam und bedeutungsvoll (exakter Tipp, Platz 1, Wappen) — nicht flächig, sonst stumpft der Effekt ab.
- **Tilt max. 8°,** Transitions 120–500 ms, Easing `cubic-bezier(0.23,1,0.32,1)`; alles hinter `prefers-reduced-motion`-Guards.
- **Dunkel ist die Bühne, Papier ist der Inhalt:** Navigation/Live auf `--bg-night`, Sammelalbum-Inhalte auf `--bg-paper`-AlbumPages.
- Tastatur-First fürs Durchtippen (Ziffern + Tab), macOS-Shortcuts (⌘1–7 für Screens, ⌘± Zoom im Bracket).

---

## Quellen

- Panini 2026: [Football Sticker Album Wiki – 2026 FIFA World Cup (Panini)](https://football-sticker-album.fandom.com/wiki/2026_FIFA_World_Cup_(Panini)) · [Panini America – Official Sticker Collection](https://www.paniniamerica.net/sticker-collections/sticker-collection/fifa-world-cup-2026tm.html) · [Deseret News – World Cup Panini Tradition](https://www.deseret.com/entertainment/2026/06/09/world-cup-panini-sticker-tradition-explained/) · [SI – Rarest Sticker Types](https://www.si.com/soccer/panini-world-cup-2026-sticker-album-rarest-sticker-types-players) · [Beckett – Collection Details](https://www.beckett.com/news/2026-panini-fifa-world-cup-sticker-collection/) · [NPR – Panini Demand](https://www.npr.org/2026/06/05/nx-s1-5844319/world-cup-2026-panini-stickers-album)
- FIFA-26-Branding: [1000logos – 2026 FIFA World Cup Identity](https://1000logos.net/news/2026-fifa-world-cup-identity-introduces-new-design-system/) · [PanamericanWorld – We Are 26 Branding](https://panamericanworld.com/en/magazine/sports/branding-2026-fifa-world-cup/) · [FWCUMC – Logo Design](https://fwcumc.com/news/world-cup-logo-design/) · [Design Week – 2026 Identity](https://www.designweek.co.uk/issues/22-may-26-may-2023/2026-fifa-world-cup-identity/)
- CSS-Foil: [simeydotme/pokemon-cards-css](https://github.com/simeydotme/pokemon-cards-css) · [poke-holo Demo](https://poke-holo.simey.me/) · [CSS-Tricks – Holographic Trading Card](https://css-tricks.com/holographic-trading-card-effect/) · [OpenReplay – Holographic Effects in CSS](https://blog.openreplay.com/creating-holographic-effects-css/) · [theosoti – Light Sweep](https://theosoti.com/short/featured-card-animation/) · [simeydotme/hover-tilt](https://github.com/simeydotme/hover-tilt)
- Flaggen: [lipis/flag-icons](https://github.com/lipis/flag-icons) · [flag-icons auf npm](https://www.npmjs.com/package/flag-icons) · [HatScripts/circle-flags](https://github.com/HatScripts/circle-flags) · [react-circle-flags](https://www.npmjs.com/package/react-circle-flags) · [SimpleLocalize – Flag-Icon-Vergleich](https://simplelocalize.io/blog/posts/list-of-country-flag-icon-projects/)
- Fonts: [Anton – Google Fonts](https://fonts.google.com/specimen/Anton) · [Oswald-Guide](https://fontfyi.com/blog/oswald-font-guide/) · [Typewolf – Best Google Fonts](https://www.typewolf.com/google-fonts)
- Bracket-UI: [DEV – Accessible Tournament Brackets](https://dev.to/yuridevat/can-tournament-brackets-be-accessible-34og) · [river.me – Tournament Brackets](https://river.me/blog/tournament-brackets/) · [g-loot/react-tournament-brackets](https://github.com/g-loot/react-tournament-brackets) · [Score7 – Bracket Templates](https://kb.score7.io/blog/guides/tournament-bracket-template/)
