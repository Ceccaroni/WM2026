import { useRef } from 'react'
import type { PointerEvent, ReactNode } from 'react'

const MAX_TILT = 8 // Grad — dezent halten (research/design.md §3.4)

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

/**
 * Pointer-getriebener Panini-Glanzsticker (research/design.md §3): Holo-Foil-Layer
 * (color-dodge) + Glare + 3D-Tilt. gold = warme Gold-Folie statt Regenbogen —
 * nur als Belohnung einsetzen. Styles: styles/foil.css.
 */
export default function HoloSticker({
  children,
  className = '',
  gold = false
}: {
  children: ReactNode
  className?: string
  gold?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || reducedMotion.matches) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    el.style.setProperty('--px', String(x * 100))
    el.style.setProperty('--py', String(y * 100))
    el.style.setProperty('--tilt-y', `${(x - 0.5) * 2 * MAX_TILT}deg`)
    el.style.setProperty('--tilt-x', `${-(y - 0.5) * 2 * MAX_TILT}deg`)
  }

  return (
    <div className="tiltscene">
      <div
        ref={ref}
        className={`holo${gold ? ' holo--gold' : ''}${className ? ` ${className}` : ''}`}
        onPointerMove={onPointerMove}
      >
        {children}
      </div>
    </div>
  )
}
