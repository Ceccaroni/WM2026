# FIFA Fussball-WM 2026 – Recherche-Dossier

**Stand: 11. Juni 2026 (Eröffnungstag).** Alle 48 Teams und der komplette Spielplan stehen final fest, inklusive der im März 2026 entschiedenen Playoff-Plätze.

- **Turnier:** FIFA World Cup 26™ (offiziell), 23. Austragung
- **Gastgeber:** USA (11 Stadien), Kanada (2), Mexiko (3)
- **Zeitraum:** 11. Juni – 19. Juli 2026
- **Teams:** 48 | **Spiele:** 104 | **Gruppen:** 12 (A–L)

---

## 1. Alle 48 Teilnehmer – Finale Gruppeneinteilung

Auslosung am 5. Dezember 2025 (Kennedy Center, Washington D.C.); die letzten 6 Plätze wurden in den Playoffs am 26./31. März 2026 vergeben.

**Playoff-Sieger März 2026:**
- UEFA Pfad A: **Bosnien-Herzegowina** (Finale vs. Italien, 1:1, 4:1 i.E.) → Gruppe B
- UEFA Pfad B: **Schweden** (Finale 3:2 vs. Polen) → Gruppe F
- UEFA Pfad C: **Türkei** (Finale 1:0 vs. Kosovo) → Gruppe D
- UEFA Pfad D: **Tschechien** (Finale vs. Dänemark, 2:2, 3:1 i.E.) → Gruppe A
- Interkontinental Pfad 1: **DR Kongo** → Gruppe K
- Interkontinental Pfad 2: **Irak** → Gruppe I

### Gruppen A–L (mit ISO-3166-Codes für Flaggen)

| Gruppe | Team 1 | Team 2 | Team 3 | Team 4 |
|---|---|---|---|---|
| **A** | Mexiko `MX` | Südkorea `KR` | Südafrika `ZA` | Tschechien `CZ` |
| **B** | Kanada `CA` | Schweiz `CH` | Katar `QA` | Bosnien-Herzegowina `BA` |
| **C** | Brasilien `BR` | Marokko `MA` | Schottland `GB-SCT`* | Haiti `HT` |
| **D** | USA `US` | Paraguay `PY` | Australien `AU` | Türkei `TR` |
| **E** | Deutschland `DE` | Ecuador `EC` | Elfenbeinküste `CI` | Curaçao `CW` |
| **F** | Niederlande `NL` | Japan `JP` | Tunesien `TN` | Schweden `SE` |
| **G** | Belgien `BE` | Iran `IR` | Ägypten `EG` | Neuseeland `NZ` |
| **H** | Spanien `ES` | Uruguay `UY` | Saudi-Arabien `SA` | Kap Verde `CV` |
| **I** | Frankreich `FR` | Senegal `SN` | Norwegen `NO` | Irak `IQ` |
| **J** | Argentinien `AR` | Österreich `AT` | Algerien `DZ` | Jordanien `JO` |
| **K** | Portugal `PT` | Kolumbien `CO` | Usbekistan `UZ` | DR Kongo `CD` |
| **L** | England `GB-ENG`* | Kroatien `HR` | Panama `PA` | Ghana `GH` |

\* England und Schottland haben **keine eigenen ISO-3166-1-alpha-2-Codes** (beide gehören zu `GB`). Für Flaggen die ISO-3166-2-Subdivision-Codes `GB-ENG` / `GB-SCT` verwenden (in Flaggen-Libraries meist `gb-eng` / `gb-sct`).

**WM-Debütanten:** Curaçao, Haiti (erste Teilnahme seit 1974), Jordanien, Kap Verde, Usbekistan; dazu Rückkehrer wie DR Kongo (erstmals seit 1974 als Zaire).

**Verifikation Gruppeneinteilung (≥2 unabhängige Quellen):**
- NBC Sports: https://www.nbcsports.com/soccer/news/2026-world-cup-groups-confirmed-full-draw-groups-details
- FWC Live (Gruppenübersicht): https://fwclive.com/groups/
- fixturedownload.com-Spielplandaten (Team-Gruppen-Zuordnung aller 72 Gruppenspiele): https://fixturedownload.com/feed/json/fifa-world-cup-2026
- openfootball (öffentlich gepflegter Datensatz, 104 Spiele): https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json
- FIFA Final-Draw-Ergebnis: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/final-draw-results
- Playoffs: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_qualification_(inter-confederation_play-offs) und https://www.olympics.com/en/news/football-2026-fifa-world-cup-playoff-tournament-and-european-play-offs-all-results-scores-and-schedule

---

## 2. Turnierformat im Detail

### Grundstruktur
- 12 Gruppen à 4 Teams, jeder gegen jeden (3 Spiele pro Team, 72 Gruppenspiele).
- **Weiter kommen:** die 12 Gruppensieger, die 12 Gruppenzweiten und die **8 besten Gruppendritten** → erstmals **Sechzehntelfinale (Round of 32)**.
- Danach klassisches K.-o.-System: R32 (16 Spiele) → Achtelfinale (8) → Viertelfinale (4) → Halbfinale (2) → Spiel um Platz 3 + Finale. Gesamt 104 Spiele.
- In allen K.-o.-Spielen bei Gleichstand: 2× 15 Min. Verlängerung, dann Elfmeterschießen.

### Offizielle Tiebreaker – Platzierung innerhalb der Gruppe
Bei Punktgleichheit gilt (FIFA World Cup 26 Regulations; **neu: direkter Vergleich zuerst**, anders als bis 2022):
1. Mehr Punkte aus den Direktbegegnungen der punktgleichen Teams
2. Bessere Tordifferenz aus den Direktbegegnungen
3. Mehr erzielte Tore in den Direktbegegnungen
4. Bessere Tordifferenz aus **allen** Gruppenspielen
5. Mehr erzielte Tore in **allen** Gruppenspielen
6. Höherer Fairplay-Score (Punktabzüge für Gelbe/Rote Karten) in allen Gruppenspielen
7. FIFA-Weltrangliste

### Offizielle Tiebreaker – Rangliste der Gruppendritten
Die 12 Dritten werden tabellarisch verglichen; die besten 8 kommen weiter:
1. Punkte
2. Tordifferenz
3. Erzielte Tore
4. Fairplay-Score (Gelbe/Rote Karten)
5. FIFA-Weltrangliste

### Zuordnung der Gruppendritten auf die R32-Bracket-Positionen
Acht R32-Spiele haben einen Gruppendritten als Gegner eines Gruppensiegers. Pro Spiel ist eine feste Kandidatenmenge definiert (welche der 5 möglichen Drittengruppen dorthin kommen kann):

| R32-Spiel | Gruppensieger | Möglicher Gruppendritter aus |
|---|---|---|
| Spiel 74 | Sieger E | 3. aus A / B / C / D / F |
| Spiel 77 | Sieger I | 3. aus C / D / F / G / H |
| Spiel 79 | Sieger A | 3. aus C / E / F / H / I |
| Spiel 80 | Sieger L | 3. aus E / H / I / J / K |
| Spiel 81 | Sieger D | 3. aus B / E / F / I / J |
| Spiel 82 | Sieger G | 3. aus A / E / H / I / J |
| Spiel 85 | Sieger B | 3. aus E / F / G / I / J |
| Spiel 87 | Sieger K | 3. aus D / E / I / J / L |

**Die konkrete Zuordnung** hängt davon ab, **welche Kombination von 8 Gruppen** ihre Dritten durchbringt: Es gibt C(12,8) = **495 mögliche Kombinationen**. Für jede einzelne ist in **Annexe C der offiziellen FIFA-Regularien** („Regulations for the FIFA World Cup 26™") die exakte Zuordnungstabelle hinterlegt (welcher Dritte in welches Spiel geht). Die Zuordnung steht erst nach dem letzten Gruppenspiel fest.

**Quellen Format/Tiebreaker/Zuordnung:**
- Offizielle FIFA-Regularien (PDF, inkl. Annexe C mit allen 495 Kombinationen): https://digitalhub.fifa.com/m/636f5c9c6f29771f/original/FWC2026_regulations_EN.pdf
- ESPN (Format & Tiebreaker): https://www.espn.com/soccer/story/_/id/47108758/2026-fifa-world-cup-format-tiebreakers-fixtures-schedule
- FOX Sports (Tiebreaker): https://www.foxsports.com/stories/soccer/fifa-world-cup-group-stage-third-place-tiebreakers
- Wikipedia K.-o.-Runde: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
- Erläuterung 495 Szenarien: https://worldcuplocaltime.com/world-cup-2026-495-scenarios-round-of-32/

---

## 3. Kompletter K.-o.-Baum (Spiele 73–104)

Notation: `1A` = Sieger Gruppe A, `2A` = Zweiter Gruppe A, `3X…` = Gruppendritter aus den genannten Gruppen, `S73` = Sieger Spiel 73. Datum = Ortszeit; UTC-Zeit aus dem verifizierten Spielplan-Feed.

### Sechzehntelfinale (Round of 32), 28. Juni – 3. Juli

| Nr. | Datum (Ortszeit) | Anstoß UTC | Stadion (Stadt) | Paarung |
|---|---|---|---|---|
| 73 | So 28.06. | 19:00 | Los Angeles Stadium (Inglewood) | **2A – 2B** |
| 76 | Mo 29.06. | 17:00 | Houston Stadium (Houston) | **1C – 2F** |
| 74 | Mo 29.06. | 20:30 | Boston Stadium (Foxborough) | **1E – 3A/B/C/D/F** |
| 75 | Mo 29.06. | 01:00 (30.06. UTC) | Estadio Monterrey (Guadalupe) | **1F – 2C** |
| 78 | Di 30.06. | 17:00 | Dallas Stadium (Arlington) | **2E – 2I** |
| 77 | Di 30.06. | 21:00 | New York/New Jersey Stadium (East Rutherford) | **1I – 3C/D/F/G/H** |
| 79 | Di 30.06. | 01:00 (01.07. UTC) | Estadio Azteca (Mexiko-Stadt) | **1A – 3C/E/F/H/I** |
| 80 | Mi 01.07. | 16:00 | Atlanta Stadium (Atlanta) | **1L – 3E/H/I/J/K** |
| 82 | Mi 01.07. | 20:00 | Seattle Stadium (Seattle) | **1G – 3A/E/H/I/J** |
| 81 | Mi 01.07. | 00:00 (02.07. UTC) | San Francisco Bay Area Stadium (Santa Clara) | **1D – 3B/E/F/I/J** |
| 84 | Do 02.07. | 19:00 | Los Angeles Stadium (Inglewood) | **1H – 2J** |
| 83 | Do 02.07. | 23:00 | Toronto Stadium (Toronto) | **2K – 2L** |
| 85 | Do 02.07. | 03:00 (03.07. UTC) | BC Place (Vancouver) | **1B – 3E/F/G/I/J** |
| 88 | Fr 03.07. | 18:00 | Dallas Stadium (Arlington) | **2D – 2G** |
| 86 | Fr 03.07. | 22:00 | Miami Stadium (Miami Gardens) | **1J – 2H** |
| 87 | Fr 03.07. | 01:30 (04.07. UTC) | Kansas City Stadium (Kansas City) | **1K – 3D/E/I/J/L** |

### Achtelfinale (Round of 16), 4.–7. Juli

| Nr. | Datum | Anstoß UTC | Stadion | Paarung |
|---|---|---|---|---|
| 90 | Sa 04.07. | 17:00 | Houston Stadium | **S73 – S75** |
| 89 | Sa 04.07. | 21:00 | Philadelphia Stadium | **S74 – S77** |
| 91 | So 05.07. | 20:00 | New York/New Jersey Stadium | **S76 – S78** |
| 92 | So 05.07. | 00:00 (06.07. UTC) | Estadio Azteca | **S79 – S80** |
| 93 | Mo 06.07. | 19:00 | Dallas Stadium | **S83 – S84** |
| 94 | Mo 06.07. | 00:00 (07.07. UTC) | Seattle Stadium | **S81 – S82** |
| 95 | Di 07.07. | 16:00 | Atlanta Stadium | **S86 – S88** |
| 96 | Di 07.07. | 20:00 | BC Place Vancouver | **S85 – S87** |

### Viertelfinale, 9.–11. Juli

| Nr. | Datum | Anstoß UTC | Stadion | Paarung |
|---|---|---|---|---|
| 97 | Do 09.07. | 20:00 | Boston Stadium | **S89 – S90** |
| 98 | Fr 10.07. | 19:00 | Los Angeles Stadium | **S93 – S94** |
| 99 | Sa 11.07. | 21:00 | Miami Stadium | **S91 – S92** |
| 100 | Sa 11.07. | 01:00 (12.07. UTC) | Kansas City Stadium | **S95 – S96** |

### Halbfinale, 14.–15. Juli

| Nr. | Datum | Anstoß UTC | Stadion | Paarung |
|---|---|---|---|---|
| 101 | Di 14.07. | 19:00 | Dallas Stadium (Arlington) | **S97 – S98** |
| 102 | Mi 15.07. | 19:00 | Atlanta Stadium (Atlanta) | **S99 – S100** |

### Spiel um Platz 3 und Finale

| Nr. | Datum | Anstoß UTC | Stadion | Paarung |
|---|---|---|---|---|
| 103 | Sa 18.07. | 21:00 | Miami Stadium (Miami Gardens) | **Verlierer 101 – Verlierer 102** |
| 104 | So 19.07. | 19:00 (= 21:00 MESZ, 15:00 Ortszeit) | **New York/New Jersey Stadium (East Rutherford)** | **Sieger 101 – Sieger 102** |

### Pfade ins Finale (Bracket-Hälften)
- **Obere Hälfte → Halbfinale 101 (Dallas):** VF 97 (Boston): [74: 1E–3.] / [77: 1I–3.] / [73: 2A–2B] / [75: 1F–2C] — VF 98 (Los Angeles): [83: 2K–2L] / [84: 1H–2J] / [81: 1D–3.] / [82: 1G–3.]
- **Untere Hälfte → Halbfinale 102 (Atlanta):** VF 99 (Miami): [76: 1C–2F] / [78: 2E–2I] / [79: 1A–3.] / [80: 1L–3.] — VF 100 (Kansas City): [86: 1J–2H] / [88: 2D–2G] / [85: 1B–3.] / [87: 1K–3.]

**Quellen K.-o.-Baum:**
- https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
- https://fixturedownload.com/feed/json/fifa-world-cup-2026 (Spielnummern, UTC-Zeiten, Stadien — deckungsgleich mit Wikipedia)
- https://www.espn.com/soccer/story/_/id/48939282/2026-fifa-world-cup-fixtures-results-match-schedule-group-stage-knockout-rounds-bracket

---

## 4. Alle 16 Stadien

Sommer-Zeitzonen: ET = UTC−4 (EDT), CT = UTC−5 (CDT), PT = UTC−7 (PDT), MX = UTC−6 (Zentralmexiko, **keine Sommerzeit**). MESZ = UTC+2.

| Offizieller FIFA-Turniername | Üblicher Name | Stadt | Land | Kapazität* | Zeitzone (Diff. zu MESZ) |
|---|---|---|---|---|---|
| Estadio Azteca / Mexico City Stadium | Estadio Azteca (Banorte) | Mexiko-Stadt | Mexiko | 80.824 | UTC−6 (−8 h) |
| New York New Jersey Stadium | MetLife Stadium | East Rutherford, NJ | USA | 80.663 | ET, UTC−4 (−6 h) |
| Dallas Stadium | AT&T Stadium | Arlington, TX | USA | 70.649 | CT, UTC−5 (−7 h) |
| Los Angeles Stadium | SoFi Stadium | Inglewood, CA | USA | 70.492 | PT, UTC−7 (−9 h) |
| Kansas City Stadium | Arrowhead Stadium | Kansas City, MO | USA | 69.045 | CT, UTC−5 (−7 h) |
| San Francisco Bay Area Stadium | Levi's Stadium | Santa Clara, CA | USA | 68.827 | PT, UTC−7 (−9 h) |
| Houston Stadium | NRG Stadium | Houston, TX | USA | 68.777 | CT, UTC−5 (−7 h) |
| Philadelphia Stadium | Lincoln Financial Field | Philadelphia, PA | USA | 68.324 | ET, UTC−4 (−6 h) |
| Atlanta Stadium | Mercedes-Benz Stadium | Atlanta, GA | USA | 68.239 | ET, UTC−4 (−6 h) |
| Seattle Stadium | Lumen Field | Seattle, WA | USA | 66.925 | PT, UTC−7 (−9 h) |
| Miami Stadium | Hard Rock Stadium | Miami Gardens, FL | USA | 64.478 | ET, UTC−4 (−6 h) |
| Boston Stadium | Gillette Stadium | Foxborough, MA | USA | 64.146 | ET, UTC−4 (−6 h) |
| BC Place Vancouver | BC Place | Vancouver, BC | Kanada | 52.497 | PT, UTC−7 (−9 h) |
| Estadio Monterrey | Estadio BBVA | Guadalupe (Monterrey) | Mexiko | 51.243 | UTC−6 (−8 h) |
| Estadio Guadalajara | Estadio Akron | Zapopan (Guadalajara) | Mexiko | 45.664 | UTC−6 (−8 h) |
| Toronto Stadium | BMO Field | Toronto, ON | Kanada | 43.036 | ET, UTC−4 (−6 h) |

\* Turnierkapazitäten laut Wikipedia (Stand Juni 2026). **Achtung:** Nominale Stadionkapazitäten weichen teils deutlich ab (z. B. AT&T Stadium bis 94.000 erweiterbar, MetLife nominal 82.500, Azteca ~83.000–87.000 nach Umbau); FIFA-Turnierkonfigurationen reduzieren die Kapazität (Medien-/Hospitality-Bereiche).

**Quellen Stadien:**
- https://en.wikipedia.org/wiki/2026_FIFA_World_Cup (Venues-Tabelle)
- FIFA-Stadioninfos: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/stadium-information-details
- https://www.olympics.com/en/news/fifa-world-cup-2026-full-list-stadiums-mexico-canada-usa

---

## 5. Spielplan-Struktur

### Rundentermine (Ortszeit; verifiziert über Spielplan-Feed)

| Runde | Spiele | Spielnummern | Zeitraum |
|---|---|---|---|
| Gruppenphase, Spieltag 1 | 24 | 1–24 | Do 11.06. – Mi 17.06. |
| Gruppenphase, Spieltag 2 | 24 | 25–48 | Do 18.06. – Di 23.06. |
| Gruppenphase, Spieltag 3 | 24 | 49–72 | Mi 24.06. – Sa 27.06. (parallel je Gruppe) |
| Sechzehntelfinale (R32) | 16 | 73–88 | So 28.06. – Fr 03.07. |
| Achtelfinale (R16) | 8 | 89–96 | Sa 04.07. – Di 07.07. |
| Viertelfinale | 4 | 97–100 | Do 09.07. – Sa 11.07. |
| Halbfinale | 2 | 101–102 | Di 14.07. (Dallas), Mi 15.07. (Atlanta) |
| Spiel um Platz 3 | 1 | 103 | Sa 18.07. (Miami) |
| Finale | 1 | 104 | So 19.07. (East Rutherford/New York) |

Spielfreie Tage: 8. und 13. Juli sowie 16./17. Juli (vor dem Spiel um Platz 3).

### Spieltagsrhythmus Gruppenphase (jede Gruppe spielt an festen Tagen)
- Spieltag 1: A 11.6. · B/D 12.–13.6. · C 13.6. · E/F 14.6. · G/H 15.6. · I/J 16.6. · K/L 17.6.
- Spieltag 2: A/B 18.6. · C/D 19.6. · E/F 20.6. · G/H 21.6. · I/J 22.6. · K/L 23.6.
- Spieltag 3 (parallele Anstöße je Gruppe): A/B 24.6. · D/E/F 25.6. · G/H/I 26.6. · J/K/L 27.6.

### Eröffnung und Finale
- **Eröffnungsspiel (Spiel 1):** Do, **11. Juni 2026**, **Mexiko – Südafrika**, Estadio Azteca, Mexiko-Stadt. Anstoß 13:00 Ortszeit = 19:00 UTC = **21:00 MESZ**. (Am selben Tag: Südkorea – Tschechien in Guadalajara, 20:00 Ortszeit = **04:00 MESZ** am 12.6.) Kanada eröffnet am 12.6. in Toronto (vs. Bosnien-H.), die USA am 12.6. in Inglewood (vs. Paraguay, 18:00 PT = **03:00 MESZ** am 13.6.).
- **Finale (Spiel 104):** So, **19. Juli 2026**, New York/New Jersey Stadium (MetLife), East Rutherford. Anstoß 15:00 Ortszeit (ET) = 19:00 UTC = **21:00 MESZ**.

### Typische Anstoßzeiten
- **Ortszeit:** überwiegend 12:00, 15:00, 17:00, 18:00, 19:00, 20:00 und 21:00 Uhr (häufigste Slots: 12:00 lokal/ET-Mittag und 18:00–20:00 abends; K.-o.-Spiele teils 16:00/17:00).
- **MESZ:** 16 verschiedene Anstoßzeiten im Turnier. Häufigste Slots: **18:00, 21:00, 22:00/23:00, 00:00, 02:00–04:00 MESZ**; frühester Tagesslot 18:00 MESZ, spätester 06:00 MESZ (Westküsten-Abendspiele). Halbfinals und Finale jeweils **21:00 MESZ**.

**Quellen Spielplan:**
- Sportschau (deutsch, Anstoßzeiten MESZ): https://www.sportschau.de/fussball/fifa-wm-2026/daten-fakten-termine-so-laeuft-die-fussball-wm-2026,fragen-und-antworten-zur-wm-zwanzigsechsundzwanzig-100.html
- ran.de Spielplan (deutsch): https://ran.joyn.de/sports/fussball/wm/spielplan
- fixturedownload-Feed (alle UTC-Zeiten, eigene Auswertung): https://fixturedownload.com/feed/json/fifa-world-cup-2026
- FIFA-Spielplan: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026

---

## 6. Maschinenlesbare Spielplan-Quellen (alle 104 Spiele)

### ⭐ Empfehlung: fixturedownload.com — am 11.06.2026 direkt verifiziert
- **Übersichtsseite:** https://fixturedownload.com/results/fifa-world-cup-2026
- **JSON-Feed (verifiziert, HTTP 200, 104 Spiele):** `https://fixturedownload.com/feed/json/fifa-world-cup-2026`
- **CSV (verifiziert, HTTP 200, 104 Zeilen + Header, UTC-Zeiten):** `https://fixturedownload.com/download/fifa-world-cup-2026-UTC.csv`
- Weitere Formate: XLSX und ICS über die Übersichtsseite; Filterung pro Team möglich (z. B. `/results/fifa-world-cup-2026/germany`).
- **JSON-Schema:** `MatchNumber`, `RoundNumber` (1–3 = Gruppenspieltage, 4 = R32, 5 = AF, 6 = VF, 7 = HF, 8 = Platz 3/Finale), `DateUtc`, `Location` (FIFA-Stadionnamen), `HomeTeam`, `AwayTeam`, `Group`, `HomeTeamScore`, `AwayTeamScore`, `Winner`.
- Beispiel (Spiel 1): `{"MatchNumber":1,"RoundNumber":1,"DateUtc":"2026-06-11 19:00:00Z","Location":"Mexico City Stadium","HomeTeam":"Mexico","AwayTeam":"South Africa","Group":"Group A",…}`
- Hinweis des Anbieters: Daten werden ca. 1×/Tag aktualisiert (Ergebnisse erscheinen mit Verzögerung); Schema kann sich ändern. K.-o.-Platzhalter heißen `2A`, `3ABCDF`, `To be announced`.

### Alternativen (ebenfalls verifiziert bzw. geprüft)
1. **openfootball/worldcup.json** (Public Domain, GitHub; verifiziert: HTTP 200, 104 Spiele, inkl. Ortszeit mit UTC-Offset):
   `https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json`
   Repo: https://github.com/openfootball/worldcup.json (Quelle: Football.TXT-Dateien in https://github.com/openfootball/worldcup)
2. **mjwebmaster/world-cup-2026-schedule-data** (GitHub, JSON + CSV + ICS): https://github.com/mjwebmaster/world-cup-2026-schedule-data
3. **Wikipedia-Tabellen** (gut parsebar, mit Live-Ergebnissen während des Turniers): https://en.wikipedia.org/wiki/2026_FIFA_World_Cup (Gruppentabellen) und https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage — via `wikitable`-Parsing oder Wikipedia-API.
4. **Offizielle FIFA-Seite** (kein offen dokumentierter Feed, aber maßgebliche Referenz für Ergebnisse/Standings): https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/standings
5. **GitHub-Topic** für weitere Projekte: https://github.com/topics/world-cup-2026

---

## Quellenübersicht (gesamt)

| Faktenblock | Primärquellen |
|---|---|
| Gruppen/Teams | NBC Sports, FWC Live, FIFA Final Draw, fixturedownload-Feed, openfootball |
| Playoffs März 2026 | Wikipedia (inter-confederation play-offs), Olympics.com, UEFA.com |
| Format/Tiebreaker | FIFA Regulations PDF (digitalhub.fifa.com), ESPN, FOX Sports |
| Drittplatzierten-Zuordnung | FIFA Regulations Annexe C, Wikipedia knockout stage, worldcuplocaltime.com |
| K.-o.-Baum | Wikipedia knockout stage, fixturedownload-Feed (kreuzverifiziert) |
| Stadien | Wikipedia (Venues), FIFA.com Stadium Information, Olympics.com |
| Spielplan/Zeiten | fixturedownload-Feed (eigene Auswertung), Sportschau, ran.de |
| Maschinenlesbare Feeds | fixturedownload.com (JSON + CSV per HTTP-Request verifiziert), openfootball (verifiziert) |

*Recherchiert und verifiziert am 11. Juni 2026.*
