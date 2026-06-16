import { useEffect, useRef, useState } from 'react'
import { SCHEDULE, slotInfo } from '../lib/data'
import { baseKind } from '../lib/scoring'
import { playCheer } from '../lib/sound'
import { useApp, useMyTips } from '../store'

interface Reward {
  match: number
  home: string
  away: string
  hs: number
  as: number
  pts: number
}

const MATCH_BY_NO = new Map(SCHEDULE.map((m) => [m.match, m]))

// Feste (deterministische) Konfetti-Bahnen — keine Math.random-Sprünge bei Re-Render
const BITS = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 4.55 + 2) % 100,
  delay: (i % 8) * 0.05,
  dur: 1.7 + (i % 5) * 0.22,
  drift: ((i % 7) - 3) * 14,
  tone: i % 3
}))

/**
 * Belohnungs-Moment: kurzer Gold-Konfetti-Funke, wenn ein Spiel endet und das aktive
 * Profil es EXAKT getippt hat. Beobachtet die Results-Pushes wie der Tor-Alarm — der erste
 * Durchlauf setzt nur die Baseline (kein Nachhol-Gewitter bei schon beendeten Spielen),
 * danach feiert jeder neue Volltreffer genau einmal. Im Shot-Modus stumm.
 */
export default function RewardMoment() {
  const results = useApp((s) => s.results)
  const tips = useMyTips()
  const scoring = useApp((s) => s.scoring)
  const [reward, setReward] = useState<Reward | null>(null)
  const seen = useRef<Set<number>>(new Set())
  const baselined = useRef(false)

  useEffect(() => {
    if (window.wm26.shotMode) return
    for (const r of Object.values(results)) {
      if (r.status !== 'finished' || seen.current.has(r.match)) continue
      seen.current.add(r.match)
      if (!baselined.current) continue // erster Durchlauf = Baseline, nicht feiern
      const tip = tips[r.match]
      if (tip && baseKind(tip, r) === 'exact') {
        const m = MATCH_BY_NO.get(r.match)
        playCheer()
        setReward({
          match: r.match,
          home: slotInfo(r.homeTeam ?? m?.home ?? '').name,
          away: slotInfo(r.awayTeam ?? m?.away ?? '').name,
          hs: r.homeScore ?? 0,
          as: r.awayScore ?? 0,
          pts: scoring.exact
        })
      }
    }
    baselined.current = true
  }, [results, tips, scoring])

  useEffect(() => {
    if (!reward) return
    const t = setTimeout(() => setReward(null), 4000)
    return () => clearTimeout(t)
  }, [reward])

  if (!reward) return null

  return (
    <div className="reward">
      <div className="reward__confetti" aria-hidden="true">
        {BITS.map((b, i) => (
          <span
            key={i}
            className={`reward__bit reward__bit--${b.tone}`}
            style={{
              left: `${b.left}%`,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.dur}s`,
              ['--drift' as string]: `${b.drift}px`
            }}
          />
        ))}
      </div>
      <div className="reward__card" role="status">
        <span className="reward__icon">🎯</span>
        <strong className="reward__head foil">Volltreffer!</strong>
        <span className="reward__match">
          {reward.home} {reward.hs}:{reward.as} {reward.away}
        </span>
        <span className="reward__pts">exakt getippt · +{reward.pts} Punkte</span>
      </div>
    </div>
  )
}
