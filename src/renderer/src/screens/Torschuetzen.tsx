import { useMemo, useState } from 'react'
import FlagBadge from '../components/FlagBadge'
import PlayerPeek from '../components/PlayerPeek'
import { slotInfo } from '../lib/data'
import { playerSlug } from '../lib/info'
import { initials, PLAYER_PHOTOS, POS_LABEL } from '../lib/players'
import { buildScorers } from '../lib/scorers'
import type { ScorerEntry } from '../lib/scorers'
import type { SquadPlayer } from '../lib/types'
import { useApp } from '../store'

type Peek = { teamId: string; player: SquadPlayer }

/** Eine Zeile der Torjägerliste — klickbar, wenn die Panini-Karte gefunden wird. */
function ScorerRow({ s, rank, lead, onPeek }: { s: ScorerEntry; rank: number; lead: boolean; onPeek: (p: Peek) => void }) {
  const team = slotInfo(s.teamId)
  const photo = s.squad ? PLAYER_PHOTOS.get(playerSlug(s.teamId, s.squad.name)) : undefined
  const inner = (
    <>
      <span className="scorer__rank">{lead ? '👟' : rank}</span>
      <span className="scorer__face">
        {photo ? (
          <img src={photo} alt="" decoding="async" />
        ) : (
          <span className="scorer__initials">{initials(s.name)}</span>
        )}
      </span>
      <span className="scorer__id">
        <span className="scorer__name">{s.name}</span>
        <small>
          {team.name}
          {s.squad ? ` · ${POS_LABEL[s.squad.pos]}` : ''}
        </small>
      </span>
      <FlagBadge flag={team.flag} label={team.badge} size="sm" />
      <span className="scorer__goals">
        <strong>{s.goals}</strong>
        <small>
          {s.goals === 1 ? 'Tor' : 'Tore'}
          {s.penalties > 0 ? ` · ${s.penalties} E` : ''}
        </small>
      </span>
    </>
  )
  const cls = `scorer${lead ? ' scorer--lead' : ''}${s.squad ? ' scorer--card' : ''}`
  if (!s.squad) return <div className={cls}>{inner}</div>
  return (
    <button className={cls} title="Panini-Karte anzeigen" onClick={() => onPeek({ teamId: s.teamId, player: s.squad! })}>
      {inner}
    </button>
  )
}

/** Torschützen-Rubrik: das Rennen um den Goldenen Schuh, aus allen MatchEvents. */
export default function Torschuetzen() {
  const results = useApp((s) => s.results)
  const [peek, setPeek] = useState<Peek | null>(null)
  const scorers = useMemo(() => buildScorers(results), [results])

  // kompetitive Ränge: gleiche Torzahl teilt den Rang
  const ranked = useMemo(() => {
    let lastGoals = -1
    let lastRank = 0
    return scorers.map((s, i) => {
      const rank = s.goals === lastGoals ? lastRank : i + 1
      lastGoals = s.goals
      lastRank = rank
      return { s, rank }
    })
  }, [scorers])
  const topGoals = scorers[0]?.goals ?? 0

  return (
    <>
      <h1>Torschützen</h1>
      <p className="lead">
        Das Rennen um den Goldenen Schuh — alle Treffer des Turniers. Klick auf einen Namen öffnet seine Panini-Karte.
      </p>
      {ranked.length === 0 ? (
        <p className="notice">Noch keine Tore — die Liste füllt sich mit dem ersten Treffer.</p>
      ) : (
        <div className="scorers">
          {ranked.map(({ s, rank }) => (
            <ScorerRow key={`${s.teamId}-${s.name}`} s={s} rank={rank} lead={rank === 1 && topGoals > 0} onPeek={setPeek} />
          ))}
        </div>
      )}
      {peek && <PlayerPeek teamId={peek.teamId} player={peek.player} onClose={() => setPeek(null)} />}
    </>
  )
}
