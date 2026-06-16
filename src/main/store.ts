import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DEFAULT_SCORING } from '../shared/types'
import type { EntryKind, ExchangeFileV1, PersistedState, Profile, Tip } from '../shared/types'

const storeFile = (): string => join(app.getPath('userData'), 'wm26-store.json')

const defaultState = (): PersistedState => ({
  version: 1,
  profiles: [],
  activeProfileId: null,
  scoring: { ...DEFAULT_SCORING },
  entries: {}
})

/**
 * Schlanker Atomic-JSON-Store: debounced, Schreiben über tmp-Datei + rename,
 * damit Auto-Save nie eine halbe Datei hinterlässt (BRIEFING.md §8).
 */
export class Store {
  state: PersistedState
  private timer: NodeJS.Timeout | null = null

  constructor() {
    this.state = this.load()
  }

  private load(): PersistedState {
    try {
      if (existsSync(storeFile())) {
        const raw = JSON.parse(readFileSync(storeFile(), 'utf8')) as PersistedState
        if (raw.version === 1) return raw
      }
    } catch (err) {
      console.error('Store nicht lesbar, starte mit leerem Zustand:', err)
    }
    return defaultState()
  }

  save(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => this.flush(), 150)
  }

  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    const file = storeFile()
    mkdirSync(dirname(file), { recursive: true })
    const tmp = `${file}.tmp`
    writeFileSync(tmp, JSON.stringify(this.state))
    renameSync(tmp, file)
  }

  createProfile(name: string, color: string): Profile {
    const profile: Profile = { id: crypto.randomUUID(), name: name.trim(), color }
    this.state.profiles.push(profile)
    this.state.activeProfileId = profile.id
    this.save()
    return profile
  }

  setActiveProfile(id: string): void {
    if (this.state.profiles.some((p) => p.id === id)) {
      this.state.activeProfileId = id
      this.save()
    }
  }

  setTip(profileId: string, entry: EntryKind, match: number, tip: Tip | null): void {
    const entries = (this.state.entries[profileId] ??= {})
    const e = (entries[entry] ??= { tips: {} })
    if (tip) e.tips[match] = tip
    else delete e.tips[match]
    this.save()
  }

  buildExport(profileId: string): ExchangeFileV1 | null {
    const profile = this.state.profiles.find((p) => p.id === profileId)
    if (!profile) return null
    return {
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      scoring: this.state.scoring,
      profile: { id: profile.id, name: profile.name, color: profile.color },
      entries: this.state.entries[profileId] ?? {}
    }
  }

  importProfile(file: ExchangeFileV1): { imported: boolean; reason?: string } {
    const existing = this.state.profiles.find((p) => p.id === file.profile.id)
    if (existing && !existing.imported) {
      return { imported: false, reason: 'Das ist ein eigenes Profil dieser Installation.' }
    }
    if (existing?.lastExportedAt && existing.lastExportedAt >= file.exportedAt) {
      return { imported: false, reason: 'Bereits ein aktuellerer Stand vorhanden.' }
    }
    const profile: Profile = {
      id: file.profile.id,
      name: file.profile.name,
      color: file.profile.color,
      imported: true,
      lastExportedAt: file.exportedAt
    }
    if (existing) Object.assign(existing, profile)
    else this.state.profiles.push(profile)
    this.state.entries[profile.id] = file.entries ?? {}
    this.save()
    return { imported: true }
  }
}
