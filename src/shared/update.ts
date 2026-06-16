// Update-Mechanismus (BRIEFING §11.11, Option A): pure Logik + Konstanten.
// Klassisches Auto-Update geht ohne Apple-Signatur nicht — stattdessen pollt die
// App ein Manifest auf GitHub: Daten-Releases kommen automatisch, neue App-
// Versionen als Download-Banner.

export const MANIFEST_URL = 'https://raw.githubusercontent.com/Ceccaroni/wm26-tipp-updates/main/manifest.json'

/** Versionsvergleich "1.4.0" vs "1.10.2": >0 wenn a neuer als b. */
export function cmpVersion(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}
