import { useEffect, useRef, useState } from 'react'
import { randomQuote } from '../lib/quotes'
import { playIntro } from '../lib/sound'

/**
 * Start-Intro: schwarzer Vollbild-Screen, Bill Shanklys Zitat schwillt langsam an, steht,
 * der Klang (Geige → Torjubel) klingt selbst aus, dann fadet das Bild weg → die Oberfläche
 * erscheint. Bei jedem Start (außer Shot-Modus), jederzeit per Klick überspringbar. Liegt über
 * allem; das Was-ist-neu-Overlay folgt erst danach. Animation läuft GPU-isoliert (will-change),
 * der Klang startet erst nach dem ersten Frame — so ruckeln weder Schrift noch Ton beim Start.
 */
export default function Intro({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)
  const [quote] = useState(randomQuote) // einmal pro Start ein zufälliger Spruch
  const done = useRef(false)
  const stopSound = useRef<() => void>(() => {})
  const rootRef = useRef<HTMLDivElement>(null)

  const finish = (): void => {
    if (done.current) return
    done.current = true
    stopSound.current()
    onDone()
  }

  useEffect(() => {
    // Reduced-Motion: kein zeitgesteuerter Intro-Schwall (~20 s) — direkt zur App.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      finish()
      return
    }
    rootRef.current?.focus() // Fokus aufs Overlay → ESC überspringt sofort, ohne erst zu klicken
    // Klang erst nach dem ersten gemalten Frame starten, damit der teure Start-Render
    // (App + Daten) nicht in den Audio-Start grätscht.
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        stopSound.current = playIntro()
      })
    })
    const hold = setTimeout(() => setLeaving(true), 19000) // Klang (~20,9 s) klingt selbst aus
    const remove = setTimeout(finish, 20800)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(hold)
      clearTimeout(remove)
      stopSound.current()
    }
  }, [])

  // Klick irgendwo überspringt — Ton sanft ausblenden, Bild kurz wegfaden, dann weg
  const skip = (): void => {
    stopSound.current()
    setLeaving(true)
    setTimeout(finish, 420)
  }

  return (
    <div
      ref={rootRef}
      className={`intro${leaving ? ' intro--leaving' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Intro überspringen"
      onClick={skip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') skip()
      }}
    >
      <blockquote className="intro__quote">
        <p className="intro__text">„{quote.text}“</p>
        <cite className="intro__cite">
          <span className="intro__author foil">{quote.author}</span>
          {quote.note && <span className="intro__note">{quote.note}</span>}
        </cite>
      </blockquote>
      <span className="intro__skip">Klick zum Überspringen</span>
    </div>
  )
}
