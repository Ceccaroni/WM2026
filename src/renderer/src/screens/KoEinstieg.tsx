import { useMemo, useState } from 'react'
import FlagBadge from '../components/FlagBadge'
import HoloSticker from '../components/HoloSticker'
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
  const tips = useMyTips(kind)

  const def = LATE_ENTRIES.find((d) => d.kind === kind)!
  const matches = useMemo(() => entrySchedule(def), [def])

  const realBracket = useMemo(() => resolveTipBracket(resultsAsTips(results)), [results])
  const lateBracket = useMemo(() => resolveLateBracket(tips, results, realBracket), [tips, results, realBracket])

  const tippedIn = (d: (typeof LATE_ENTRIES)[number]): number => {
    const t = activeProfileId ? (entries[activeProfileId]?.[d.kind]?.tips ?? {}) : {}
    return Object.keys(t).length
  }

  // Einstiegsrunde noch ohne echte Qualifikanten? (erst Ende Gruppenphase / Vorrunden)
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

  const champion = lateBracket.champion ? TEAM_BY_ID.get(lateBracket.champion) : undefined

  return (
    <>
      <h1>KO-Einstieg</h1>
      <p className="lead">
        Zu spät fürs Durchtippen ab Spiel 1? Pro KO-Runde gibt es eine eigene Wertungskategorie — die Einstiegsrunde ist
        mit den echten Qualifikanten vorbefüllt, ab dort tippst du durch bis zum Weltmeister. Jede Einstiegsrunde
        ist eine eigene Wertungskategorie — fair gegenüber denen, die ab Spiel 1 dabei sind.
      </p>

      <div className="groupchips">
        {LATE_ENTRIES.map((d) => (
          <button
            key={d.kind}
            className={`groupchip groupchip--ko${d.kind === kind ? ' groupchip--active' : ''}${
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
            Die echten Qualifikanten erscheinen hier automatisch, sobald sie feststehen (Gruppenphase endet am 27. Juni,
            das Sechzehntelfinale startet am 28. Juni). Tippen geht, sobald die Teams eingeklebt sind.
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
                entry={kind}
                tables={realBracket.tables}
              />
            ))}
          </div>
        ))}
        {champion && (
          <HoloSticker gold>
            <div className="champbanner">
              <FlagBadge flag={champion.flag} size="xl" />
              <div>
                <small>Dein Weltmeister ({def.label})</small>
                <strong className="foil">{champion.name}</strong>
              </div>
            </div>
          </HoloSticker>
        )}
      </section>
    </>
  )
}
