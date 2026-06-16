import namap from '../assets/namap.json'
import { STADIUMS } from '../lib/data'

// Projektion identisch zu scripts/build-venuemap.mjs (dort dokumentiert)
const P = namap.proj
const px = (lon: number): number => (lon - P.lon0) * P.cos * P.s
const py = (lat: number): number => (P.lat1 - lat) * P.s
const W = Number(namap.viewBox.split(' ')[2])

/**
 * Lagekarte Nordamerika (Natural Earth 110m, Public Domain — generiert via
 * scripts/build-venuemap.mjs): alle 16 Spielorte als Punkte, der gewählte
 * gold mit Stadt-Label. Läuft komplett offline.
 */
export default function VenueMap({ selected }: { selected: string }) {
  const sel = STADIUMS.find((s) => s.id === selected)!
  const x = px(sel.lon)
  const y = py(sel.lat)
  const labelLeft = x > W * 0.55
  return (
    <svg className="venuemap" viewBox={namap.viewBox} role="img" aria-label={`Lage: ${sel.city}`}>
      <path className="venuemap__land" d={namap.land} />
      {STADIUMS.filter((s) => s.id !== selected).map((s) => (
        <circle key={s.id} className="venuemap__dot" cx={px(s.lon)} cy={py(s.lat)} r="6" />
      ))}
      <circle className="venuemap__halo" cx={x} cy={y} r="17" />
      <circle className="venuemap__sel" cx={x} cy={y} r="8" />
      <text className="venuemap__label" x={labelLeft ? x - 24 : x + 24} y={y + 9} textAnchor={labelLeft ? 'end' : 'start'}>
        {sel.city}
      </text>
    </svg>
  )
}
