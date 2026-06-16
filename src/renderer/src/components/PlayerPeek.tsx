import { useEffect } from 'react'
import { playerSlug } from '../lib/info'
import { initials, PLAYER_CREDITS, PLAYER_PHOTOS, POS_LABEL } from '../lib/players'
import { TEAM_BY_ID } from '../lib/data'
import type { SquadPlayer } from '../lib/types'
import HoloSticker from './HoloSticker'

/**
 * Panini-Karte als Overlay — öffnet sich beim Klick auf einen Torschützen/Platzverweis
 * in der LiveRow (die Brücke vom Live-Ereignis ins Sticker-Album). Klick daneben
 * oder Escape schließt.
 */
export default function PlayerPeek({
  teamId,
  player,
  onClose
}: {
  teamId: string
  player: SquadPlayer
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const slug = playerSlug(teamId, player.name)
  const photo = PLAYER_PHOTOS.get(slug)
  const credit = PLAYER_CREDITS[slug]
  const team = TEAM_BY_ID.get(teamId)

  return (
    <div className="peek" onClick={onClose} role="dialog" aria-label={player.name}>
      <div className="peek__card" onClick={(e) => e.stopPropagation()}>
        <HoloSticker className="playercard">
          <span className="playercard__no">
            Nº {player.no}
            {player.captain ? ' · ©' : ''}
          </span>
          {photo ? (
            <img
              className="playercard__photo"
              src={photo}
              alt={player.name}
              decoding="async"
              title={credit ? `Foto: ${credit.author} (${credit.license}, Wikimedia Commons)` : undefined}
            />
          ) : (
            <span className="playercard__photo playercard__photo--fallback">
              <span className="playercard__26">26</span>
              <span className="playercard__initials">{initials(player.name)}</span>
            </span>
          )}
          <span className="playercard__bar">{player.name}</span>
          <span className="playercard__meta">
            {POS_LABEL[player.pos]}
            <small>
              {team?.name} · {player.club}
            </small>
          </span>
        </HoloSticker>
      </div>
    </div>
  )
}
