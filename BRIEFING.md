# BRIEFING — „WM26 Tipp" · Die ultimative WM-2026-Durchtipp-App für den Mac

**Stand: 11. Juni 2026 — Eröffnungstag der WM.** Alle Fakten in diesem Briefing sind recherchiert und mehrfach verifiziert (Details in `research/`).

---

## 1. Vision

Eine native macOS-App (.dmg, ohne Apple Developer Account) im **Panini-Sammelalbum-Look**: sexy, glossy, aber aufgeräumt und perfekt gestaltet. Eine **Durchtipp-App** — das komplette Turnier (104 Spiele, 48 Teams, 12 Gruppen, Round of 32 bis Finale) ist mit allen Konstellationen, Turnierbäumen, Spieltagen, Anstoßzeiten (MESZ) und Stadien fest eingebaut. Man tippt sich durch, alles wird automatisch gespeichert, mehrere Tipper:innen pro App, Austausch per Datei, echte Ergebnisse kommen live aus dem Netz.

**Leitmotiv-Design:** „Digitales Panini-Album bei Flutlicht" — dunkle Bühne, cremefarbene Albumseiten, Sticker mit weißem Rand, Gold-Foil-Effekte als Belohnung.

---

## 2. Rahmenbedingungen

| | |
|---|---|
| Turnier | FIFA World Cup 26™, 11. Juni – 19. Juli 2026, USA/Kanada/Mexiko |
| Format | 48 Teams, 12 Gruppen (A–L), Top 2 + 8 beste Dritte → **Round of 32** → AF → VF → HF → Finale. 104 Spiele, 16 Stadien |
| Eröffnung | **Heute**, 11.6., Mexiko–Südafrika, Estadio Azteca, 21:00 MESZ |
| Finale | So 19.7., MetLife Stadium (East Rutherford/NY), 21:00 MESZ |
| Plattform | macOS (Apple Silicon primär, Intel-Build optional), Verteilung als unsigniertes/ad-hoc-signiertes .dmg |
| Nutzer | Eine Freundesrunde; jede:r installiert die App auf dem eigenen Mac, Datenaustausch per Datei (kein Server) |
| Zeitdruck | Gruppenphase läuft ab heute — MVP (Tippen + Speichern + Spielplan) hat höchste Priorität |

---

## 3. Rubriken & Funktionsumfang

### 3.1 Spielplan
- Alle 104 Spiele, gruppiert nach Spieltagen/Runden, mit **Anstoßzeit in MEZ/MESZ** (Turnier = MESZ, UTC+2), Stadion und Austragungsort.
- Filter: nach Gruppe, Team, Runde, Tag. Heutige Spiele prominent („Heute im Album").
- Jedes Spiel als **MatchCard** im Sticker-Stil: Flaggen-Badges, Gruppenbadge, Stadion-Hinweis.

### 3.2 Meine Tipps (Durchtippen)
- **Gruppenphase:** Alle 72 Gruppenspiele mit Ergebnis tippen (ScoreStepper). Die **Gruppentabellen berechnen sich live aus den Tipps** — mit den offiziellen FIFA-Tiebreakern (neu 2026: direkter Vergleich VOR Gesamttordifferenz!).
- **Drittplatzierten-Logik:** Die App berechnet aus den Tipps die Rangliste der 12 Gruppendritten (Punkte → Tordifferenz → Tore) und ermittelt die 8 besten Dritten. Die Zuordnung auf die R32-Spiele folgt der **offiziellen FIFA-Tabelle (Annexe C, 495 Kombinationen)** — fest in der App hinterlegt.
- **KO-Phase:** Aus den Gruppentipps füllt sich der Turnierbaum automatisch. Man tippt jedes KO-Spiel (Endergebnis inkl. Verlängerung + Sieger bei Unentschieden) und der Baum wächst weiter bis zum Finaltipp + Weltmeister.
- **Auto-Save:** Jeder Tipp wird sofort atomar gespeichert. Kein Speichern-Button, nirgends.
- **Tipp-Deadline:** Tipps sind bis zum Anstoß des jeweiligen Spiels änderbar, danach gesperrt (visuell: Sticker „eingeklebt").

### 3.3 Live
- Echte Ergebnisse und Live-Spielstände, automatisch geholt (siehe § 6).
- **Mein Tipp wird dezent dazugeblendet** (GlassHUD über/neben der Live-MatchCard): eigener Tipp, Live-Stand, aktuell erzielte Punkte für dieses Spiel.
- Live-Indikator (pulsierender roter Punkt), Spielminute, Halbzeitstand; bei KO: Verlängerung/Elfmeterschießen sauber abgebildet.
- Echte Gruppentabellen und echter Turnierbaum (Ist-Zustand) parallel zur Tipp-Welt.

### 3.4 Rangliste
- Punktestand aller importierten Tipper:innen, FLIP-animiert, Platz 1 mit Gold-Foil.
- Aufschlüsselung: Punkte pro Spieltag/Runde, exakte Treffer, Tendenzen, Bonuspunkte.

### 3.5 KO-Späteinstieg („Neu einsteigen")
- Ab der KO-Runde kann man **pro Runde neu einsteigen**: eigene Kategorie je Einstiegsrunde (ab R32, ab Achtelfinale, ab Viertelfinale, …), die **Teams sind dann mit den echten Qualifikanten vorausgefüllt**.
- Jede Einstiegsrunde bildet eine **eigene Wertungskategorie** (faire Vergleichbarkeit); die Hauptwertung bleibt das Durchtippen ab Spiel 1.

### 3.6 Teams (Panini-Sticker-Seiten)
- Pro Team eine Unterseite als **großer Panini-Sticker**: Flagge (alle Teams mit Landesflagge gekennzeichnet, app-weit), Verbandsname, Gruppe, Spielplan des Teams.
- **Topaktuelle Infos (keine älter als 4 Monate, Stand-Datum sichtbar):** Form, Kader-Highlights/Stars, Trainer, Quali-Bilanz, aktuelle Storylines.
- **Am Ende jeder Team-Seite: die Wettquote der Buchmacher** auf den Turniersieg (Quoten-Snapshot mit Datumsstempel).
- **Live-News intern (ergänzt 11.06.):** Aufklappbare aktuelle Meldungen zum Team aus 7 deutschsprachigen Sport-Feeds (CH + DE), alle 15 Min automatisch aktualisiert, per Namens-Matching dem Team zugeordnet — **komplett in der App lesbar, keine externen Tabs**.

### 3.7 Stadien
- Pro Stadion eine StadiumCard/Unterseite: FIFA-Turniername + üblicher Name (z. B. „Dallas Stadium" = AT&T Stadium), Stadt, Land, Kapazität, Zeitzone, **topaktuelle Infos** (≤ 4 Monate) und welche Spiele dort stattfinden.
- **Drehbar (ergänzt 11.06.):** Klick dreht die Karte wie einen Panini-Sticker — Rückseite mit frei lizenziertem Stadion-Foto (Wikimedia Commons, Attribution sichtbar) und einer Nordamerika-Lagekarte (alle 16 Spielorte, gewählter gold).

### 3.8 Profile & Austausch
- **Mehrere Benutzerprofile** in einer App-Installation (Name, Farbe, Avatar-Initialen); Wechsel über Profil-Switcher.
- **Export:** Eigene Tipps als Datei `Name.wm26tipp` (JSON) — per AirDrop/Mail/Chat an die anderen.
- **Import:** Fremde `.wm26tipp`-Dateien per Drag & Drop oder Dateidialog; Merge nach Profil-UUID, bei Konflikt gewinnt der neuere Export. → Danach erscheinen die anderen in der Rangliste und als Vergleich („Was hat Reto getippt?").

### 3.9 WM-Begleiter (ergänzt 11.06.)
- **„Heute im Album"** als Startscreen: heutige Spiele live, Countdown zum nächsten Anstoß, Punktestand, Warnung bei fehlenden Tipps, Morgen-Vorschau.
- **Tipp-Vergleich:** In Live/Heute jede Spielzeile aufklappbar — alle Tipps der Runde mit Punkten. **Fremde Tipps werden erst beim Anstoß aufgedeckt** (vorher nur „getippt ✓"), damit niemand abschreibt.
- **Tipp-Wächter:** Dock- und Sidebar-Badge für ungetippte heutige Spiele, macOS-Mitteilung 30 Min vor Anstoß.
- **Kür:** Formkurve in der Rangliste (Punkte je Spieltag/Runde), Bracket-Kompaktmodus (ganzer Baum ohne Scrollen), Spielplan-Export als .ics (gefilterte Spiele, z. B. nur das eigene Team).

---

## 4. Turnierlogik (fest eingebaute Regeln)

1. **Gruppen-Tiebreaker (offiziell, neu 2026):** ① Punkte direkter Vergleich → ② Tordifferenz direkter Vergleich → ③ Tore direkter Vergleich → ④ Tordifferenz gesamt → ⑤ Tore gesamt → ⑥ Fairplay → ⑦ FIFA-Ranking. (Für die Tipp-Welt enden wir bei ⑤; danach deterministischer Fallback: Setzlisten-Reihenfolge — wird im UI als „Münzwurf" gekennzeichnet.)
2. **Drittplatzierten-Rangliste:** Punkte → Tordifferenz → Tore (→ Fairplay → FIFA-Ranking; Fallback wie oben).
3. **R32-Bracket:** Fixe Struktur (Spiele 73–88) inkl. der 8 Dritten-Slots (1E, 1I, 1A, 1L, 1D, 1G, 1B, 1K) und der offiziellen Zuordnungstabelle für alle 495 Dritten-Kombinationen (FIFA Regulations, Annexe C). Vollständiger Baum bis Spiel 104 mit Pfaden, Spiel um Platz 3 inklusive.
4. **KO-Spiele:** Tipp = Endergebnis inkl. Verlängerung; bei Unentschieden (Elfmeterschießen) zusätzlich „Wer kommt weiter?".

Alle Daten (Teams, Gruppen, Spielplan, Stadien, Bracket) liegen als **gebundelte JSON-Dateien** in der App — die App funktioniert vollständig offline, online kommen nur Live-Ergebnisse dazu. Quellen und Verifikation: `research/wm2026-daten.md`.

---

## 5. Punktesystem (Vorschlag — konfigurierbar in den Einstellungen)

| Ereignis | Punkte |
|---|---|
| Exaktes Ergebnis | **4** |
| Richtige Tordifferenz (bzw. richtiges Unentschieden) | **3** |
| Richtige Tendenz | **2** |
| KO: richtiger Weiterkommer (zusätzlich, auch wenn Ergebnis falsch) | **+1** |
| Bonus Durchtippen: je korrekt getippter Achtelfinalist | **+1** |
| Bonus: je korrekter Viertelfinalist / Halbfinalist / Finalist | **+2 / +3 / +4** |
| Bonus: korrekter Weltmeister | **+10** |

Defaults bei Erststart; pro Tipprunde einstellbar. Das Punktesystem wird im Export mitgeführt, damit alle identisch werten. *(✅ Bestätigt am 11.06.2026.)*

---

## 6. Datenquellen & Aktualisierung

| Zweck | Quelle | Status |
|---|---|---|
| **Live-Ergebnisse (primär)** | ESPN-API (inoffiziell, **keyless**): `site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard` | ✅ Heute live verifiziert (liefert Eröffnungsspiel, alle 104 Spiele per Range-Query; Status inkl. AET/Elfmeterschießen) |
| **Endstände (Fallback)** | `fixturedownload.com/feed/json/fifa-world-cup-2026` (Mapping über FIFA-Spielnummer 1–104) | ✅ Verifiziert, bereits lokal unter `resources/data/source/` |
| **Quervergleich (optional)** | OpenLigaDB Liga `wm26` | ✅ Existiert, community-gepflegt |
| Spielplan/Stammdaten | Gebündelt in der App (fixturedownload + openfootball, kreuzverifiziert) | ✅ Lokal |
| **Team-News (Klartext)** | 7 deutschsprachige RSS/Atom-Feeds: Blick WM, Watson Fussball, NZZ Sport, kicker WM, Sportschau WM 2026, t-online Sport (Volltexte), sport.de Fussball — 15-Min-Polling im Main, persistiert | ✅ Verifiziert 11.06. (Texte, Aktualität, App-User-Agent) |

**Polling-Strategie:** Während Spielfenstern alle 60–120 s, sonst stündlich; manueller Refresh-Button. Spiel-Mapping über Datum + Teamnamen → eigene Spielnummer. Bei API-Ausfall: Fallback-Kette, Stale-Anzeige mit Zeitstempel („Stand 21:43"). Details: `research/ergebnis-api.md`.

**Team-/Stadion-Inhalte & Wettquoten:** Kuratierte, datierte Daten-Releases (`teaminfo/*.json`, `stadiuminfo/*.json`) — initial per Tiefenrecherche erstellt (Stand Juni 2026, damit ist „keine Info älter als 4 Monate" erfüllt), während des Turniers per Daten-Update nachgeliefert (Import wie Tipps oder App-Update). Quoten als Snapshot mit Datumsstempel; optional später The-Odds-API (Free Tier, Key nötig). *(✅ Umgesetzt 11.06.2026: 48 Team- + 16 Stadion-Dossiers kuratiert, Quoten-Snapshot BetMGM vom 10.06. — Live-Odds-API nicht nötig, siehe §11.4.)*

---

## 7. Design (Kurzfassung — vollständiges Designsystem in `research/design.md`)

- **Richtung:** Digitales Panini-Album bei Flutlicht. Dunkle Bühne (`#0E1116`), helle Album-„Papierseiten" (`#F6F1E7`), Sticker mit weißem Rand (5 px) und Sticker-Nummern, ungetippte Spiele als „fehlende Sticker" (graue Schraffur-Slots).
- **Farben:** Panini-Blau `#0B5FA5` · Babyblau `#BFE0F5` · Akzent-Magenta `#E62E6B` · Gold-Foil `#D4AF37`/`#F9E27D` · Pitch-Grün `#1F8A4C` · Live-Rot `#E5484D`.
- **Fonts (frei):** **Anton** (Hero-Headlines), **Oswald** (Scores/Nummern, tabular), **Inter** (UI).
- **Glossy:** Pointer-getriebener Holo-Layer (`mix-blend-mode: color-dodge`) + 3D-Tilt (max. 8°) nach dem Vorbild pokemon-cards-css; Shine-Sweep; `@property`-animierter Gold-Foil-Verlauf. Foil **nur als Belohnung** (exakter Tipp, Platz 1, Weltmeister-Sticker) — so bleibt es edel statt grell. `prefers-reduced-motion` wird respektiert.
- **Flaggen:** `flag-icons` (MIT; 4:3 + 1:1) als Mini-Sticker mit weißem Rand + runde `circle-flags` (MIT) für Tabellen/Bracket. England/Schottland über `gb-eng`/`gb-sct`.
- **KO-Baum (32 Teams!):** Gespiegeltes Bracket mit Finale in der Mitte (6 Spalten statt 11), Runden-Tabs + Zoom/Minimap; eigener Tipp-Pfad als goldene Linie; offene Slots als „fehlende Sticker".
- **Komponenten:** StickerCard, FoilStickerCard, MatchCard, FlagBadge, ScorePill, ScoreStepper, FoilHeader, BracketNode/-Connector, GroupTable (FLIP-animiert), AlbumPage, StadiumCard, LeaderboardRow, GlassHUD.

---

## 8. Technik

**Stack (Empfehlung aus `research/tech-stack.md`):**
Electron + electron-builder ≥ 26 · React 19 + TypeScript · electron-vite · Motion (ex Framer Motion) · electron-store v11 (atomare Writes, Schema, Migrationen) · Zustand (UI-State).
*Begründung:* maximale UI-Freiheit für den Glossy-Look, ausgereiftester unsignierter .dmg-Pfad, kein Vorteil von Tauri/SwiftUI bei der Empfänger-Erfahrung (Gatekeeper-Prozedur ist identisch).

**Persistenz:** schlanker eigener Atomic-JSON-Store im Electron-Main (Schreiben in tmp-Datei + rename, debounced; gleiche Semantik wie electron-store, aber ohne dessen ESM-Bundling-Risiko). Auto-Save bei jeder Änderung. Export/Import = Teilmenge des Stores als `.wm26tipp`.

**Export-Format `.wm26tipp` (JSON):**
```json
{
  "formatVersion": 1,
  "exportedAt": "2026-06-18T21:30:00+02:00",
  "scoring": { "exact": 4, "diff": 3, "tendency": 2, "...": "…" },
  "profile": { "id": "uuid", "name": "Adrian", "color": "#0B5FA5" },
  "entries": {
    "main": { "tips": { "1": { "h": 2, "a": 0 }, "73": { "h": 1, "a": 1, "adv": "home" } } },
    "fromR32": { "tips": { "…": "…" } }
  }
}
```

**Distribution (.dmg ohne Apple Developer Account) — kritische Punkte:**
- **Ad-hoc signieren** (`identity: "-"` in electron-builder), NICHT komplett unsigniert — sonst meldet macOS „App ist beschädigt".
- `hardenedRuntime: false`, `notarize: false`; electron-builder ≥ 26 (behebt DMG-Bug unter macOS 26 Tahoe).
- Separate .dmg für Apple Silicon (arm64) und Intel (x64).
- **Empfänger-Anleitung (liegt der .dmg bei):** Seit macOS 15 reicht Rechtsklick→Öffnen NICHT mehr. Ablauf: App starten → Dialog mit „Fertig" schließen → Systemeinstellungen → Datenschutz & Sicherheit → unten „Dennoch öffnen" → bestätigen (auf macOS 26 mit Admin-Passwort). Einmalig pro App.

---

## 9. Projektstruktur

```
WM2026/
├── BRIEFING.md                  ← dieses Dokument
├── README.md                    ← Dev-Kommandos + Empfänger-Anleitung
├── research/                    ← verifizierte Recherche-Dossiers (4 Stück)
├── package.json · electron-builder.yml · electron.vite.config.ts · tsconfig*.json
├── scripts/
│   └── build-schedule.mjs       ← Quell-Feed → resources/data/schedule.json
├── resources/data/
│   ├── source/                  ← Roh-Feeds (fixturedownload, 104 Spiele)
│   ├── teams.json               ← 48 Teams: ID, Name de, Gruppe, Flaggencode
│   ├── stadiums.json            ← 16 Stadien: FIFA-Name, üblicher Name, Stadt, Kapazität, TZ
│   ├── schedule.json            ← 104 Spiele: Nr., Runde, UTC-Zeit, Stadion-ID, Teams/Platzhalter
│   ├── bracket.json             ← KO-Struktur, Dritten-Slots, Annexe-C-Zuordnung
│   └── teaminfo/ · stadiuminfo/ ← kuratierte topaktuelle Inhalte + Quoten (Phase 2)
└── src/
    ├── main/                    ← Electron-Main: Fenster, Store, IPC, Results-Fetcher
    ├── preload/                 ← sichere IPC-Brücke
    └── renderer/src/
        ├── screens/             ← Spielplan · MeineTipps · Live · Rangliste · KoEinstieg · Teams · Stadien · Profile
        ├── components/          ← StickerCard, MatchCard, FlagBadge, …
        ├── lib/                 ← types, tournament (Tabellen/Tiebreaker), thirdPlace (Annexe C), scoring, resultsApi
        └── styles/              ← tokens.css (Designsystem), foil.css (Glossy)
```

---

## 10. Meilensteine

1. **M1 — Tippen ab sofort (höchste Prio):** Spielplan + Gruppenphase durchtippen + Auto-Save + Profile. *(Die Gruppenphase läuft 17 Tage — Zeit bis zum R32 am 28.6. für den Rest.)*
2. **M2 — Turnierlogik komplett:** Tabellen-/Dritten-Berechnung, Annexe-C-Zuordnung, KO-Baum durchtippen, KO-Späteinstieg.
3. **M3 — Live & Wertung:** ESPN-Polling, Live-Rubrik mit Tipp-Overlay, Punkteberechnung, Rangliste, Export/Import.
4. **M4 — Album-Glanz:** Team-Sticker-Seiten (topaktuell + Quoten), Stadion-Seiten, Foil-Effekte, Feinschliff.
5. **M5 — Release:** Ad-hoc-signierte .dmg (arm64 + x64) + Empfänger-Anleitung.

*✅ Alle Meilensteine am 11.06.2026 (Eröffnungstag) abgeschlossen; Version 1.1.0 abends an die Mittipper verteilt. Aktueller Stand: STATUS.md.*

---

## 11. Entscheidungen (Stand 11.06.2026) & offene Punkte

1. ✅ **Punktesystem** (§ 5) — bestätigt wie vorgeschlagen.
2. ✅ **Wertung Späteinstieg** — eigene Kategorie pro Einstiegsrunde, bestätigt.
3. ✅ **Intel-Build** — unklar, ob ein Intel-Mac dabei ist → es werden standardmäßig **beide** .dmg gebaut (arm64 + x64).
4. ✅ **Quoten-Updates:** kuratierte Snapshots umgesetzt (BetMGM, Stand 10.06., mit Datumsstempel im UI) — Live-Odds-API mit Key nicht nötig; bei Bedarf neuer Snapshot per Daten-Release.
5. Anstoßzeiten werden als **MESZ** angezeigt (Juni/Juli = Sommerzeit); Label im UI: „MEZ/MESZ" via `Europe/Zurich`.
6. **KO-Basispunkte teamunabhängig** *(11.06., als Default gesetzt — Veto möglich)*: Die 4/3/2-Basiswertung vergleicht den getippten Score mit dem echten Score **pro Spielnummer**, unabhängig davon, ob die getippte Paarung eintrifft (kicktipp-üblich). Die team-bezogene Treffsicherheit belohnen Weiterkommer- (+1) und Durchtipp-Boni.
7. ✅ **Team-News intern statt Links** *(11.06.)*: Meldungen werden IN der App gelesen (aufklappbar) — keine externen Browser-Tabs. Quelle: 7 verifizierte deutschsprachige Feeds mit Klartext (§6), 15-Min-Polling. Google-News-Ansatz (nur Titel + Link) verworfen.
8. ✅ **Stadion-Rückseiten** *(11.06.)*: Foto (Wikimedia Commons, frei lizenziert, Attribution) + eigene Offline-Lagekarte (Natural Earth, Public Domain) — kein Kartendienst, kein Tracking, läuft offline.
9. ✅ **Tipp-Vergleich-Regel** *(11.06., konkretisiert §3.8/§3.9)*: Fremde Tipps werden erst ab Anstoß angezeigt (vorher nur „getippt ✓") — Anti-Abschreib-Regel; der eigene Tipp ist immer sichtbar.
10. **Versionierung:** 1.0.0 = Release-Stand M4, 1.1.0 = + WM-Begleiter-Paket & News v2 — am 11.06. abends verteilt (arm64; x64 in Reserve).
11. ✅ **Update-Mechanismus** *(11.06., Option A umgesetzt)*: Klassisches Auto-Update (electron-updater/Squirrel.Mac) ist ohne Apple-Developer-Signatur **nicht möglich**. Stattdessen pollt die App `github.com/Ceccaroni/wm26-tipp-updates` (öffentlich): **Daten-Releases** (Anstoßzeiten, Dossiers, Quoten, Kader) werden automatisch geladen und beim Start angewendet; **neue App-Versionen** erscheinen als Download-Banner (DMG einmal manuell installieren, Tipps bleiben). Veröffentlichen: `npm run publish:update [-- --dmg]`. Verworfen: (B) Datei via Chat (Handarbeit), (C) Selbst-Updater (zu riskant). Ab Version 1.4.0 aktiv.
12. ✅ **KO-Wertung = Endergebnis inkl. Verlängerung** *(14.06., korrigiert §4.4/§5)*: Die Basiswertung vergleicht den Tipp mit dem ESPN-Endstand (nach Verlängerung); ein Elfmeterschießen wird über den Sieger („Wer kommt weiter?") abgebildet, nicht über den Score. Damit ist die App in sich konsistent — vorher fragte der Tipp-Text „Ergebnis nach 90 Min.", die Wertung verglich aber gegen den Endstand. Bewusst **gegen** eine 90-Min-Rekonstruktion entschieden (kicktipp-üblich, sofort verifizierbar, kein unverifizierbarer Rekonstruktions-Code vor der KO-Phase).
