import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ROUND_LABEL, SCHEDULE } from '../lib/data'
import { resolveTipBracket } from '../lib/bracket'
import { entrySchedule, LATE_ENTRIES, resolveLateBracket } from '../lib/lateEntry'
import { buildRealWorld, resultsAsTips } from '../lib/results'
import { computeBreakdown } from '../lib/scoring'
import type { ScoreBreakdown } from '../lib/scoring'
import type { Profile, Round, ScoringConfig } from '../lib/types'
import { useApp } from '../store'
import HoloSticker from '../components/HoloSticker'

/** Punktesystem als Album-Karte erklärt — Werte live aus der Konfiguration. */
function Punktesystem({ scoring }: { scoring: ScoringConfig }) {
  return (
    <section className="papercard rules">
      <h3>So zählen die Punkte</h3>
      <div className="rules__cols">
        <div>
          <h4>Pro Spiel — dein Tipp gegen den Endstand</h4>
          <ul>
            <li>
              <span className="rules__pill rules__pill--gold">+{scoring.exact}</span> Exaktes Ergebnis getroffen
            </li>
            <li>
              <span className="rules__pill">+{scoring.diff}</span> Richtige Tordifferenz (bzw. richtiges Unentschieden)
            </li>
            <li>
              <span className="rules__pill">+{scoring.tendency}</span> Richtige Tendenz (Sieger oder Unentschieden)
            </li>
            <li>
              <span className="rules__pill">+{scoring.koAdvance}</span> KO-Spiele zusätzlich: richtiger Weiterkommer —
              auch wenn das Ergebnis daneben lag
            </li>
          </ul>
          <p className="rules__note">
            Bei KO-Spielen zählt das Endergebnis inkl. Verlängerung; endet es unentschieden, zählt zusätzlich der
            Sieger (Elfmeterschießen). Gewertet wird Spiel für Spiel im Turnierbaum — auch wenn bei dir andere Teams
            an dieser Stelle stehen (wie bei kicktipp üblich).
          </p>
        </div>
        <div>
          <h4>Durchtipp-Boni — fürs Weitsehen</h4>
          <p className="rules__intro">
            Aus deinen Tipps baut sich dein eigener Turnierbaum. Erreicht ein Team eine Runde <em>bei dir</em> und{' '}
            <em>in echt</em>, gibt es den Bonus dieser Runde — egal, auf welchem Weg es dort ankommt:
          </p>
          <ul>
            <li>
              <span className="rules__pill">+{scoring.bonusR16}</span> je richtiger Achtelfinalist
            </li>
            <li>
              <span className="rules__pill">+{scoring.bonusQF}</span> je richtiger Viertelfinalist
            </li>
            <li>
              <span className="rules__pill">+{scoring.bonusSF}</span> je richtiger Halbfinalist
            </li>
            <li>
              <span className="rules__pill">+{scoring.bonusFinal}</span> je richtiger Finalist
            </li>
            <li>
              <span className="rules__pill rules__pill--gold">+{scoring.bonusChampion}</span> richtiger{' '}
              <strong className="foil">Weltmeister</strong>
            </li>
          </ul>
          <p className="rules__note rules__note--gold">
            Die Boni stapeln sich Runde für Runde: Tippst du z.&nbsp;B. Spanien bis zum Titel durch und Spanien wird
            wirklich Weltmeister, bringt dir dieses eine Team {scoring.bonusR16}&nbsp;+&nbsp;{scoring.bonusQF}
            &nbsp;+&nbsp;{scoring.bonusSF}&nbsp;+&nbsp;{scoring.bonusFinal}&nbsp;+&nbsp;{scoring.bonusChampion}
            &nbsp;=&nbsp;
            <strong>
              {scoring.bonusR16 + scoring.bonusQF + scoring.bonusSF + scoring.bonusFinal + scoring.bonusChampion}{' '}
              Bonuspunkte
            </strong>
            . Gutgeschrieben wird, sobald die jeweilige Runde in echt feststeht.
          </p>
          <p className="rules__note">
            Der KO-Einstieg (ab 1/16, 1/8 …) ist eine eigene Kategorie, in der alle mit den echten Paarungen frisch
            tippen: Die Einstiegsrunde selbst bringt keine Teilnehmer-Boni (ihr Feld steht ja fest) — ab der nächsten
            Runde gilt alles wie hier.
          </p>
        </div>
      </div>
    </section>
  )
}

interface Row {
  profile: Profile
  bd: ScoreBreakdown
  tipped: number
  rank: number
}

interface Board {
  key: string
  title: string
  /** Ein-Satz-Erklärung, was diese Wertung ist — gegen die „Auswertung des Todes" */
  hint: string
  rows: Row[]
}

const KO_ROUNDS: Round[] = ['r32', 'r16', 'qf', 'sf', 'third', 'final']

function rankRows(unranked: Array<Omit<Row, 'rank'>>): Row[] {
  unranked.sort(
    (a, b) => b.bd.total - a.bd.total || b.bd.exact - a.bd.exact || a.profile.name.localeCompare(b.profile.name, 'de')
  )
  // Standard-Wettkampf-Ränge: punktgleich (inkl. exakte Treffer) = gleicher Rang
  const ranked: Row[] = []
  for (const [i, r] of unranked.entries()) {
    const prev = ranked[i - 1]
    const tied = prev != null && prev.bd.total === r.bd.total && prev.bd.exact === r.bd.exact
    ranked.push({ ...r, rank: tied ? prev.rank : i + 1 })
  }
  return ranked
}

const ROUND_SHORT: Record<Round, string> = {
  group: 'GR',
  r32: '1/16',
  r16: '1/8',
  qf: 'VF',
  sf: 'HF',
  third: 'P3',
  final: 'F'
}

/** Formkurve: Punkte je Spieltag/KO-Runde als Mini-Balken (Kür zu §3.4). */
function Spark({ lines }: { lines: Array<{ label: string; short: string; pts: number }> }) {
  const max = Math.max(1, ...lines.map((l) => l.pts))
  return (
    <div className="spark">
      {lines.map((l) => (
        <span key={l.label} className="spark__col" title={`${l.label}: ${l.pts} Punkte`}>
          <small className="spark__val">{l.pts > 0 ? l.pts : ''}</small>
          <span className="spark__bar" style={{ height: `${3 + (l.pts / max) * 36}px` }} />
          <small className="spark__cap">{l.short}</small>
        </span>
      ))}
    </div>
  )
}

function Detail({ bd, showMatchdays }: { bd: ScoreBreakdown; showMatchdays: boolean }) {
  const lines = [
    ...(showMatchdays
      ? ([1, 2, 3] as const).map((d) => ({ label: `Spieltag ${d}`, short: `S${d}`, pts: bd.byMatchday[d] }))
      : []),
    ...KO_ROUNDS.filter((r) => bd.byRound[r] != null).map((r) => ({
      label: ROUND_LABEL[r],
      short: ROUND_SHORT[r],
      pts: bd.byRound[r]!
    }))
  ]
  const boni: string[] = []
  if (bd.advanceCount > 0) boni.push(`${bd.advanceCount}× richtiger Weiterkommer (+${bd.advance})`)
  for (const [key, label] of [
    ['r16', 'Achtelfinalisten'],
    ['qf', 'Viertelfinalisten'],
    ['sf', 'Halbfinalisten'],
    ['final', 'Finalisten']
  ] as const) {
    if (bd.durchtipp[key] > 0) boni.push(`${bd.durchtipp[key]}× ${label}`)
  }
  if (bd.durchtipp.champion) boni.push('Weltmeister ✓')

  return (
    <div className="lbdetail">
      {lines.length > 0 && <Spark lines={lines} />}
      <div className="lbdetail__boni">
        {boni.length > 0 ? `Boni: ${boni.join(' · ')} — zusammen +${bd.advance + bd.durchtippPts}` : 'Noch keine Bonuspunkte.'}
      </div>
    </div>
  )
}

export default function Rangliste() {
  const profiles = useApp((s) => s.profiles)
  const entries = useApp((s) => s.entries)
  const results = useApp((s) => s.results)
  const scoring = useApp((s) => s.scoring)
  const activeProfileId = useApp((s) => s.activeProfileId)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showRules, setShowRules] = useState(false)

  const boards = useMemo<Board[]>(() => {
    const realBracket = resolveTipBracket(resultsAsTips(results))
    const real = buildRealWorld(results, realBracket)

    const main: Board = {
      key: 'main',
      title: 'Hauptwertung — Durchtippen ab Spiel 1',
      hint: 'Der Juni-Tipp läuft das ganze Turnier: Basispunkte für jedes Spiel (KO: pro Spielnummer, Ergebnis-Tipps bis zum Anstoß änderbar) plus Weiterkommer- und Durchtipp-Boni für alles, was du im Voraus richtig gesehen hast.',
      rows: rankRows(
        profiles.map((profile) => {
          const tips = entries[profile.id]?.main?.tips ?? {}
          const bd = computeBreakdown(tips, resolveTipBracket(tips), results, real, SCHEDULE, scoring)
          return { profile, bd, tipped: Object.keys(tips).length }
        })
      )
    }

    // Späteinstiegs-Kategorien: nur anzeigen, wenn jemand dort tippt (BRIEFING §3.5)
    const late = LATE_ENTRIES.flatMap((def): Board[] => {
      const entrants = profiles.filter((p) => Object.keys(entries[p.id]?.[def.kind]?.tips ?? {}).length > 0)
      if (entrants.length === 0) return []
      const schedule = entrySchedule(def)
      return [
        {
          key: def.kind,
          title: `KO-Einstieg ${def.label} — ${def.title}`,
          hint: 'Hier tippen alle frisch mit den echten Paarungen — eigene Wertung, die Hauptwertung läuft parallel weiter. Die Einstiegsrunde bringt keine Teilnehmer-Boni (ihr Feld steht fest), danach gilt das normale Punktesystem.',
          rows: rankRows(
            entrants.map((profile) => {
              const tips = entries[profile.id]?.[def.kind]?.tips ?? {}
              const bd = computeBreakdown(
                tips,
                resolveLateBracket(tips, results, realBracket),
                results,
                real,
                schedule,
                scoring,
                def.bonusRounds
              )
              return { profile, bd, tipped: Object.keys(tips).length }
            })
          )
        }
      ]
    })

    return [main, ...late]
  }, [profiles, entries, results, scoring])

  // FLIP: Zeilen gleiten an ihre neue Position, wenn sich die Reihenfolge ändert (§3.4)
  const listRef = useRef<HTMLDivElement>(null)
  const positions = useRef(new Map<string, number>())
  useLayoutEffect(() => {
    const els = listRef.current?.querySelectorAll<HTMLElement>('[data-pid]') ?? []
    for (const el of els) {
      const id = el.dataset['pid']!
      const top = el.getBoundingClientRect().top
      const prev = positions.current.get(id)
      if (prev !== undefined && Math.abs(prev - top) > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.animate(
          [{ transform: `translateY(${prev - top}px)` }, { transform: 'translateY(0)' }],
          { duration: 450, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
        )
      }
      positions.current.set(id, top)
    }
  })

  return (
    <>
      <h1>Rangliste</h1>
      <p className="lead">
        Die Hauptwertung: alle, die ab Spiel 1 durchtippen. Zeile anklicken für die Aufschlüsselung nach Spieltagen,
        Runden und Boni.
      </p>
      <button className={`btn rules__toggle${showRules ? ' rules__toggle--open' : ''}`} onClick={() => setShowRules(!showRules)}>
        {showRules ? '× Punktesystem zuklappen' : 'ⓘ Wie zählen die Punkte?'}
      </button>
      {showRules && <Punktesystem scoring={scoring} />}
      {profiles.length < 2 && (
        <p className="notice">
          Noch alleine im Album — importiere <code>.wm26tipp</code>-Dateien der anderen (Rubrik Profile), dann erscheinen
          sie hier.
        </p>
      )}
      <div ref={listRef}>
        {boards.map((board) => (
          <section key={board.key}>
            <h2 className="sectiontitle">{board.title}</h2>
            <p className="boardhint">{board.hint}</p>
            <div className="leaderboard">
              {board.rows.map((row) => {
                const p = row.profile
                const rowKey = `${board.key}:${p.id}`
                const first = row.rank === 1 && row.bd.total > 0
                const btn = (
                  <button
                    className={`lbrow${first ? ' lbrow--first' : ''}${p.id === activeProfileId ? ' lbrow--me' : ''}`}
                    onClick={() => setExpanded(expanded === rowKey ? null : rowKey)}
                  >
                    <span className={`lbrow__rank${first ? ' foil' : ''}`}>{row.rank}</span>
                    <span className="lbrow__dot" style={{ background: p.color }} />
                    <span className="lbrow__name">
                      {p.name}
                      {p.imported && <small>importiert</small>}
                    </span>
                    <span className="lbrow__chips">
                      {row.tipped === 0
                        ? 'noch keine Tipps'
                        : `${row.bd.exact}× exakt · ${row.bd.diff}× Differenz · ${row.bd.tendency}× Tendenz` +
                          (row.bd.advance + row.bd.durchtippPts > 0
                            ? ` · +${row.bd.advance + row.bd.durchtippPts} Boni`
                            : '')}
                    </span>
                    <span className={`lbrow__total${first ? ' foil' : ''}`}>{row.bd.total}</span>
                  </button>
                )
                return (
                  <div key={rowKey} data-pid={rowKey}>
                    {first ? (
                      // Belohnungs-Regel: Gold-Foil nur für die Führung — Schimmer + Glow beim Hovern
                      <HoloSticker gold className="lbholo">
                        {btn}
                      </HoloSticker>
                    ) : (
                      btn
                    )}
                    {expanded === rowKey && <Detail bd={row.bd} showMatchdays={board.key === 'main'} />}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
