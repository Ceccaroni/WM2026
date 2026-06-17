import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'
import { resolve } from 'node:path'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@data': resolve('resources/data')
      }
    },
    // Build-Schalter „Nachzügler-Spezial": `VITE_MARTIN=1 npm run dist` ⇒ __MARTIN__ true
    // ⇒ Tipp-Sperre offen (Nachtragen gelaufener Spiele). Jede normale Build = false.
    // Name im Einblender per `VITE_MARTIN_NAME=Dani` setzbar (Default „Martin").
    define: {
      __MARTIN__: JSON.stringify(process.env.VITE_MARTIN === '1'),
      __LATE_NAME__: JSON.stringify(process.env.VITE_MARTIN_NAME ?? 'Martin'),
      // Electron-Renderer → false (Gegenstück zu vite.web.config.ts). Auf dem geteilten Mac
      // bleibt die „Aktivieren"-Sperre für importierte Profile bestehen.
      __WEB__: JSON.stringify(false)
    },
    plugins: [react()]
  }
})
