# STATUS — Übergabe (kompakt!)

> Bei Sessionstart lesen — das genügt. Nach jedem Arbeitsblock NEU SCHREIBEN, nicht anwachsen
> lassen (hartes Limit: ~60 Zeilen): Erledigtes als Block oben in HISTORIE.md einfügen, hier nur
> Stand / Wächter / Nächstes. Rollen aller Dokumente: CLAUDE.md.

## Stand: 17. Juni 2026

**v1.8.11 live** (Daten **v29**); PWA live: **https://ceccaroni.github.io/WM2026/**.

**Dodo (Adrians Vater) aufgenommen.** Von der kollabierten SRF-Tipprunde übernommen: Profil **Dodo** (#DC2626), alle
**104 Tipps** (1–72 + KO 73–104, keine Lücke) am Mac via **Martin-Modus** erfasst, vorher Store gesichert
(`wm26-store.backup-2026-06-17.json`). Auf der PWA live (im Seed verifiziert). Export `~/Downloads/Dodo.wm26tipp`
(104 Tipps, gleiche Profil-ID) — **Adrian verteilt sie an die anderen zum Mac-Import** (sein Job, läuft).

**PWA: alle Profile aktivierbar.** Importierte Profile (Benjamin/Franzipani/Claude/Martin) ließen sich am Handy nicht
aktivieren (`!p.imported`-Sperre). Neu via Build-Flag **`__WEB__`**: im Web zeigt „Aktivieren" bei ALLEN Profilen
(PWA-Gerätekopie isoliert → Fairness-Sperre wirkungslos). **Desktop/Mac unverändert.** Am Bundle verifiziert, deployt,
committet (26acdb7).

**Tunesien-Trainer: Hervé Renard** (Kebaier war interim). coaches.json + **OTA** (Daten v29, live verifiziert) + PWA +
Cloud-Routine-Baseline — alle drei Kanäle bedient. Mac-Apps ziehen es beim nächsten Update-Check.

## 🔴 Offene Fäden

- **Adrian verteilt `Dodo.wm26tipp`** an die Mitspieler (Mac-Import). PWA-seitig ist Dodo schon live.
- **iOS-PWA-Reload:** neuer Deploy wird NICHT durch App-Neustart übernommen → Seite einmal frisch in Safari laden
  (App ganz schließen+neu, ggf. Safari). **Niemand muss neu installieren.**
- **28.06.:** alle tippen zusätzlich `fromR32` (Gold-Banner); Claude-Profil `Claude.wm26tipp` mit fromR32 nachliefern.
  Dodo hat noch kein fromR32 — gehört auch dazu.
- **Finaler Gegencheck der 6 Hochformat-Fixes am echten iPhone** (Adrian war heute am Gerät ohne Layout-Klage — sehr
  wahrscheinlich ok, aber nicht explizit bestätigt).
- Danach: PWA-Feinschliff (In-App-Update-Hinweis, Web-Badging), restliche Feature-Ideen (Memory `projekt-feature-ideen`).

## ⚠️ Wächter — nicht übersehen

- **Web vs. Desktop divergiert jetzt bewusst** über **`__WEB__`** (vite.web.config.ts=true / electron.vite.config.ts=false,
  deklariert in `src/renderer/src/lib/env.ts`). Erste Nutzung: „Aktivieren" für importierte Profile nur im Web. Nicht „zurückfixen".
- **Web-Update online: `npm run publish:web`** (= build:web + deploy:web). Backt aktuellen Mac-Store als Seed, baut
  `dist-web/`, force-pusht als **Orphan in `gh-pages`** (`scripts/deploy-web.mjs`, `.nojekyll`). CI baut NICHT (Seed nur
  lokal). `gh`=**Ceccaroni**. Repo-Name MUSS `WM2026` bleiben (`base '/WM2026/'`).
- **Trainerwechsel = 4 Schritte:** coaches.json ändern → **`publish:update -- --notes '…'`** (OHNE `--dmg`, dataVersion +1,
  `--notes` nur EINFACHE Quotes) für Mac-OTA → **`publish:web`** für die PWA → **Cloud-Routine „Trainerwechsel"-Baseline**
  (`trig_01F2EfZDT3kCTKLPaB6dYiKL`, tgl. 08:00 = 06:00 UTC) nachziehen. Die `.wm26tipp`-Verteilung trägt NUR Profile, NICHT coaches.json.
- **Nachzügler erfassen:** `VITE_MARTIN=1 VITE_MARTIN_NAME=<Name> npm run dev` hebt die Tipp-Sperre auf (schreibt in den
  ECHTEN Store!). Vorher Store sichern; installierte App schließen (sonst zwei Prozesse auf einem Store); Fenster NICHT übers Dock öffnen.
- **PWA-Bridge spiegelt `Wm26Api`:** neue `window.wm26`-Methode im Preload MUSS `src/web/bridge.ts` mitziehen. Polling/Parse via `src/shared/results.ts`.
- **`seed-state.json` ist gitignored** (generiert bei jedem `build:web`) — nie im Source-Branch committen.
- **Datenschutz Seed:** öffentlich live — Namen+Tipps der Gruppe unter der URL abrufbar (Adrian ok).
- **Versionsnummern NIE wiederverwenden:** 1.8.3 verbrannt; 1.8.4–1.8.11 vergeben. Nächste frische ≥ 1.8.12.
- **App-Update (mit Binary):** `publish:update -- --notes '…' --dmg`; `--dmg` globt `dist/*.dmg` mit Versions-Substring ⇒ vor Publish genau EINE Ziel-.dmg dieser Version in `dist/`.
- **Cloud-Routine „Nati-Spielerfotos" tgl. 09:00 (07:00 UTC):** Funde lokal einpflegen. Offen: Manzambi, Vargas, Aebischer,
  Keller, Rieder, Amenda, Jaquez, Itten. Alle 8 ⇒ Routine löschen (nur via claude.ai/code/routines).
- **`npm run data:schedule` GESPERRT**, solange fixturedownload Spiel 29/31 alte Zeiten führt (sonst Patch 00:30Z/03:00Z weg).
- **Shot-Tooling:** Desktop 1320px `WM26_SHOT_DIR=/tmp/x npm run dev`; Mobile `WM26_SHOT_W=390 WM26_SHOT_DIR=/tmp/x npm run dev`
  (≤680px-Layout, `m-*.png`). Isoliertes userData, echte Tipps unberührt. Mobile-CSS am ENDE von components.css.
- Echte Tippdaten in `~/Library/Application Support/WM26 Tipp/` — nie verändern (Seed liest nur). Port 5173 fremd → 5174+.
- **App bleibt „WM26 Tipp"** (Rename „TSCHUTTINI '26" verworfen, macOS-26-Dock-Problem).

## Nächstes

- Warten, ob die anderen Dodo importieren und der iPhone-Reload bei allen zieht; bei Restbefunden nachfixen → `publish:web`.
- **Bracket-Minimap verworfen** (Kompaktmodus deckt den Nutzen ab — Adrian-Entscheid 16.06.).
