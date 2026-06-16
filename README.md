# WM26 Tipp

Die WM-2026-Durchtipp-App im Panini-Stil für macOS.

**Doku-Struktur:** [BRIEFING.md](BRIEFING.md) (Was & Warum, Entscheidungen) · [STATUS.md](STATUS.md) (aktueller Stand, Übergabe) · [CLAUDE.md](CLAUDE.md) (Projektkontext & Konventionen) · `research/` (verifizierte Recherche-Dossiers)

## Entwicklung

```bash
npm install
npm run dev          # App im Dev-Modus (Hot Reload)
npm run typecheck    # TypeScript prüfen
npm run data:schedule  # resources/data/schedule.json aus dem Quell-Feed neu bauen
```

## Release (.dmg, ohne Apple Developer Account)

```bash
npm run dist         # Apple Silicon (arm64) → dist/WM26 Tipp-<version>-arm64.dmg
npm run dist:intel   # Intel (x64), falls jemand noch einen Intel-Mac hat
```

Die App wird **ad-hoc signiert** (`identity: "-"` in `electron-builder.yml`) — das ist Pflicht, sonst meldet macOS die App nach dem Download als „beschädigt".

## Updates verteilen (OTA via github.com/Ceccaroni/wm26-tipp-updates)

```bash
npm run publish:update -- --notes "…" [--dmg]
```

- **Nur Daten geändert** (resources/data): `publish:update` — alle Apps ab 1.4.0 ziehen das Daten-Release automatisch (Poll max. 6 h).
- **Code geändert:** Version in package.json bumpen → `npm run dist` + `dist:intel` → `publish:update --notes "…" --dmg` — alle sehen den Update-Banner; der ewige Direktlink `…/releases/latest/download/WM26-Tipp-arm64.dmg` zeigt immer auf die neueste Version.

## Anleitung für Empfänger (einmalig pro App)

Seit macOS 15 reicht Rechtsklick → Öffnen **nicht** mehr:

1. .dmg öffnen, „WM26 Tipp" in den Programme-Ordner ziehen.
2. App starten → Warndialog mit **„Fertig"** schließen (nicht „In den Papierkorb"!).
3. **Systemeinstellungen → Datenschutz & Sicherheit** → ganz unten bei „WM26 Tipp wurde blockiert" auf **„Dennoch öffnen"** klicken.
4. Bestätigen (auf macOS 26 mit Admin-Passwort). Ab jetzt startet die App normal.

## Struktur

```
resources/data/   Stammdaten: teams, stadiums, schedule (104 Spiele), bracket (KO + Dritten-Slots)
scripts/          build-schedule.mjs: Quell-Feed → schedule.json (mit Validierung)
src/main          Electron-Main (Fenster, Store-IPC, Results-Fetcher)
src/preload       IPC-Brücke
src/renderer      React-UI: screens/ (8 Rubriken), lib/ (Turnierlogik, Wertung, API), styles/ (Designsystem)
```

Meilensteine M1–M5 und alle offenen Entscheidungen: BRIEFING.md §10/§11.
