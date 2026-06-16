/** Tor-Eingabe mit −/+; erster Klick legt 0 an. Werte 0–20. */
export default function ScoreStepper({
  value,
  onChange,
  disabled
}: {
  value?: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  const dec = () => onChange(Math.max(0, (value ?? 1) - 1))
  const inc = () => onChange(Math.min(20, (value ?? -1) + 1))
  return (
    <span className={`stepper${value == null ? ' stepper--empty' : ''}`}>
      <button type="button" disabled={disabled || !value} onClick={dec} aria-label="weniger Tore">
        −
      </button>
      <span className="stepper__value">{value ?? '·'}</span>
      <button type="button" disabled={disabled} onClick={inc} aria-label="mehr Tore">
        +
      </button>
    </span>
  )
}
