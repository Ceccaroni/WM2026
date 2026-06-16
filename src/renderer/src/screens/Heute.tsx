import { useEffect, useMemo, useState } from 'react'
import emblem from '../assets/wm26-emblem.svg'
import GoalAlarmToggle from '../components/GoalAlarmToggle'
import LiveRow, { isRunning } from '../components/LiveRow'
import MatchCard from '../components/MatchCard'
import { SCHEDULE, TEAM_BY_ID } from '../lib/data'
import { resolveTipBracket } from '../lib/bracket'
import { useCompare } from '../lib/compare'
import { buildRealWorld, resultsAsTips } from '../lib/results'
import { computeBreakdown } from '../lib/scoring'
import { dayKey, dayLabel, kickoffTime, todayKey } from '../lib/time'
import { openTipMatches } from '../lib/watch'
import type { ScheduledMatch } from '../lib/types'
import { useActiveProfile, useApp, useMyTips } from '../store'

const dateFmt = new Intl.DateTimeFormat('de-CH', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Zurich'
})

/** "in 2 h 14 min" / "in 42 min" */
function countdown(toIso: string, now: number): string {
  const mins = Math.max(0, Math.round((Date.parse(toIso) - now) / 60_000))
  if (mins >= 60) return `in ${Math.floor(mins / 60)} h ${mins % 60} min`
  return `in ${mins} min`
}

/** Tages-Dashboard: heutige Spiele, Countdown, fehlende Tipps, Morgen-Vorschau. */
export default function Heute({ goTo }: { goTo: (id: 'tipps' | 'ko' | 'live') => void }) {
  const results = useApp((s) => s.results)
  const lineups = useApp((s) => s.lineups)
  const scoring = useApp((s) => s.scoring)
  const tips = useMyTips()
  const lateTips = useMyTips('fromR32')
  const profile = useActiveProfile()
  const compareFor = useCompare()
  const [now, setNow] = useState(() => Date.now())

  // Countdown im Halbminutentakt nachführen
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  const today = todayKey()
  const realBracket = useMemo(() => resolveTipBracket(resultsAsTips(results)), [results])
  const breakdown = useMemo(() => {
    const real = buildRealWorld(results, realBracket)
    return computeBreakdown(tips, resolveTipBracket(tips), results, real, SCHEDULE, scoring)
  }, [tips, results, realBracket, scoring])

  const todayMatches = SCHEDULE.filter((m) => dayKey(m.dateUtc) === today).sort(
    (a, b) => a.dateUtc.localeCompare(b.dateUtc) || a.match - b.match
  )
  // Beendete Spiele verschwinden aus „Heute" — der Blick gehört dem, was jetzt
  // ansteht. Ergebnisse stehen vollständig in der Live-Rubrik.
  const done = todayMatches.filter((m) => results[m.match]?.status === 'finished')
  const pending = todayMatches.filter((m) => results[m.match]?.status !== 'finished')
  const live = todayMatches.filter((m) => isRunning(results[m.match]))
  const next = todayMatches.find((m) => Date.parse(m.dateUtc) > now) ?? SCHEDULE.find((m) => Date.parse(m.dateUtc) > now)
  const open = useMemo(() => openTipMatches(tips, now), [tips, now])

  // KO-Aufruf: sobald alle 16 Sechzehntelfinal-Paarungen real feststehen (ESPN-Teams
  // oder echte Tabellen-Auflösung), sollen alle zusätzlich die Kategorie „ab 1/16" tippen
  const r32Matches = useMemo(() => SCHEDULE.filter((m) => m.round === 'r32'), [])
  const r32Fixed = r32Matches.every((m) => {
    const r = results[m.match]
    const t = realBracket.teams[m.match]
    return (r?.homeTeam && r?.awayTeam) || (TEAM_BY_ID.has(t.home) && TEAM_BY_ID.has(t.away))
  })
  const r32Tipped = r32Matches.filter((m) => lateTips[m.match]).length
  const lastR32Kickoff = Math.max(...r32Matches.map((m) => Date.parse(m.dateUtc)))
  const showKoCall = r32Fixed && r32Tipped < r32Matches.length && now < lastR32Kickoff

  const tomorrow = useMemo(() => {
    const after = SCHEDULE.filter((m) => dayKey(m.dateUtc) > today).sort((a, b) => a.dateUtc.localeCompare(b.dateUtc))
    if (after.length === 0) return []
    const day = dayKey(after[0].dateUtc)
    return after.filter((m) => dayKey(m.dateUtc) === day)
  }, [today])

  const row = (m: ScheduledMatch) => (
    <LiveRow
      key={m.match}
      match={m}
      result={results[m.match]}
      tip={tips[m.match]}
      slots={m.round === 'group' ? undefined : realBracket.teams[m.match]}
      scoring={scoring}
      bonusPts={breakdown.perMatch[m.match]?.advance ?? 0}
      compare={compareFor(m)}
      lineup={lineups[m.match]}
    />
  )

  return (
    <>
      <h1 className="heute__title">
        Heute im Album
        <img className="heute__emblem" src={emblem} alt="WM 2026" title="FIFA World Cup 26 — Emblem (Wikimedia Commons, Public domain; Marke der FIFA)" />
      </h1>
      <p className="lead">{dateFmt.format(new Date())} — willkommen zurück{profile ? `, ${profile.name}` : ''}.</p>

      <div className="glasshud">
        {live.length > 0 ? (
          <span className="glasshud__live">
            <span className="glasshud__dot" />
            {live.length} live
          </span>
        ) : next ? (
          <span className="heute__next">
            Anstoß <strong>{countdown(next.dateUtc, now)}</strong>
            <small>
              {' '}
              ({kickoffTime(next.dateUtc)} MESZ{dayKey(next.dateUtc) !== today ? `, ${dayLabel(next.dateUtc)}` : ''})
            </small>
          </span>
        ) : (
          <span className="heute__next">Das Turnier ist vorbei — danke fürs Mittippen!</span>
        )}
        <span className="glasshud__spacer" />
        <GoalAlarmToggle />
        <span className="glasshud__pts">
          <strong>{breakdown.total}</strong> Punkte bisher
        </span>
      </div>

      {open.length > 0 && (
        <button className="tipalert" onClick={() => goTo('tipps')}>
          ⚠️ {open.length === 1 ? 'Ein Spiel von heute ist' : `${open.length} Spiele von heute sind`} noch nicht getippt
          — jetzt tippen, bevor der Sticker verpasst ist →
        </button>
      )}

      {showKoCall && (
        <button className="tipalert tipalert--gold" onClick={() => goTo('ko')}>
          🏁 Die KO-Paarungen stehen fest! Jetzt zusätzlich die Kategorie «ab 1/16» tippen — echte Teams, eigene
          Wertung ({r32Tipped}/{r32Matches.length} getippt) →
        </button>
      )}

      {todayMatches.length > 0 ? (
        <section className="day">
          <header className="dayhead">
            <h2>Heutige Spiele</h2>
            {pending.length > 0 && (
              <span className="dayhead__count">
                {done.length > 0 ? 'noch ' : ''}
                {pending.length} {pending.length === 1 ? 'Spiel' : 'Spiele'}
              </span>
            )}
            {done.length > 0 && (
              <button className="dayhead__done" onClick={() => goTo('live')}>
                ✓ {done.length} beendet — Ergebnisse →
              </button>
            )}
          </header>
          {pending.length > 0 ? (
            <div className="liverows">{pending.map(row)}</div>
          ) : (
            <p className="notice">Für heute ist alles gespielt — die Ergebnisse stehen in der Live-Rubrik.</p>
          )}
        </section>
      ) : (
        <p className="notice">Heute sind keine Spiele angesetzt — Zeit, die KO-Tipps zu vervollständigen.</p>
      )}

      {tomorrow.length > 0 && (
        <section className="day">
          <header className="dayhead">
            <h2>Vorschau: {dayLabel(tomorrow[0].dateUtc)}</h2>
            <span className="dayhead__count">
              {tomorrow.length} {tomorrow.length === 1 ? 'Spiel' : 'Spiele'}
            </span>
          </header>
          <div className="day__grid">
            {tomorrow.map((m) => (
              <MatchCard key={m.match} match={m} tip={tips[m.match]} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
