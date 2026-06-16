import { useMemo, useState } from 'react'
import FlagBadge from '../components/FlagBadge'
import HoloSticker from '../components/HoloSticker'
import MiniMatchRow from '../components/MiniMatchRow'
import Crest from '../components/Crest'
import { GROUP_TEAMS, GROUPS, SCHEDULE, TEAMS } from '../lib/data'
import { formatOdds, ODDS, playerSlug, squad, standDatum, teamInfo } from '../lib/info'
import { initials, PLAYER_CREDITS, PLAYER_PHOTOS, POS_LABEL } from '../lib/players'
import { dayShort, kickoffTime } from '../lib/time'
import type { SquadPlayer, Team } from '../lib/types'
import { useApp } from '../store'

const bornFmt = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })

/** Panini-Spielerkarte: Foto (oder Initialen-Fallback), Datenbalken, Holo + Tilt beim Hover. */
function PlayerCard({ team, index, star }: { team: Team; index: number; star: { name: string; club: string; role: string } }) {
  const slug = playerSlug(team.id, star.name)
  const photo = PLAYER_PHOTOS.get(slug)
  const credit = PLAYER_CREDITS[slug]
  return (
    <HoloSticker className="playercard">
      <span className="playercard__no">
        {team.id} · {index + 1}
      </span>
      {photo ? (
        <img
          className="playercard__photo"
          src={photo}
          alt={star.name}
          decoding="async"
          title={credit ? `Foto: ${credit.author} (${credit.license}, Wikimedia Commons)` : undefined}
        />
      ) : (
        <span className="playercard__photo playercard__photo--fallback">
          <span className="playercard__26">26</span>
          <span className="playercard__initials">{initials(star.name)}</span>
        </span>
      )}
      <span className="playercard__bar">{star.name}</span>
      <span className="playercard__meta">
        {star.role}
        <small>{star.club}</small>
      </span>
    </HoloSticker>
  )
}

/**
 * Aktuelle Meldungen zum Team — komplett IN der App lesbar: Schlagzeile
 * anklicken klappt den Meldungstext auf (keine externen Tabs). Quelle:
 * deutschsprachige Sport-Feeds, vom Main-Prozess alle 15 Min gepollt.
 */
function NewsSection({ team }: { team: Team }) {
  const all = useApp((s) => s.news)
  const fetchedAt = useApp((s) => s.newsFetchedAt)
  const refreshNews = useApp((s) => s.refreshNews)
  const [openId, setOpenId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const items = useMemo(() => all.filter((i) => i.teamIds.includes(team.id)).slice(0, 8), [all, team.id])

  const refresh = async (): Promise<void> => {
    setRefreshing(true)
    try {
      await refreshNews()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <>
      <h3 className="teamdetail__h">
        Aktuelle Meldungen
        <button className="newslist__refresh" onClick={() => void refresh()} disabled={refreshing} title="Jetzt aktualisieren">
          {refreshing ? '…' : '↻'}
        </button>
      </h3>
      {items.length === 0 ? (
        <p className="newslist__hint">
          {fetchedAt
            ? 'Zurzeit keine Meldungen zu diesem Team — schau später wieder rein.'
            : 'Noch keine News geladen (offline?) — die App funktioniert auch ohne weiter.'}
        </p>
      ) : (
        <>
          <ul className="newslist">
            {items.map((item) => (
              <li key={item.id} className={openId === item.id ? 'newslist__item--open' : ''}>
                <button className="newslist__head" onClick={() => setOpenId(openId === item.id ? null : item.id)}>
                  <span className="newslist__title">{item.title}</span>
                  <small>
                    {item.source}
                    {item.publishedAt && ` · ${dayShort(item.publishedAt)} ${kickoffTime(item.publishedAt)}`}
                  </small>
                  <span className={`newslist__chev${openId === item.id ? ' newslist__chev--open' : ''}`}>›</span>
                </button>
                {openId === item.id && (
                  <p className="newslist__body">
                    {item.text || 'Zu dieser Meldung liefert der Feed keinen Text.'}
                    <small>Quelle: {item.source}</small>
                  </p>
                )}
              </li>
            ))}
          </ul>
          {fetchedAt && (
            <small className="stand">Aktualisiert sich automatisch alle 15 Min · Stand {kickoffTime(fetchedAt)}</small>
          )}
        </>
      )}
    </>
  )
}

function TeamDetail({ team, onBack, onSquad }: { team: Team; onBack: () => void; onSquad: () => void }) {
  const info = teamInfo(team.id)
  const quote = ODDS.odds[team.id]
  const results = useApp((s) => s.results)
  // Gruppenspiele immer; KO-Spiele, sobald ESPN das Team in einer Paarung führt
  const matches = SCHEDULE.filter(
    (m) =>
      m.home === team.id ||
      m.away === team.id ||
      results[m.match]?.homeTeam === team.id ||
      results[m.match]?.awayTeam === team.id
  )
  const stickerNo = TEAMS.findIndex((t) => t.id === team.id) + 1

  return (
    <>
      <button className="btn teamdetail__back" onClick={onBack}>
        ← Alle Teams
      </button>
      <div className="album teamdetail">
        <span className="teamdetail__crest">
          <Crest team={team} />
        </span>
        <header className="teamdetail__head">
          <div className="teamdetail__heroside">
            <HoloSticker className="teamhero">
              <span className="teamhero__no">Nº {stickerNo}</span>
              <span className="teamhero__26">26</span>
              <span className={`fi fi-${team.flag} teamhero__flag`} />
              <span className="teamhero__bar">
                {team.name} · {team.id}
              </span>
            </HoloSticker>
            {squad(team.id).length > 0 && (
              <button className="squadbtn" onClick={onSquad}>
                🃏 Kompletter Kader
              </button>
            )}
          </div>
          <div className="teamdetail__title">
            <h2>{team.name}</h2>
            <div className="teamdetail__badges">
              <span className="badge badge--group">Gruppe {team.group}</span>
              {info?.fifaRank != null && <span className="badge badge--rank">FIFA-Rang {info.fifaRank}</span>}
            </div>
            {info && <p className="teamdetail__record">{info.wcRecord}</p>}
            {info && (
              <p className="teamdetail__coach">
                Trainer: <strong>{info.coach.name}</strong> <small>(seit {info.coach.since})</small>
              </p>
            )}
          </div>
        </header>

        {info ? (
          <>
            <div className="teamdetail__cols">
              <section>
                <h3 className="teamdetail__h">Form</h3>
                <p>{info.form}</p>
                <h3 className="teamdetail__h">Qualifikation</h3>
                <p>{info.quali}</p>
              </section>
              <section>
                <h3 className="teamdetail__h">Storylines</h3>
                <ul className="teamdetail__stories">
                  {info.storylines.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </section>
            </div>

            <h3 className="teamdetail__h">Stars im Kader</h3>
            <div className="stargrid">
              {info.stars.map((s, i) => (
                <PlayerCard key={s.name} team={team} index={i} star={s} />
              ))}
            </div>
            <small className="stand">Spielerfotos: Wikimedia Commons (frei lizenziert) — Autor & Lizenz per Mouseover</small>
          </>
        ) : (
          <p className="notice">Für dieses Team liegt noch kein kuratiertes Dossier vor.</p>
        )}

        <NewsSection team={team} />

        <h3 className="teamdetail__h">Spielplan</h3>
        <ul className="teamdetail__matches">
          {matches.map((m) => (
            <MiniMatchRow key={m.match} match={m} showVenue />
          ))}
        </ul>

        {quote != null && (
          <div className="oddsbanner">
            <span className="oddsbanner__label">Wettquote Turniersieg</span>
            <strong className="foil">{formatOdds(quote)}</strong>
            <small>
              {ODDS.source} · Stand {standDatum(ODDS.date)}
            </small>
          </div>
        )}
        {info && <small className="stand">Dossier-Stand {standDatum(info.updatedAt)}</small>}
      </div>
    </>
  )
}

/**
 * Drehbare Kader-Karte: vorne Panini-Sticker (Holo), hinten die Fakten — beim
 * Drehen vergrößert (Lesbarkeit). Es ist immer nur eine Karte gedreht (Steuerung
 * über SquadPage), ein Klick auf eine andere dreht die aktive zurück.
 */
function SquadCard({
  team,
  player,
  flipped,
  onFlip
}: {
  team: Team
  player: SquadPlayer
  flipped: boolean
  onFlip: () => void
}) {
  const slug = playerSlug(team.id, player.name)
  const photo = PLAYER_PHOTOS.get(slug)
  const credit = PLAYER_CREDITS[slug]
  const age = player.born ? Math.floor((Date.now() - Date.parse(player.born)) / (365.25 * 24 * 3600_000)) : undefined

  return (
    <div
      className={`flipcard${flipped ? ' flipcard--flipped' : ''}`}
      role="button"
      tabIndex={0}
      title={flipped ? 'Klicken: zurück zur Karte' : 'Klicken: Fakten auf der Rückseite'}
      onClick={onFlip}
      onKeyDown={(e) => e.key === 'Enter' && onFlip()}
    >
      <div className="flipcard__inner">
        <div className="flipcard__front">
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
              <small>{player.club}</small>
            </span>
          </HoloSticker>
        </div>
        <div className="flipcard__back playercard playercard--back">
          <span className="playercard__backno">{player.no}</span>
          <ul className="playercard__facts">
            <li>
              <small>Position</small>
              <strong>{POS_LABEL[player.pos]}</strong>
            </li>
            {age != null && player.born && (
              <li>
                <small>Alter</small>
                <strong>
                  {age} <span className="playercard__factsub">({bornFmt.format(new Date(player.born))})</span>
                </strong>
              </li>
            )}
            <li>
              <small>Länderspiele</small>
              <strong>{player.caps}</strong>
            </li>
            <li>
              <small>Tore</small>
              <strong>{player.goals}</strong>
            </li>
            <li>
              <small>Verein</small>
              <strong>{player.club}</strong>
            </li>
            {player.captain && (
              <li>
                <small>Captain</small>
                <strong>© der Mannschaft</strong>
              </li>
            )}
          </ul>
          <span className="playercard__bar">{player.name}</span>
        </div>
      </div>
    </div>
  )
}

/** Kompletter 26er-Kader, gruppiert nach Position — jede Karte drehbar. */
function SquadPage({ team, onBack }: { team: Team; onBack: () => void }) {
  const players = squad(team.id)
  // genau eine Karte gleichzeitig gedreht — die vorherige dreht sich zurück
  const [flippedKey, setFlippedKey] = useState<string | null>(null)
  return (
    <>
      <button className="btn teamdetail__back" onClick={onBack}>
        ← {team.name}
      </button>
      <div className="album teamdetail">
        <header className="squadhead">
          <FlagBadge flag={team.flag} size="lg" />
          <div>
            <h2>Kader {team.name}</h2>
            <small>
              {players.length} Spieler · Karten anklicken zum Umdrehen · ©&nbsp;= Captain
            </small>
          </div>
        </header>
        {(['TW', 'AB', 'MF', 'ST'] as const).map((pos) => {
          const group = players.filter((p) => p.pos === pos)
          if (group.length === 0) return null
          return (
            <section key={pos}>
              <h3 className="teamdetail__h">
                {POS_LABEL[pos]} ({group.length})
              </h3>
              <div className="stargrid stargrid--squad">
                {group.map((p) => {
                  const key = `${p.no}-${p.name}`
                  return (
                    <SquadCard
                      key={key}
                      team={team}
                      player={p}
                      flipped={flippedKey === key}
                      onFlip={() => setFlippedKey(flippedKey === key ? null : key)}
                    />
                  )
                })}
              </div>
            </section>
          )
        })}
        <small className="stand">
          Kader laut FIFA/Wikipedia (Stand 11.06.2026) · Fotos: Wikimedia Commons — Autor & Lizenz per Mouseover
        </small>
      </div>
    </>
  )
}

export default function Teams() {
  const [selected, setSelected] = useState<Team | null>(null)
  const [showSquad, setShowSquad] = useState(false)

  if (selected && showSquad) return <SquadPage team={selected} onBack={() => setShowSquad(false)} />
  if (selected)
    return <TeamDetail team={selected} onBack={() => setSelected(null)} onSquad={() => setShowSquad(true)} />

  return (
    <>
      <h1>Teams</h1>
      <p className="lead">
        Alle 48 Teilnehmer, sortiert nach Gruppen — jeder Sticker führt zur grossen Team-Seite mit Form, Stars,
        Storylines und der Buchmacher-Quote.
      </p>
      {GROUPS.map((g) => (
        <section key={g} className="teamgroup">
          <h2 className="sectiontitle">Gruppe {g}</h2>
          <div className="teamgrid">
            {GROUP_TEAMS[g].map((t) => (
              <button key={t.id} className="teamsticker" onClick={() => setSelected(t)}>
                <FlagBadge flag={t.flag} size="xl" />
                <strong>{t.name}</strong>
                <small>{t.id}</small>
              </button>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
