# 🧮 Das Tipp-Rezeptbuch — Buchmachermathematik fürs WM26-Punktesystem

> Wie man unter **unserem** Punktesystem (4 exakt / 3 Tordiff / 2 Tendenz + KO-Boni)
> erwartungswert-optimal tippt. Keine Faustregeln aus dem Bauch — alle Tipp-Empfehlungen
> sind durchgerechnet (Poisson-Modell, Quelle: [`scripts/recipe-ev.mjs`](../scripts/recipe-ev.mjs)).
> Reproduzieren: `node scripts/recipe-ev.mjs`.

---

## 0. Die eine Idee dahinter

Du tippst **nicht das spannendste Ergebnis, sondern das mit dem höchsten erwarteten
Punktegewinn.** Für jedes Spiel gibt es eine Wahrscheinlichkeitsverteilung über alle
Ergebnisse (die kennt der Buchmacher näherungsweise). Multipliziert man jede mögliche
Ergebnis-Wahrscheinlichkeit mit den Punkten, die dein Tipp dort bekäme, und summiert,
erhält man den **Erwartungswert (EV)** des Tipps. Wir suchen den EV-Maximierer. That's it.

Das Punktesystem belohnt **drei Stufen** (BRIEFING §5):

| Treffer | Punkte | Bedingung |
|---|---|---|
| **Exakt** | 4 | Ergebnis exakt richtig |
| **Tordifferenz** | 3 | gleiche Differenz (deckt auch „richtiges Remis, falsches Ergebnis") |
| **Tendenz** | 2 | nur Sieger/Remis-Richtung richtig |

Plus in der KO-Phase: **+1** je richtigem Weiterkommer, Durchtipp-Boni je korrektem
Runden-Teilnehmer (R16 +1 / VF +2 / HF +3 / Final +4) und **Weltmeister +10**.

---

## 1. Das Kern-Rezept: Scoreline nach Spieltyp

Durchgerechnet für typische Spielprofile. Die **1/X/2-Spalte** ist deine Brücke von den
Quoten zum Rezept: Rechne aus den 1X2-Quoten die impliziten Prozente (≈ 1/Quote, dann
normieren) und nimm die Zeile mit dem ähnlichsten Profil.

| Spieltyp | 1 / X / 2 (%) | **Tipp** | knapp dahinter |
|---|---|---|---|
| Kantersieg-Favorit | 80 / 13 / 6 | **2:0** | 1:0, 2:1, 3:1 |
| Klarer Favorit | 68 / 20 / 12 | **1:0** | 2:1, 2:0 |
| Leichter Favorit | 51 / 24 / 24 | **1:0** | 2:1, 2:0 |
| Knapper Favorit | 46 / 27 / 27 | **1:0** | 2:1 |
| Defensiv-Favorit (wenig Tore) | 57 / 28 / 16 | **1:0** | 2:1, 2:0 |
| Zähes Low-Scoring-Spiel | 42 / 31 / 26 | **1:0** | 2:1 |
| Ausgeglichen, offensiv | 38 / 24 / 38 | **2:1** bzw. **1:2** | 1:0 / 0:1 |
| Ausgeglichen, eng | 35 / 29 / 35 | **1:0** bzw. **0:1** | 1:1 |

**Das Arbeitstier ist 1:0.** Bei praktisch jedem Favoritenspiel ist 1:0 EV-optimal oder
Top-2. **2:0** nur, wenn es wirklich Richtung Kantersieg geht. **2:1** liegt fast immer
nur Haaresbreite hinter 1:0 (oft 0.02–0.05 EV) — wer's weniger fad mag, nimmt 2:1: es
deckt mehr reale Ergebnisse über die Tordiff-/Tendenzstufe ab und kostet kaum etwas.

> Genau das ist der Grund, warum ich (Claude) auf Rang 3 stehe, obwohl ich 3 Spiele
> weniger getippt habe: konsequent knappe, wahrscheinliche Ergebnisse → fette
> Tendenz-/Tordiff-Ausbeute, wenig Nullrunden.

---

## 2. Zwei nicht-offensichtliche Wahrheiten

**a) Remis-Tipps haben kein Sicherheitsnetz.** Tippst du 1:1 und das Spiel endet 2:1,
bekommst du **0** Punkte — ein Remis-Tipp hat keine Tendenz-Auffangstufe (es gibt keine
„Remis-Richtung, knapp daneben"). Ein knapper Siegtipp dagegen fängt über die
Tendenzstufe (2P) fast immer etwas auf. Deshalb ist 1:1 selbst bei ausgeglichenen
Spielen mit 29 % Remis-Wahrscheinlichkeit nur **dritte** Wahl. **Remis nur tippen, wenn
es der mit Abstand wahrscheinlichste Einzelausgang ist.**

**b) Zu hoch tippen ist der teuerste Anfängerfehler.** Beim klaren Favoriten (λ 2.0/0.7):

| Tipp | EV |
|---|---|
| **1:0** | **1.75** |
| 2:1 | 1.71 |
| 2:0 | 1.70 |
| 3:1 | 1.63 |
| 3:0 | 1.57 |
| 4:0 | 1.46 |

Jede Stufe „höher" kostet ~0.15–0.20 EV. Über ein ganzes Turnier (~64 Spiele) sind das
**locker 10+ Punkte** — ungefähr der Abstand, der bei uns über Platz 1 und Platz 6
entscheidet. (Im echten Feld erkennt man die „Hochtipper" Adrian & Martin genau daran:
viele 5:0/6:1/7:0 → Tendenz oft getroffen, aber die wertvolle 3er-Tordiffstufe verschenkt.)

---

## 3. Wie du λ aus den Quoten bekommst (1 Minute pro Spiel)

Das Poisson-Modell braucht zwei Zahlen — beide stehen quasi auf dem Wettschein:

- **Total** `λh + λa` ≈ die **Over/Under-2.5-Linie**. Faustwerte: O/U-2.5 fair → Total ≈ 2.6;
  Over günstig quotiert → 3.0+; Under günstig → ~2.0.
- **Supremacy** `λh − λa` ≈ das **asiatische Handicap**. AH −0.5 → ≈ 0.5; AH −1.0 → ≈ 1.0;
  AH −1.5 → ≈ 1.5 (Heimvorteil bei neutralem Platz: ignorieren).

Dann: `λh = (Total + Supremacy) / 2`, `λa = (Total − Supremacy) / 2` → Zeile in §1 suchen.

**Schnellpfad ohne Rechnen:** Nur die 1X2-Quoten anschauen → implizite Prozente → die
Zeile in §1 mit dem passenden 1/X/2-Profil → Tipp ablesen. Reicht für 90 % der Fälle.

---

## 4. Die KO-Phase: hier wird das Spiel gewonnen

In der Gruppenphase sammeln alle ähnlich viele Basispunkte (bei uns aktuell: alle 59–61,
**null** Boni). Entschieden wird's über die KO-Boni. Drei Hebel:

**a) Weiterkommer (+1).** Der Tipp muss zum gewünschten Sieger passen. Bei Remis-Tipp
das `adv`-Feld (Sieger nach Elfmeterschießen) setzen — sonst verschenkst du den Bonus.
KO-Spiele sind enger und defensiver als Gruppenspiele → **1:0 und 2:1 dominieren noch
stärker.** Tippe den stärkeren Favoriten als Weiterkommer, Ergebnis nach §1.

**b) Durchtipp-Boni (R16 +1 / VF +2 / HF +3 / Final +4 je korrektem Teilnehmer).**
Das ist ein **Teilnehmer**-Bonus, unabhängig vom Spielergebnis. Strategie: Im Bracket die
**Favoriten möglichst weit durchmarschieren** lassen → maximiert die Schnittmenge mit den
echten Runden-Teilnehmern. Jeder Außenseiter, den du tief ins Bracket setzt, kostet
Bonus-Erwartung. Die späten Runden zählen am meisten (Final-Teilnehmer +4) — dort am
konservativsten auf die Top-Seeds setzen.

**c) Weltmeister (+10) — der größte Einzelhebel.** EV = 10 × P(Titel). Selbst der
Top-Favorit hat meist nur ~18–22 % Titelchance, aber jede Alternative ist im EV
schlechter. **Champion = das Team mit der höchsten Titelwahrscheinlichkeit laut Quoten,
niemals das Herzensteam.** (Einzige Ausnahme: siehe §5, Differenzierung von hinten.)

---

## 5. Turnierstrategie: wann du vom EV abweichst

EV-optimal tippen bringt dich **zuverlässig nach vorne** — aber wenn alle es tun, tippt
das halbe Feld ähnlich, und es entscheiden Differenzierung + Glück. Deshalb die Meta-Schicht:

- **Führst du → bleib beim EV-Optimum.** Varianz ist dein Feind, wenn du vorne stehst.
  Konsens-Tipps spielen, Vorsprung verwalten.
- **Liegst du zurück (besonders spät) → erhöhe kontrolliert das Risiko.** Weiche bei den
  großen Streuern bewusst vom Feld ab: ein anderer **Champion** als die Verfolger, mutigere
  HF/Final-Besetzung, bei Spielen mit eigener Meinung auch mal die exakte Scoreline jagen.
  Risiko ist hier ein **Werkzeug zum Aufholen**, kein Selbstzweck.
- **Die Haupt-Differenzierer** sind Champion-Tipp und SF/Final-Teilnehmer — große Boni,
  große Streuung im Feld. Wer hier richtig **und** anders liegt als der Rest, gewinnt.

---

## 6. Die häufigsten Fehler (= deine Chancen, sie zu schlagen)

1. **Zu hoch tippen** (3:0, 4:1, 5:0). Kostet die 3er-Tordiffstufe → ~10+ Punkte/Turnier.
2. **Remis ohne Not.** Kein Tendenz-Sicherheitsnetz (§2a).
3. **Exakt jagen.** Die 4 Punkte sind verlockend, aber unwahrscheinliche Ergebnisse zu
   tippen senkt den EV. Exakt-Treffer sind **Beifang**, nicht Ziel.
4. **Herzensteam im Bracket / als Champion.** Boni nach Quoten verteilen, nicht nach Liebe.
5. **Rotation am 3. Spieltag ignorieren.** Ein bereits qualifizierter Favorit rotiert →
   sein λ sinkt deutlich. Vor MD3 immer auf Quali-Stand und mutmaßliche Aufstellung schauen.

---

## TL;DR — der Spickzettel

> **Tippe knapp, tippe den Favoriten, tippe nüchtern.**
> Standard = **1:0**. Kantersieg = **2:0**. Lust auf mehr = **2:1**. Remis fast nie.
> In der KO-Phase Favoriten durchmarschieren lassen, Champion = Top-Quotenteam.
> Vorne: safe spielen. Hinten: bei Champion & Halbfinale mutig vom Feld abweichen.
