# STATUS — Übergabe (kompakt!)

> Bei Sessionstart lesen — das genügt. Nach jedem Arbeitsblock NEU SCHREIBEN, nicht anwachsen
> lassen (hartes Limit: ~60 Zeilen): Erledigtes als Block oben in HISTORIE.md einfügen, hier nur
> Stand / Wächter / Nächstes. Rollen aller Dokumente: CLAUDE.md.

## Stand: 16. Juni 2026

**v1.8.11 ist live** (Daten v28); installiert, Deutsch-Menü & Live-Pitch von Adrian am Gerät bestätigt.

**PWA fürs iPhone — Phase 1 gebaut** (Details: HISTORIE, oberster Block; Plan: `~/.claude/plans/sorted-imagining-quill.md`).
Renderer läuft als statische PWA über eine **Web-Bridge** (`src/web/`, spiegelt `window.wm26`) — **0 Renderer-Umbau**,
kein Backend (ESPN CORS-offen). Lokal lauffähig; von Adrian iterativ bestätigt: **Ton (Anpfiff-Screen), Tipps der
ganzen Gruppe (Seed), Burger-Navigation, Stadien & responsive Grids**. `typecheck` + Electron-Build grün (keine Regression).
Lokaler Test: `npm run preview:web` → `http://192.168.0.118:4173/WM2026/` (am Mac: `localhost`).

## 🔴 Offene Fäden (PWA Phase 1 abschließen)

- **Finale Geräte-Sichtung ALLER Screens im Hochformat** (ich kann das Layout nicht sehen): noch seitlich schiebbar?
  Match-Zeilen-Umbruch ok? Zuletzt gefixt: Heute-Vorschau, Team-Kopf (Wappen war weg), Rangliste/Gruppentabellen/News.
- **Spielerkarten-Flip-Spiegelung (Safari):** Fix (Front `transform:rotateY(0) translateZ(0)`) **unverifiziert**. Falls
  Rückseite noch durchscheint → Ursache vermutl. Foil-Effekt auf der Front: `HoloSticker`/`FoilStickerCard`-CSS auf
  `filter`/`mask`/`overflow` prüfen, das `preserve-3d` flachdrückt.
- **GitHub-Pages-Deploy** für echten iPhone-Install/Offline (https nötig; LAN-http hat keinen Service-Worker).
  Arbeitsverzeichnis ist **kein Git-Repo** → init + Repo/Branch klären. `base` steht schon auf `/WM2026/` (via `VITE_BASE`).
- **28.06.:** alle tippen zusätzlich `fromR32` (Gold-Banner); Claude-Profil `Claude.wm26tipp` mit fromR32 nachliefern.
- **TUN-Trainer volatil:** Kebaier interim in coaches.json; bei Wechsel anpassen (+ `publish:update`, kein Rebuild).

## ⚠️ Wächter — nicht übersehen

- **PWA-Bridge spiegelt `Wm26Api`:** kommt im Preload (`src/preload/index.ts`) eine neue `window.wm26`-Methode dazu,
  MUSS `src/web/bridge.ts` mitziehen (sonst bricht die PWA). Polling/Parse in `espn-poll.ts` nutzt `src/shared/results.ts`.
- **PWA-Build:** `npm run build:web` (ruft `seed:web` vor Vite → backt aktuellen Mac-Store als Gruppen-Seed ein).
  SW precacht **nur App-Shell**, NICHT die ~985 Bilder. Responsive-Mobile-CSS steht am **ENDE von components.css**
  (lädt nach global.css → gewinnt) + Burger in global.css. Nur `≤680px` betroffen → Electron unberührt.
- **Datenschutz Seed:** öffentlich gehostet sind Namen+Tipps der Gruppe abrufbar (Adrian informiert, für private Gruppe ok).
- **Versionsnummern NIE wiederverwenden:** 1.8.3 verbrannt; 1.8.4–1.8.11 vergeben. Nächste frische ≥ 1.8.12.
- **coaches.json / OTA-Trainer aktiv (≥1.8.9):** Trainerwechsel = coaches.json ändern + `publish:update` (OHNE `--dmg`).
  Cloud-Routine „Trainerwechsel" tgl. 08:00 — Baseline steckt im Routine-Prompt, bei coaches.json-Änderung nachziehen.
- **Cloud-Routine „Nati-Spielerfotos" tgl. 09:00:** Funde lokal einpflegen. Offen: Manzambi, Vargas, Aebischer, Keller,
  Rieder, Amenda, Jaquez, Itten. Alle 8 ⇒ Routine löschen.
- **Publish-Mechanik:** `publish:update -- --notes '…' --dmg`; `--notes` nur in EINFACHEN Quotes. `--dmg` globt `dist/*.dmg`
  mit Versions-Substring ⇒ vor Publish genau EINE Ziel-.dmg dieser Version in `dist/`. dataVersion +1 je Publish.
- **`npm run data:schedule` GESPERRT**, solange fixturedownload Spiel 29/31 alte Zeiten führt (sonst Patch 00:30Z/03:00Z weg).
- **Shot-Hook** (Electron): Shot 28 `ko-hilfe.png`; Seed enthält Gruppen B+E. Nur Screenshot-userData, nie echte Tipps.
- **Tokens:** Spacing 1/2/3/4/6/8; Gold = Belohnung, `--panini-blue` Hinweis/Favorit, `--pitch-green` Quali/Rasen.
- Echte Tippdaten in `~/Library/Application Support/WM26 Tipp/` — nie verändern (Seed liest nur). Port 5173 fremd → 5174+.
- **App bleibt „WM26 Tipp"** (Rename „TSCHUTTINI '26" verworfen, macOS-26-Dock-Problem).

## Nächstes

- **PWA Phase 1 abschließen:** Geräte-Sichtung + Flip-Bug verifizieren/nachfixen → GitHub-Pages-Deploy → am iPhone installieren.
- Danach offen: PWA-Feinschliff (Web-Badging, evtl. News über Proxy), restliche Feature-Ideen (Memory `projekt-feature-ideen`).
- **Bracket-Minimap verworfen** (Kompaktmodus deckt den Nutzen schon ab — Adrian-Entscheid 16.06.).
