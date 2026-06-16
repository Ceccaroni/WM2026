// Anpfiff-Screen der PWA: Tschuttini-Logo, nach 2 s der Hinweis „Tippen zum Anpfiff".
// Zweck ist doppelt: eleganter Einstieg UND die nötige User-Geste — Browser/iOS lassen Ton
// erst nach einer Geste zu. Der Tap spielt das Intro-File kurz stumm an (primeAudio) und
// entsperrt damit die Audio-Session, sodass das eigentliche Intro (Intro.tsx) gleich darauf
// MIT Ton startet. Läuft nur im Web (Electron kennt diese Autoplay-Sperre nicht).

import introUrl from '../renderer/src/assets/sound/intro.mp3'
import tschuttiniUrl from '../renderer/src/assets/tschuttini.png'

const CSS = `
.anpfiff{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:2.4rem;background:#0c0d10;cursor:pointer;
  padding:max(2rem,env(safe-area-inset-top)) 2rem max(3rem,env(safe-area-inset-bottom));
  -webkit-tap-highlight-color:transparent;transition:opacity .45s ease}
.anpfiff--leaving{opacity:0}
.anpfiff__logo{width:min(62vw,260px);height:auto;filter:drop-shadow(0 8px 28px rgba(0,0,0,.55));
  animation:anpfiff-logo .9s cubic-bezier(.2,.7,.2,1) both}
.anpfiff__hint{font-family:'Oswald',system-ui,sans-serif;font-weight:500;font-size:.95rem;
  letter-spacing:.2em;text-transform:uppercase;color:#f6f1e7;opacity:0;
  animation:anpfiff-appear .6s ease 2s forwards,anpfiff-pulse 2.8s ease-in-out 2.6s infinite}
@keyframes anpfiff-logo{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes anpfiff-appear{to{opacity:.85}}
@keyframes anpfiff-pulse{0%,100%{opacity:.85}50%{opacity:.4}}
@media (prefers-reduced-motion:reduce){.anpfiff__logo,.anpfiff__hint{animation:none;opacity:1}}
`

/** Zeigt den Anpfiff-Screen und löst auf, sobald der Nutzer tippt (Audio ist dann entsperrt). */
export function showAnpfiff(): Promise<void> {
  return new Promise((resolve) => {
    const style = document.createElement('style')
    style.textContent = CSS
    document.head.appendChild(style)

    const root = document.createElement('div')
    root.className = 'anpfiff'
    root.setAttribute('role', 'button')
    root.setAttribute('aria-label', 'Tippen zum Anpfiff')
    root.tabIndex = 0

    const logo = document.createElement('img')
    logo.className = 'anpfiff__logo'
    logo.src = tschuttiniUrl
    logo.alt = 'Tschuttini'
    logo.draggable = false

    const hint = document.createElement('div')
    hint.className = 'anpfiff__hint'
    hint.textContent = 'Tippen zum Anpfiff'

    root.append(logo, hint)
    document.body.appendChild(root)
    root.focus()

    let done = false
    const begin = (): void => {
      if (done) return
      done = true
      primeAudio()
      root.classList.add('anpfiff--leaving')
      setTimeout(() => {
        root.remove()
        style.remove()
        resolve()
      }, 460)
    }
    root.addEventListener('pointerdown', begin)
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') begin()
    })
  })
}

/** Entsperrt die Audio-Session per geste-getriggerter Stumm-Wiedergabe des Intro-Files. */
function primeAudio(): void {
  try {
    const a = new Audio(introUrl)
    a.volume = 0
    void a
      .play()
      .then(() => {
        a.pause()
        a.currentTime = 0
      })
      .catch(() => {
        /* nicht entsperrbar — Intro bleibt halt stumm */
      })
  } catch {
    /* Audio nicht verfügbar */
  }
}
