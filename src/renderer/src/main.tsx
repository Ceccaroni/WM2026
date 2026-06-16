import 'flag-icons/css/flag-icons.min.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyDataOverride } from './lib/override'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/global.css'
import './styles/components.css'
import './styles/foil.css'

// Daten-Release (falls vorhanden) VOR dem ersten Render anwenden — schlägt der
// Abruf fehl (Erststart offline), rendert die App mit den gebündelten Daten.
async function bootstrap(): Promise<void> {
  try {
    const snap = await window.wm26.getUpdate()
    applyDataOverride(snap.data)
  } catch (err) {
    console.warn('[update] Override nicht anwendbar:', err)
  }
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

void bootstrap()
