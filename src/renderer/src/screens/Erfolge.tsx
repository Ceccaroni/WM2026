import { useMemo } from 'react'
import HoloSticker from '../components/HoloSticker'
import { computeAchievements } from '../lib/achievements'
import { SCHEDULE } from '../lib/data'
import { resolveTipBracket } from '../lib/bracket'
import { buildRealWorld, resultsAsTips } from '../lib/results'
import { computeBreakdown } from '../lib/scoring'
import { useActiveProfile, useApp, useMyTips } from '../store'

/**
 * Erfolgs-Sticker des aktiven Profils: verdiente glänzen in Gold-Foil, offene sind
 * gestrichelte Lücken im Heft (mit Fortschritt) — wie fehlende Panini-Bilder.
 * Alles live abgeleitet, nichts persistiert.
 */
export default function Erfolge() {
  const profile = useActiveProfile()
  const results = useApp((s) => s.results)
  const scoring = useApp((s) => s.scoring)
  const tips = useMyTips()

  const stickers = useMemo(() => {
    const realBracket = resolveTipBracket(resultsAsTips(results))
    const real = buildRealWorld(results, realBracket)
    const bd = computeBreakdown(tips, resolveTipBracket(tips), results, real, SCHEDULE, scoring)
    return computeAchievements(bd, tips, results, scoring)
  }, [tips, results, scoring])

  const earned = stickers.filter((s) => s.earned).length

  return (
    <>
      <h1>Erfolge</h1>
      <p className="lead">
        Dein Sticker-Heft, {profile?.name} — <strong>{earned} von {stickers.length}</strong> eingeklebt. Die Lücken
        füllen sich von selbst, wenn deine Tipps treffen.
      </p>
      <div className="stickergrid">
        {stickers.map((s) =>
          s.earned ? (
            <HoloSticker key={s.id} gold className="achsticker achsticker--earned">
              <span className="achsticker__icon">{s.icon}</span>
              <strong className="achsticker__title foil">{s.title}</strong>
              <small className="achsticker__desc">{s.desc}</small>
            </HoloSticker>
          ) : (
            <div key={s.id} className="achsticker achsticker--open">
              <span className="achsticker__icon achsticker__icon--dim">{s.icon}</span>
              <strong className="achsticker__title">{s.title}</strong>
              <small className="achsticker__desc">{s.desc}</small>
              {s.progress && s.progress.now > 0 && (
                <span className="achsticker__progress">
                  <span className="achsticker__bar" style={{ width: `${(s.progress.now / s.progress.goal) * 100}%` }} />
                  <small>
                    {s.progress.now}/{s.progress.goal}
                  </small>
                </span>
              )}
            </div>
          )
        )}
      </div>
      <p className="boardhint">
        Erfolge zählen für die Hauptwertung (Durchtippen ab Spiel 1) und rechnen sich live aus deinen Tipps und den
        echten Ergebnissen.
      </p>
    </>
  )
}
