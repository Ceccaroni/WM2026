import { useState } from 'react'
import { TEAM_BY_ID } from '../lib/data'
import { formatOdds, ODDS } from '../lib/info'
import type { TableRow } from '../lib/tournament'
import type { EntryKind, GroupId, ScheduledMatch, Tip } from '../lib/types'
import FlagBadge from './FlagBadge'
import GroupTable from './GroupTable'
import TipRow from './TipRow'

const RANK_LABEL: Record<number, string> = { 1: 'Gruppensieger', 2: 'Gruppenzweiter', 3: 'Gruppendritter' }

/** Entscheidungshilfe für eine Seite: Herkunft, Gruppentabelle (Team hervorgehoben), Turniersieg-Quote. */
function HelpSide({ slot, tables }: { slot: string; tables: Record<GroupId, TableRow[]> }) {
  const team = TEAM_BY_ID.get(slot)
  if (!team) return <div className="kohelp__side kohelp__side--tbd">Steht noch nicht fest</div>
  const rows = tables[team.group] ?? []
  const row = rows.find((r) => r.team === slot)
  const origin = row && row.rank <= 3 ? `${RANK_LABEL[row.rank]} ${team.group}` : `Gruppe ${team.group}`
  const quote = ODDS.odds[slot]
  return (
    <div className="kohelp__side">
      <div className="kohelp__head">
        <FlagBadge flag={team.flag} size="sm" />
        <strong>{team.name}</strong>
        <span className="kohelp__origin">{origin}</span>
      </div>
      <GroupTable rows={rows} highlight={slot} />
      {quote != null && (
        <div className="kohelp__odds">
          <span>Turniersieg-Quote</span>
          <strong>{formatOdds(quote)}</strong>
        </div>
      )}
    </div>
  )
}

/**
 * KO-Tipp-Zeile mit aufklappbarer Entscheidungshilfe ("Form & Quoten"): vergleicht beide
 * Teams nebeneinander — Gruppenresultate/-tabelle (echte Ergebnisse aus tables) + Turniersieg-
 * Quote. Hülle um TipRow, damit die Tipp-Zeile selbst (auch in der Gruppenphase genutzt)
 * unangetastet bleibt. Quoten = Turniersieg-Snapshot als Stärke-Indikator (keine Spiel-Quote).
 */
export default function KoTipMatch({
  match,
  tip,
  slots,
  entry,
  tables
}: {
  match: ScheduledMatch
  tip?: Tip
  slots: { home: string; away: string }
  entry: EntryKind
  tables: Record<GroupId, TableRow[]>
}) {
  const [open, setOpen] = useState(false)
  const homeTeam = TEAM_BY_ID.get(slots.home)
  const awayTeam = TEAM_BY_ID.get(slots.away)
  const canHelp = Boolean(homeTeam || awayTeam)

  // Favorit = niedrigere (wahrscheinlichere) Turniersieg-Quote; nur wenn beide Teams + Quote feststehen.
  const qh = homeTeam ? ODDS.odds[slots.home] : undefined
  const qa = awayTeam ? ODDS.odds[slots.away] : undefined
  const favorite = qh != null && qa != null && qh !== qa ? (qh < qa ? homeTeam : awayTeam) : undefined

  return (
    <div className="kotip">
      <TipRow match={match} tip={tip} slots={slots} entry={entry} />
      {canHelp && (
        <>
          <button className="kohelp-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            <span className={`kohelp-toggle__chev${open ? ' kohelp-toggle__chev--open' : ''}`}>›</span>
            {open ? 'Form & Quoten ausblenden' : 'Form & Quoten'}
          </button>
          {open && (
            <div className="kohelp">
              <div className="kohelp__grid">
                <HelpSide slot={slots.home} tables={tables} />
                <HelpSide slot={slots.away} tables={tables} />
              </div>
              {favorite && <div className="kohelp__fav">★ Favorit lt. Wettquote: {favorite.name}</div>}
            </div>
          )}
        </>
      )}
    </div>
  )
}
