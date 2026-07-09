import { ROUND_LABEL, slotInfo, STADIUM_BY_ID } from '../lib/data'
import { isLocked, kickoffTime } from '../lib/time'
import type { ScheduledMatch, Tip } from '../lib/types'
import FlagBadge from './FlagBadge'

export default function MatchCard({
  match,
  tip,
  slots
}: {
  match: ScheduledMatch
  tip?: Tip
  /** echte Paarung (KO), sobald bekannt — sonst greift die statische Schedule-Paarung */
  slots?: { home: string; away: string }
}) {
  const home = slotInfo(slots?.home ?? match.home)
  const away = slotInfo(slots?.away ?? match.away)
  const stadium = STADIUM_BY_ID.get(match.stadium)!
  const locked = isLocked(match.dateUtc)

  return (
    <article className={`matchcard${locked ? ' matchcard--past' : ''}`}>
      <span className="matchcard__num">{match.match}</span>
      <div className="matchcard__teams">
        <span className="matchcard__team matchcard__team--home">
          <span className={`matchcard__name${home.placeholder ? ' matchcard__name--tbd' : ''}`}>{home.name}</span>
          <FlagBadge flag={home.flag} label={home.badge} />
        </span>
        <span className="matchcard__time">
          <strong>{kickoffTime(match.dateUtc)}</strong>
          <small>MESZ</small>
        </span>
        <span className="matchcard__team">
          <FlagBadge flag={away.flag} label={away.badge} />
          <span className={`matchcard__name${away.placeholder ? ' matchcard__name--tbd' : ''}`}>{away.name}</span>
        </span>
      </div>
      <footer className="matchcard__meta">
        <span className={`badge ${match.group ? 'badge--group' : 'badge--round'}`}>
          {match.group ? `Gruppe ${match.group}` : ROUND_LABEL[match.round]}
        </span>
        <span className="matchcard__venue">
          {stadium.commonName} · {stadium.city}
        </span>
        {tip && (
          <span className="badge badge--tip">
            Mein Tipp {tip.h}:{tip.a}
          </span>
        )}
      </footer>
    </article>
  )
}
