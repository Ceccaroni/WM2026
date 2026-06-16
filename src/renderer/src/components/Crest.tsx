import crestCreditsJson from '../assets/crests/credits.json'
import type { Team } from '../lib/types'

/** Gebündelte Verbandslogos (Wikimedia Commons, nur Public Domain/CC0) — Dateiname = Trigramm lowercase. */
const crestFiles = import.meta.glob('../assets/crests/*.{svg,png}', { eager: true, import: 'default' }) as Record<
  string,
  string
>
const CRESTS = new Map(
  Object.entries(crestFiles).map(([path, url]) => [path.replace(/.*\/(.+)\.(svg|png)$/, '$1'), url])
)
const CREDITS = crestCreditsJson as Record<string, { commons: string; license: string; author?: string }>

/**
 * Verbandswappen als „eingeklebtes" Panini-Bild. Echtes Verbandslogo, wo eines mit
 * freier Lizenz existiert (PD/CC0, Markenhinweis im Tooltip); sonst ein eigenes
 * Schild-Wappen aus Flagge + Trigramm — konsistenter Look statt leerer Ecke.
 */
export default function Crest({ team }: { team: Team }) {
  const url = CRESTS.get(team.id.toLowerCase())
  const credit = CREDITS[team.id]
  if (url) {
    // Commons-Funde mit Lizenz-Attribution; der Rest ist privat beschafft (Entscheid
    // Adrian 12.06.: Eigengebrauch, Art. 19 URG) — dann schlichter Tooltip ohne Lizenz.
    const title = credit
      ? `Verbandslogo ${team.name} — Wikimedia Commons, ${credit.license} (Marke des Verbands)`
      : `Verbandslogo ${team.name} (Marke des Verbands)`
    return (
      <span className="crest" title={title}>
        <img className="crest__img" src={url} alt={`Verbandslogo ${team.name}`} />
      </span>
    )
  }
  return (
    <span className="crest" title={`${team.name} — eigenes Wappen (kein frei lizenziertes Verbandslogo verfügbar)`}>
      <span className="crest__shield">
        <span className={`fi fi-${team.flag} crest__flag`} />
      </span>
      <span className="crest__tag">{team.id}</span>
    </span>
  )
}
