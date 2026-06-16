// MARTIN-SPEZIAL — einmalige Sonder-Build, NICHT über das OTA-Update an alle verteilen!
// Hebt für einen späten Einsteiger die Tipp-Sperre auf, damit er die schon gelaufenen
// Spiele nachtragen kann (reine Vertrauenssache). Aktiviert über den Build-Schalter
// `VITE_MARTIN=1 npm run dist`; jede normale Build ist false ⇒ Spiele bleiben gesperrt.
// __MARTIN__ / __LATE_NAME__ werden zur Build-Zeit von Vite (electron.vite.config.ts → define)
// ersetzt. Für den nächsten Nachzügler genügt `VITE_MARTIN=1 VITE_MARTIN_NAME=Dani npm run dist`.
declare const __MARTIN__: boolean
declare const __LATE_NAME__: string

export const MARTIN_MODE: boolean = __MARTIN__
export const LATE_NAME: string = __LATE_NAME__
