// Generiert die Nordamerika-Lagekarte für die Stadion-Rückseiten:
// Natural-Earth-110m-Ländergrenzen (Public Domain) → USA/Kanada/Mexiko →
// equirektangulär projiziert, auf den Turnier-Ausschnitt zugeschnitten,
// als kompakte SVG-Pfaddaten nach src/renderer/src/assets/namap.json.
// Aufruf: node scripts/build-venuemap.mjs (einmalig; Ergebnis ist eingecheckt).
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SOURCE =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'
const COUNTRIES = new Set(['United States of America', 'Canada', 'Mexico'])

// Kartenausschnitt: alle 16 Spielorte plus Rand (Vancouver 49°N, Mexiko-Stadt 19°N)
const LON0 = -127
const LON1 = -65
const LAT0 = 14
const LAT1 = 54
const COS = Math.cos(((LAT0 + LAT1) / 2 / 180) * Math.PI) // Breitengrad-Korrektur
const S = 16 // Maßstab (SVG-Einheiten pro Grad Breite)

const px = (lon) => (lon - LON0) * COS * S
const py = (lat) => (LAT1 - lat) * S
const W = Math.round(px(LON1))
const H = Math.round(py(LAT0))

const res = await fetch(SOURCE)
if (!res.ok) throw new Error(`Download fehlgeschlagen: HTTP ${res.status}`)
const geo = await res.json()

let rings = 0
let path = ''
for (const f of geo.features) {
  if (!COUNTRIES.has(f.properties.ADMIN)) continue
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  for (const poly of polys) {
    for (const ring of poly) {
      // Ringe komplett außerhalb des Ausschnitts (Hawaii, Arktis-Inseln …) weglassen
      const inside = ring.some(([lon, lat]) => lon >= LON0 - 3 && lon <= LON1 + 3 && lat >= LAT0 - 3 && lat <= LAT1 + 3)
      if (!inside) continue
      path += ring
        .map(([lon, lat], i) => `${i === 0 ? 'M' : 'L'}${px(lon).toFixed(1)} ${py(lat).toFixed(1)}`)
        .join('')
      path += 'Z'
      rings++
    }
  }
}

const out = {
  source: 'Natural Earth 110m (Public Domain), Ausschnitt USA/Kanada/Mexiko',
  viewBox: `0 0 ${W} ${H}`,
  proj: { lon0: LON0, lat1: LAT1, cos: COS, s: S },
  land: path
}

const file = join(dirname(fileURLToPath(import.meta.url)), '../src/renderer/src/assets/namap.json')
writeFileSync(file, JSON.stringify(out))
console.log(`namap.json geschrieben: ${rings} Ringe, viewBox ${out.viewBox}, ${(path.length / 1024).toFixed(1)} KB Pfad`)
