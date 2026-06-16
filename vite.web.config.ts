// Standalone-Web-Build der PWA (kein Electron). Baut nur den Renderer + die Web-Bridge
// (src/web) zu statischen Dateien für GitHub Pages. Spiegelt @data-Alias und die define-
// Globals aus electron.vite.config.ts, ergänzt base (Subpfad-Hosting) und __APP_VERSION__.
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }

export default defineConfig({
  root: resolve('src/web'),
  // Hosting unter github.io/<repo>/ → Subpfad. Per VITE_BASE überschreibbar (z. B. '/' für Root).
  base: process.env.VITE_BASE ?? '/WM2026/',
  resolve: {
    alias: {
      '@data': resolve('resources/data')
    }
  },
  define: {
    __MARTIN__: JSON.stringify(process.env.VITE_MARTIN === '1'),
    __LATE_NAME__: JSON.stringify(process.env.VITE_MARTIN_NAME ?? 'Martin'),
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Wir registrieren den SW selbst in src/web/main.tsx (kein inline-Script → CSP-konform).
      injectRegister: false,
      manifest: {
        name: 'WM26 Tipp',
        short_name: 'WM26 Tipp',
        description: 'WM-2026-Durchtipp im Panini-Stil — Tippen, Live-Ergebnisse, Aufstellungen.',
        lang: 'de',
        // relativ → respektiert die base ('/WM2026/'), kein hartkodierter Subpfad
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f6f1e7',
        theme_color: '#0b5fa5',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // App-Shell precachen (JS/CSS/HTML/Fonts/Sounds) — die ~985 Spielerfotos & Flaggen-SVGs
        // (zusammen ~50 MB) bewusst NICHT, sonst lädt der Erst-Install das ganze Bilderpaket.
        globPatterns: ['**/*.{js,css,html,woff2,mp3}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            // Bilder erst bei Bedarf cachen (Spielerfotos, Stadien, Flaggen).
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'wm26-images',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    })
  ],
  build: {
    outDir: resolve('dist-web'),
    emptyOutDir: true
  },
  server: {
    // Dev/Preview muss auf den Projektroot zugreifen dürfen (Renderer-Code liegt außerhalb root).
    fs: { allow: [resolve('.')] }
  }
})
