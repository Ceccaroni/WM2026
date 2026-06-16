// Legendäre Fußballersprüche fürs Start-Intro — bei jedem Start wird einer zufällig gezeigt.
// Originalzitate (deutsche Schreibweise mit ß bewusst belassen). note = Kontext/Zuschreibung.

export interface FootballQuote {
  text: string
  author: string
  note?: string
}

export const FOOTBALL_QUOTES: FootballQuote[] = [
  { text: 'Manche Leute halten Fußball für eine Frage von Leben und Tod. Ich versichere Ihnen: Es ist viel, viel wichtiger als das.', author: 'Bill Shankly', note: 'Liverpool-Legende' },
  { text: 'Fußball ist ein einfaches Spiel. 22 Männer jagen 90 Minuten lang einem Ball nach, und am Ende gewinnen immer die Deutschen.', author: 'Gary Lineker', note: 'nach dem WM-Halbfinal-Aus 1990' },
  { text: 'Fußball spielen ist sehr einfach. Aber einfachen Fußball zu spielen, ist das Schwierigste, was es gibt.', author: 'Johan Cruyff' },
  { text: 'Jeder Nachteil hat seinen Vorteil.', author: 'Johan Cruyff' },
  { text: 'Du siehst es erst, wenn du es kapiert hast.', author: 'Johan Cruyff' },
  { text: 'Der Ball ist rund, das Spiel dauert 90 Minuten.', author: 'Sepp Herberger' },
  { text: 'Nach dem Spiel ist vor dem Spiel.', author: 'Sepp Herberger' },
  { text: 'Das Runde muss ins Eckige.', author: 'Sepp Herberger' },
  { text: 'Grau is im Leben alle Theorie — entscheidend is auf’m Platz.', author: 'Adi Preißler', note: 'BVB-Legende der 50er' },
  { text: 'Fußball ist das Einzige, das ein ganzes Land vereinen kann.', author: 'Zinédine Zidane' },
  { text: 'Hinter jedem Schuss auf den Ball muss ein Gedanke stecken.', author: 'Dennis Bergkamp' },
  { text: 'Eier, wir brauchen Eier!', author: 'Oliver Kahn' },
  { text: 'Weiter, immer weiter!', author: 'Oliver Kahn' },
  { text: 'Was erlauben Strunz?', author: 'Giovanni Trapattoni', note: 'Wutrede, FC Bayern, 10. März 1998' },
  { text: 'Schwach wie eine Flasche leer!', author: 'Giovanni Trapattoni' },
  { text: 'Ich habe fertig!', author: 'Giovanni Trapattoni' },
  { text: 'Woran hat’s jelegen? An der Leistung.', author: 'Andreas Möller' },
  { text: 'Mailand oder Madrid — Hauptsache Italien.', author: 'Andreas Möller', note: 'oft fälschlich Matthäus zugeschrieben' },
  { text: 'Erst hatten wir kein Glück, und dann kam auch noch Pech dazu.', author: 'Jürgen „Kobra“ Wegmann' },
  { text: 'Manni, Bananenflanke — ich Kopf, Tor!', author: 'Horst Hrubesch' },
  { text: 'Fußball ist wie Schach, nur ohne Würfel.', author: 'Lukas Podolski' },
  { text: 'Es ist bitter, wenn jeder Ball, der reingeht, ein Tor ist.', author: 'Lukas Podolski' },
  { text: 'Wir müssen jetzt die Köpfe hochkrempeln — und die Ärmel auch.', author: 'Lukas Podolski' },
  { text: 'So ist Fußball. Manchmal gewinnt der Bessere!', author: 'Rudi Völler', note: 'Fußballspruch des Jahres 2006' },
  { text: 'Schalke 05.', author: 'Carmen Thomas', note: 'der legendärste Versprecher der TV-Geschichte, 1973' },
  { text: 'Geht’s raus und spielt’s Fußball!', author: 'Franz Beckenbauer' },
  { text: 'Schau’n mer mal.', author: 'Franz Beckenbauer' },
  { text: 'Mein Problem ist, dass ich immer sehr selbstkritisch bin, auch mir selbst gegenüber.', author: 'Andreas Möller' },
  { text: 'Als die Möwen dem Trawler folgen, dann nur, weil sie glauben, dass Sardinen ins Meer geworfen werden. Vielen Dank.', author: 'Eric Cantona', note: 'legendär-kryptisch, 1995' },
  { text: 'Ich bin kein Mann, ich bin Cantona.', author: 'Eric Cantona' },
  { text: 'Ich habe viel Geld für Alkohol, Frauen und schnelle Autos ausgegeben. Den Rest habe ich einfach verprasst.', author: 'George Best' },
  { text: 'Ich würde nicht sagen, dass ich der beste Trainer war — aber ich war unter den Top eins.', author: 'Brian Clough' },
  { text: 'Die Hand Gottes.', author: 'Diego Maradona', note: 'über sein Tor gegen England, WM 1986' },
  { text: 'Wer das Beste gibt, bereut nie.', author: 'Pelé', note: 'sinngemäß' }
]

/** Zufälliger Spruch (für jeden App-Start einer). */
export function randomQuote(): FootballQuote {
  return FOOTBALL_QUOTES[Math.floor(Math.random() * FOOTBALL_QUOTES.length)]
}
