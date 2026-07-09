# STATUS — Übergabe (kompakt!)

> Bei Sessionstart lesen — das genügt. Nach jedem Arbeitsblock NEU SCHREIBEN, nicht anwachsen
> lassen (hartes Limit: ~60 Zeilen): Erledigtes als Block oben in HISTORIE.md einfügen, hier nur
> Stand / Wächter / Nächstes. Rollen aller Dokumente: CLAUDE.md.

## Stand: 9. Juli 2026

**PWA live: https://ceccaroni.github.io/WM2026/** — Deploy über **GitHub Actions**, Seed `2026-07-09T17:32:48Z`, Bundle `index-DEJrj88L.js`. **Live verifiziert** (HTML referenziert neuen Hash, Seed-Chunk trägt seedVersion). **Viertelfinale läuft** (Spiel 97 FRA–MAR heute 22:00 Zürich).

Heute: **Viertelfinaltipps (`fromQF` = 97–100) ALLER 8 Profile eingebunden + deployt** (via Projektskill `ko-tipps-einlesen`). 4 frische PWA-Exporte (Adrian/Benjamin/Franzipani/Leonor), Dodo manuell nachgereicht (Minimal-Export gebaut), Lisa+Martin später nachgeliefert → **erstmals kein Nachzügler**. Claude fair generiert (alle 4 VF ungespielt): 97 FRA 2:1, 98 ESP 1:0, 99 ENG 1:2, 100 ARG 2:0. **adv-Artefakt** bei Adrians Spiel 99 (3:1 mit verwaistem `adv:away`) bereinigt + `merge-ko-tips.py`-`clean_tip` gehärtet (adv nur bei Remis). Details: HISTORIE.

## 🔴 Offene Fäden (Priorität oben)

- **Alle müssen PWA hart neu laden** (Mac ⌘R 2× / iPhone Safari-URL neu) — sonst greift `mergeSeed` nicht und die VF-Runde zählt bei ihnen nicht. Deploy ist live-verifiziert; Gruppe noch auffordern (siehe Nächstes 2).
- **Rest KO-Anzeige:** der Weiterkommer-Bonus (`advance`) in LiveRow kommt für KO-Spiele weiter aus der main-Breakdown, nicht der Runden-Breakdown (Heute/Live `bonusPts`). Bewusst nicht gefixt — bei Bedarf fromQF-Breakdown durchreichen.
- **Deploy-Mechanik (Actions, bewährt):** `deploy:web` pusht nur gh-pages; danach **`gh workflow run deploy-pages.yml --ref main`** + `gh run watch`. Noch NICHT in `deploy-web.mjs` automatisiert — Feinschliff offen. Legacy-Build ist tot/deaktiviert.
- **ALLES VOM 28.06. + 04.07. UNCOMMITTED** (Renderer-Runden-Modell, `espn-poll.ts`, Shot-Hook, Tool-Scripts, KO-Anzeige-Fix). Auf PWA live, aber nicht committet, nicht in einem `.dmg`. Zusätzlich untracked: `.claude/skills/ko-tipps-einlesen/` (inkl. heute gehärtetem Script). Commit-Entscheidung offen.
- **`bridge.ts` Desktop-Export → direkter Download** (statt Mac-Teilen-Sheet); vereinfacht künftiges Einsammeln. Zurückgestellt.
- **Dodo macht keinen eigenen PWA-Export** (Android/Teilen-Bug, echtes Gerät weiter offen) → Adrian reicht Dodos Tipps mündlich nach, ich baue einen Minimal-Export mit Dodos Profil-ID. Für fromSF wieder so.
- **Martin** weiter ohne `fromR32`/`fromR16` (nur main+fromQF), **Dodo** ohne `fromR16` (hat fromR32+fromQF) — nur relevant, falls jemand alte Runden rückwirkend nachliefern will; für die laufende Wertung egal.

## ⚠️ Wächter — nicht übersehen

- **🩹 Punkte-Beschwerde? ZUERST den PWA-Stand verdächtigen, nicht die Wertung.** Wertung (`scoring.ts`, 4/3/2) mehrfach verifiziert; SW cached ESPN nie; Live-Bundle selbstheilend. „Halbe/zu wenig Punkte" war bisher IMMER veralteter Cache/altes Bundle → Fix = hartes Neuladen. Memory [[projekt-punkte-beschwerde-pwa-stand]].
- **🪤 Adrian arbeitet am Mac in der Safari-Web-App** (Dock „Tschuttini"), NICHT Electron. Eigene IndexedDB, getrennt vom JSON-Store. **Tippen/Importieren dort erreicht den Deploy-Store NICHT** (der baut aus `…/WM26 Tipp/wm26-store.json`). Einsammeln = je Profil aus der Web-App exportieren (`*-WM-Tipps.txt`) → in den Store mergen. Memory [[projekt-pwa-zwei-stores]].
- **🔧 Tipps chirurgisch mergen — IMMER via Skill `ko-tipps-einlesen` + `merge-ko-tips.py`.** Exporte können Kategorien VERLIEREN (Lisa hatte mal kein fromR32). Darum NIE die ganze Datei importieren — nur die Ziel-Kategorie je Profil-ID setzen, Nicht-Ziel-Kategorien per SHA256 vorher/nachher gegenprüfen. Script macht Backup + `lsof`-Guard + atomic write; `clean_tip` behält nur `h/a` + `adv` (letzteres nur bei Remis).
- **⚖️ Claude-Fairness:** Claude nur für Spiele tippen, die noch NICHT angepfiffen sind (ESPN-Status prüfen). Läuft eins schon → blind (nur Vorab-Quoten) oder weglassen, offen ausweisen. Memory [[projekt-claude-tippt-mit]].
- **`mergeSeed` (store-web.ts) ersetzt bei NEUEM seedVersion die entries jedes Seed-Profils komplett.** Neuer-Version-Deploy NUR, wenn der Store die volle Wahrheit ist. Sonst gepinnt (`SEED_VERSION=<live-Wert>`) → kein mergeSeed.
- **PWA-Reload:** neuer Deploy greift erst nach hartem Neuladen. SW cached App-Shell; ESPN-API NICHT (nur Bilder `CacheFirst`).
- **Versionsnummern NIE wiederverwenden:** ≤1.8.11 vergeben, 1.8.3 verbrannt. Nächste frische ≥ 1.8.12.
- **Tool-Scripts:** `npx tsx --tsconfig scripts/tsconfig.tools.json scripts/<x>.ts`. `standings.ts` (read-only) rechnet die Rangliste, `r32-pairings.ts` die Paarungen (lokaler results-Store ggf. veraltet → für Live-Paarungen ESPN-Scoreboard direkt).
- **Trainerwechsel = 4 Schritte** (coaches.json → `publish:update` OHNE `--dmg` → `publish:web` → Cloud-Routine `trig_01F2EfZDT3kCTKLPaB6dYiKL`).
- **Cloud-Routine „Nati-Spielerfotos" tgl. 09:00** (Stand nicht neu geprüft): offen ggf. Manzambi, Vargas, Aebischer, Keller, Rieder, Amenda, Jaquez, Itten. Alle da ⇒ Routine löschen.
- **`npm run data:schedule` GESPERRT**, solange fixturedownload Spiel 29/31 alte Zeiten führt.
- **Echte Tippdaten** in `~/Library/Application Support/WM26 Tipp/`. `gh`=**Ceccaroni**, Repo MUSS `WM2026` bleiben (`base '/WM2026/'`).
- **Shot-Tooling:** Desktop `WM26_SHOT_DIR=/tmp/x npm run dev`; Mobile `WM26_SHOT_W=390 …`. Navigiert per Sidebar-LABEL.

## Nächstes

1. **Halbfinal-Tipps (`fromSF`, 101–102) einlesen → Skill `ko-tipps-einlesen`**, sobald die VF durch sind (HF: 14./15.07.). Gleicher Ablauf. Für Dodo wieder Minimal-Export bauen, Claude fair (Anpfiff prüfen).
2. **Gruppe zum harten Neuladen auffordern** (PWA ⌘R 2× / iPhone neu) — bringt die VF-Tipps in ihre Wertung.
3. `deploy-web.mjs` um automatischen `gh workflow run` ergänzen; Commit-Entscheidung für die 28.06.+04.07.+09.07.-Arbeit; ggf. Mac-`.dmg` ≥1.8.12.
