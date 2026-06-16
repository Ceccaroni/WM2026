# WM26 Tipp — Projektkontext

WM-2026-Durchtipp-App für macOS (Electron + React 19 + TS), Panini-Album-Look, Verteilung als ad-hoc-signierte .dmg ohne Apple Developer Account. UI-Sprache: Deutsch (de-CH-Publikum, Anstoßzeiten in MESZ via `Europe/Zurich`).

> Hinweis: Eine Umbenennung in „TSCHUTTINI '26" wurde am 14.06.26 versucht und wieder verworfen — eine umbenannte App ist für macOS eine neue Datei, das alte Dock-Icon öffnet die alte App, und das automatische Dock-Umbiegen scheiterte auf macOS 26. Nicht erneut versuchen, ohne das Dock-Problem zu lösen. Details: HISTORIE.md.

## Dokumentationsstruktur (Übergabe-Ordnung)

| Dokument | Rolle | Pflege |
|---|---|---|
| `BRIEFING.md` | Was & Warum: Vision, Funktionsumfang, Turnierlogik, Entscheidungen (§11), Meilensteine M1–M5 | stabil; nur bei neuen Entscheidungen ergänzen |
| `STATUS.md` | **Übergabe-Dokument, bewusst kompakt (~60 Zeilen)**: Stand, Wächter, was als Nächstes | **nach jedem Arbeitsblock NEU schreiben, nie anwachsen lassen** |
| `HISTORIE.md` | Arbeitslog: alle erledigten Blöcke mit Verifikations-/Quellendetails, neueste oben | append-only; Erledigtes aus STATUS.md hierhin verschieben |
| `README.md` | Wie bedienen: Dev-Kommandos, Release/OTA-Updates, Empfänger-Anleitung | bei Bedarf |
| `research/` | Verifizierte Recherche-Dossiers (Daten, Tech, API, Design) mit Quellen | abgeschlossen, nicht editieren |

Bei Sessionstart: NUR `STATUS.md` lesen (kompakt, reicht), dann loslegen — BRIEFING/HISTORIE/research erst bei konkretem Bedarf gezielt nachschlagen. Vor Sessionende: erledigte Blöcke oben in `HISTORIE.md` einfügen und `STATUS.md` kompakt neu schreiben.

## Kommandos

- `npm run dev` — App starten (Hot Reload)
- `npm run typecheck` — beide TS-Projekte prüfen (vor jedem Abschluss laufen lassen)
- `npm run data:schedule` — schedule.json aus Quell-Feed neu bauen (validiert gegen bracket.json)
- `npm run dist` / `dist:intel` — .dmg arm64 / x64
- `WM26_SHOT_DIR=/tmp/shots npm run dev` — automatisierte UI-Screenshots (isoliertes userData, echte Tipps unberührt); zum visuellen Verifizieren von UI-Änderungen nutzen

## Konventionen

- Stammdaten nur aus `resources/data/*.json`; nie hartkodieren. Teams über FIFA-Trigramm (`GER`), Flaggen über flag-icons-Codes (`de`, `gb-eng`, `gb-sct`).
- Geteilte Typen in `src/shared/types.ts` (Main + Preload + Renderer); Renderer importiert via `lib/types.ts`-Re-Export.
- KO-Platzhalter-Notation: `1A`/`2A` (Gruppensieger/-zweiter), `3ABCDF` (Dritter aus …), `W73`/`L101` (Sieger/Verlierer Spiel n). Auflösung in `lib/data.ts → slotInfo()`.
- Designsystem strikt über Tokens in `styles/tokens.css` (Panini-Palette, Anton/Oswald/Inter); Gold-Foil nur als Belohnung. Vollständiges Designsystem: `research/design.md`.
- Persistenz: eigener Atomic-JSON-Store im Main (`src/main/store.ts`), debounced, tmp+rename. Kein electron-store.
- Punktesystem und alle Produktentscheidungen: BRIEFING.md §5/§11 — nicht neu verhandeln.
