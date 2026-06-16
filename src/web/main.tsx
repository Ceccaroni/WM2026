// Web-Entry der PWA. Reihenfolge ist entscheidend: ZUERST window.wm26 setzen (Browser-Bridge),
// ERST DANN den bestehenden Renderer-Bootstrap laden — der ruft beim Import sofort
// window.wm26.getUpdate()/getState() auf. Deshalb dynamischer Import NACH installWebBridge()
// (ein statischer Import würde gehoisted und liefe vor der Bridge-Installation → Absturz).

// Fonts früh laden, damit der Anpfiff-Hinweis schon in Oswald erscheint (der Renderer-CSS-Import
// kommt erst mit dem dynamischen Import nach dem Tap). Idempotent — derselbe Import im Renderer.
import '../renderer/src/styles/fonts.css'
import { registerSW } from 'virtual:pwa-register'
import { showAnpfiff } from './anpfiff'
import { installWebBridge } from './bridge'

async function start(): Promise<void> {
  await installWebBridge()
  await showAnpfiff() // wartet auf den Tap → entsperrt Audio
  await import('../renderer/src/main') // Bootstrap: Intro läuft jetzt MIT Ton
}

void start()

// Service-Worker registrieren (Offline-Shell + Installierbarkeit); autoUpdate übernimmt neue Builds.
registerSW({ immediate: true })
