import { useApp } from '../store'

/**
 * Schalter für den Tor-Alarm (macOS-Mitteilung bei jedem Tor laufender Spiele).
 * Default AUS: Die Daten-Feeds sind dem TV-Bild oft 30–60 Sekunden VORAUS — wer
 * das Spiel schaut, würde gespoilert. Fürs Parallelspiel-Verfolgen einschalten.
 */
export default function GoalAlarmToggle() {
  const on = useApp((s) => s.goalAlarm)
  const setOn = useApp((s) => s.setGoalAlarm)
  return (
    <button
      className={`glasshud__alarm${on ? ' glasshud__alarm--on' : ''}`}
      onClick={() => setOn(!on)}
      title={
        on
          ? 'Tor-Alarm ausschalten'
          : 'Mitteilung bei jedem Tor — Achtung: dem TV-Bild oft 30–60 s voraus (Spoiler!)'
      }
    >
      {on ? '🔔 Tor-Alarm an' : '🔕 Tor-Alarm'}
    </button>
  )
}
