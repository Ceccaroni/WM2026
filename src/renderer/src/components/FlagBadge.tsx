/**
 * Flagge als Mini-Panini-Sticker (weißer Rand). Ohne Flagge:
 * mit label = Platzhalter-Sticker (Gruppenbuchstabe/Spielnummer), sonst „fehlender Sticker".
 */
export default function FlagBadge({
  flag,
  label,
  size = 'md'
}: {
  flag?: string
  label?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const variant = flag ? '' : label ? ' flagbadge--slot' : ' flagbadge--empty'
  return (
    <span className={`flagbadge flagbadge--${size}${variant}`}>
      {flag ? <span className={`fi fi-${flag}`} /> : <span className="flagbadge__q">{label ?? '?'}</span>}
    </span>
  )
}
