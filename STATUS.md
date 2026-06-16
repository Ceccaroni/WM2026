# STATUS — Übergabe (kompakt!)

> Bei Sessionstart lesen — das genügt. Nach jedem Arbeitsblock NEU SCHREIBEN, nicht anwachsen
> lassen (hartes Limit: ~60 Zeilen): Erledigtes als Block oben in HISTORIE.md einfügen, hier nur
> Stand / Wächter / Nächstes. Rollen aller Dokumente: CLAUDE.md.

## Stand: 16. Juni 2026

**v1.8.11 ist live** (Daten v28); installiert, am Gerät bestätigt.

**PWA fürs iPhone — live & durchgesichtet.** Öffentlich: **https://ceccaroni.github.io/WM2026/** (Repo `Ceccaroni/WM2026`,
public, HTTPS). Renderer als statische PWA über Web-Bridge (`src/web/`), kein Backend. Adrian hat am iPhone Screen für
Screen gesichtet → **6 Hochformat-Layoutbefunde gefixt & deployt** (Details: HISTORIE, oberster Block): Home/Spielplan-
Karten, Filter, Rangliste-Zeile, KO-Tippzeile + Header-Badge, Team-Kopf (zentriert, Logo ohne Kachel), Chronik-
Tagesstreifen. **Spielerkarten-Flip von Adrian als „perfekt" bestätigt** → Safari-3D-Bug erledigt. Alle Fixes nur
≤680px/`.kotip` → Desktop unberührt (per Desktop-Shot gegengeprüft). `typecheck` grün, `publish:web` deployt.

## 🔴 Offene Fäden

- **Finaler Gegencheck der Fixes am echten Safari/iPhone** (meine Eigen-Verifikation lief im 390px-Chromium-Fenster via
  `WM26_SHOT_W`, gleicher Renderer-Code — sehr nah, aber kein iOS-Safari). Adrian checkt die 6 Screens am Gerät gegen.
- **28.06.:** alle tippen zusätzlich `fromR32` (Gold-Banner); Claude-Profil `Claude.wm26tipp` mit fromR32 nachliefern.
- **TUN-Trainer volatil:** Kebaier interim in coaches.json; bei Wechsel anpassen (+ `publish:update`, kein Rebuild).
- Danach: PWA-Feinschliff (Web-Badging, evtl. News über Proxy), restliche Feature-Ideen (Memory `projekt-feature-ideen`).

## ⚠️ Wächter — nicht übersehen

- **Web-Update online: `npm run publish:web`** (= build:web + deploy:web). Backt aktuellen Mac-Store als Seed, baut
  `dist-web/`, force-pusht als **Orphan in `gh-pages`** (`scripts/deploy-web.mjs`, `.nojekyll`). CI baut NICHT (Seed nur
  lokal). `gh`-Account = **Ceccaroni**. Repo-Name MUSS `WM2026` bleiben (Assets absolut über `base '/WM2026/'`).
- **Mobile-Layout selbst prüfen: `WM26_SHOT_W=390 WM26_SHOT_DIR=/tmp/x npm run dev`** → `captureMobile` schießt jeden
  Screen im ≤680px-Layout (`m-*.png`). Responsive-Mobile-CSS steht am **ENDE von components.css** (lädt nach global →
  gewinnt); Burger in global.css. Nur ≤680px / `.kotip` betroffen → Electron-Desktop unberührt.
- **PWA-Bridge spiegelt `Wm26Api`:** neue `window.wm26`-Methode im Preload (`src/preload/index.ts`) MUSS `src/web/bridge.ts`
  mitziehen, sonst bricht die PWA. Polling/Parse in `espn-poll.ts` nutzt `src/shared/results.ts`.
- **`seed-state.json` ist gitignored** (generiert) — nie im Source-Branch committen; entsteht bei jedem `build:web`.
- **Datenschutz Seed:** öffentlich live — Namen+Tipps der Gruppe unter der URL abrufbar (Adrian informiert, ok).
- **Versionsnummern NIE wiederverwenden:** 1.8.3 verbrannt; 1.8.4–1.8.11 vergeben. Nächste frische ≥ 1.8.12.
- **coaches.json / OTA-Trainer aktiv (≥1.8.9):** Trainerwechsel = coaches.json ändern + `publish:update` (OHNE `--dmg`).
  Cloud-Routine „Trainerwechsel" tgl. 08:00 — Baseline im Routine-Prompt bei coaches.json-Änderung nachziehen. ⚠️ Die
  Cloud aktualisiert nur die Mac-App OTA, NICHT die PWA (kein Seed in der Cloud) → bei Wechsel lokal `publish:web` nachziehen.
- **Cloud-Routine „Nati-Spielerfotos" tgl. 09:00:** Funde lokal einpflegen. Offen: Manzambi, Vargas, Aebischer, Keller,
  Rieder, Amenda, Jaquez, Itten. Alle 8 ⇒ Routine löschen.
- **Publish-Mechanik (Electron-OTA):** `publish:update -- --notes '…' --dmg`; `--notes` nur in EINFACHEN Quotes. `--dmg`
  globt `dist/*.dmg` mit Versions-Substring ⇒ vor Publish genau EINE Ziel-.dmg dieser Version in `dist/`. dataVersion +1.
- **`npm run data:schedule` GESPERRT**, solange fixturedownload Spiel 29/31 alte Zeiten führt (sonst Patch 00:30Z/03:00Z weg).
- **Shot-Hook** (Electron, Desktop 1320px): Shot 28 `ko-hilfe.png`; Seed enthält Gruppen B+E. Nur Screenshot-userData, nie echte Tipps.
- **Tokens:** Spacing 1/2/3/4/6/8; Gold = Belohnung, `--panini-blue` Hinweis/Favorit, `--pitch-green` Quali/Rasen.
- Echte Tippdaten in `~/Library/Application Support/WM26 Tipp/` — nie verändern (Seed liest nur). Port 5173 fremd → 5174+.
- **App bleibt „WM26 Tipp"** (Rename „TSCHUTTINI '26" verworfen, macOS-26-Dock-Problem).

## Nächstes

- **Adrian gegencheckt die 6 Fixes am iPhone** (Reload der PWA nötig → SW autoUpdate, ggf. App schließen/neu öffnen). Bei Restbefunden nachfixen → `publish:web`.
- **Bracket-Minimap verworfen** (Kompaktmodus deckt den Nutzen ab — Adrian-Entscheid 16.06.).
