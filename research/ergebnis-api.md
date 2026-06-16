# Recherche: Kostenlose Ergebnis-APIs für die FIFA WM 2026 (Tippspiel-App)

Stand: 11. Juni 2026 (Eröffnungsspieltag). Alle als „verifiziert" markierten Aussagen wurden
heute durch echte HTTP-Abrufe geprüft.

## TL;DR / Empfehlung

| Rang | API | Key? | Live? | Verifiziert | Bewertung |
|---|---|---|---|---|---|
| **1 (Primär)** | ESPN inoffizielle JSON-API | **nein** | ja (inkl. Spielminute) | **ja, heute** | Beste Datenqualität, alle 104 WM-Spiele, klare Status-/Elfmeter-Abbildung |
| **2 (Fallback)** | fixturedownload.com | nein | nein (Endstände, verzögert) | **ja, heute** | Perfekt fürs Mapping (offizielle FIFA-Spielnummern 1–104), Endstände nach Abpfiff |
| **3 (Fallback)** | OpenLigaDB | nein | teilweise | **ja, heute** | Community-gepflegt → Aktualität nicht garantiert |
| 4 | football-data.org | ja (gratis) | nein (Free Tier verzögert) | ja (403 ohne Key) | Solide, aber Key + nur verzögerte Scores im Free Tier |
| 5 | API-Football (api-sports.io) | ja (gratis) | ja | nur Doku | 100 Req/Tag, Saison-Restriktionen im Free Plan möglich |
| – | FotMob (inoffiziell) | – | – | **ja: funktioniert NICHT mehr** | `/api/matches` liefert 404/HTML, Token-Pflicht → ungeeignet |

---

## 1. ESPN inoffizielle JSON-API ⭐ (Primär-Empfehlung)

### Verifizierte Endpoints (alle ohne Key, HTTP 200)

```
# Scoreboard heute (Standard): ~20 KB
https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard

# Bestimmter Tag:
https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260612

# Ganzes Turnier (verifiziert: liefert alle 104 Spiele, ~760 KB):
https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200

# Detail zu einem Spiel (Boxscore, Aufstellungen, Tabellen, ~90 KB):
https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=760415
```

- Kein API-Key, keine Registrierung, kein Auth-Header nötig (heute verifiziert).
- `http://` wird auf `https://` umgeleitet → direkt HTTPS verwenden.
- Liga-Slug `fifa.world`, Saison `2026`, `season.slug: "group-stage"`.

### Echtes Beispiel vom heutigen Eröffnungsspiel (gekürzt)

Abruf heute, 11.06.2026, vor Anpfiff:

```json
{
  "leagues": [{ "name": "FIFA World Cup", "slug": "fifa.world", "season": { "year": 2026 } }],
  "events": [
    {
      "id": "760415",
      "uid": "s:600~l:606~e:760415",
      "date": "2026-06-11T19:00Z",
      "name": "South Africa at Mexico",
      "shortName": "RSA @ MEX",
      "season": { "year": 2026, "slug": "group-stage" },
      "competitions": [
        {
          "id": "760415",
          "status": {
            "clock": 0.0,
            "displayClock": "0'",
            "type": {
              "id": "1",
              "name": "STATUS_SCHEDULED",
              "state": "pre",
              "completed": false,
              "detail": "Thu, June 11th at 3:00 PM EDT"
            }
          },
          "venue": { "fullName": "Estadio Banorte", "address": { "city": "Mexico City", "country": "Mexico" } },
          "competitors": [
            {
              "id": "203", "homeAway": "home", "winner": false, "score": "0",
              "team": { "id": "203", "abbreviation": "MEX", "displayName": "Mexico",
                        "logo": "https://a.espncdn.com/i/teamlogos/countries/500/mex.png" }
            },
            {
              "id": "467", "homeAway": "away", "winner": false, "score": "0",
              "team": { "id": "467", "abbreviation": "RSA", "displayName": "South Africa" }
            }
          ]
        }
      ]
    }
  ]
}
```

Zweites Spiel heute (Event `760414`): Südkorea – Tschechien, `2026-06-12T02:00Z`.

### Wichtige Felder

| Feld | Bedeutung |
|---|---|
| `events[].id` | eindeutige Spiel-ID (stabil, z. B. `760415`) |
| `events[].date` | Anstoßzeit UTC, ISO-Format `2026-06-11T19:00Z` |
| `competitions[0].status.type.state` | `pre` / `in` / `post` ← **robusteste Statusquelle** |
| `status.type.name` / `id` | feiner Status (s. Tabelle unten) |
| `status.type.completed` | `true` sobald Spiel gewertet |
| `status.displayClock`, `status.period` | Spielminute (`"57'"`), Halbzeit-Nr. (1, 2; 3/4 = Verlängerung, 5 = Elfmeterschießen) |
| `competitors[].homeAway` | `home` / `away` |
| `competitors[].score` | Tore als **String** (inkl. Verlängerung, **ohne** Elfmeterschießen) |
| `competitors[].shootoutScore` | Elfmeter-Treffer (Zahl, nur vorhanden bei Elfmeterschießen) |
| `competitors[].winner` | `true` beim Sieger (auch nach Elfmeterschießen gesetzt) |
| `competitors[].team.abbreviation` | FIFA-Kürzel (`MEX`, `RSA`, …) – gut fürs Mapping |

### Status-Abbildung (Halbzeit / Endstand / Verlängerung / Elfmeterschießen)

Heute live verifizierte Werte:

| `type.id` | `type.name` | `state` | Bedeutung | Verifiziert |
|---|---|---|---|---|
| 1 | `STATUS_SCHEDULED` | `pre` | angesetzt | ✅ heute (Eröffnungsspiel) |
| 2 | `STATUS_IN_PROGRESS` | `in` | läuft (Minute in `displayClock`) | dokumentiert¹ |
| 23 | `STATUS_HALFTIME` | `in` | Halbzeitpause | dokumentiert¹ |
| 28 | `STATUS_FULL_TIME` | `post` | Endstand nach 90 Min. | ✅ heute (andere Ligen) |
| 45 | `STATUS_FINAL_AET` | `post` | Endstand nach Verlängerung | ✅ (WM 2018, Kroatien–England: `"detail": "AET"`) |
| 47 | `STATUS_FINAL_PEN` | `post` | Entscheidung im Elfmeterschießen | ✅ heute geprüft am WM-Finale 2022 |
| 6 / 5 / 48 | `POSTPONED` / `CANCELED` / `ABANDONED` | `post` | Sonderfälle | dokumentiert¹ |

¹ Vor Anpfiff des ersten WM-Spiels nicht live beobachtbar; aus Community-Doku bekannt.
**Empfehlung:** App-Logik primär auf `state` (`pre`/`in`/`post`) + `completed` stützen, `type.name` nur
für Detailanzeige – das ist gegen ID-Änderungen robust.

Verifiziertes Beispiel Elfmeterschießen (WM-Finale 2022, Abruf heute):

```json
"status": { "clock": 7200.0, "displayClock": "120'", "period": 5,
            "type": { "id": "47", "name": "STATUS_FINAL_PEN", "state": "post",
                      "completed": true, "detail": "FT-Pens" } },
"competitors": [
  { "homeAway": "home", "team": "Argentina", "score": "3", "shootoutScore": 4, "winner": true },
  { "homeAway": "away", "team": "France",    "score": "3", "shootoutScore": 2, "winner": false }
]
```

→ Regulärer Spielstand und Verlängerungstore stehen in `score` (3:3), das Elfmeterschießen separat
in `shootoutScore` (4:2), Turniersieger über `winner`.

### Mapping auf den eigenen Spielplan

1. **Einmalig beim App-Start/Setup:** Range-Query `?dates=20260611-20260719&limit=200` ziehen
   (liefert verifiziert alle 104 Spiele) und jede ESPN-`event.id` per
   **Anstoßzeit (UTC, `date`) + Heim-/Auswärts-Kürzel (`team.abbreviation`)** dem eigenen
   Spielplan zuordnen. Mapping lokal persistieren (`eigene Spiel-Nr. → espnEventId`).
2. Ab dann **nur noch über die stabile `event.id`** matchen — robust gegen abweichende
   Teamnamen-Schreibweisen ("South Korea" vs. "Korea Republic" etc.).
3. Für K.o.-Spiele mit noch unbekannten Teams (Platzhalter) das Mapping über Datum + Stadion
   bzw. nach Gruppenphase einmal aktualisieren.
4. Achtung Zeitzonen: `date` ist UTC; späte Spiele in Nordamerika fallen lokal auf den Vortag
   (Beispiel verifiziert: USA – Paraguay `2026-06-13T01:00Z` erscheint im Scoreboard vom 12.06.).
   Daher beim Tages-Polling ggf. `?dates=<heute>-<morgen>` abfragen.

### Polling-Strategie (empfohlen)

- **Spielfenster bestimmen** aus dem eigenen Spielplan (Anstoß bis Anstoß + ~2,5 h; bei möglicher
  Verlängerung/Elfmeterschießen + ~3,5 h).
- **Während eines Spielfensters:** Tages-Scoreboard alle **60–120 s** abrufen (~20 KB pro Abruf).
  Ein einziger Request deckt alle parallelen Spiele ab.
- **Außerhalb von Spielfenstern:** 1 Abruf pro Stunde (oder gar keiner) zur Plan-/Absagen-Erkennung.
- Übergänge `pre → in → post` als Trigger für UI-Updates/Punkteberechnung nutzen;
  Endstand erst werten, wenn `status.type.completed == true`.
- `User-Agent` setzen, Backoff bei Fehlern (z. B. 2× Intervall nach Timeout), Antworten cachen.
- Bei 1 Abruf/Minute über 6 h Spielbetrieb: ~360 Requests/Tag — unkritisch.

### Risiken

- **Inoffiziell/undokumentiert:** ESPN kann Struktur oder Verfügbarkeit jederzeit ändern (in der
  Praxis seit >10 Jahren stabil; wird von vielen Open-Source-Projekten genutzt).
- Keine dokumentierten Rate-Limits → moderat bleiben (≥ 30 s Intervall).
- ToS-Grauzone; für eine private, lokale Tippspiel-App mit moderater Frequenz geringes Risiko.
- **Darum: Fallback einbauen (s. u.).**

---

## 2. football-data.org

**Heute verifiziert:** Ohne Key liefern `https://api.football-data.org/v4/competitions/WC` und
`.../competitions/WC/matches` **HTTP 403** („resource restricted … check your subscription").
→ **Ohne Registrierung/Key unbrauchbar.**

- Free Tier (laut Pricing-/Coverage-Seite, heute abgerufen): 12 Wettbewerbe inkl. **„Worldcup"**
  (Competition-Code `WC`, ID 2000), **10 Calls/Minute**, kostenloser API-Key nach Registrierung
  (Header `X-Auth-Token`).
- **Wermutstropfen:** Echte Live-Scores sind im Free Tier **nicht** enthalten — dafür gibt es den
  Bezahlplan „Free w/ Livescores" (12 €/Monat). Im Free Tier werden Ergebnisse verzögert
  aktualisiert.
- Saubere, dokumentierte Struktur (`score.fullTime/halfTime/extraTime/penalties`, `status:
  TIMED/IN_PLAY/PAUSED/FINISHED`), aber wegen Key-Pflicht + Live-Verzögerung nur 2. Wahl.

## 3. fixturedownload.com ⭐ (bester keyless Fallback für Endstände)

**Heute verifizierte URLs:**

```
JSON:  https://fixturedownload.com/feed/json/fifa-world-cup-2026     (HTTP 200, 104 Spiele)
CSV:   https://fixturedownload.com/download/fifa-world-cup-2026-UTC.csv  (HTTP 200)
```

Echter JSON-Auszug von heute (Spiel 1):

```json
{ "MatchNumber": 1, "RoundNumber": 1, "DateUtc": "2026-06-11 19:00:00Z",
  "Location": "Mexico City Stadium", "HomeTeam": "Mexico", "AwayTeam": "South Africa",
  "Group": "Group A", "HomeTeamScore": null, "AwayTeamScore": null, "Winner": "" }
```

- **Liefert Resultate, nicht nur den Spielplan** — am 2022-Feed verifiziert: dort sind
  `HomeTeamScore`/`AwayTeamScore` gefüllt und `Winner` gesetzt; beim Finale 2022 steht
  `3:3, "Winner": "Argentina"` → der `Winner` bildet auch Elfmeter-Sieger ab, aber das
  **Elfmeter-Ergebnis selbst fehlt**; AET wird nicht von 90-Minuten-Ergebnissen unterschieden.
- Kein Key, alle 104 Spiele, `MatchNumber` 1–104 = ideale Mapping-Referenz, Rundenstruktur
  verifiziert: Runde 1–3 = je 24 Gruppenspiele, dann 16/8/4/2 K.o.-Spiele + Spiel um Platz 3 + Finale.
- **Kein Live-Status/Halbzeitstand**; Scores erscheinen erst (etwas verzögert) nach Abpfiff.
- Polling: 1×/Stunde reicht völlig (statischer Feed hinter CDN).
- Team-Namensgebung beachten: „Korea Republic" (FIFA-Stil) vs. ESPN „South Korea".

## 4. OpenLigaDB (api.openligadb.de)

**Heute verifiziert — es gibt mehrere community-gepflegte WM-2026-Ligen:**

| `leagueShortcut` | leagueId | Name | Stand heute |
|---|---|---|---|
| `wm26` | 4897 | WM 2026 | 72 Gruppenspiele angelegt, gepflegt (lastChange 10.06.) |
| `wm2026` | 4923 | WM 2026 USA | 72 Spiele angelegt |
| `wm2026_xlife` | 4949 | FIFA World Cup 2026 | nur 6 Spiele → unbrauchbar |

```
https://api.openligadb.de/getmatchdata/wm26/2026          → 72 Spiele (HTTP 200, verifiziert)
https://api.openligadb.de/getlastchangedate/wm26/2026/1   → "2026-06-10T20:17:00.963" (verifiziert)
```

Struktur (verifiziert): `matchID`, `matchDateTimeUTC`, `team1/team2` (deutsche Namen: „Mexiko",
„Südafrika"), `matchIsFinished`, `matchResults[]` (Halbzeit-/Endstand mit `resultTypeID` 1/2),
`goals[]`. `getlastchangedate` erlaubt sehr effizientes Change-Polling.

**Bewertung:** Kein Key, CORS-frei, deutsche Teamnamen — aber **Community-Daten**: Ob Ergebnisse
während der WM zeitnah eingetragen werden, hängt von Freiwilligen ab; K.o.-Runde (Spiele 73–104)
ist noch nicht angelegt. Nur als Fallback/Quervergleich nutzen, dann `wm26` wählen.

## 5. API-Football / api-sports.io (dokumentierter Not-Fallback)

- Free Plan: **100 Requests/Tag** (Reset 00:00 UTC), API-Key nötig (Registrierung, keine
  Kreditkarte), Endpoints u. a. `fixtures?live=all`, `fixtures?league=1&season=2026` (Liga-ID 1 = World Cup).
- Antwortstruktur sehr vollständig: `fixture.status.short` (`NS/1H/HT/2H/ET/P/FT/AET/PEN`),
  `score.halftime/fulltime/extratime/penalty` — fachlich die sauberste Status-Abbildung.
- **Aber:** 100 Req/Tag erlauben nur ~1 Abruf alle 15 Min. bei 24 h, und der Free Plan hatte
  historisch **Saison-Beschränkungen** (ältere Saisons frei, aktuelle teils eingeschränkt) —
  vor Verlass darauf unbedingt mit eigenem Key gegen Saison 2026 testen. Pricing-Seite blockt
  automatisierte Abrufe (403), daher hier nicht final verifizierbar.
- Fazit: Nur als Not-Fallback, wenn ESPN ausfällt und man einen Key akzeptiert.

## 6. Weitere keyless Optionen

- **FotMob (inoffiziell):** `https://www.fotmob.com/api/matches?date=20260611` liefert heute
  verifiziert **404 + HTML** — FotMob verlangt inzwischen signierte Header (`x-mas`-Token) und
  blockt Scraper aktiv. **Ungeeignet.**
- **FIFA inoffizielle API (`api.fifa.com`):** existiert, ist aber undokumentiert, wechselt
  IDs/Struktur pro Turnier und blockt zeitweise nicht-Browser-Clients. ToS-Risiko höher als bei
  ESPN, Struktur sperrig → nicht empfohlen, wenn ESPN verfügbar ist.
- **Scorebat, TheSportsDB (Free):** Video-/Basisdaten, kein zuverlässiger Live-Spielstand im
  Gratiszugang → ungeeignet als Primärquelle.

---

## Empfohlene Gesamtarchitektur für die Tippspiel-App

1. **Primär: ESPN** — Tages-Scoreboard alle 60–120 s während Spielfenstern; Mapping einmalig
   über Range-Query auf `event.id`.
2. **Sekundär: fixturedownload.com** — 1×/Stunde Endstände abgleichen (Plausibilitätscheck +
   Lückenfüller über `MatchNumber` 1–104, falls ESPN klemmt). Kein Key, sehr stabil.
3. **Tertiär (optional): OpenLigaDB `wm26`** — Quervergleich per `getlastchangedate`.
4. **Notnagel: API-Football Free Key** — vorregistrieren, nur aktivieren, wenn 1–3 ausfallen.
5. Endstand für die Punktevergabe erst fixieren, wenn **zwei Quellen** übereinstimmen oder die
   ESPN-Antwort `completed: true` seit > 10 Min. stabil ist.
