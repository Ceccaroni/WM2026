import { useState } from 'react'
import FlagBadge from '../components/FlagBadge'
import MiniMatchRow from '../components/MiniMatchRow'
import VenueMap from '../components/VenueMap'
import creditsJson from '../assets/stadiums/credits.json'
import { SCHEDULE, STADIUMS } from '../lib/data'
import { stadiumInfo, standDatum } from '../lib/info'
import type { ScheduledMatch, Stadium } from '../lib/types'

const capFmt = new Intl.NumberFormat('de-CH')

/** Länder in Turnier-Dramaturgie: Eröffnung in Mexiko, Finale in den USA. */
const COUNTRY_ORDER = ['Mexiko', 'Kanada', 'USA']

/** Gebündelte Stadion-Fotos (Wikimedia Commons, frei lizenziert) — Dateiname = Stadion-ID. */
const photoFiles = import.meta.glob('../assets/stadiums/*.jpg', { eager: true, import: 'default' }) as Record<
  string,
  string
>
const PHOTOS = new Map(Object.entries(photoFiles).map(([path, url]) => [path.replace(/.*\/(.+)\.jpg$/, '$1'), url]))
const CREDITS = creditsJson as Record<string, { author: string; license: string }>

/** Das „größte" Spiel eines Stadions als Auszeichnung (Finale schlägt Halbfinale usw.). */
function highlight(matches: ScheduledMatch[]): string | undefined {
  if (matches.some((m) => m.match === 104)) return 'Finale'
  if (matches.some((m) => m.match === 1)) return 'Eröffnungsspiel'
  if (matches.some((m) => m.round === 'sf')) return 'Halbfinale'
  if (matches.some((m) => m.round === 'third')) return 'Spiel um Platz 3'
  if (matches.some((m) => m.round === 'qf')) return 'Viertelfinale'
  return undefined
}

/** Vorderseite: Dossier + Spiele · Rückseite (Klick = umdrehen): Foto + Lagekarte. */
function StadiumCard({ stadium }: { stadium: Stadium }) {
  const [flipped, setFlipped] = useState(false)
  const matches = SCHEDULE.filter((m) => m.stadium === stadium.id)
  const info = stadiumInfo(stadium.id)
  const star = highlight(matches)
  const photo = PHOTOS.get(stadium.id)
  const credit = CREDITS[stadium.id]

  return (
    <div
      className={`flipcard${flipped ? ' flipcard--flipped' : ''}`}
      role="button"
      tabIndex={0}
      title={flipped ? 'Klicken: zurück zu den Infos' : 'Klicken: Foto & Lage'}
      onClick={() => setFlipped((f) => !f)}
      onKeyDown={(e) => e.key === 'Enter' && setFlipped((f) => !f)}
    >
      <div className="flipcard__inner">
        <article className={`papercard stadiumcard flipcard__front${star === 'Finale' ? ' stadiumcard--final' : ''}`}>
          <header className="stadiumcard__head">
            <div>
              <h3>{stadium.commonName}</h3>
              {stadium.fifaName !== stadium.commonName && (
                <small className="stadiumcard__fifa">FIFA: {stadium.fifaName}</small>
              )}
            </div>
            {star && <span className={`badge ${star === 'Finale' ? 'badge--today' : 'badge--round'}`}>{star}</span>}
          </header>
          <div className="stadiumcard__meta">
            <FlagBadge flag={stadium.countryFlag} size="sm" />
            <span>{stadium.city}</span>
            <span className="stadiumcard__dot">·</span>
            <span>{capFmt.format(stadium.capacity)} Plätze</span>
            <span className="stadiumcard__dot">·</span>
            <span title={stadium.tz}>{`${stadium.diffMesz}`.replace('-', '−')} h zu MESZ</span>
          </div>
          {info && (
            <>
              <p className="stadiumcard__blurb">{info.blurb}</p>
              <ul className="stadiumcard__facts">
                {info.facts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <small className="stand">Stand {standDatum(info.updatedAt)}</small>
            </>
          )}
          <h4 className="stadiumcard__matchtitle">
            {matches.length} {matches.length === 1 ? 'Spiel' : 'Spiele'} in diesem Stadion
          </h4>
          <ul className="stadiumcard__matches">
            {matches.map((m) => (
              <MiniMatchRow key={m.match} match={m} />
            ))}
          </ul>
          <span className="flipcard__hint" aria-hidden="true">
            ↻
          </span>
        </article>

        <article className="papercard stadiumcard flipcard__back">
          <header className="stadiumcard__head">
            <div>
              <h3>{stadium.commonName}</h3>
              <small className="stadiumcard__fifa">
                {stadium.city} · {stadium.country}
              </small>
            </div>
          </header>
          {photo && (
            <figure className="flipcard__photo">
              <img src={photo} alt={`Foto: ${stadium.commonName}`} decoding="async" />
            </figure>
          )}
          <VenueMap selected={stadium.id} />
          <small className="stand">
            {credit ? `Foto: ${credit.author} (${credit.license}, Wikimedia Commons) · ` : ''}Karte: Natural Earth
          </small>
          <span className="flipcard__hint" aria-hidden="true">
            ↻
          </span>
        </article>
      </div>
    </div>
  )
}

export default function Stadien() {
  return (
    <>
      <h1>Stadien</h1>
      <p className="lead">
        Die 16 WM-Stadien in drei Ländern — vom Eröffnungsspiel im Estadio Azteca bis zum Finale im MetLife Stadium.
        Karte anklicken zum Umdrehen: Foto und Lage. Anstoßzeiten in MESZ.
      </p>
      {COUNTRY_ORDER.map((country) => (
        <section key={country}>
          <h2 className="sectiontitle">
            <FlagBadge flag={STADIUMS.find((s) => s.country === country)!.countryFlag} size="sm" /> {country}
          </h2>
          <div className="stadiumgrid">
            {STADIUMS.filter((s) => s.country === country)
              .slice()
              .sort((a, b) => b.capacity - a.capacity)
              .map((s) => (
                <StadiumCard key={s.id} stadium={s} />
              ))}
          </div>
        </section>
      ))}
    </>
  )
}
