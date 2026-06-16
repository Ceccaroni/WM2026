import { ROUND_LABEL, slotInfo, STADIUM_BY_ID } from '../lib/data'
import { dayShort, kickoffTime } from '../lib/time'
import type { ScheduledMatch } from '../lib/types'
import { useApp } from '../store'
import FlagBadge from './FlagBadge'

/**
 * Kompakte Spielzeile für Album-Papierseiten (Stadion-Karten, Team-Seiten).
 * KO-Paarungen zeigen echte Teams laut ESPN, sobald bekannt; beendete Spiele
 * den Endstand, laufende den Live-Stand.
 */
export default function MiniMatchRow({ match, showVenue = false }: { match: ScheduledMatch; showVenue?: boolean }) {
  const result = useApp((s) => s.results[match.match])
  const home = slotInfo(result?.homeTeam ?? match.home)
  const away = slotInfo(result?.awayTeam ?? match.away)
  const stadium = STADIUM_BY_ID.get(match.stadium)!
  const live = result?.status === 'live' || result?.status === 'ht'
  const score =
    result && result.status !== 'scheduled' && result.homeScore != null
      ? `${result.homeScore}:${result.awayScore}${result.pens ? ' i.E.' : result.aet ? ' n.V.' : ''}`
      : undefined

  return (
    <li className={`minirow${showVenue ? ' minirow--venue' : ''}`}>
      <small>
        {dayShort(match.dateUtc)} {kickoffTime(match.dateUtc)}
      </small>
      <span className="minirow__pairing">
        <FlagBadge flag={home.flag} label={home.badge} size="sm" />
        <span className={home.placeholder ? 'minirow__tbd' : ''}>{home.name}</span>
        <span className={`minirow__mid${live ? ' minirow__mid--live' : ''}`}>{score ?? '–'}</span>
        <span className={away.placeholder ? 'minirow__tbd' : ''}>{away.name}</span>
        <FlagBadge flag={away.flag} label={away.badge} size="sm" />
      </span>
      {showVenue && (
        <span className="minirow__venue">
          {stadium.commonName}, {stadium.city}
        </span>
      )}
      <span className={`badge ${match.group ? 'badge--group' : 'badge--round'}`}>
        {match.group ? `Gruppe ${match.group}` : ROUND_LABEL[match.round]}
      </span>
    </li>
  )
}
