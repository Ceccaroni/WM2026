import { useMemo, useState } from 'react'
import MatchCard from '../components/MatchCard'
import { GROUPS, ROUND_LABEL, SCHEDULE, TEAMS } from '../lib/data'
import { buildIcs } from '../lib/ics'
import { dayKey, dayLabel, todayKey } from '../lib/time'
import type { Round } from '../lib/types'
import { useMyTips } from '../store'

type RoundFilter = 'all' | Round

export default function Spielplan() {
  const [round, setRound] = useState<RoundFilter>('all')
  const [group, setGroup] = useState('all')
  const [team, setTeam] = useState('all')
  const tips = useMyTips()
  const today = todayKey()

  const days = useMemo(() => {
    const filtered = SCHEDULE.filter(
      (m) =>
        (round === 'all' || m.round === round) &&
        (group === 'all' || m.group === group) &&
        (team === 'all' || m.home === team || m.away === team)
    ).sort((a, b) => a.dateUtc.localeCompare(b.dateUtc) || a.match - b.match)
    const byDay = new Map<string, typeof filtered>()
    for (const m of filtered) {
      const key = dayKey(m.dateUtc)
      if (!byDay.has(key)) byDay.set(key, [])
      byDay.get(key)!.push(m)
    }
    return [...byDay.entries()]
  }, [round, group, team])

  const jumpToToday = () => document.getElementById(`day-${today}`)?.scrollIntoView({ behavior: 'smooth' })
  const hasToday = days.some(([key]) => key === today)

  return (
    <>
      <h1>Spielplan</h1>
      <div className="filters">
        <select value={round} onChange={(e) => setRound(e.target.value as RoundFilter)}>
          <option value="all">Alle Runden</option>
          {(Object.keys(ROUND_LABEL) as Round[]).map((r) => (
            <option key={r} value={r}>
              {ROUND_LABEL[r]}
            </option>
          ))}
        </select>
        <select value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="all">Alle Gruppen</option>
          {GROUPS.map((g) => (
            <option key={g} value={g}>
              Gruppe {g}
            </option>
          ))}
        </select>
        <select value={team} onChange={(e) => setTeam(e.target.value)}>
          <option value="all">Alle Teams</option>
          {[...TEAMS].sort((a, b) => a.name.localeCompare(b.name, 'de')).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {hasToday && (
          <button className="filters__today" onClick={jumpToToday}>
            Heute
          </button>
        )}
        <button
          className="filters__ics"
          title="Die gefilterten Spiele als Kalenderdatei sichern (Anstoßzeiten, Stadien)"
          onClick={() =>
            void window.wm26.exportIcs(
              buildIcs(
                days.flatMap(([, ms]) => ms),
                new Date().toISOString()
              ),
              team !== 'all' ? `WM26-${team}.ics` : 'WM26-Spielplan.ics'
            )
          }
        >
          📅 In Kalender exportieren
        </button>
      </div>

      {days.map(([key, matches]) => (
        <section key={key} id={`day-${key}`} className="day">
          <header className="dayhead">
            <h2>{dayLabel(matches[0].dateUtc)}</h2>
            {key === today && <span className="badge badge--today">Heute</span>}
            <span className="dayhead__count">
              {matches.length} {matches.length === 1 ? 'Spiel' : 'Spiele'}
            </span>
          </header>
          <div className="day__grid">
            {matches.map((m) => (
              <MatchCard key={m.match} match={m} tip={tips[m.match]} />
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
