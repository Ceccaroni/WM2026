import annexcJson from '@data/annexc.json'
import bracketJson from '@data/bracket.json'
import { GROUP_MATCHES, GROUPS } from './data'
import { allocateThirds, rankThirds } from './thirdPlace'
import { computeGroupTable } from './tournament'
import type { ThirdRank } from './thirdPlace'
import type { TableRow } from './tournament'
import type { GroupId, Tip } from './types'

interface BracketMatch {
  match: number
  home: string
  away: string
}

interface BracketData {
  r32: BracketMatch[]
  r16: BracketMatch[]
  qf: BracketMatch[]
  sf: BracketMatch[]
  third: BracketMatch
  final: BracketMatch
  thirdPlaceAllocation: { slots: Record<string, GroupId[]> }
}

const BRACKET = bracketJson as unknown as BracketData
const ANNEX_C = (annexcJson as { combos: Record<string, Record<string, GroupId>> }).combos

export const KO_MATCHES: BracketMatch[] = [
  ...BRACKET.r32,
  ...BRACKET.r16,
  ...BRACKET.qf,
  ...BRACKET.sf,
  BRACKET.third,
  BRACKET.final
]

export interface TipBracket {
  /** Live berechnete Gruppentabellen (auch unvollständig) */
  tables: Record<GroupId, TableRow[]>
  groupComplete: Record<GroupId, boolean>
  allGroupsComplete: boolean
  /** Rangliste der 12 Dritten (nur wenn alle Gruppen fertig getippt) */
  thirds?: ThirdRank[]
  qualifiedThirds?: GroupId[]
  /** R32-Spielnummer → Gruppe des zugeordneten Dritten */
  thirdAllocation?: Record<number, GroupId>
  /** false = Näherung per Backtracking (Annexe C fehlt für diese Kombination) */
  officialAllocation?: boolean
  /** Spielnummer (73–104) → aufgelöste TeamIds bzw. verbleibende Platzhalter */
  teams: Record<number, { home: string; away: string }>
  /** Spielnummer → Sieger-TeamId (nur wenn Teams aufgelöst + Tipp vorhanden/entscheidbar) */
  winner: Record<number, string | undefined>
  champion?: string
}

const isTeamId = (slot: string): boolean => /^[A-Z]{3}$/.test(slot)

/** Löst die komplette Tipp-Welt auf: Tabellen → Dritte (Annexe C) → KO-Baum bis zum Weltmeister. */
export function resolveTipBracket(tips: Record<number, Tip>): TipBracket {
  const tables = {} as Record<GroupId, TableRow[]>
  const groupComplete = {} as Record<GroupId, boolean>
  for (const g of GROUPS) {
    tables[g] = computeGroupTable(GROUP_MATCHES[g], tips)
    groupComplete[g] = GROUP_MATCHES[g].every((m) => tips[m.match])
  }
  const allGroupsComplete = GROUPS.every((g) => groupComplete[g])

  const rankOf = (g: GroupId, rank: 1 | 2 | 3): string | null =>
    groupComplete[g] ? tables[g][rank - 1].team : null

  let thirds: ThirdRank[] | undefined
  let qualifiedThirds: GroupId[] | undefined
  let thirdAllocation: Record<number, GroupId> | undefined
  let officialAllocation: boolean | undefined
  if (allGroupsComplete) {
    thirds = rankThirds(GROUPS.map((g) => ({ group: g, row: tables[g][2] })))
    qualifiedThirds = thirds.slice(0, 8).map((t) => t.group)
    const result = allocateThirds(qualifiedThirds, BRACKET.thirdPlaceAllocation.slots, ANNEX_C)
    if (result) {
      thirdAllocation = result.allocation
      officialAllocation = result.official
    }
  }

  const teams: Record<number, { home: string; away: string }> = {}
  const winner: Record<number, string | undefined> = {}
  const loser: Record<number, string | undefined> = {}

  const resolveSlot = (slot: string, matchNumber: number): string => {
    let m: RegExpExecArray | null
    if ((m = /^([12])([A-L])$/.exec(slot))) {
      return rankOf(m[2] as GroupId, m[1] === '1' ? 1 : 2) ?? slot
    }
    if (/^3[A-L]+$/.test(slot)) {
      const g = thirdAllocation?.[matchNumber]
      return g ? (rankOf(g, 3) ?? slot) : slot
    }
    if ((m = /^W(\d+)$/.exec(slot))) return winner[Number(m[1])] ?? slot
    if ((m = /^L(\d+)$/.exec(slot))) return loser[Number(m[1])] ?? slot
    return slot
  }

  // aufsteigend: Vorgänger-Spiele sind immer zuerst aufgelöst
  for (const bm of [...KO_MATCHES].sort((a, b) => a.match - b.match)) {
    const home = resolveSlot(bm.home, bm.match)
    const away = resolveSlot(bm.away, bm.match)
    teams[bm.match] = { home, away }
    const tip = tips[bm.match]
    if (tip && isTeamId(home) && isTeamId(away)) {
      if (tip.h > tip.a) {
        winner[bm.match] = home
        loser[bm.match] = away
      } else if (tip.h < tip.a) {
        winner[bm.match] = away
        loser[bm.match] = home
      } else if (tip.adv) {
        winner[bm.match] = tip.adv === 'home' ? home : away
        loser[bm.match] = tip.adv === 'home' ? away : home
      }
    }
  }

  return {
    tables,
    groupComplete,
    allGroupsComplete,
    thirds,
    qualifiedThirds,
    thirdAllocation,
    officialAllocation,
    teams,
    winner,
    champion: winner[104]
  }
}
