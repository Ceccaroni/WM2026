import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SCHEDULE, slotInfo, TEAM_BY_ID } from '../lib/data'
import type { TipBracket } from '../lib/bracket'
import type { Tip } from '../lib/types'
import FlagBadge from './FlagBadge'

// Gespiegeltes Bracket, Finale in der Mitte (research/design.md):
// linke Hälfte führt zu Halbfinale 101, rechte zu 102.
const COLS: Array<{ key: string; matches: number[] }> = [
  { key: 'l32', matches: [74, 77, 73, 75, 83, 84, 81, 82] },
  { key: 'l16', matches: [89, 90, 93, 94] },
  { key: 'lqf', matches: [97, 98] },
  { key: 'lsf', matches: [101] },
  { key: 'mid', matches: [104, 103] },
  { key: 'rsf', matches: [102] },
  { key: 'rqf', matches: [99, 100] },
  { key: 'r16', matches: [91, 92, 95, 96] },
  { key: 'r32', matches: [76, 78, 79, 80, 86, 88, 85, 87] }
]

// Sieger-Kanten aus dem Spielplan: Spiel m → Spiel n, wenn n den Slot "W<m>" enthält.
// (Verlierer-Kanten zum Spiel um Platz 3 bleiben weg — weniger Linien-Gewirr.)
const EDGES: Array<{ from: number; to: number }> = SCHEDULE.flatMap((m) =>
  [m.home, m.away]
    .map((slot) => /^W(\d+)$/.exec(slot))
    .filter((x): x is RegExpExecArray => x !== null)
    .map((x) => ({ from: Number(x[1]), to: m.match }))
)

function TeamLine({ slot, score, isWinner }: { slot: string; score?: number; isWinner: boolean }) {
  const info = slotInfo(slot)
  const team = TEAM_BY_ID.get(slot)
  return (
    <span className={`bnode__team${isWinner ? ' bnode__team--winner' : ''}`} title={info.name}>
      <FlagBadge flag={info.flag} label={info.badge} size="sm" />
      <span className="bnode__code">{team ? team.id : '—'}</span>
      <span className="bnode__score">{score ?? ''}</span>
    </span>
  )
}

function Node({ match, bracket, tips }: { match: number; bracket: TipBracket; tips: Record<number, Tip> }) {
  const t = bracket.teams[match]
  const tip = tips[match]
  const w = bracket.winner[match]
  return (
    <div data-bnode={match} className={`bnode${match === 104 ? ' bnode--final' : ''}${match === 103 ? ' bnode--third' : ''}`}>
      <span className="bnode__nr">{match === 104 ? 'FINALE' : match === 103 ? 'PLATZ 3' : match}</span>
      <TeamLine slot={t.home} score={tip?.h} isWinner={!!w && w === t.home} />
      <TeamLine slot={t.away} score={tip?.a} isWinner={!!w && w === t.away} />
    </div>
  )
}

interface ConnectorPath {
  key: string
  d: string
  gold: boolean
}

export default function BracketTree({
  bracket,
  tips,
  championCaption = 'Dein Weltmeister'
}: {
  bracket: TipBracket
  /** Scores pro Spielnummer — Tipps oder echte Endstände in Tipp-Form (lib/results.ts) */
  tips: Record<number, Tip>
  championCaption?: string
}) {
  const champion = bracket.champion ? TEAM_BY_ID.get(bracket.champion) : undefined
  const wrapRef = useRef<HTMLDivElement>(null)
  const [paths, setPaths] = useState<ConnectorPath[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })
  // Kompaktmodus: ganzer Baum ohne Scrollen im Blick (kleinere Nodes statt CSS-Transform,
  // damit die Connector-Vermessung weiter stimmt)
  const [compact, setCompact] = useState(false)

  // Connector-Linien nach dem Layout vermessen (Positionen hängen von Flexbox ab)
  const measure = useCallback(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const wr = wrap.getBoundingClientRect()
    const offX = wrap.scrollLeft - wr.left
    const offY = wrap.scrollTop - wr.top
    const next: ConnectorPath[] = []
    for (const e of EDGES) {
      const a = wrap.querySelector(`[data-bnode="${e.from}"]`)
      const b = wrap.querySelector(`[data-bnode="${e.to}"]`)
      if (!a || !b) continue
      const ra = a.getBoundingClientRect()
      const rb = b.getBoundingClientRect()
      const y1 = ra.top + ra.height / 2 + offY
      const y2 = rb.top + rb.height / 2 + offY
      // linke Hälfte: rechts raus; rechte (gespiegelte) Hälfte: links raus
      const ltr = rb.left >= ra.right
      const x1 = (ltr ? ra.right : ra.left) + offX
      const x2 = (ltr ? rb.left : rb.right) + offX
      const midX = (x1 + x2) / 2
      next.push({
        key: `${e.from}-${e.to}`,
        d: `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`,
        gold: !!bracket.winner[e.from]
      })
    }
    setPaths(next)
    setSize({ w: wrap.scrollWidth, h: wrap.scrollHeight })
  }, [bracket])

  useLayoutEffect(() => {
    measure()
  }, [measure, tips, compact])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [measure])

  return (
    <>
      <div className="bracket__bar">
        {(
          [
            [false, '100 %'],
            [true, 'Kompakt']
          ] as Array<[boolean, string]>
        ).map(([value, label]) => (
          <button
            key={label}
            className={`bracket__zoom${compact === value ? ' bracket__zoom--active' : ''}`}
            onClick={() => setCompact(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div ref={wrapRef} className={`bracket${compact ? ' bracket--compact' : ''}`}>
        <svg className="bracket__lines" width={size.w} height={size.h} aria-hidden="true">
        {paths.map((p) => (
          <path key={p.key} d={p.d} className={p.gold ? 'bracket__line bracket__line--gold' : 'bracket__line'} />
        ))}
      </svg>
      {COLS.map((col) => (
        <div key={col.key} className={`bracket__col${col.key === 'mid' ? ' bracket__col--mid' : ''}`}>
          {col.key === 'mid' && (
            <div className={`champ${champion ? ' champ--set' : ''}`}>
              {champion ? (
                <>
                  <FlagBadge flag={champion.flag} size="lg" />
                  <strong>{champion.name}</strong>
                  <small>{championCaption}</small>
                </>
              ) : (
                <>
                  <FlagBadge size="lg" />
                  <small>Weltmeister</small>
                </>
              )}
            </div>
          )}
          {col.matches.map((m) => (
            <Node key={m} match={m} bracket={bracket} tips={tips} />
          ))}
        </div>
      ))}
      </div>
    </>
  )
}
