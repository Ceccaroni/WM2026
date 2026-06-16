// Konvertiert den fixturedownload-Roh-Feed (resources/data/source/) in unser
// Spielplan-Schema (resources/data/schedule.json) und validiert dabei:
// - alle 104 Spiele vorhanden, alle Team-/Stadionnamen gemappt
// - R32-Paarungen des Feeds stimmen mit unserem recherchierten bracket.json überein
// Aufruf: npm run data:schedule
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'resources', 'data')
const read = (f) => JSON.parse(readFileSync(join(dataDir, f), 'utf8'))

const feed = read('source/fixturedownload-2026.json')
const teams = read('teams.json')
const stadiums = read('stadiums.json')
const bracket = read('bracket.json')

const teamByFeedName = new Map(teams.map((t) => [t.feedName, t.id]))
const stadiumByFeedName = new Map(stadiums.map((s) => [s.feedName, s.id]))
const r32ByMatch = new Map(bracket.r32.map((m) => [m.match, m]))
const koByMatch = new Map(
  [...bracket.r16, ...bracket.qf, ...bracket.sf, bracket.third, bracket.final].map((m) => [m.match, m])
)

const ROUND_BY_FEED = { 4: 'r32', 5: 'r16', 6: 'qf', 7: 'sf' }

const schedule = feed
  .map((m) => {
    const stadium = stadiumByFeedName.get(m.Location)
    if (!stadium) throw new Error(`Spiel ${m.MatchNumber}: unbekanntes Stadion "${m.Location}"`)

    const entry = {
      match: m.MatchNumber,
      dateUtc: m.DateUtc.replace(' ', 'T'),
      stadium
    }

    if (m.RoundNumber <= 3) {
      const home = teamByFeedName.get(m.HomeTeam)
      const away = teamByFeedName.get(m.AwayTeam)
      if (!home || !away) throw new Error(`Spiel ${m.MatchNumber}: unbekanntes Team "${m.HomeTeam}" / "${m.AwayTeam}"`)
      return { ...entry, round: 'group', matchday: m.RoundNumber, group: m.Group.replace('Group ', ''), home, away }
    }

    if (m.RoundNumber === 4) {
      const b = r32ByMatch.get(m.MatchNumber)
      if (!b || b.home !== m.HomeTeam || b.away !== m.AwayTeam) {
        throw new Error(
          `Spiel ${m.MatchNumber}: R32-Paarung weicht ab — Feed ${m.HomeTeam}/${m.AwayTeam}, bracket.json ${b?.home}/${b?.away}`
        )
      }
      return { ...entry, round: 'r32', home: b.home, away: b.away }
    }

    const b = koByMatch.get(m.MatchNumber)
    if (!b) throw new Error(`Spiel ${m.MatchNumber}: fehlt in bracket.json`)
    const round = m.RoundNumber <= 7 ? ROUND_BY_FEED[m.RoundNumber] : m.MatchNumber === 103 ? 'third' : 'final'
    return { ...entry, round, home: b.home, away: b.away }
  })
  .sort((a, b) => a.match - b.match)

if (schedule.length !== 104) throw new Error(`Erwartet 104 Spiele, gefunden: ${schedule.length}`)
const groupGames = schedule.filter((m) => m.round === 'group')
if (groupGames.length !== 72) throw new Error(`Erwartet 72 Gruppenspiele, gefunden: ${groupGames.length}`)

writeFileSync(join(dataDir, 'schedule.json'), JSON.stringify(schedule, null, 1) + '\n')
console.log(`schedule.json geschrieben: ${schedule.length} Spiele (${groupGames.length} Gruppenspiele, ${schedule.length - groupGames.length} KO).`)
