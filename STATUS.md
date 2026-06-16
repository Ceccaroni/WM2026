# STATUS — Übergabe (kompakt!)

> Bei Sessionstart lesen — das genügt. Nach jedem Arbeitsblock NEU SCHREIBEN, nicht anwachsen
> lassen (hartes Limit: ~60 Zeilen): Erledigtes als Block oben in HISTORIE.md einfügen, hier nur
> Stand / Wächter / Nächstes. Rollen aller Dokumente: CLAUDE.md.

## Stand: 16. Juni 2026

**v1.8.11 ist live** (Daten v28); installiert, Deutsch-Menü & Live-Pitch von Adrian am Gerät bestätigt.

**PWA fürs iPhone — Phase 1 gebaut & jetzt LIVE auf GitHub Pages** (Details: HISTORIE, 2 oberste Blöcke).
Renderer läuft als statische PWA über eine **Web-Bridge** (`src/web/`, spiegelt `window.wm26`) — 0 Renderer-Umbau,
kein Backend (ESPN CORS-offen). **Öffentlich erreichbar: https://ceccaroni.github.io/WM2026/** (HTTPS).
Repo `Ceccaroni/WM2026` (public, Free-Plan → Pages nur public). Von Adrian iterativ bestätigt: Ton (Anpfiff),
Tipps der ganzen Gruppe (Seed), Burger-Navigation, Stadien & responsive Grids. Lokaler Test weiterhin:
`npm run preview:web`. **Artefakt-Verifikation grün (HTTP 200 für Seite/JS/CSS/Manifest/SW/Icons) — aber:**

## 🔴 Offene Fäden (PWA Phase 1 am ECHTEN iPhone abschließen)

- **Am iPhone öffnen → „Zum Home-Bildschirm" → testen:** Install, Offline (SW erst über https aktiv), Layout
  ALLER Screens im Hochformat (noch seitlich schiebbar? Match-Zeilen-Umbruch ok?). Reine URL-Erreichbarkeit ≠ Nutzerfall.
- **Spielerkarten-Flip-Spiegelung (Safari):** Fix (Front `transform:rotateY(0) translateZ(0)`) **unverifiziert**. Falls
  Rückseite durchscheint → Ursache vermutl. Foil-Effekt auf der Front: `HoloSticker`/`FoilStickerCard`-CSS auf
  `filter`/`mask`/`overflow` prüfen, das `preserve-3d` flachdrückt.
- **28.06.:** alle tippen zusätzlich `fromR32` (Gold-Banner); Claude-Profil `Claude.wm26tipp` mit fromR32 nachliefern.
- **TUN-Trainer volatil:** Kebaier interim in coaches.json; bei Wechsel anpassen (+ `publish:update`, kein Rebuild).

## ⚠️ Wächter — nicht übersehen

- **Web-Update online bringen: `npm run publish:web`** (= `build:web` + `deploy:web`). Backt aktuellen Mac-Store als
  Seed, baut `dist-web/`, force-pusht ihn als **Orphan in `gh-pages`** (`scripts/deploy-web.mjs`, setzt `.nojekyll`).
  CI baut NICHT (Seed liegt nur lokal). `gh`-Account = **Ceccaroni**. Repo-Name MUSS `WM2026` bleiben (Assets sind
  absolut über `base '/WM2026/'` → anderer Name bricht die Pfade, sonst `VITE_BASE` mitziehen).
- **PWA-Bridge spiegelt `Wm26Api`:** neue `window.wm26`-Methode im Preload (`src/preload/index.ts`) MUSS `src/web/bridge.ts`
  mitziehen, sonst bricht die PWA. Polling/Parse in `espn-poll.ts` nutzt `src/shared/results.ts`.
- **`seed-state.json` ist jetzt gitignored** (generiert) — nie im Source-Branch committen; entsteht bei jedem `build:web`.
- **Datenschutz Seed:** JETZT öffentlich live — Namen+Tipps der Gruppe unter der URL abrufbar (Adrian informiert, ok).
- **Versionsnummern NIE wiederverwenden:** 1.8.3 verbrannt; 1.8.4–1.8.11 vergeben. Nächste frische ≥ 1.8.12.
- **coaches.json / OTA-Trainer aktiv (≥1.8.9):** Trainerwechsel = coaches.json ändern + `publish:update` (OHNE `--dmg`).
  Cloud-Routine „Trainerwechsel" tgl. 08:00 — Baseline im Routine-Prompt bei coaches.json-Änderung nachziehen.
- **Cloud-Routine „Nati-Spielerfotos" tgl. 09:00:** Funde lokal einpflegen. Offen: Manzambi, Vargas, Aebischer, Keller,
  Rieder, Amenda, Jaquez, Itten. Alle 8 ⇒ Routine löschen.
- **Publish-Mechanik (Electron-OTA):** `publish:update -- --notes '…' --dmg`; `--notes` nur in EINFACHEN Quotes. `--dmg`
  globt `dist/*.dmg` mit Versions-Substring ⇒ vor Publish genau EINE Ziel-.dmg dieser Version in `dist/`. dataVersion +1.
- **`npm run data:schedule` GESPERRT**, solange fixturedownload Spiel 29/31 alte Zeiten führt (sonst Patch 00:30Z/03:00Z weg).
- **Shot-Hook** (Electron): Shot 28 `ko-hilfe.png`; Seed enthält Gruppen B+E. Nur Screenshot-userData, nie echte Tipps.
- **Tokens:** Spacing 1/2/3/4/6/8; Gold = Belohnung, `--panini-blue` Hinweis/Favorit, `--pitch-green` Quali/Rasen.
- Echte Tippdaten in `~/Library/Application Support/WM26 Tipp/` — nie verändern (Seed liest nur). Port 5173 fremd → 5174+.
- **App bleibt „WM26 Tipp"** (Rename „TSCHUTTINI '26" verworfen, macOS-26-Dock-Problem).

## Nächstes

- **PWA Phase 1 abschließen:** Adrian testet am iPhone (Install/Offline/Hochformat-Sichtung) + Flip-Bug → bei Fundstellen nachfixen, dann `npm run publish:web`.
- Danach offen: PWA-Feinschliff (Web-Badging, evtl. News über Proxy), restliche Feature-Ideen (Memory `projekt-feature-ideen`).
- **Bracket-Minimap verworfen** (Kompaktmodus deckt den Nutzen schon ab — Adrian-Entscheid 16.06.).
