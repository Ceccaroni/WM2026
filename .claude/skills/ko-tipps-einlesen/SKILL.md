---
name: ko-tipps-einlesen
description: KO-Runden-Tipps der WM26-Tippgruppe einsammeln, chirurgisch in den Store mergen, Claude mittippen lassen und via GitHub Actions deployen. Nutzen, wenn die Tipps einer neuen K.-o.-Runde eingebunden werden sollen — Sechzehntel (fromR32/73-88), Achtel (fromR16/89-96), VIERTELFINALE (fromQF/97-100), Halbfinale (fromSF/101-102). Deckt die bekannten Fallstricke ab (zwei Stores, verlorene Kategorien, Fairness, kaputter Legacy-Pages-Build).
---

# KO-Runden-Tipps einlesen (WM26 Tipp)

Erprobter Ablauf (Stand 04.07.26, fromR16). Nächste Runde: **fromQF (Viertelfinale, Spiele 97–100)**.
Kategorien: `fromR32`=1/16 (73–88) · `fromR16`=1/8 (89–96) · `fromQF`=VF (97–100) · `fromSF`=HF (101–102). Finale/Platz 3 (103/104) haben **keine** eigene Kategorie (nur `main`).

## Die 5 Fallstricke (warum es beim ersten Mal weh tat)

1. **Zwei Stores.** Adrian tippt/importiert in der Safari-Web-App (PWA/IndexedDB) — das erreicht den Deploy-Store NICHT. Der Deploy baut aus `~/Library/Application Support/WM26 Tipp/wm26-store.json`. Einsammeln = **je Profil aus der Web-App exportieren** → `~/Downloads/<Name>-WM-Tipps.txt`.
2. **Exporte verlieren Kategorien.** Ein PWA-Export kann plötzlich eine ältere Kategorie NICHT mehr enthalten (real passiert: Lisa ohne fromR32). **Niemals die ganze Datei importieren** — nur die neue Runde einsetzen. Das Merge-Script erzwingt das per Hash-Guard.
3. **Legacy-Pages-Build ist tot.** Der klassische branch-basierte Build hängt/errored („Page build failed." bzw. endlos `building`). Deploy läuft jetzt über **GitHub Actions** (`build_type=workflow`); nach dem gh-pages-Push muss der Workflow **manuell** angestoßen werden.
4. **Claude-Fairness.** Claude nur für Spiele tippen, die noch NICHT angepfiffen sind (ESPN-Status prüfen). Läuft eins schon → blind (nur Vorab-Quoten, Live-Stand ignorieren) oder weglassen, offen ausweisen.
5. **Tip-Objekte sauber halten.** Nur `h`/`a`/`adv`. Recherche-Agenten schleppen gern ein `favorit`-Feld mit — das gehört NICHT ins Tip-Objekt (Script bereinigt es via `clean_tip`).

## Ablauf

### 1 — Paarungen + Anpfiff + Status von ESPN holen (lokaler results-Store ist oft veraltet!)
```bash
curl -s "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=YYYYMMDD-YYYYMMDD&limit=200"
```
Events per **Anpfiffzeit** auf die Spielnummer mappen (die Zeiten stehen in `resources/data/schedule.json`, Feld `dateUtc`, für die Ziel-Runde). Status `STATUS_SCHEDULED` = noch nicht angepfiffen. Jetzt-Zeit: `date -u` + `TZ=Europe/Zurich date`.

### 2 — Menschen-Exporte prüfen
Frische `*-WM-Tipps.txt` in `~/Downloads/` (heutiges Datum). Inhalt ist JSON (ExchangeFileV1). Prüfen: enthält `entries.<KIND>.tips` die erwarteten Spiele? Welche Profile fehlen? (Martin/Dodo hatten teils keine Exporte.)

### 3 — Claude mittippen (falls gewünscht)
Recherche-Agent (general-purpose, WebSearch) auf die Paarungen ansetzen: aktuelle 1X2-Quoten + Form, pro Spiel ein Tipp im JSON-Format. Stil: knappe Fußball-Resultate (Favorit 2:1/1:0; 2:0 bei klarem Unterschied; Remis+`adv` nur bei Pick-'em). **Nur nicht-angepfiffene Spiele**; laufende blind. Ergebnis als JSON `{"97":{"h":1,"a":2},...}` in eine Datei (z. B. Scratchpad) schreiben. → Memory [[projekt-claude-tippt-mit]].

### 4 — Chirurgisch mergen (App vorher beenden!)
```bash
# Dry-run zeigt den Plan (welche Datei je Profil, wie viele Tipps):
python3 .claude/skills/ko-tipps-einlesen/merge-ko-tips.py --kind fromQF
# mit Claude-Tipps und wirklich schreiben:
python3 .claude/skills/ko-tipps-einlesen/merge-ko-tips.py --kind fromQF --claude /tmp/claude-qf.json --apply
```
Das Script: nimmt pro Profil-ID die NEUESTE Export-Datei mit der Ziel-Kategorie, setzt **nur** `entries[id][KIND]`, beweist per SHA256, dass alle anderen Kategorien byte-genau bleiben, macht Backup + lsof-Guard + atomic write. Danach im Store gegenprüfen (Zähler je Kategorie).

### 5 — Deployen (Build → gh-pages → **Actions dispatchen**)
```bash
npm run build:web        # baut Seed (neuer seedVersion) + Bundle
# Seed prüfen: src/web/seed-state.json -> seedVersion neu, alle KIND-Profile vorhanden
npm run deploy:web       # force-push nach gh-pages  (Legacy-Build ist AUS)
gh workflow run deploy-pages.yml --ref main   # << WICHTIG: sonst passiert nichts
```
`mergeSeed`-Wächter: neuer `seedVersion` nur, wenn der Store die volle Wahrheit ist (ist er nach dem Merge). Kein Pinning nötig.

### 6 — Live verifizieren (nicht nur Push!)
```bash
RUN=$(gh run list --workflow=deploy-pages.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch $RUN        # bis success
# neuen Entry-Hash aus dist-web/index.html holen, dann:
curl -s "https://ceccaroni.github.io/WM2026/?cb=$(date +%s%N)" | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js'
# muss der NEUE Hash sein; im Seed-Chunk seedVersion + KIND greppen (dist-web lokal: grep -l <seedVersion> dist-web/assets/*.js)
```
Actions-Run dauert ~30 s. **Erst „live" melden, wenn das HTML den neuen Bundle-Hash referenziert.**

### 7 — Gruppe zum harten Neuladen auffordern
Mac-Web-App **⌘R 2×** (bzw. ⌘Q + neu); iPhone Safari-URL neu öffnen. Sonst greift `mergeSeed` nicht und die Runde zählt bei ihnen nicht. → Memory [[projekt-pwa-update-ios]].

## Anzeige (schon gelöst ab 04.07.)
Heute/Live/Spielplan/Vergleich zeigen für KO-Spiele die **Runden-Kategorie** (via `mergeDisplayTips`/`useMyTipsMerged` in `lib/lateEntry.ts` + `store.ts`) — nicht mehr den `main`-Durchtipp. `fromQF` ist in `LATE_ENTRIES` bereits enthalten, also **kein neuer Anzeige-Fix nötig**. Rest offen: der Weiterkommer-Bonus (`advance`) in LiveRow kommt für KO-Spiele noch aus der main-Breakdown.

## Wächter
- App/Dev **beenden** vor jedem Store-Schreiben (`lsof`-Guard im Script).
- `npm run data:schedule` bleibt gesperrt (fixturedownload führt Spiel 29/31 mit alten Zeiten).
- Repo MUSS `Ceccaroni/WM2026` bleiben (`base '/WM2026/'`). `gh`-Token braucht `workflow`-Scope (vorhanden).
- Offener Feinschliff: `deploy-web.mjs` könnte den `gh workflow run` am Ende selbst anstoßen (dann entfällt Schritt 5 Zeile 4).
