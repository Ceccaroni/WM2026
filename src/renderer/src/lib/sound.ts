// Sound-Effekte, gebündelt + frei lizenziert. Stummschaltung global in localStorage
// (Default: an). Ein Sample tauschen = die Datei in assets/sound/ ersetzen, sonst nichts.
import cheerUrl from '../assets/sound/cheer.mp3'
import introUrl from '../assets/sound/intro.mp3'

const MUTE_KEY = 'wm26-muted'

export const isMuted = (): boolean => localStorage.getItem(MUTE_KEY) === '1'
export const setMuted = (m: boolean): void => localStorage.setItem(MUTE_KEY, m ? '1' : '0')

/** Sanftes Aus- bzw. Einblenden per volume-Rampe (verhindert Knacken bei abruptem Start/Stopp). */
function ramp(audio: HTMLAudioElement, to: number, ms: number, onDone?: () => void): void {
  const steps = Math.max(1, Math.round(ms / 30))
  const delta = (to - audio.volume) / steps
  let n = 0
  const id = setInterval(() => {
    n++
    audio.volume = Math.min(1, Math.max(0, audio.volume + delta))
    if (n >= steps) {
      clearInterval(id)
      audio.volume = Math.max(0, Math.min(1, to))
      onDone?.()
    }
  }, 30)
}

/**
 * Spielt einen Effekt, sofern nicht stummgeschaltet. Bricht nach maxMs sanft ab
 * (viele Samples sind länger als der Moment, den sie untermalen).
 */
function play(src: string, volume: number, maxMs?: number): void {
  if (isMuted()) return
  try {
    const audio = new Audio(src)
    audio.volume = volume
    void audio.play().catch(() => {
      /* Autoplay/kein Audiogerät — still ignorieren */
    })
    if (maxMs) {
      setTimeout(() => {
        const fade = setInterval(() => {
          audio.volume = Math.max(0, audio.volume - 0.08)
          if (audio.volume <= 0) {
            audio.pause()
            clearInterval(fade)
          }
        }, 40)
      }, maxMs)
    }
  } catch {
    /* Audio nicht verfügbar */
  }
}

/** Kurzer Jubel beim Volltreffer (Belohnungs-Moment). Cutoff 3 s = der laute Stadion-Roar
 *  (Peak ~1–2 s, laut bis ~3 s), dann sanftes Ausblenden — bleibt innerhalb der 4-s-Karte. */
export const playCheer = (): void => play(cheerUrl, 0.55, 3000)

/**
 * Intro-Klang (Geige → Torjubel, mit eigenem Ausklang). Sanfter Fade-in gegen Start-Knack;
 * gibt eine Stopp-Funktion zurück, die beim Überspringen sanft ausblendet (kein Knacken).
 * Spielt nichts, wenn stummgeschaltet.
 */
export function playIntro(volume = 0.9): () => void {
  if (isMuted()) return () => {}
  try {
    const audio = new Audio(introUrl)
    audio.preload = 'auto'
    audio.volume = 0
    void audio.play().catch(() => {
      /* Autoplay/kein Audiogerät — still ignorieren */
    })
    ramp(audio, volume, 500) // Fade-in
    let stopped = false
    return () => {
      if (stopped) return
      stopped = true
      ramp(audio, 0, 320, () => audio.pause()) // sanft ausblenden statt hart stoppen
    }
  } catch {
    return () => {}
  }
}
