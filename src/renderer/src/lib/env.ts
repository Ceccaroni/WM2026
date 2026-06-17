// Build-Flag: true nur im statischen Web-Build (vite.web.config.ts → define __WEB__),
// false im Electron-Renderer (electron.vite.config.ts). Analog zu martin.ts.
// Zweck: Web-spezifisches Verhalten schalten — etwa „Profil aktivieren" auch für
// importierte Profile. Auf der PWA gibt es keinen geteilten Store (jede Gerätekopie
// ist isoliert, kein Backend), darum greift die Fairness-Sperre dort nicht.
declare const __WEB__: boolean

export const IS_WEB: boolean = __WEB__
