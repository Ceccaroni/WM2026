// Aufstellungs-Spielfeld (Sofa-Blick): beide Startelfen auf einem Panini-Flutlicht-Rasen.
// Heim spielt von unten nach oben, Auswärts gespiegelt von oben. Ein Klick auf einen im
// WM-Kader gefundenen Spieler öffnet seine Panini-Karte (PlayerPeek) — wie bei den Toren.
// Auswechslungen: am Slot stehen Aus- (rot ▼, gedimmt) und Eingewechselter (grün ▲) gestapelt;
// die komplette Bank steht darunter (Heim links, Auswärts rechts), Eingewechselte mit grünem ▲.
import { slotInfo } from '../lib/data'
import { layoutTeam } from '../lib/formation'
import { coach } from '../lib/info'
import { findSquadPlayer } from '../lib/players'
import type { PlacedPlayer } from '../lib/formation'
import type { LineupPlayer, MatchLineup, SquadPlayer, TeamLineup } from '../lib/types'
import FlagBadge from './FlagBadge'

type Peek = { teamId: string; player: SquadPlayer }
type Side = 'home' | 'away'

/** Bank-Spieler, die eingewechselt wurden, nach der Rückennummer des Ersetzten ausschlüsseln. */
function incomingByReplaced(team: TeamLineup): Map<number, LineupPlayer> {
  const map = new Map<number, LineupPlayer>()
  for (const p of team.bench) if (p.subbedIn && p.forNo) map.set(p.forNo, p)
  return map
}

/** Slot-Kette: Starter → wer ihn ersetzte → wer dessen Ersatz ersetzte … (folgt Doppelwechseln). */
function slotChain(starter: LineupPlayer, incoming: Map<number, LineupPlayer>): LineupPlayer[] {
  const chain = [starter]
  const seen = new Set<number>([starter.no])
  let cur = starter
  while (cur.subbedOut) {
    const next = incoming.get(cur.no)
    if (!next || seen.has(next.no)) break
    chain.push(next)
    seen.add(next.no)
    cur = next
  }
  return chain
}

/** Grüner Rein-/​roter Raus-Pfeil mit Minute — am Slot und auf der Bank. */
function SubArrow({ player }: { player: LineupPlayer }) {
  return (
    <>
      {player.subbedIn && <span className="pitch__arrow pitch__arrow--in">▲{player.inMinute ?? ''}</span>}
      {player.subbedOut && <span className="pitch__arrow pitch__arrow--out">▼{player.outMinute ?? ''}</span>}
    </>
  )
}

function PlayerChip({
  player,
  teamId,
  side,
  compact,
  onPeek
}: {
  player: LineupPlayer
  teamId?: string
  side: Side
  compact?: boolean
  onPeek: (p: Peek) => void
}) {
  const squadPlayer = teamId ? findSquadPlayer(teamId, player.fullName, player.no ? String(player.no) : undefined) : undefined
  const cls = `pitch__player pitch__player--${side}${player.subbedOut ? ' pitch__player--out' : ''}${compact ? ' pitch__player--compact' : ''}`
  const inner = (
    <>
      <span className="pitch__num">{player.no || '–'}</span>
      <span className="pitch__pname">{player.name}</span>
      <SubArrow player={player} />
    </>
  )
  if (squadPlayer && teamId) {
    return (
      <button
        className={`${cls} pitch__player--card`}
        title="Panini-Karte anzeigen"
        onClick={(e) => {
          e.stopPropagation()
          onPeek({ teamId, player: squadPlayer })
        }}
      >
        {inner}
      </button>
    )
  }
  return <div className={cls}>{inner}</div>
}

/** Ein Platz auf dem Feld mit seiner Wechsel-Kette (gestapelt: oben raus, unten rein). */
function Slot({
  chain,
  placed,
  teamId,
  side,
  onPeek
}: {
  chain: LineupPlayer[]
  placed: PlacedPlayer
  teamId?: string
  side: Side
  onPeek: (p: Peek) => void
}) {
  // Heim: Tor unten (y=0) → bottom; Auswärts gespiegelt, Tor oben.
  const top = side === 'home' ? 92 - placed.y * 42 : 8 + placed.y * 42
  const left = side === 'home' ? placed.x * 100 : (1 - placed.x) * 100
  // Aktueller Spieler ankert am Slot-Punkt (Feld-Position bleibt korrekt); Ausgewechselte
  // floaten als kompakte, gedimmte Ghost-Chips darüber — so kollidieren sie nicht mit Nachbarn.
  const current = chain[chain.length - 1]
  const gone = chain.slice(0, -1)
  return (
    <div className="pitch__slot" style={{ top: `${top}%`, left: `${left}%` }}>
      {gone.length > 0 && (
        <span className="pitch__gone">
          {gone.map((p, i) => (
            <PlayerChip key={i} player={p} teamId={teamId} side={side} compact onPeek={onPeek} />
          ))}
        </span>
      )}
      <PlayerChip player={current} teamId={teamId} side={side} onPeek={onPeek} />
    </div>
  )
}

function TeamHead({ teamId, formation, align }: { teamId?: string; formation?: string; align: 'left' | 'right' }) {
  const info = teamId ? slotInfo(teamId) : undefined
  return (
    <span className={`pitch__head pitch__head--${align}`}>
      <FlagBadge flag={info?.flag} label={info?.badge} size="md" />
      <span className="pitch__headtext">
        <strong>{info?.name ?? '—'}</strong>
        {formation && <small>{formation}</small>}
      </span>
    </span>
  )
}

/** Komplette Bank eines Teams; Eingewechselte mit grünem ▲. Heim links, Auswärts rechts. */
function BenchCol({
  team,
  teamId,
  side,
  onPeek
}: {
  team?: TeamLineup
  teamId?: string
  side: Side
  onPeek: (p: Peek) => void
}) {
  const bench = team?.bench ?? []
  const label = teamId ? slotInfo(teamId).name : side === 'home' ? 'Heim' : 'Auswärts'
  const trainer = teamId ? coach(teamId) : undefined
  return (
    <div className={`pitch__benchcol pitch__benchcol--${side}`}>
      <small className="pitch__benchlbl">Bank · {label}</small>
      {trainer && (
        <span className="pitch__coach">
          <span className="pitch__coachlbl">Trainer</span> {trainer}
        </span>
      )}
      {bench.map((p, i) => {
        const squadPlayer = teamId ? findSquadPlayer(teamId, p.fullName, p.no ? String(p.no) : undefined) : undefined
        const inner = (
          <>
            <span className="pitch__benchno">{p.no || '–'}</span>
            <span className="pitch__benchname">{p.name}</span>
            {p.subbedIn && <span className="pitch__arrow pitch__arrow--in">▲{p.inMinute ?? ''}</span>}
          </>
        )
        if (squadPlayer && teamId) {
          return (
            <button
              key={i}
              className="pitch__benchitem pitch__benchitem--card"
              title="Panini-Karte anzeigen"
              onClick={(e) => {
                e.stopPropagation()
                onPeek({ teamId, player: squadPlayer })
              }}
            >
              {inner}
            </button>
          )
        }
        return (
          <span key={i} className="pitch__benchitem">
            {inner}
          </span>
        )
      })}
    </div>
  )
}

/**
 * Pitch-Markierungen als SVG (vertikales Feld 100×140). Bewusst dezent — der Rasen und die
 * Spieler-Sticker tragen das Bild, die Linien geben nur den Kontext.
 */
function PitchLines() {
  return (
    <svg className="pitch__lines" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">
      <rect x="2" y="2" width="96" height="136" rx="2" />
      <line x1="2" y1="70" x2="98" y2="70" />
      <circle cx="50" cy="70" r="9" />
      <circle className="pitch__spot" cx="50" cy="70" r="0.8" />
      {/* unten (Heim-Tor) */}
      <rect x="24" y="120" width="52" height="18" />
      <rect x="38" y="132" width="24" height="6" />
      <circle className="pitch__spot" cx="50" cy="126" r="0.8" />
      {/* oben (Auswärts-Tor) */}
      <rect x="24" y="2" width="52" height="18" />
      <rect x="38" y="2" width="24" height="6" />
      <circle className="pitch__spot" cx="50" cy="14" r="0.8" />
    </svg>
  )
}

function TeamSlots({ team, teamId, side, onPeek }: { team: TeamLineup; teamId?: string; side: Side; onPeek: (p: Peek) => void }) {
  const incoming = incomingByReplaced(team)
  return (
    <>
      {layoutTeam(team).map((pp, i) => (
        <Slot key={`${side}${i}`} chain={slotChain(pp.player, incoming)} placed={pp} teamId={teamId} side={side} onPeek={onPeek} />
      ))}
    </>
  )
}

export default function FormationPitch({
  lineup,
  homeTeamId,
  awayTeamId,
  onPeek
}: {
  lineup: MatchLineup
  homeTeamId?: string
  awayTeamId?: string
  onPeek: (p: Peek) => void
}) {
  const home = lineup.home
  const away = lineup.away
  const hasBench = (home?.bench.length ?? 0) > 0 || (away?.bench.length ?? 0) > 0

  return (
    <div className="pitch">
      <div className="pitch__heads">
        <TeamHead teamId={homeTeamId} formation={home?.formation} align="left" />
        <span className="pitch__title">Aufstellungen</span>
        <TeamHead teamId={awayTeamId} formation={away?.formation} align="right" />
      </div>
      <div className="pitch__field">
        <PitchLines />
        {home && <TeamSlots team={home} teamId={homeTeamId} side="home" onPeek={onPeek} />}
        {away && <TeamSlots team={away} teamId={awayTeamId} side="away" onPeek={onPeek} />}
      </div>
      {hasBench && (
        <div className="pitch__bench">
          <BenchCol team={home} teamId={homeTeamId} side="home" onPeek={onPeek} />
          <BenchCol team={away} teamId={awayTeamId} side="away" onPeek={onPeek} />
        </div>
      )}
    </div>
  )
}
