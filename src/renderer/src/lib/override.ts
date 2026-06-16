// Wendet das persistierte Daten-Release (UpdateService im Main) auf die
// gebündelten Stammdaten an — einmalig VOR dem ersten Render (main.tsx).
// So bleiben alle Modul-Konstanten (SCHEDULE, Dossier-Maps, ODDS) konsistent.
import { patchSchedule } from './data'
import { applyInfoOverride } from './info'
import type { DataRelease } from './types'

export function applyDataOverride(data: DataRelease | null): void {
  if (!data) return
  if (data.schedule) patchSchedule(data.schedule)
  applyInfoOverride(data)
  console.log(`[update] Daten-Release v${data.version} angewendet (${data.createdAt})`)
}
