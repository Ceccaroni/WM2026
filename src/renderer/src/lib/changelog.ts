// „Was ist neu"-Verlauf, gebündelt im Code (keine Netzabfrage): Nach einem Update
// zeigt die App alle Einträge, die neuer sind als die zuletzt gesehene Version — so
// holt ein Mittipper, der mehrere Versionen überspringt, den ganzen Verlauf auf einmal.
// Neueste Version zuerst. Nutzersprache, kein Changelog-Jargon.

export interface ChangelogEntry {
  version: string
  title: string
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.8.10',
    title: 'Aufstellungen: Namen vollständig',
    items: [
      'Lange Spielernamen werden auf dem Spielfeld jetzt vollständig angezeigt, statt mit „…" abgeschnitten zu werden.'
    ]
  },
  {
    version: '1.8.9',
    title: 'Aufstellungen: Darstellung korrigiert',
    items: [
      'Ein Anzeigefehler ist behoben: vor Anpfiff wurden kurz alle Spieler blass und mit Ein-/Auswechselpfeilen dargestellt. Jetzt erscheinen die Pfeile nur bei echten Auswechslungen.'
    ]
  },
  {
    version: '1.8.8',
    title: 'Aufstellungen: Bank, Wechsel & Trainer',
    items: [
      'Klappst du ein Live-Spiel auf, siehst du jetzt die komplette Ersatzbank beider Mannschaften — links das Heim-, rechts das Auswärtsteam — samt Trainer.',
      'Auswechslungen erscheinen live direkt auf dem Feld: der eingewechselte Spieler steht mit grünem Pfeil und Minute am Platz des Ausgewechselten (rot abgesetzt).',
      'Auch die Bankspieler kannst du antippen und ihre Panini-Karte öffnen.'
    ]
  },
  {
    version: '1.8.7',
    title: 'Die Aufstellungen sind da',
    items: [
      'Klappst du ein laufendes oder anstehendes Spiel auf, zeigt ein Panini-Rasen beide Startelfen in ihrer echten Formation — etwa eine Stunde vor Anpfiff, sobald die Aufstellungen feststehen.',
      'Tippe einen Spieler an, um seine Panini-Karte zu sehen.'
    ]
  },
  {
    version: '1.8.6',
    title: 'Siegerehrung & Stadionjubel',
    items: [
      'Neue Rubrik „Siegerehrung": Nach dem Finale steigt die grosse Krönung — Podest für den Tippkönig, Weltmeister-Banner und Konfetti. Bis dahin zeigt sie schon die aktuelle Führung und zählt die Tage bis zum Finale.',
      'Der Jubel beim exakten Tipp ist jetzt ein echter Stadion-Torjubel statt des bisherigen Applaus.'
    ]
  },
  {
    version: '1.8.5',
    title: 'Updates auf Knopfdruck',
    items: [
      'Neuer Knopf „Nach Updates suchen" in der Profile-Rubrik — du kannst jederzeit selbst prüfen, ob eine neue Version bereitsteht.',
      'Die App bemerkt neue Versionen jetzt schneller und zuverlässiger, auch wenn sie lange offen bleibt.'
    ]
  },
  {
    version: '1.8.4',
    title: 'Flotterer Start & zuverlässige Updates',
    items: [
      'Beim Start zeigt jetzt ein kurzer Ladebildschirm, dass die App hochfährt — kein langes schwarzes Fenster mehr.',
      'Update-Hinweise kommen wieder zuverlässig an.'
    ]
  },
  {
    version: '1.8.3',
    title: 'Der Live-Bereich, rundum geschärft',
    items: [
      'Der bunte Live-Rand erscheint jetzt direkt zum Anpfiff — nicht mehr erst eine Minute später.',
      'Wird ein Spiel unterbrochen (z. B. wegen Gewitter), steht in der Live-Ansicht „Unterbrochen" statt einer eingefrorenen Spielminute.',
      'Der Live-Bereich warnt jetzt, wenn die Ergebnisse gerade nicht aktualisiert werden können — dann weißt du, dass ein Stand womöglich veraltet ist.',
      'Bei KO-Spielen ist jetzt klar: getippt und gewertet wird das Endergebnis inkl. Verlängerung; endet es unentschieden, zählt zusätzlich der Sieger (Elfmeterschießen).',
      'Verschobene oder abgesagte Spiele werden als solche gekennzeichnet — dazu kleinere Verbesserungen unter der Haube.'
    ]
  },
  {
    version: '1.8.2',
    title: 'Live-Spiele im WM-Glanz',
    items: [
      'Das gerade laufende Spiel bekommt jetzt einen schimmernden Regenbogen-Rand im Stil der WM-Übertragung — so siehst du auf einen Blick, welche Begegnung live ist.'
    ]
  },
  {
    version: '1.8.1',
    title: 'Tschuttini, Sprüche & Klang',
    items: [
      'Das Start-Intro zeigt jetzt bei jedem Start zufällig einen von 34 legendären Fußballersprüchen — von Shankly bis Trapattoni.',
      'Das Intro ist vertont (Geige → Torjubel) — stummschaltbar in der Profile-Rubrik.',
      'Neues Tschuttini-Logo als Marken-Kopf in der Seitenleiste.'
    ]
  },
  {
    version: '1.8.0',
    title: 'Intro, Torschützen & Jubel',
    items: [
      'Neues Start-Intro mit Bill Shanklys berühmtem Satz über den Fussball.',
      'Neue Rubrik „Torschützen": das Rennen um den Goldenen Schuh — Klick öffnet die Panini-Karte.',
      'Volltreffer-Moment: Gold-Konfetti und ein Jubel, wenn du ein Spiel exakt getippt hast.'
    ]
  },
  {
    version: '1.7.0',
    title: 'Tipp-Vergleich in der Chronik',
    items: [
      'Chronik: Unter jedem beendeten Spiel steht jetzt, wer was getippt und wie viele Punkte er geholt hat — der beste Tipp in Gold.',
      'Die Torschützen der allerersten Spiele werden nachgetragen (sie blieben leer, weil das Live-Torschützen-Feature erst danach kam).',
      'Neu: dieser „Was ist neu"-Hinweis nach jedem Update.'
    ]
  },
  {
    version: '1.6.0',
    title: 'Turnier-Chronik',
    items: [
      'Eine Album-Seite pro Turniertag — Spiele, Torschützen, Tagespunkte und der Stand der Runde, klebt sich von selbst ein.',
      'Die ganze Chronik als PDF-Tagebuch sichern.'
    ]
  },
  {
    version: '1.5.0',
    title: 'Der WM-Sofa-Begleiter',
    items: [
      'Heute-Dashboard mit den Spielen des Tages.',
      'Live-Spiele mit Torschützen — ein Klick öffnet die Panini-Karte des Spielers.',
      '„Stand jetzt": Tabellen und Turnierbaum mit den laufenden Ergebnissen.',
      'Tor-Alarm (optional) und Tipp-Wächter, der rechtzeitig ans Tippen erinnert.',
      'Erfolgs-Sticker, Team-News und Team-Dossiers mit allen Wappen und kompletten Kadern.'
    ]
  },
  {
    version: '1.4.0',
    title: 'Spielerkarten & automatische Updates',
    items: [
      'Alle Kaderspieler als drehbare Panini-Karten.',
      'Neue Versionen melden sich von selbst — Herunterladen mit einem Klick.'
    ]
  }
]
