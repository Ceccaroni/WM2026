import { createElement, useEffect, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import Chronik from './screens/Chronik'
import Erfolge from './screens/Erfolge'
import Heute from './screens/Heute'
import KoEinstieg from './screens/KoEinstieg'
import Live from './screens/Live'
import MeineTipps from './screens/MeineTipps'
import Profile, { ProfileForm } from './screens/Profile'
import Rangliste from './screens/Rangliste'
import Siegerehrung from './screens/Siegerehrung'
import Spielplan from './screens/Spielplan'
import Stadien from './screens/Stadien'
import Teams from './screens/Teams'
import Torschuetzen from './screens/Torschuetzen'
import WhatsNew from './components/WhatsNew'
import RewardMoment from './components/RewardMoment'
import Intro from './components/Intro'
import MartinModeNotice from './components/MartinModeNotice'
import tschuttini from './assets/tschuttini.png'
import { SCHEDULE, slotInfo } from './lib/data'
import { cmpVersion } from './lib/update'
import { openTipMatches } from './lib/watch'
import type { UpdateSnapshot } from './lib/types'
import { useActiveProfile, useApp, useMyTips } from './store'

const RUBRIKEN = [
  { id: 'heute', label: 'Heute' },
  { id: 'spielplan', label: 'Spielplan' },
  { id: 'tipps', label: 'Meine Tipps' },
  { id: 'live', label: 'Live' },
  { id: 'rangliste', label: 'Rangliste' },
  { id: 'ko', label: 'KO-Einstieg' },
  { id: 'teams', label: 'Teams' },
  { id: 'stadien', label: 'Stadien' },
  // Neue Rubriken bewusst NACH den bestehenden anfügen — der Screenshot-Hook klickt Sidebar-Indizes
  { id: 'erfolge', label: 'Erfolge' },
  { id: 'chronik', label: 'Chronik' },
  { id: 'torschuetzen', label: 'Torschützen' },
  { id: 'profile', label: 'Profile' },
  { id: 'siegerehrung', label: 'Siegerehrung' }
] as const

type RubrikId = (typeof RUBRIKEN)[number]['id']

const SCREENS: Partial<Record<RubrikId, ComponentType>> = {
  spielplan: Spielplan,
  tipps: MeineTipps,
  live: Live,
  rangliste: Rangliste,
  ko: KoEinstieg,
  teams: Teams,
  stadien: Stadien,
  erfolge: Erfolge,
  chronik: Chronik,
  torschuetzen: Torschuetzen,
  profile: Profile,
  siegerehrung: Siegerehrung
}

/**
 * Tipp-Wächter: zählt ungetippte heutige Spiele (Deadline = Anstoß) für
 * Sidebar- und Dock-Badge und meldet sich 30 Minuten vor Anstoß per
 * macOS-Mitteilung. Im Screenshot-Modus deaktiviert.
 */
function useTipWatch(): number {
  const tips = useMyTips()
  const hasProfile = useApp((s) => s.activeProfileId != null)
  const [count, setCount] = useState(0)
  const notified = useRef(new Set<number>())

  useEffect(() => {
    if (window.wm26.shotMode || !hasProfile) return
    const check = (): void => {
      const open = openTipMatches(tips)
      setCount(open.length)
      window.wm26.setBadge(open.length)
      for (const m of open) {
        const mins = (Date.parse(m.dateUtc) - Date.now()) / 60_000
        if (mins <= 30 && !notified.current.has(m.match)) {
          notified.current.add(m.match)
          const note = new Notification('WM26 Tipp — gleich Anstoß!', {
            body: `In ${Math.max(1, Math.round(mins))} Min: ${slotInfo(m.home).name} – ${slotInfo(m.away).name} — noch kein Tipp!`
          })
          note.onclick = () => window.focus()
        }
      }
    }
    check()
    const timer = setInterval(check, 60_000)
    return () => clearInterval(timer)
  }, [tips, hasProfile])

  return count
}

const MATCH_BY_NUMBER = new Map(SCHEDULE.map((m) => [m.match, m]))

/**
 * Tor-Alarm (opt-in, Schalter im Live-/Heute-HUD): vergleicht bei jedem Results-Push
 * die Tore laufender Spiele mit dem letzten Stand und meldet neue Treffer als
 * macOS-Mitteilung — inkl. Torschütze, wenn ESPN ihn schon liefert. Baselines werden
 * auch bei ausgeschaltetem Alarm gepflegt (kein Nachhol-Gewitter beim Einschalten).
 */
function useGoalAlarm(): void {
  const results = useApp((s) => s.results)
  const on = useApp((s) => s.goalAlarm)
  const prev = useRef(new Map<number, { h: number; a: number }>())

  useEffect(() => {
    if (window.wm26.shotMode) return
    for (const r of Object.values(results)) {
      if (r.status !== 'live' && r.status !== 'ht') continue
      const h = r.homeScore ?? 0
      const a = r.awayScore ?? 0
      const p = prev.current.get(r.match)
      prev.current.set(r.match, { h, a })
      if (!p || (h <= p.h && a <= p.a)) continue // Baseline neu / Tor zurückgenommen (VAR)
      if (!on) continue
      const m = MATCH_BY_NUMBER.get(r.match)
      const homeName = slotInfo(r.homeTeam ?? m?.home ?? '').name
      const awayName = slotInfo(r.awayTeam ?? m?.away ?? '').name
      const scorer = r.events?.filter((e) => e.kind !== 'red').at(-1)
      const note = new Notification(`⚽ TOR — ${homeName} ${h}:${a} ${awayName}`, {
        body: scorer ? `${scorer.minute} ${scorer.player}${scorer.kind === 'pen' ? ' (Elfmeter)' : scorer.kind === 'og' ? ' (Eigentor)' : ''}` : `Spielminute ${r.minute ?? '–'}`,
        silent: false
      })
      note.onclick = () => window.focus()
    }
  }, [results, on])
}

/**
 * „Version X ist da"-Banner (BRIEFING §11.11): erscheint, wenn das Manifest eine
 * neuere App-Version meldet als die laufende; „Später" merkt sich die Version.
 */
function UpdateBanner() {
  const [snap, setSnap] = useState<UpdateSnapshot | null>(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('wm26-update-dismissed'))

  useEffect(() => {
    let alive = true
    window.wm26.getUpdate().then((s) => {
      if (alive) setSnap(s)
    })
    const off = window.wm26.onUpdate(setSnap)
    return () => {
      alive = false
      off()
    }
  }, [])

  const manifest = snap?.manifest
  // Dismiss gilt nur bis zur weggeklickten Version: eine echt neuere meldet sich wieder
  // (robust gegen wiederverwendete Nummern statt Exakt-Vergleich).
  const show =
    snap != null &&
    manifest != null &&
    cmpVersion(manifest.appVersion, snap.currentVersion) > 0 &&
    (dismissed == null || cmpVersion(manifest.appVersion, dismissed) > 0)

  useEffect(() => {
    if (show && manifest) console.log(`[update] Banner: Version ${manifest.appVersion} verfügbar (laufend: ${snap?.currentVersion})`)
  }, [show, manifest, snap])

  if (!show || !manifest) return null

  return (
    <div className="updatebanner">
      <strong className="foil">Version {manifest.appVersion} ist da!</strong>
      {manifest.notes && <span>{manifest.notes}</span>}
      <span className="updatebanner__hint">
        Beim Herunterladen schließt sich die App gleich selbst — danach die neue .dmg installieren, Tipps bleiben
        erhalten.
      </span>
      <div className="updatebanner__actions">
        <button className="btn btn--primary" onClick={() => void window.wm26.downloadUpdate()}>
          Herunterladen &amp; schließen
        </button>
        <button
          className="btn"
          onClick={() => {
            localStorage.setItem('wm26-update-dismissed', manifest.appVersion)
            setDismissed(manifest.appVersion)
          }}
        >
          Später
        </button>
      </div>
    </div>
  )
}

function Onboarding() {
  return (
    <div className="onboarding">
      <div className="onboarding__card">
        <h1 className="foil">WM26 TIPP</h1>
        <p>
          Das Panini-Album fürs Durchtippen: 104 Spiele, 48 Teams, dein Weg bis zum Weltmeister.
          <br />
          Leg zuerst dein Tipper-Profil an:
        </p>
        <ProfileForm />
      </div>
    </div>
  )
}

export default function App() {
  const [active, setActive] = useState<RubrikId>('heute')
  const { loaded, profiles, init } = useApp()
  const profile = useActiveProfile()
  const openTips = useTipWatch()
  // Intro bei jedem Start (außer Shot-Modus); What's-New folgt erst, wenn das Intro durch ist
  const [introDone, setIntroDone] = useState(() => window.wm26.shotMode)
  // Burger-Navigation im schmalen Viewport (PWA-Hochformat); am Desktop per CSS unsichtbar
  const [menuOpen, setMenuOpen] = useState(false)
  useGoalAlarm()

  useEffect(() => {
    void init()
  }, [init])

  if (!loaded) return null

  return (
    <>
      {profiles.length === 0 ? (
        <Onboarding />
      ) : (
        <div className={`app${menuOpen ? ' app--menu-open' : ''}`}>
          <button
            className="burger"
            aria-label="Menü"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="sidebar-backdrop" aria-hidden="true" onClick={() => setMenuOpen(false)} />
          <nav className={`sidebar${menuOpen ? ' sidebar--open' : ''}`}>
            <img className="sidebar__brand" src={tschuttini} alt="Tschuttini" draggable={false} />
            {RUBRIKEN.map((r) => (
              <button
                key={r.id}
                className={r.id === active ? 'active' : ''}
                onClick={() => {
                  setActive(r.id)
                  setMenuOpen(false)
                }}
              >
                {r.label}
                {r.id === 'tipps' && openTips > 0 && <span className="navbadge">{openTips}</span>}
              </button>
            ))}
            <div className="sidebar__spacer" />
            {profile && (
              <button
                className="sidebar__profile"
                onClick={() => {
                  setActive('profile')
                  setMenuOpen(false)
                }}
              >
                <span className="sidebar__dot" style={{ background: profile.color }} />
                {profile.name}
              </button>
            )}
          </nav>
          <main className="screen">
            {active === 'heute' ? <Heute goTo={setActive} /> : createElement(SCREENS[active]!)}
          </main>
          <UpdateBanner />
          <MartinModeNotice />
          {introDone && <WhatsNew />}
          {introDone && <RewardMoment />}
        </div>
      )}
      {!introDone && <Intro onDone={() => setIntroDone(true)} />}
    </>
  )
}
