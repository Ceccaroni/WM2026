import { useState } from 'react'
import { ROUND_LABEL, slotInfo, STADIUM_BY_ID, TEAM_BY_ID } from '../lib/data'
import { findSquadPlayer } from '../lib/players'
import { scoreMatch } from '../lib/scoring'
import { dayShort, isLocked, kickoffTime } from '../lib/time'
import type { CompareEntry } from '../lib/compare'
import type { LiveResult, MatchEvent, MatchLineup, ScheduledMatch, ScoringConfig, SquadPlayer, Tip } from '../lib/types'
import FlagBadge from './FlagBadge'
import FormationPitch from './FormationPitch'
import PlayerPeek from './PlayerPeek'

export const isRunning = (r?: LiveResult): boolean => r?.status === 'live' || r?.status === 'ht'

/** Punkte-Sticker: gold = exakter Treffer (Foil als Belohnung), gestrichelt = live/provisorisch. */
export function PointsPill({ pts, exact, provisional }: { pts: number; exact: boolean; provisional: boolean }) {
  const cls = exact ? ' ptspill--exact' : pts === 0 ? ' ptspill--zero' : ''
  return (
    <span
      className={`ptspill${cls}${provisional ? ' ptspill--live' : ''}`}
      title={provisional ? 'Stand jetzt — Spiel läuft noch' : undefined}
    >
      +{pts}
    </span>
  )
}

/**
 * Tor/Platzverweis als Chip: „⚽ 67' Hwang In-Beom". Findet das Matching den Spieler
 * im WM-Kader, öffnet ein Klick seine Panini-Karte (PlayerPeek) — die Brücke vom
 * Live-Ereignis ins Sticker-Album.
 */
function EventChip({
  ev,
  teamId,
  onPeek
}: {
  ev: MatchEvent
  teamId?: string
  onPeek: (p: { teamId: string; player: SquadPlayer }) => void
}) {
  const icon = ev.kind === 'red' ? '🟥' : '⚽'
  const suffix = ev.kind === 'pen' ? ' (P)' : ev.kind === 'og' ? ' (ET)' : ''
  const squadPlayer = teamId ? findSquadPlayer(teamId, ev.player, ev.jersey) : undefined
  const label = (
    <>
      <small>{ev.minute}</small> {icon} {ev.player}
      {suffix}
    </>
  )
  if (!squadPlayer || !teamId) return <span className="liverow__ev">{label}</span>
  return (
    <button
      className="liverow__ev liverow__ev--card"
      title="Panini-Karte anzeigen"
      onClick={(e) => {
        e.stopPropagation()
        onPeek({ teamId, player: squadPlayer })
      }}
    >
      {label}
    </button>
  )
}

/**
 * Ergebniszeile (Live/Heute). Mit `compare` wird die Zeile aufklappbar und zeigt
 * die Tipps aller Profile zu diesem Spiel — fremde erst ab Anstoß (lib/compare.ts).
 */
export default function LiveRow({
  match,
  result,
  tip,
  slots,
  scoring,
  bonusPts = 0,
  compare,
  lineup
}: {
  match: ScheduledMatch
  result?: LiveResult
  tip?: Tip
  /** Aus dem echten Baum aufgelöste Teams (KO), falls ESPN sie noch nicht nennt */
  slots?: { home: string; away: string }
  scoring: ScoringConfig
  /** Weiterkommer-Bonus dieses Spiels (aus der Gesamtwertung) */
  bonusPts?: number
  /** Tipps aller Profile zu diesem Spiel — aktiviert das Aufklappen */
  compare?: CompareEntry[]
  /** Aufstellungen beider Teams (ESPN summary), sobald verfügbar — aktiviert ebenfalls das Aufklappen */
  lineup?: MatchLineup
}) {
  const [open, setOpen] = useState(false)
  const [peek, setPeek] = useState<{ teamId: string; player: SquadPlayer } | null>(null)
  const home = slotInfo(result?.homeTeam ?? slots?.home ?? match.home)
  const away = slotInfo(result?.awayTeam ?? slots?.away ?? match.away)
  // Echte Team-IDs (für Kader-Karten der Torschützen) — Platzhalter wie „1A" zählen nicht
  const teamIdOf = (side: 'home' | 'away'): string | undefined => {
    const id = result?.[side === 'home' ? 'homeTeam' : 'awayTeam'] ?? slots?.[side] ?? match[side]
    return TEAM_BY_ID.has(id) ? id : undefined
  }
  const stadium = STADIUM_BY_ID.get(match.stadium)!
  const running = isRunning(result)
  const finished = result?.status === 'finished'
  const hasScore = result != null && (running || finished)
  const hasLineup = !!lineup && (!!lineup.home || !!lineup.away)
  const hasCompare = compare != null && compare.length > 1
  const expandable = hasCompare || hasLineup
  const revealed = isLocked(match.dateUtc)

  const base = tip && result && hasScore ? scoreMatch(tip, { ...result, status: 'finished' }, scoring) : undefined
  const pts = base !== undefined ? base + (finished ? bonusPts : 0) : undefined

  const cmpPts = (c: CompareEntry): { pts: number; exact: boolean } | undefined => {
    if (!c.tip || !result || !hasScore) return undefined
    const b = scoreMatch(c.tip, { ...result, status: 'finished' }, scoring)
    return { pts: b + (finished ? c.advance : 0), exact: b === scoring.exact && finished }
  }

  return (
    <div className="liverowwrap">
      <div
        className={`liverow${running ? ' liverow--live' : ''}${result?.delayed ? ' liverow--delayed' : ''}${expandable ? ' liverow--expandable' : ''}`}
        onClick={expandable ? () => setOpen((o) => !o) : undefined}
        title={
          expandable
            ? hasLineup
              ? hasCompare
                ? 'Klicken: Aufstellungen & Tipps'
                : 'Klicken: Aufstellungen ansehen'
              : 'Klicken: Tipps der Runde vergleichen'
            : undefined
        }
      >
        <span className="liverow__info">
          <strong>#{match.match}</strong> {dayShort(match.dateUtc)}
          <small>
            {match.group ? `Gruppe ${match.group}` : ROUND_LABEL[match.round]} · {stadium.city}
          </small>
        </span>
        <span className="liverow__team liverow__team--home">
          <span className={`liverow__name${finished && result.winner === 'home' ? ' liverow__name--winner' : ''}`}>
            {home.name}
          </span>
          <FlagBadge flag={home.flag} label={home.badge} size="lg" />
        </span>
        {hasScore ? (
          <span className="liverow__score">
            <strong>
              {result.homeScore}:{result.awayScore}
            </strong>
            <small>
              {result.delayed
                ? '⏸ Unterbrochen'
                : result.pens
                  ? `${result.pens.home}:${result.pens.away} i.E.`
                  : result.aet
                    ? 'n.V.'
                    : running
                      ? (result.status === 'ht' ? 'Halbzeit' : (result.minute ?? 'live'))
                      : 'Endstand'}
            </small>
          </span>
        ) : result?.postponed ? (
          <span className="liverow__score liverow__score--pre liverow__score--postponed">
            <strong>verschoben</strong>
            <small>kein Termin</small>
          </span>
        ) : (
          <span className="liverow__score liverow__score--pre">
            <strong>{kickoffTime(match.dateUtc)}</strong>
            <small>MESZ</small>
          </span>
        )}
        <span className="liverow__team">
          <FlagBadge flag={away.flag} label={away.badge} size="lg" />
          <span className={`liverow__name${finished && result.winner === 'away' ? ' liverow__name--winner' : ''}`}>
            {away.name}
          </span>
        </span>
        <span className="liverow__tip">
          {tip ? (
            <>
              <span className="liverow__tiplabel">
                Tipp {tip.h}:{tip.a}
              </span>
              {pts !== undefined && <PointsPill pts={pts} exact={base === scoring.exact && finished} provisional={running} />}
            </>
          ) : hasScore ? (
            <span className="liverow__notip">kein Tipp</span>
          ) : null}
          {expandable && <span className={`liverow__chev${open ? ' liverow__chev--open' : ''}`}>›</span>}
        </span>
      </div>
      {hasScore && (result.events?.length ?? 0) > 0 && (
        <div className="liverow__events">
          {(['home', 'away'] as const).map((side) => (
            <span key={side} className={`liverow__evcol liverow__evcol--${side}`}>
              {result.events!
                .filter((e) => e.side === side)
                .map((e, i) => (
                  <EventChip key={`${e.minute}-${e.player}-${i}`} ev={e} teamId={teamIdOf(side)} onPeek={setPeek} />
                ))}
            </span>
          ))}
        </div>
      )}
      {peek && <PlayerPeek teamId={peek.teamId} player={peek.player} onClose={() => setPeek(null)} />}
      {open && hasLineup && (
        <FormationPitch
          lineup={lineup!}
          homeTeamId={teamIdOf('home')}
          awayTeamId={teamIdOf('away')}
          onPeek={setPeek}
        />
      )}
      {open && hasCompare && (
        <div className="cmp">
          {compare!.map((c) => {
            const p = cmpPts(c)
            return (
              <span key={c.id} className={`cmp__row${c.me ? ' cmp__row--me' : ''}`}>
                <span className="lbrow__dot" style={{ background: c.color }} />
                <span className="cmp__name">{c.name}</span>
                {c.tip ? (
                  <>
                    <span className="cmp__tip">
                      {c.tip.h}:{c.tip.a}
                      {c.tip.adv && <small> · {c.tip.adv === 'home' ? home.name : away.name} weiter</small>}
                    </span>
                    {p && <PointsPill pts={p.pts} exact={p.exact} provisional={running} />}
                  </>
                ) : c.hasTip ? (
                  <span className="cmp__hidden">getippt ✓ — sichtbar ab Anstoß</span>
                ) : (
                  <span className="cmp__hidden">kein Tipp</span>
                )}
              </span>
            )
          })}
          {!revealed && <small className="cmp__note">Fremde Tipps werden beim Anstoß aufgedeckt.</small>}
        </div>
      )}
    </div>
  )
}
