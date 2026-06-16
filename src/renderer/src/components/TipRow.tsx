import { slotInfo, STADIUM_BY_ID, TEAM_BY_ID } from '../lib/data'
import { MARTIN_MODE } from '../lib/martin'
import { dayShort, isLocked, kickoffTime } from '../lib/time'
import type { EntryKind, ScheduledMatch, Tip } from '../lib/types'
import { useApp } from '../store'
import FlagBadge from './FlagBadge'
import ScoreStepper from './ScoreStepper'

/**
 * Eine Tipp-Zeile (Albumseite). entry = Wertungskategorie: Hauptwertung ('main')
 * oder Späteinstieg ('fromR32'…). slots = aufgelöste Teams, falls home/away des
 * Spielplans noch Platzhalter sind.
 */
export default function TipRow({
  match,
  tip,
  slots,
  entry = 'main'
}: {
  match: ScheduledMatch
  tip?: Tip
  slots?: { home: string; away: string }
  entry?: EntryKind
}) {
  const setTip = useApp((s) => s.setTip)
  const homeSlot = slots?.home ?? match.home
  const awaySlot = slots?.away ?? match.away
  const home = slotInfo(homeSlot)
  const away = slotInfo(awaySlot)
  const stadium = STADIUM_BY_ID.get(match.stadium)!
  // Martin-Spezial (nur in der Sonder-Build): Tipp-Sperre aufheben, damit gelaufene Spiele
  // nachgetragen werden können. isLocked selbst bleibt unangetastet (Live-Reveal/„vergangen"-Optik).
  const locked = isLocked(match.dateUtc) && !MARTIN_MODE
  const missed = locked && !tip
  const unresolved = home.placeholder || away.placeholder
  const isKo = match.round !== 'group'
  const needsAdv = isKo && !!tip && tip.h === tip.a && !unresolved

  return (
    <div className={`tiprow${locked ? ' tiprow--locked' : ''}${missed ? ' tiprow--missed' : ''}`}>
      <span className="tiprow__info">
        <strong>#{match.match}</strong> {dayShort(match.dateUtc)} · {kickoffTime(match.dateUtc)} MESZ
        <small>{stadium.city}</small>
      </span>
      <span className="tiprow__team tiprow__team--home">
        <span className="tiprow__name">{home.name}</span>
        <FlagBadge flag={home.flag} label={home.badge} size="lg" />
      </span>
      <span className="tiprow__score">
        <ScoreStepper
          value={tip?.h}
          disabled={locked || unresolved}
          onChange={(h) => setTip(match.match, { ...tip, h, a: tip?.a ?? 0 }, entry)}
        />
        <span className="tiprow__colon">:</span>
        <ScoreStepper
          value={tip?.a}
          disabled={locked || unresolved}
          onChange={(a) => setTip(match.match, { ...tip, h: tip?.h ?? 0, a }, entry)}
        />
      </span>
      <span className="tiprow__team">
        <FlagBadge flag={away.flag} label={away.badge} size="lg" />
        <span className="tiprow__name">{away.name}</span>
      </span>
      <span className="tiprow__state">
        {missed ? (
          <span className="tiprow__missedlabel">verpasst</span>
        ) : locked ? (
          <span className="tiprow__sealed">eingeklebt</span>
        ) : tip ? (
          <button className="tiprow__clear" onClick={() => setTip(match.match, null, entry)} aria-label="Tipp löschen">
            ✕
          </button>
        ) : null}
      </span>
      {needsAdv && (
        <div className={`advpick${tip.adv ? '' : ' advpick--open'}`}>
          <span>{match.round === 'third' || match.round === 'final' ? 'Wer gewinnt?' : 'Wer kommt weiter?'}</span>
          {(['home', 'away'] as const).map((side) => {
            const teamSlot = side === 'home' ? homeSlot : awaySlot
            const team = TEAM_BY_ID.get(teamSlot)
            return (
              <button
                key={side}
                className={`advpick__btn${tip.adv === side ? ' advpick__btn--active' : ''}`}
                disabled={locked}
                onClick={() => setTip(match.match, { ...tip, adv: side }, entry)}
              >
                <FlagBadge flag={team?.flag} size="sm" /> {team?.id ?? '—'}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
