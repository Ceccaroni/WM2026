import { TEAM_BY_ID } from '../lib/data'
import type { TableRow } from '../lib/tournament'
import type { TeamId } from '../lib/types'
import FlagBadge from './FlagBadge'

/** Live aus den Tipps berechnete Gruppentabelle (Album-Optik). highlight hebt ein
 *  bestimmtes Team hervor (z. B. das betreffende Land in der KO-Tipp-Hilfe). */
export default function GroupTable({ rows, highlight }: { rows: TableRow[]; highlight?: TeamId }) {
  return (
    <table className="grouptable">
      <thead>
        <tr>
          <th>#</th>
          <th className="grouptable__teamcol">Team</th>
          <th>Sp</th>
          <th>Tore</th>
          <th>TD</th>
          <th>Pkt</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const team = TEAM_BY_ID.get(r.team)!
          const cls = [
            r.rank <= 2 ? 'grouptable__row--in' : r.rank === 3 ? 'grouptable__row--maybe' : '',
            r.team === highlight ? 'grouptable__row--you' : ''
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <tr key={r.team} className={cls}>
              <td>{r.rank}</td>
              <td className="grouptable__teamcol">
                <FlagBadge flag={team.flag} size="sm" />
                <span>{team.name}</span>
                {r.coinflip && (
                  <span className="grouptable__coin" title="Komplett gleichauf — Reihenfolge wäre Losentscheid">
                    ⚖
                  </span>
                )}
              </td>
              <td>{r.played}</td>
              <td>
                {r.gf}:{r.ga}
              </td>
              <td>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
              <td className="grouptable__pts">{r.points}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
