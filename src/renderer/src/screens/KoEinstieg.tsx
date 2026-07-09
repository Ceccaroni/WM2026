import { useMemo, useState } from 'react'
import KoTipMatch from '../components/KoTipMatch'
import { ROUND_LABEL, TEAM_BY_ID } from '../lib/data'
import { resolveTipBracket } from '../lib/bracket'
import { entrySchedule, LATE_ENTRIES, resolveLateBracket } from '../lib/lateEntry'
import { resultsAsTips } from '../lib/results'
import type { LateKind } from '../lib/lateEntry'
import type { Round, ScheduledMatch } from '../lib/types'
import { useApp, useMyTips } from '../store'

const ROUND_ORDER: Round[] = ['r32', 'r16', 'qf', 'sf', 'third', 'final']

export default function KoEinstieg() {
  const [kind, setKind] = useState<LateKind>('fromR32')
  const results = useApp((s) => s.results)
  const entries = useApp((s) => s.entries)
  const activeProfileId = useApp((s) => s.activeProfileId)

  const realBracket = useMemo(() => resolveTipBracket(resultsAsTips(results)), [results])

  const tippedIn = (d: (typeof LATE_ENTRIES)[number]): number => {
    const t = activeProfileId ? (entries[activeProfileId]?.[d.kind]?.tips ?? {}) : {}
    return Object.keys(t).length
  }

  // Eine Runde ist freigeschaltet, sobald ihre echten Paarungen feststehen (ESPN-Teams
  // oder aufgelöste Tabellen für ALLE Spiele der Runde). Künftige Runden bleiben verborgen,
  // bereits getippte bleiben zum Nachschauen sichtbar.
  const isFixed = (d: (typeof LATE_ENTRIES)[number]): boolean =>
    entrySchedule(d).every((m) => {
      const r = results[m.match]
      const t = realBracket.teams[m.match]
      return (
        (TEAM_BY_ID.has(r?.homeTeam ?? '') && TEAM_BY_ID.has(r?.awayTeam ?? '')) ||
        (TEAM_BY_ID.has(t.home) && TEAM_BY_ID.has(t.away))
      )
    })

  const visibleDefs = LATE_ENTRIES.filter((d) => isFixed(d) || tippedIn(d) > 0)
  // Auswahl auf eine sichtbare Runde klemmen (sonst leerer Inhalt, falls die gewählte noch gesperrt ist)
  const activeKind = visibleDefs.some((d) => d.kind === kind) ? kind : (visibleDefs[0]?.kind ?? kind)

  const tips = useMyTips(activeKind)
  const def = LATE_ENTRIES.find((d) => d.kind === activeKind)!
  const matches = useMemo(() => entrySchedule(def), [def])
  const lateBracket = useMemo(() => resolveLateBracket(tips, results, realBracket), [tips, results, realBracket])

  // Aktive Runde freigeschaltet, aber einzelne Teams noch Platzhalter? (Übergangsmoment)
  const firstRound = matches[0].round
  const entryRoundOpen = matches
    .filter((m) => m.round === firstRound)
    .some((m) => {
      const t = lateBracket.teams[m.match]
      return !TEAM_BY_ID.has(t.home) || !TEAM_BY_ID.has(t.away)
    })

  const byRound = ROUND_ORDER.filter((r) => matches.some((m) => m.round === r)).map(
    (r): [Round, ScheduledMatch[]] => [r, matches.filter((m) => m.round === r)]
  )

  return (
    <>
      <h1>KO-Runde</h1>
      <p className="lead">
        Jede KO-Runde ist eine eigene Wertungskategorie: Sobald die echten Paarungen feststehen, schaltet sich
        die Runde hier frei und du tippst sie frisch mit den richtigen Teams. Punkte: 4/3/2 je Spiel plus 1 pro
        richtigem Weiterkommer. Der Weltmeister-Tipp läuft separat in der Hauptwertung weiter.
      </p>

      {visibleDefs.length === 0 ? (
        <p className="notice">
          Noch ist keine KO-Runde freigeschaltet. Sobald die Paarungen einer Runde feststehen, erscheint sie hier
          automatisch zum Tippen.
        </p>
      ) : (
        <>
          <div className="groupchips">
            {visibleDefs.map((d) => (
              <button
                key={d.kind}
                className={`groupchip groupchip--ko${d.kind === activeKind ? ' groupchip--active' : ''}${
                  tippedIn(d) === entrySchedule(d).length ? ' groupchip--done' : ''
                }`}
                onClick={() => setKind(d.kind)}
              >
                {d.label}
                <small>
                  {tippedIn(d)}/{entrySchedule(d).length}
                </small>
              </button>
            ))}
          </div>

          <section className="album">
            <header className="album__head">
              <h2 className="foil">{def.title}</h2>
              <span className="badge badge--round">eigene Wertungskategorie</span>
            </header>
            {entryRoundOpen && (
              <p className="notice">
                Die echten Paarungen dieser Runde erscheinen hier automatisch, sobald die Vorrunde gespielt ist.
                Tippen geht, sobald die Teams eingeklebt sind.
              </p>
            )}
            {byRound.map(([round, ms]) => (
              <div key={round} className="album__matchday">
                <h3>{ROUND_LABEL[round]}</h3>
                {ms.map((m) => (
                  <KoTipMatch
                    key={m.match}
                    match={m}
                    tip={tips[m.match]}
                    slots={lateBracket.teams[m.match]}
                    entry={activeKind}
                    tables={realBracket.tables}
                  />
                ))}
              </div>
            ))}
          </section>
        </>
      )}
    </>
  )
}
