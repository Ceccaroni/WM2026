// Temporär: Claudes Bauch-Tipps — Bracket-Auflösung mit dem echten App-Code,
// damit die KO-Tipps gegen die richtigen (eigenen) Paarungen getippt werden.
import { resolveTipBracket } from '../src/renderer/src/lib/bracket'
import { TEAM_BY_ID } from '../src/renderer/src/lib/data'
import type { Tip } from '../src/shared/types'

// Recherche-kalibrierte Tipps (12.06. abends): Tendenz nach DraftKings-1X2-Quoten,
// Resultat nach wahrscheinlichstem Scoreline; Verletzungen/Sperren eingepreist
// (Agenten-Recherche, Quellen in STATUS.md). Spiele 1–3 bewusst kein Tipp
// (waren beim Tippen angepfiffen/vorbei).
export const TIPS: Record<number, Tip> = {
  4: { h: 2, a: 1 }, 5: { h: 0, a: 2 }, 6: { h: 1, a: 2 }, 7: { h: 2, a: 1 },
  8: { h: 0, a: 2 }, 9: { h: 1, a: 1 }, 10: { h: 3, a: 0 }, 11: { h: 2, a: 1 },
  12: { h: 2, a: 1 }, 13: { h: 0, a: 2 }, 14: { h: 3, a: 0 }, 15: { h: 1, a: 0 },
  16: { h: 2, a: 0 }, 17: { h: 2, a: 0 }, 18: { h: 0, a: 3 }, 19: { h: 2, a: 0 },
  20: { h: 2, a: 0 }, 21: { h: 2, a: 1 }, 22: { h: 2, a: 0 }, 23: { h: 3, a: 0 },
  24: { h: 0, a: 2 }, 25: { h: 2, a: 0 }, 26: { h: 2, a: 0 }, 27: { h: 2, a: 0 },
  28: { h: 2, a: 1 }, 29: { h: 3, a: 0 }, 30: { h: 0, a: 1 }, 31: { h: 1, a: 0 },
  32: { h: 2, a: 0 }, 33: { h: 2, a: 0 }, 34: { h: 2, a: 0 }, 35: { h: 2, a: 1 },
  36: { h: 0, a: 2 }, 37: { h: 2, a: 0 }, 38: { h: 3, a: 0 }, 39: { h: 2, a: 0 },
  40: { h: 0, a: 1 }, 41: { h: 2, a: 1 }, 42: { h: 3, a: 0 }, 43: { h: 2, a: 1 },
  44: { h: 0, a: 2 }, 45: { h: 2, a: 0 }, 46: { h: 0, a: 2 }, 47: { h: 2, a: 0 },
  48: { h: 2, a: 0 }, 49: { h: 0, a: 2 }, 50: { h: 2, a: 0 }, 51: { h: 1, a: 1 },
  52: { h: 2, a: 1 }, 53: { h: 1, a: 2 }, 54: { h: 0, a: 1 }, 55: { h: 0, a: 2 },
  56: { h: 0, a: 1 }, 57: { h: 2, a: 1 }, 58: { h: 0, a: 2 }, 59: { h: 1, a: 1 },
  60: { h: 1, a: 0 }, 61: { h: 1, a: 2 }, 62: { h: 2, a: 0 }, 63: { h: 1, a: 1 },
  64: { h: 0, a: 2 }, 65: { h: 1, a: 1 }, 66: { h: 1, a: 2 }, 67: { h: 0, a: 2 },
  68: { h: 2, a: 1 }, 69: { h: 1, a: 2 }, 70: { h: 0, a: 3 }, 71: { h: 1, a: 2 },
  72: { h: 1, a: 1 },
  // 1/16: aufgelöste Paarungen nach Markt/Matchup, A/B-Äste blind (positionsbezogen)
  73: { h: 1, a: 2 }, 74: { h: 2, a: 0 }, 75: { h: 2, a: 1 }, 76: { h: 2, a: 0 },
  77: { h: 2, a: 0 }, 78: { h: 1, a: 2 }, 79: { h: 2, a: 1 }, 80: { h: 2, a: 0 },
  81: { h: 2, a: 1 }, 82: { h: 2, a: 1 }, 83: { h: 2, a: 1 }, 84: { h: 2, a: 0 },
  85: { h: 2, a: 1 }, 86: { h: 2, a: 1 }, 87: { h: 2, a: 0 }, 88: { h: 2, a: 0 },
  // 1/8
  89: { h: 1, a: 2 }, 90: { h: 1, a: 2 }, 91: { h: 2, a: 1 }, 92: { h: 1, a: 2 },
  93: { h: 1, a: 2 }, 94: { h: 1, a: 2 }, 95: { h: 2, a: 0 }, 96: { h: 1, a: 2 },
  // VF / HF / Spiel um Platz 3 / Finale (Spine: ESP schlägt ARG — Markt + Opta + Goldman)
  97: { h: 2, a: 1 }, 98: { h: 2, a: 0 }, 99: { h: 1, a: 2 }, 100: { h: 2, a: 1 },
  101: { h: 1, a: 2 }, 102: { h: 1, a: 2 },
  103: { h: 2, a: 1 }, 104: { h: 2, a: 1 }
}

const bracket = resolveTipBracket(TIPS)
const name = (id: string): string => TEAM_BY_ID.get(id)?.name ?? id
for (let n = 73; n <= 104; n++) {
  const t = bracket.teams[n]
  console.log(n, name(t.home), '-', name(t.away))
}
console.log('Champion:', bracket.champion ? name(bracket.champion) : '—')

// Scoring-Probe: Breakdown mit leeren Ergebnissen und mit Volltreffer-Welt — darf nicht werfen
import { SCHEDULE } from '../src/renderer/src/lib/data'
import { buildRealWorld } from '../src/renderer/src/lib/results'
import { computeBreakdown } from '../src/renderer/src/lib/scoring'
import { DEFAULT_SCORING } from '../src/shared/types'
import type { ExchangeFileV1, LiveResult } from '../src/shared/types'
import { writeFileSync } from 'node:fs'

const empty = computeBreakdown(TIPS, bracket, {}, buildRealWorld({}, resolveTipBracket({})), SCHEDULE, DEFAULT_SCORING)
const world: Record<number, LiveResult> = Object.fromEntries(
  SCHEDULE.map((m) => [
    m.match,
    { match: m.match, status: 'finished', homeScore: 1, awayScore: 0, winner: 'home', updatedAt: 'x' } as LiveResult
  ])
)
const full = computeBreakdown(TIPS, bracket, world, buildRealWorld(world, resolveTipBracket({})), SCHEDULE, DEFAULT_SCORING)
console.log(`Scoring-Probe: leer=${empty.total} P, 1:0-Welt=${full.total} P, Tipps=${Object.keys(TIPS).length}`)

const file: ExchangeFileV1 = {
  formatVersion: 1,
  exportedAt: new Date().toISOString(),
  scoring: DEFAULT_SCORING,
  profile: { id: 'claude-fable', name: 'Claude', color: '#D97757' },
  entries: { main: { tips: TIPS } }
}
const out = `${process.env.HOME}/Desktop/Claude.wm26tipp`
writeFileSync(out, JSON.stringify(file, null, 2))
console.log('geschrieben:', out)
