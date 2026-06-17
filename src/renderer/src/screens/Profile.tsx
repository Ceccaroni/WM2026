import { useEffect, useState } from 'react'
import { IS_WEB } from '../lib/env'
import { isMuted, playCheer, setMuted } from '../lib/sound'
import { cmpVersion } from '../lib/update'
import type { UpdateSnapshot } from '../lib/types'
import { useApp } from '../store'

export const PROFILE_COLORS = ['#0B5FA5', '#E62E6B', '#1F8A4C', '#D4AF37', '#7C3AED', '#EA580C', '#0EA5E9', '#DC2626']

/** Globaler Stummschalter für die Soundeffekte (Jubel beim Volltreffer). */
function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted())
  return (
    <button
      className="btn"
      role="switch"
      aria-checked={!muted}
      onClick={() => {
        const next = !muted
        setMuted(next)
        setMutedState(next)
        if (!next) playCheer() // beim Einschalten eine Kostprobe abspielen
      }}
    >
      {muted ? '🔇 Soundeffekte aus' : '🔊 Soundeffekte an'}
    </button>
  )
}

/**
 * „Nach Updates suchen": erzwingt einen cache-busted Sofort-Check (das reguläre Polling
 * läuft nur alle 2 h und kann am Fastly-Cache hängen). Findet sich ein neueres Manifest,
 * erscheint das Banner oben automatisch via Broadcast — hier nur die Rückmeldung.
 */
function UpdateCheck() {
  const [snap, setSnap] = useState<UpdateSnapshot | null>(null)
  const [checking, setChecking] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    void window.wm26.getUpdate().then(setSnap)
  }, [])

  const check = async () => {
    setChecking(true)
    setMsg('')
    const s = await window.wm26.checkUpdate()
    setSnap(s)
    setChecking(false)
    const newer = s.manifest && cmpVersion(s.manifest.appVersion, s.currentVersion) > 0
    setMsg(newer ? `Version ${s.manifest!.appVersion} ist da — siehe Banner oben.` : 'Du hast bereits die neuste Version.')
  }

  return (
    <>
      <p className="lead">Installiert: Version {snap?.currentVersion ?? '…'}.</p>
      <button className="btn" disabled={checking} onClick={() => void check()}>
        {checking ? 'Suche …' : 'Nach Updates suchen'}
      </button>
      {msg && <p className="statusline">{msg}</p>}
    </>
  )
}

export function ProfileForm({ onDone }: { onDone?: () => void }) {
  const createProfile = useApp((s) => s.createProfile)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PROFILE_COLORS[0])

  const submit = async () => {
    if (!name.trim()) return
    await createProfile(name, color)
    setName('')
    onDone?.()
  }

  return (
    <div className="profileform">
      <input
        value={name}
        placeholder="Name"
        maxLength={24}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && void submit()}
      />
      <div className="profileform__colors">
        {PROFILE_COLORS.map((c) => (
          <button
            key={c}
            className={`swatch${c === color ? ' swatch--active' : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
            aria-label={`Farbe ${c}`}
          />
        ))}
      </div>
      <button className="btn btn--primary" disabled={!name.trim()} onClick={() => void submit()}>
        Profil anlegen
      </button>
    </div>
  )
}

export default function Profile() {
  const { profiles, activeProfileId, entries, setActiveProfile, exportActive, importFile } = useApp()
  const [status, setStatus] = useState('')

  const tipCount = (id: string) => Object.keys(entries[id]?.main?.tips ?? {}).length

  const doExport = async () => {
    const r = await exportActive()
    setStatus(r.ok ? `Exportiert nach ${r.path}` : (r.error ?? ''))
  }

  const doImport = async () => {
    const r = await importFile()
    if (r.canceled) return
    if (r.ok && r.imported) setStatus(`„${r.profileName}" importiert — taucht jetzt in der Rangliste auf.`)
    else setStatus(r.reason ?? r.error ?? 'Import fehlgeschlagen.')
  }

  return (
    <>
      <h1>Profile</h1>
      <p className="lead">
        Mehrere Tipper:innen pro Mac, Austausch per .wm26tipp-Datei — exportiere deine Tipps und importiere die der
        anderen.
      </p>

      <div className="profilegrid">
        {profiles.map((p) => (
          <div key={p.id} className={`profilecard${p.id === activeProfileId ? ' profilecard--active' : ''}`}>
            <span className="profilecard__avatar" style={{ background: p.color }}>
              {p.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="profilecard__name">{p.name}</span>
            <span className="profilecard__meta">
              {tipCount(p.id)}/72 getippt
              {p.imported && <em> · importiert</em>}
            </span>
            {p.id === activeProfileId ? (
              <span className="badge badge--tip">Aktiv</span>
            ) : (
              // Auf dem geteilten Mac bleiben importierte (fremde) Profile gesperrt; in der PWA
              // ist jede Gerätekopie isoliert → alle aktivierbar, damit sich jede:r selbst wählen kann.
              (IS_WEB || !p.imported) && (
                <button className="btn" onClick={() => void setActiveProfile(p.id)}>
                  Aktivieren
                </button>
              )
            )}
          </div>
        ))}
      </div>

      <h2 className="sectiontitle">Neues Profil</h2>
      <ProfileForm />

      <h2 className="sectiontitle">Austausch</h2>
      <div className="exchange">
        <button className="btn btn--primary" onClick={() => void doExport()}>
          Meine Tipps exportieren …
        </button>
        <button className="btn" onClick={() => void doImport()}>
          Tipps importieren …
        </button>
      </div>
      {status && <p className="statusline">{status}</p>}

      <h2 className="sectiontitle">Ton</h2>
      <p className="lead">Kurzer Jubel, wenn du ein Spiel exakt getippt hast.</p>
      <SoundToggle />

      <h2 className="sectiontitle">App-Version</h2>
      <UpdateCheck />
    </>
  )
}
