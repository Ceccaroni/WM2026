import { useState } from 'react'
import { LATE_NAME, MARTIN_MODE } from '../lib/martin'

/**
 * Humorvoller Einblender im „Martin-Modus": die Tipp-Sperre ist offen, damit gelaufene
 * Spiele auf Ehrenbasis nachgetragen werden können. Rendert ausschließlich in der
 * Martin-Sonder-Build (MARTIN_MODE); in jeder normalen Build gibt die Komponente null zurück.
 */
export default function MartinModeNotice() {
  const [open, setOpen] = useState(true)
  if (!MARTIN_MODE || !open) return null
  return (
    <div className="martinnote" role="alert">
      <span className="martinnote__paw" aria-hidden="true">🐾</span>
      <div className="martinnote__text">
        <strong className="foil">Nachtipp-Fenster offen — exklusiv für dich, {LATE_NAME}</strong>
        <p>
          Die schon gelaufenen Spiele sind freigeschaltet. Trag ein, was du <em>wirklich</em> getippt
          hättest — Ehrensache. 😇 Bei frei erfundenen 5:0-Heldentaten hau ich dir mit Strom durch die
          Tastatur auf die Pfoten. ⚡🐾😉
        </p>
      </div>
      <button className="martinnote__close" onClick={() => setOpen(false)} aria-label="Hinweis schliessen">
        ✕
      </button>
    </div>
  )
}
