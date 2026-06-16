import { useMemo, useState } from 'react'
import BracketTree from '../components/BracketTree'
import GoalAlarmToggle from '../components/GoalAlarmToggle'
import GroupTable from '../components/GroupTable'
import LiveRow, { isRunning } from '../components/LiveRow'
import { GROUPS, SCHEDULE } from '../lib/data'
import { resolveTipBracket } from '../lib/bracket'
import { useCompare } from '../lib/compare'
import { buildRealWorld, resultsAsTips } from '../lib/results'
import { computeBreakdown } from '../lib/scoring'
import { dayKey, dayLabel, kickoffTime, todayKey } from '../lib/time'
import type { ScheduledMatch } from '../lib/types'
import { useApp, useMyTips } from '../store'

type View = 'spiele' | 'tabellen' | 'baum'

/**
 * Umschalter „Stand jetzt / Nur beendete" für Tabellen + Baum. Ohne laufende Spiele
 * sind beide Sichten identisch — dann nur der bisherige Hinweis.
 */
function ProjToggle({ live, proj, setProj }: { live: number; proj: boolean; setProj: (v: boolean) => void }) {
  if (live === 0) return <p className="notice">Echte Tabellen und Baum — es zählen nur beendete Spiele.</p>
  return (
    <div className="projbar">
      <button className={`projbar__chip${proj ? ' projbar__chip--active' : ''}`} onClick={() => setProj(true)}>
        ⚡ Stand jetzt
      </button>
      <button className={`projbar__chip${!proj ? ' projbar__chip--active' : ''}`} onClick={() => setProj(false)}>
        Nur beendete
      </button>
      {proj && (
        <small>
          {live} laufende{live === 1 ? 's' : ''} Spiel{live === 1 ? '' : 'e'} zähl{live === 1 ? 't' : 'en'} mit aktuellem
          Stand mit — provisorisch, die Wertung bleibt unberührt.
        </small>
      )}
    </div>
  )
}

export default function Live() {
  const [view, setView] = useState<View>('spiele')
  // „Stand jetzt": Tabellen/Baum rechnen laufende Spiele mit (nur Anzeige, nie Wertung)
  const [proj, setProj] = useState(true)
  const results = useApp((s) => s.results)
  const lineups = useApp((s) => s.lineups)
  const fetchedAt = useApp((s) => s.resultsFetchedAt)
  const refreshResults = useApp((s) => s.refreshResults)
  const scoring = useApp((s) => s.scoring)
  const tips = useMyTips()
  const [refreshing, setRefreshing] = useState(false)
  const compareFor = useCompare()

  // Echte Welt = dieselbe Maschinerie wie die Tipp-Welt, gefüttert mit Endständen
  const realTips = useMemo(() => resultsAsTips(results), [results])
  const realBracket = useMemo(() => resolveTipBracket(realTips), [realTips])
  const projTips = useMemo(() => resultsAsTips(results, true), [results])
  const projBracket = useMemo(() => resolveTipBracket(projTips), [projTips])
  const breakdown = useMemo(() => {
    const real = buildRealWorld(results, realBracket)
    return computeBreakdown(tips, resolveTipBracket(tips), results, real, SCHEDULE, scoring)
  }, [tips, results, realBracket, scoring])

  const today = todayKey()
  const liveMatches = SCHEDULE.filter((m) => isRunning(results[m.match]))
  const todayMatches = SCHEDULE.filter((m) => dayKey(m.dateUtc) === today && !isRunning(results[m.match])).sort(
    (a, b) => a.dateUtc.localeCompare(b.dateUtc) || a.match - b.match
  )
  const pastDays = useMemo(() => {
    const finished = SCHEDULE.filter(
      (m) => results[m.match]?.status === 'finished' && dayKey(m.dateUtc) !== today
    ).sort((a, b) => b.dateUtc.localeCompare(a.dateUtc) || b.match - a.match)
    const byDay = new Map<string, ScheduledMatch[]>()
    for (const m of finished) {
      const key = dayKey(m.dateUtc)
      if (!byDay.has(key)) byDay.set(key, [])
      byDay.get(key)!.push(m)
    }
    return [...byDay.entries()]
  }, [results, today])

  const staleMs = fetchedAt != null ? Date.now() - Date.parse(fetchedAt) : 0
  const stale = fetchedAt != null && staleMs > 10 * 60_000
  const staleMin = Math.round(staleMs / 60_000)
  const nothingYet = liveMatches.length === 0 && todayMatches.length === 0 && pastDays.length === 0

  const refresh = async (): Promise<void> => {
    setRefreshing(true)
    try {
      await refreshResults()
    } finally {
      setRefreshing(false)
    }
  }

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
      <h1>Live</h1>
      <div className="glasshud">
        {liveMatches.length > 0 && (
          <span className="glasshud__live">
            <span className="glasshud__dot" />
            {liveMatches.length} live
          </span>
        )}
        <span className="glasshud__pts">
          <strong>{breakdown.total}</strong> Punkte bisher
        </span>
        <span className="glasshud__spacer" />
        <GoalAlarmToggle />
        <span className={`glasshud__stand${stale ? ' glasshud__stand--stale' : ''}`}>
          {fetchedAt ? `Stand ${kickoffTime(fetchedAt)}` : 'noch keine Daten'}
        </span>
        <button className="glasshud__refresh" onClick={() => void refresh()} disabled={refreshing}>
          {refreshing ? '…' : '↻ Aktualisieren'}
        </button>
      </div>

      {stale && liveMatches.length > 0 && (
        <p className="notice notice--warn" role="status">
          ⚠️ Seit {staleMin} Min keine neuen Daten von ESPN — die Live-Stände unten sind womöglich veraltet. Verbindung
          prüfen oder ↻ Aktualisieren.
        </p>
      )}

      <div className="groupchips">
        {(
          [
            ['spiele', 'Spiele'],
            ['tabellen', 'Tabellen'],
            ['baum', 'Baum']
          ] as Array<[View, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            className={`groupchip groupchip--ko${view === id ? ' groupchip--active' : ''}`}
            onClick={() => setView(id)}
          >
            {label}
            <small>&nbsp;</small>
          </button>
        ))}
      </div>

      {view === 'spiele' && (
        <>
          {nothingYet && (
            <p className="notice">
              Noch keine Ergebnisse — die Resultate erscheinen hier automatisch, sobald das erste Spiel angepfiffen ist.
            </p>
          )}
          {liveMatches.length > 0 && (
            <section className="day">
              <header className="dayhead">
                <h2>Jetzt live</h2>
              </header>
              <div className="liverows liverows--live">{liveMatches.map(row)}</div>
            </section>
          )}
          {todayMatches.length > 0 && (
            <section className="day">
              <header className="dayhead">
                <h2>{dayLabel(todayMatches[0].dateUtc)}</h2>
                <span className="badge badge--today">Heute</span>
              </header>
              <div className="liverows">{todayMatches.map(row)}</div>
            </section>
          )}
          {pastDays.map(([key, matches]) => (
            <section key={key} className="day">
              <header className="dayhead">
                <h2>{dayLabel(matches[0].dateUtc)}</h2>
                <span className="dayhead__count">
                  {matches.length} {matches.length === 1 ? 'Spiel' : 'Spiele'}
                </span>
              </header>
              <div className="liverows">{matches.map(row)}</div>
            </section>
          ))}
        </>
      )}

      {view === 'tabellen' && (
        <>
          <ProjToggle live={liveMatches.length} proj={proj} setProj={setProj} />
          <div className="livetables">
            {GROUPS.map((g) => (
              <section key={g} className="papercard">
                <h3>Gruppe {g}</h3>
                <GroupTable rows={(proj ? projBracket : realBracket).tables[g]} />
              </section>
            ))}
          </div>
        </>
      )}

      {view === 'baum' && (
        <>
          {!realBracket.allGroupsComplete && (
            <p className="notice">
              Der echte Baum füllt sich, sobald die Gruppenphase entschieden ist — Paarungen übernimmt die App direkt aus
              den offiziellen Ansetzungen.
            </p>
          )}
          <ProjToggle live={liveMatches.length} proj={proj} setProj={setProj} />
          <BracketTree
            bracket={proj ? projBracket : realBracket}
            tips={proj ? projTips : realTips}
            championCaption="Weltmeister"
          />
        </>
      )}
    </>
  )
}
