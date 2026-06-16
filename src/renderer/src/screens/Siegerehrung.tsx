import { useEffect, useMemo, useState } from 'react'
import { SCHEDULE, TEAM_BY_ID } from '../lib/data'
import { resolveTipBracket } from '../lib/bracket'
import { entrySchedule, LATE_ENTRIES, resolveLateBracket } from '../lib/lateEntry'
import { buildRealWorld, resultsAsTips } from '../lib/results'
import { computeBreakdown } from '../lib/scoring'
import type { ScoreBreakdown } from '../lib/scoring'
import type { Profile, Team } from '../lib/types'
import { useApp } from '../store'
import HoloSticker from '../components/HoloSticker'
import FlagBadge from '../components/FlagBadge'

// Die Siegerehrung krönt drei Disziplinen (Adrians Modell):
//   Hauptsieger  = Hauptwertung + KO-Wertung zusammen (Gesamttippkönig)
//   Sieger Haupt = nur die Hauptwertung (Durchtippen ab Spiel 1)
//   Sieger KO    = nur die KO-Wertung (= fromR32, „ab 1/16", die alle gemeinsam tippen)
// Gewinnt EINE Person alle drei → das Triple (Superscreen).
const FINAL_MATCH = 104
const KO = LATE_ENTRIES[0] // 'fromR32' — der gemeinsame KO-Durchtipp ab Sechzehntelfinale
const DEV = import.meta.env.DEV

interface Standing {
  profile: Profile
  main: ScoreBreakdown
  ko: ScoreBreakdown | null
  combined: number
  mainTipped: boolean
  koTipped: boolean
}

/** Vergleichsfunktion: Punkte ↓, dann exakte Treffer ↓, dann Name (wie Rangliste). */
const byScore =
  (get: (s: Standing) => number) =>
  (a: Standing, b: Standing): number =>
    get(b) - get(a) || b.main.exact - a.main.exact || a.profile.name.localeCompare(b.profile.name, 'de')

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]}`
}

// — dev/shot-only Demo: das echte Finale ist erst am 19.07., darum eine Vorschau der Zeremonie
//   mit plausiblen Mock-Daten. Im Release (import.meta.env.DEV === false, kein Shot) nie aktiv.
function mockBd(total: number, exact: number, champion = false): ScoreBreakdown {
  return {
    total,
    base: total,
    exact,
    diff: Math.round(exact * 0.7),
    tendency: Math.round(exact * 0.5),
    advance: 0,
    advanceCount: 0,
    durchtipp: { r16: 0, qf: 0, sf: 0, final: 0, champion },
    durchtippPts: 0,
    byMatchday: { 1: 0, 2: 0, 3: 0 },
    byRound: {},
    perMatch: {}
  }
}
const DEMO_FALLBACK: Profile[] = [
  { id: 'demo-1', name: 'Adrian', color: '#e62e6b' },
  { id: 'demo-2', name: 'Neffe', color: '#0b5fa5' },
  { id: 'demo-3', name: 'Reto', color: '#1f8a4c' },
  { id: 'demo-4', name: 'Livia', color: '#e0972a' },
  { id: 'demo-5', name: 'Claude', color: '#8c6a1d' }
]
function buildDemo(profiles: Profile[], mode: 'ceremony' | 'triple'): { standings: Standing[]; championTeam?: Team } {
  const base = profiles.length >= 3 ? profiles : DEMO_FALLBACK
  const standings = base.map((profile, i): Standing => {
    // Werte index-basiert (eindeutig & fallend) — egal wie viele Profile, keine zwei landen gleich
    let m: number
    let k: number
    if (mode === 'triple') {
      m = Math.max(0, 132 - i * 13) // Platz 1 gewinnt alle drei Wertungen
      k = Math.max(0, 55 - i * 8)
    } else if (i === 0) {
      m = 118 // Gesamtsieger (157)
      k = 39
    } else if (i === 1) {
      m = 130 // Sieger Hauptwertung (152)
      k = 22
    } else if (i === 2) {
      m = 90 // Sieger KO-Wertung (146)
      k = 56
    } else {
      m = Math.max(0, 108 - i * 9)
      k = Math.max(0, 33 - i * 4)
    }
    return {
      profile,
      main: mockBd(m, Math.max(0, 9 - i), i === 0),
      ko: mockBd(k, Math.max(0, 4 - (i % 4))),
      combined: m + k,
      mainTipped: true,
      koTipped: true
    }
  })
  return { standings, championTeam: TEAM_BY_ID.get('ESP') }
}

/** Dauer-Konfetti für die Zeremonie (reicher als der kurze Volltreffer-Funke). */
const CONFETTI = Array.from({ length: 44 }, (_, i) => ({
  left: (i * 2.27 + (i % 4) * 1.7) % 100,
  delay: ((i % 12) * 0.31).toFixed(2),
  dur: (3 + (i % 6) * 0.45).toFixed(2),
  drift: ((i % 9) - 4) * 18,
  tone: i % 3
}))
function Confetti() {
  return (
    <div className="cer-confetti" aria-hidden="true">
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className={`cer-bit cer-bit--${c.tone}`}
          style={{
            left: `${c.left}%`,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.dur}s`,
            ['--drift' as string]: `${c.drift}px`
          }}
        />
      ))}
    </div>
  )
}

const MEDAL = ['🥇', '🥈', '🥉']
function Podest({ top, gold }: { top: Standing[]; gold: boolean }) {
  const [first, second, third] = top
  // Olympia-Anordnung: 2 · 1 · 3
  const cols: Array<{ s?: Standing; place: 1 | 2 | 3 }> = [
    { s: second, place: 2 },
    { s: first, place: 1 },
    { s: third, place: 3 }
  ]
  return (
    <div className="podest">
      {cols.map(({ s, place }) =>
        s ? (
          <div key={place} className={`podest__col podest__col--${place}`}>
            {gold && place === 1 ? (
              <HoloSticker gold className="podest__holo">
                <PodestCard s={s} place={place} gold />
              </HoloSticker>
            ) : (
              <PodestCard s={s} place={place} gold={false} />
            )}
            <div className={`podest__base podest__base--${place}`}>{place}</div>
          </div>
        ) : (
          <div key={place} className={`podest__col podest__col--${place}`} />
        )
      )}
    </div>
  )
}
function PodestCard({ s, place, gold }: { s: Standing; place: number; gold: boolean }) {
  return (
    <div className={`podest__card podest__card--${place}`}>
      <span className="podest__medal">{MEDAL[place - 1]}</span>
      <span className="podest__dot" style={{ background: s.profile.color }} />
      <span className="podest__name">{s.profile.name}</span>
      <span className={`podest__pts${gold ? ' foil' : ''}`}>{s.combined}</span>
      <span className="podest__sub">
        Haupt {s.main.total}
        {s.ko ? ` · KO ${s.ko.total}` : ''}
      </span>
    </div>
  )
}

function MiniWinner({ title, sub, s, score }: { title: string; sub: string; s?: Standing; score?: number }) {
  return (
    <div className="cer-mini">
      <span className="cer-mini__title">{title}</span>
      {s && score != null && score > 0 ? (
        <>
          <span className="cer-mini__name">
            <span className="podest__dot" style={{ background: s.profile.color }} />
            {s.profile.name}
          </span>
          <span className="cer-mini__pts">{score} Pkt.</span>
        </>
      ) : (
        <span className="cer-mini__empty">{sub}</span>
      )}
    </div>
  )
}

export default function Siegerehrung() {
  const profiles = useApp((s) => s.profiles)
  const entries = useApp((s) => s.entries)
  const results = useApp((s) => s.results)
  const scoring = useApp((s) => s.scoring)
  const activeProfileId = useApp((s) => s.activeProfileId)
  const [demo, setDemo] = useState<'off' | 'ceremony' | 'triple'>('off')

  // Countdown bis zum Finale — tickt minütlich (im Shot-Modus eingefroren = deterministisch)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (window.wm26.shotMode) return
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const { standings, championTeam } = useMemo(() => {
    const realBracket = resolveTipBracket(resultsAsTips(results))
    const real = buildRealWorld(results, realBracket)
    const koSchedule = entrySchedule(KO)
    const rows = profiles.map((profile): Standing => {
      const mainTips = entries[profile.id]?.main?.tips ?? {}
      const main = computeBreakdown(mainTips, resolveTipBracket(mainTips), results, real, SCHEDULE, scoring)
      const koTips = entries[profile.id]?.fromR32?.tips ?? {}
      const koTipped = Object.keys(koTips).length > 0
      const ko = koTipped
        ? computeBreakdown(koTips, resolveLateBracket(koTips, results, realBracket), results, real, koSchedule, scoring, KO.bonusRounds)
        : null
      return {
        profile,
        main,
        ko,
        combined: main.total + (ko?.total ?? 0),
        mainTipped: Object.keys(mainTips).length > 0,
        koTipped
      }
    })
    return { standings: rows, championTeam: real.champion ? TEAM_BY_ID.get(real.champion) : undefined }
  }, [profiles, entries, results, scoring])

  const isFinalPlayed = results[FINAL_MATCH]?.status === 'finished'
  // Zeremonie-Vorschau nur im Dev (umschaltbar per Buttons, auch im Shot-Hook); im Release nie (tree-geshaket).
  const effectiveDemo: 'off' | 'ceremony' | 'triple' = DEV ? demo : 'off'
  const demoData = effectiveDemo !== 'off' ? buildDemo(profiles, effectiveDemo) : null
  const view = demoData ?? { standings, championTeam }
  const ceremony = isFinalPlayed || demoData != null

  const byCombined = [...view.standings].sort(byScore((s) => s.combined))
  const byMain = [...view.standings].sort(byScore((s) => s.main.total))
  const byKo = view.standings.filter((s) => s.koTipped).sort(byScore((s) => s.ko?.total ?? 0))
  const hauptsieger = byCombined[0]
  const mainWinner = byMain[0]
  const koWinner = byKo[0]
  const championTippers = view.standings.filter((s) => s.main.durchtipp.champion).map((s) => s.profile.name)
  const triple =
    !!hauptsieger &&
    !!mainWinner &&
    !!koWinner &&
    hauptsieger.profile.id === mainWinner.profile.id &&
    mainWinner.profile.id === koWinner.profile.id &&
    hauptsieger.combined > 0

  const finalIso = SCHEDULE.find((m) => m.match === FINAL_MATCH)?.dateUtc
  const finalMs = finalIso ? new Date(finalIso).getTime() : 0
  const year = finalIso ? new Date(finalIso).getFullYear() : 2026
  const finalDateStr = finalIso
    ? new Date(finalIso).toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Zurich' })
    : ''
  const left = Math.max(0, finalMs - now)
  const cd = {
    days: Math.floor(left / 86_400_000),
    hours: Math.floor((left % 86_400_000) / 3_600_000),
    mins: Math.floor((left % 3_600_000) / 60_000)
  }

  if (profiles.length === 0 && !demoData) {
    return (
      <>
        <h1>Siegerehrung</h1>
        <p className="notice">
          Noch niemand im Album — sobald Profile da sind und das Finale gespielt ist, steigt hier die grosse Krönung.
        </p>
      </>
    )
  }

  return (
    <>
      {ceremony && <Confetti />}
      <h1>Siegerehrung</h1>

      {DEV && (
        <div className="cer-devbar">
          <span>dev-Vorschau:</span>
          <button className={demo === 'ceremony' ? 'active' : ''} onClick={() => setDemo(demo === 'ceremony' ? 'off' : 'ceremony')}>
            Zeremonie
          </button>
          <button className={demo === 'triple' ? 'active' : ''} onClick={() => setDemo(demo === 'triple' ? 'off' : 'triple')}>
            Triple 😎
          </button>
        </div>
      )}

      {!ceremony ? (
        <>
          <section className="cer-teaser">
            <span className="cer-cup">🏆</span>
            <h2 className="cer-teaser__head foil">Die grosse Krönung folgt</h2>
            <p className="cer-teaser__sub">
              Nach dem Finale am {finalDateStr} steigt hier die Siegerehrung — Podest, Konfetti und Gold-Folie für den
              Tippkönig.
            </p>
            {left > 0 && (
              <div className="cer-countdown" role="timer" aria-label="Countdown bis zum Finale">
                <span className="cer-cd-cell">
                  <span className="cer-cd-num">{cd.days}</span>
                  <span className="cer-cd-lab">Tage</span>
                </span>
                <span className="cer-cd-cell">
                  <span className="cer-cd-num">{cd.hours}</span>
                  <span className="cer-cd-lab">Std</span>
                </span>
                <span className="cer-cd-cell">
                  <span className="cer-cd-num">{cd.mins}</span>
                  <span className="cer-cd-lab">Min</span>
                </span>
              </div>
            )}
          </section>

          <section>
            <h2 className="sectiontitle">Aktuelle Führung — Gesamtwertung</h2>
            <p className="boardhint">
              Haupt- und KO-Wertung zusammen, Stand jetzt. Zählt zur Krönung erst, wenn das Finale gespielt ist — bis
              dahin kann sich noch alles drehen.
            </p>
            <Podest top={byCombined.slice(0, 3)} gold={false} />
          </section>
        </>
      ) : (
        <>
          {triple && (
            <section className="cer-super">
              <span className="cer-super__crown">👑</span>
              <strong className="cer-super__head foil">Das Triple!</strong>
              <p className="cer-super__sub">
                {hauptsieger.profile.name} gewinnt Gesamtwertung, Hauptwertung <em>und</em> KO-Wertung — eine perfekte
                Siegerehrung.
              </p>
            </section>
          )}

          <section className="cer-champ">
            <span className="cer-champ__label">Weltmeister {year}</span>
            {view.championTeam ? (
              <>
                <div className="cer-champ__team">
                  <FlagBadge flag={view.championTeam.flag} size="xl" />
                  <strong className="cer-champ__name foil">{view.championTeam.name}</strong>
                </div>
                {championTippers.length > 0 ? (
                  <span className="cer-champ__tips">
                    🎯 Richtig getippt von {joinNames(championTippers)} (+{scoring.bonusChampion})
                  </span>
                ) : (
                  <span className="cer-champ__tips cer-champ__tips--miss">Niemand hatte den Weltmeister auf dem Zettel.</span>
                )}
              </>
            ) : (
              <span className="cer-champ__pending">Der Weltmeister steht noch nicht fest.</span>
            )}
          </section>

          <section>
            <h2 className="sectiontitle">Tippkönig {year} — Gesamtwertung</h2>
            <p className="boardhint">
              <strong>Gesamt</strong> = Haupt + KO zusammen. <strong>Haupt</strong>: Durchtippen ab Spiel 1 (alle 104
              Spiele). <strong>KO</strong>: der frische Einstieg ab Sechzehntelfinale (1/16).
            </p>
            <Podest top={byCombined.slice(0, 3)} gold />
            {byCombined.length > 3 && (
              <div className="cer-rest">
                {byCombined.slice(3).map((s, i) => (
                  <div key={s.profile.id} className={`cer-restrow${s.profile.id === activeProfileId ? ' cer-restrow--me' : ''}`}>
                    <span className="cer-restrow__rank">{i + 4}</span>
                    <span className="podest__dot" style={{ background: s.profile.color }} />
                    <span className="cer-restrow__name">{s.profile.name}</span>
                    <span className="cer-restrow__pts">{s.combined}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="cer-minis">
            <MiniWinner title="Sieger Hauptwertung" sub="Niemand getippt" s={mainWinner} score={mainWinner?.main.total} />
            <MiniWinner title="Sieger KO-Wertung (ab 1/16)" sub="Noch keine KO-Tipps" s={koWinner} score={koWinner?.ko?.total} />
          </div>
        </>
      )}
    </>
  )
}
