// Persistenz-Schicht der PWA — spiegelt die reine State-Logik aus src/main/store.ts
// (createProfile / setActiveProfile / setTip / buildExport / importProfile, inkl. der
// Konfliktregel „neueres exportedAt gewinnt"), ersetzt aber die fs-Atomic-Persistenz
// durch IndexedDB. Die Logik MUSS mit src/main/store.ts konsistent bleiben — bei
// Änderungen am Store-Verhalten beide Stellen nachziehen.

import { DEFAULT_SCORING } from '../shared/types'
import type { EntryKind, ExchangeFileV1, PersistedState, Profile, Tip } from '../shared/types'
import { idbGet, idbSet } from './idb'
import seedJson from './seed-state.json'

const STATE_KEY = 'state'
const SEED_VERSION_KEY = 'seedVersion'

/** Eingebackener Gruppen-Stand (scripts/build-web-seed.mjs) — alle Profile/Tipps der Tipprunde. */
type Seed = Partial<PersistedState> & { seedVersion: string | null }
const SEED = seedJson as unknown as Seed

function seedToState(seed: Seed): PersistedState {
  return {
    version: 1,
    profiles: seed.profiles ?? [],
    activeProfileId: seed.activeProfileId ?? null,
    scoring: seed.scoring ?? { ...DEFAULT_SCORING },
    entries: seed.entries ?? {}
  }
}

/** Gruppen-Profile aus dem Seed übernehmen (per id ersetzen/hinzufügen); selbst angelegte
 *  Profile (id nicht im Seed) bleiben unangetastet. */
function mergeSeed(state: PersistedState, seed: Seed): void {
  for (const p of seed.profiles ?? []) {
    const i = state.profiles.findIndex((x) => x.id === p.id)
    if (i >= 0) state.profiles[i] = p
    else state.profiles.push(p)
    state.entries[p.id] = seed.entries?.[p.id] ?? {}
  }
  if (seed.scoring) state.scoring = seed.scoring
  if (!state.activeProfileId) state.activeProfileId = seed.activeProfileId ?? null
}

/** UUID v4 — crypto.randomUUID() gibt es nur im Secure Context (https/localhost),
 *  beim LAN-Test über http://<ip> aber nicht. getRandomValues ist überall verfügbar. */
function uid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0'))
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10, 16).join('')}`
}

const defaultState = (): PersistedState => ({
  version: 1,
  profiles: [],
  activeProfileId: null,
  scoring: { ...DEFAULT_SCORING },
  entries: {}
})

export class WebStore {
  state: PersistedState = defaultState()
  private timer: ReturnType<typeof setTimeout> | null = null

  /** Persistierten Zustand aus IndexedDB laden (einmalig vor dem ersten getState).
   *  Erststart → Gruppen-Seed übernehmen; vorhandene DB + neuerer Build → Gruppen-Tipps auffrischen. */
  async init(): Promise<void> {
    try {
      const [saved, savedSeedV] = await Promise.all([
        idbGet<PersistedState>(STATE_KEY),
        idbGet<string>(SEED_VERSION_KEY)
      ])
      const seeded = (SEED.profiles?.length ?? 0) > 0
      if (saved && saved.version === 1) {
        this.state = saved
        if (seeded && SEED.seedVersion && SEED.seedVersion !== savedSeedV) {
          mergeSeed(this.state, SEED)
          await idbSet(SEED_VERSION_KEY, SEED.seedVersion)
          await idbSet(STATE_KEY, this.state)
        }
      } else if (seeded) {
        this.state = seedToState(SEED)
        await idbSet(SEED_VERSION_KEY, SEED.seedVersion)
        await idbSet(STATE_KEY, this.state)
      }
    } catch (err) {
      console.error('[store] IndexedDB nicht lesbar, starte leer:', err)
    }
  }

  /** Debounced nach IndexedDB schreiben (wie der 150-ms-Flush im Main). */
  private save(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => void idbSet(STATE_KEY, this.state), 150)
  }

  createProfile(name: string, color: string): Profile {
    const profile: Profile = { id: uid(), name: name.trim(), color }
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
