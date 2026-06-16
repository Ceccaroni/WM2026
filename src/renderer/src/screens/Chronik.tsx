import { useEffect, useMemo, useRef, useState } from 'react'
import emblem from '../assets/wm26-emblem.svg'
import FlagBadge from '../components/FlagBadge'
import PlayerPeek from '../components/PlayerPeek'
import { slotInfo, STADIUM_BY_ID } from '../lib/data'
import { buildChronik, TOTAL_DAYS } from '../lib/chronik'
import type { ChronikDay, ChronikTip } from '../lib/chronik'
import { findSquadPlayer } from '../lib/players'
import { dayLabel, dayShort, kickoffTime } from '../lib/time'
import type { LiveResult, MatchEvent, ScheduledMatch, SquadPlayer } from '../lib/types'
import { useApp } from '../store'

type Peek = { teamId: string; player: SquadPlayer }

/** Torschütze/Platzverweis als Album-Notiz — klickbar, wenn die Panini-Karte gefunden wird. */
function ChronikEvent({ ev, teamId, onPeek }: { ev: MatchEvent; teamId?: string; onPeek: (p: Peek) => void }) {
  const icon = ev.kind === 'red' ? '🟥' : '⚽'
  const suffix = ev.kind === 'pen' ? ' (P)' : ev.kind === 'og' ? ' (ET)' : ''
  const squadPlayer = teamId ? findSquadPlayer(teamId, ev.player, ev.jersey) : undefined
  const label = (
    <>
      <small>{ev.minute}</small> {icon} {ev.player}
      {suffix}
    </>
  )
  if (!squadPlayer || !teamId) return <span className="chronikev">{label}</span>
  return (
    <button
      className="chronikev chronikev--card"
      title="Panini-Karte anzeigen"
      onClick={() => onPeek({ teamId, player: squadPlayer })}
    >
      {label}
    </button>
  )
}

/** Tipp-Vergleich aller Profile unter einem beendeten Spiel: Tipp + geholte Punkte,
 *  beste Punktzahl in Gold, das eigene Profil hervorgehoben. */
function MatchTips({ tips, activeId }: { tips: ChronikTip[]; activeId: string | null }) {
  const best = Math.max(0, ...tips.map((t) => t.base + t.advance))
  return (
    <div className="chroniktips">
      {tips.map((t) => {
        const pts = t.base + t.advance
        const top = pts > 0 && pts === best
        return (
          <div
            key={t.profile.id}
            className={`chroniktips__row${t.profile.id === activeId ? ' chroniktips__row--me' : ''}`}
          >
            <span className="lbrow__dot" style={{ background: t.profile.color }} />
            <span className="chroniktips__name">{t.profile.name}</span>
            <span className={`chroniktips__tip${t.tip ? '' : ' chroniktips__tip--none'}`}>
              {t.tip ? `${t.tip.h}:${t.tip.a}` : '–'}
            </span>
            <span className={`chroniktips__pts${top ? ' chroniktips__pts--best' : ''}${pts === 0 ? ' chroniktips__pts--zero' : ''}`}>
              <strong>{pts > 0 ? `+${pts}` : t.tip ? '0' : '–'}</strong>
              {t.kind === 'exact' && <small>exakt</small>}
              {t.advance > 0 && <small>inkl. +{t.advance} Weiter</small>}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Eine Spielzeile der Albumseite: Endstand (Sieger gold) + Torschützen + Tipp-Vergleich. */
function ChronikMatch({
  match,
  result,
  tips,
  activeId,
  onPeek
}: {
  match: ScheduledMatch
  result?: LiveResult
  tips?: ChronikTip[]
  activeId: string | null
  onPeek: (p: Peek) => void
}) {
  const home = slotInfo(result?.homeTeam ?? match.home)
  const away = slotInfo(result?.awayTeam ?? match.away)
  const stadium = STADIUM_BY_ID.get(match.stadium)!
  const finished = result?.status === 'finished'
  const running = result?.status === 'live' || result?.status === 'ht'
  const teamIdOf = (side: 'home' | 'away'): string | undefined => {
    const id = result?.[side === 'home' ? 'homeTeam' : 'awayTeam'] ?? match[side]
    return slotInfo(id).placeholder ? undefined : id
  }

  return (
    <div className={`chronikmatch${finished ? '' : ' chronikmatch--open'}`}>
      <div className="chronikmatch__row">
        <span className="chronikmatch__info">
          <small>
            #{match.match}
            {match.group ? ` · Gruppe ${match.group}` : ''}
          </small>
          <small className="chronikmatch__city">{stadium.city}</small>
        </span>
        <span className="chronikmatch__team chronikmatch__team--home">
          <span className={`chronikmatch__name${finished && result.winner === 'home' ? ' chronikmatch__name--winner' : ''}`}>
            {home.name}
          </span>
          <FlagBadge flag={home.flag} label={home.badge} />
        </span>
        {finished || running ? (
          <span className={`chronikmatch__score${running ? ' chronikmatch__score--live' : ''}`}>
            <strong>
              {result.homeScore}:{result.awayScore}
            </strong>
            <small>
              {result.pens
                ? `${result.pens.home}:${result.pens.away} i.E.`
                : result.aet
                  ? 'n.V.'
                  : running
                    ? 'läuft'
                    : ''}
            </small>
          </span>
        ) : (
          <span className="chronikmatch__score chronikmatch__score--pre">
            <strong>{kickoffTime(match.dateUtc)}</strong>
            <small>MESZ</small>
          </span>
        )}
        <span className="chronikmatch__team">
          <FlagBadge flag={away.flag} label={away.badge} />
          <span className={`chronikmatch__name${finished && result.winner === 'away' ? ' chronikmatch__name--winner' : ''}`}>
            {away.name}
          </span>
        </span>
        <span className="chronikmatch__pad" />
      </div>
      {(result?.events?.length ?? 0) > 0 && (
        <div className="chronikmatch__events">
          {(['home', 'away'] as const).map((side) => (
            <span key={side} className={`chronikmatch__evcol chronikmatch__evcol--${side}`}>
              {result!.events!
                .filter((e) => e.side === side)
                .map((e, i) => (
                  <ChronikEvent key={`${e.minute}-${e.player}-${i}`} ev={e} teamId={teamIdOf(side)} onPeek={onPeek} />
                ))}
            </span>
          ))}
        </div>
      )}
      {finished && tips && tips.length > 0 && <MatchTips tips={tips} activeId={activeId} />}
    </div>
  )
}

/** Rangbewegung gegenüber dem Vortag: ▲2 / ▼1 / – */
function Movement({ rank, prevRank }: { rank: number; prevRank?: number }) {
  // immer rendern — die Zelle hält die Grid-Spalten auch ohne Vortag in Position
  if (prevRank == null) return <small className="chronikstand__move" />
  const diff = prevRank - rank
  if (diff > 0) return <small className="chronikstand__move chronikstand__move--up">▲{diff}</small>
  if (diff < 0) return <small className="chronikstand__move chronikstand__move--down">▼{-diff}</small>
  return <small className="chronikstand__move">·</small>
}

/** Eine Albumseite pro Turniertag — das automatisch entstehende WM-Tagebuch. */
function DayPage({
  day,
  results,
  activeId,
  onPeek
}: {
  day: ChronikDay
  results: Record<number, LiveResult>
  activeId: string | null
  onPeek: (p: Peek) => void
}) {
  const date = dayLabel(day.matches[0].dateUtc)
  const summary = [
    day.complete
      ? `${day.matches.length} ${day.matches.length === 1 ? 'Spiel' : 'Spiele'}`
      : `${day.finished.size}/${day.matches.length} Spiele beendet`,
    day.goals === 1 ? '1 Tor' : `${day.goals} Tore`,
    ...(day.reds > 0 ? [`${day.reds}× Rot`] : [])
  ].join(' · ')

  return (
    <article className="album chronikpage">
      <header className="album__head">
        <div>
          <h2>Tag {day.index}</h2>
          <p className="chronikpage__sub">
            {date} — {day.phase}
            {!day.complete && <span className="chronikpage__running"> · Tag läuft noch</span>}
          </p>
        </div>
        <span className="album__sticker">
          <span className="chronikpage__no">{day.index}</span>
          Seite {day.index}/{TOTAL_DAYS}
        </span>
      </header>

      <p className="chronikpage__summary">{summary}</p>
      <div className="chronikpage__matches">
        {day.matches.map((m) => (
          <ChronikMatch
            key={m.match}
            match={m}
            result={results[m.match]}
            tips={day.matchTips[m.match]}
            activeId={activeId}
            onPeek={onPeek}
          />
        ))}
      </div>

      <h3 className="chronikpage__h">Tagespunkte{day.complete ? '' : ' (Zwischenstand)'}</h3>
      <div className="chronikpts">
        {day.rows
          .slice()
          .sort((a, b) => b.dayPts - a.dayPts || a.profile.name.localeCompare(b.profile.name, 'de'))
          .map((r) => {
            const win = day.bestPts > 0 && r.dayPts === day.bestPts
            return (
              <span key={r.profile.id} className={`chronikpts__chip${win ? ' chronikpts__chip--win' : ''}${r.dayPts === 0 ? ' chronikpts__chip--zero' : ''}`}>
                {win && <span className="chronikpts__crown">👑</span>}
                <span className="lbrow__dot" style={{ background: r.profile.color }} />
                {r.profile.name}
                <strong>+{r.dayPts}</strong>
                {r.dayExact > 0 && <small>{r.dayExact}× exakt</small>}
              </span>
            )
          })}
      </div>

      <h3 className="chronikpage__h">Stand nach Tag {day.index}</h3>
      <div className="chronikstand">
        {day.rows.map((r) => (
          <div key={r.profile.id} className={`chronikstand__row${r.rank === 1 && r.total > 0 ? ' chronikstand__row--first' : ''}`}>
            <span className="chronikstand__rank">{r.rank}</span>
            <Movement rank={r.rank} prevRank={r.prevRank} />
            <span className="lbrow__dot" style={{ background: r.profile.color }} />
            <span className="chronikstand__name">{r.profile.name}</span>
            <strong className="chronikstand__total">{r.total}</strong>
          </div>
        ))}
      </div>
    </article>
  )
}

/** Turnier-Chronik: das WM-Tagebuch, Tag für Tag automatisch eingeklebt. */
export default function Chronik() {
  const profiles = useApp((s) => s.profiles)
  const entries = useApp((s) => s.entries)
  const results = useApp((s) => s.results)
  const scoring = useApp((s) => s.scoring)
  const activeId = useApp((s) => s.activeProfileId)
  const [selected, setSelected] = useState<string | null>(null)
  const [peek, setPeek] = useState<Peek | null>(null)
  const [printing, setPrinting] = useState(false)

  const days = useMemo(() => buildChronik(profiles, entries, results, scoring), [profiles, entries, results, scoring])
  const day = days.find((d) => d.key === selected) ?? days.at(-1)

  // Im horizontalen Tages-Streifen (Mobile) den aktiven Tag in die Mitte scrollen.
  // Auf dem Desktop (Raster, nicht horizontal scrollbar) ein No-Op.
  const chipsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = chipsRef.current?.querySelector<HTMLElement>('.groupchip--active')
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [day?.key])

  // PDF-Export zweiphasig: erst den Print-Modus rendern (Deckblatt + ALLE Tagesseiten
  // im @media-print-DOM), dann druckt der Main-Prozess via printToPDF.
  useEffect(() => {
    if (!printing) return
    let cancelled = false
    const t = setTimeout(() => {
      void window.wm26.exportChronikPdf().finally(() => {
        if (!cancelled) setPrinting(false)
      })
    }, 80)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [printing])

  return (
    <>
      <h1>Turnier-Chronik</h1>
      <p className="lead">
        Das WM-Tagebuch klebt sich von selbst: pro Turniertag eine Albumseite mit Spielen, Torschützen, Tagespunkten
        und dem Stand der Runde.
      </p>

      {days.length === 0 ? (
        <p className="notice">Noch keine Seite im Tagebuch — die Chronik beginnt mit dem ersten beendeten Spiel.</p>
      ) : (
        <>
          <div className="chronikbar">
            <div className="groupchips" ref={chipsRef}>
              {days.map((d) => (
                <button
                  key={d.key}
                  className={`groupchip${d.key === day!.key ? ' groupchip--active' : ''}${d.complete ? ' groupchip--done' : ''}`}
                  onClick={() => setSelected(d.key)}
                >
                  Tag {d.index}
                  <small>{dayShort(d.matches[0].dateUtc)}</small>
                </button>
              ))}
            </div>
            <button
              className="filters__ics"
              title="Alle bisherigen Tagesseiten als PDF-Tagebuch sichern"
              disabled={printing}
              onClick={() => setPrinting(true)}
            >
              {printing ? '⏳ PDF wird erstellt …' : '📄 Als PDF sichern'}
            </button>
          </div>
          <DayPage day={day!} results={results} activeId={activeId} onPeek={setPeek} />
        </>
      )}
      {peek && <PlayerPeek teamId={peek.teamId} player={peek.player} onClose={() => setPeek(null)} />}
      {printing && (
        <div className="chronikprint">
          <div className="chronikcover">
            <img src={emblem} alt="" />
            <h2>Turnier-Chronik</h2>
            <p>
              Das WM-2026-Tagebuch von {profiles.map((p) => p.name).join(' · ')}
            </p>
            <small>
              Stand: {dayLabel(new Date().toISOString())} · Tag {days.length}/{TOTAL_DAYS} · erstellt mit WM26 Tipp
            </small>
          </div>
          {days.map((d) => (
            <DayPage key={d.key} day={d} results={results} activeId={activeId} onPeek={() => {}} />
          ))}
        </div>
      )}
    </>
  )
}
