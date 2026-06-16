import { useCallback, useEffect, useState } from 'react'
import { CHANGELOG } from '../lib/changelog'
import type { ChangelogEntry } from '../lib/changelog'
import { cmpVersion } from '../lib/update'

const SEEN_KEY = 'wm26-last-seen-version'

/**
 * „Was ist neu" nach einem Update: vergleicht die laufende App-Version mit der zuletzt
 * gesehenen (in localStorage) und zeigt einmalig alle Changelog-Einträge dazwischen.
 * Beim allerersten Start (nichts gemerkt) wird nichts gezeigt — nur die Version vermerkt,
 * damit eine frische Installation kein Changelog sieht, der nächste echte Sprung aber schon.
 */
export default function WhatsNew() {
  const [current, setCurrent] = useState<string | null>(null)
  const [entries, setEntries] = useState<ChangelogEntry[]>([])

  useEffect(() => {
    let alive = true
    void window.wm26.getUpdate().then((snap) => {
      if (!alive) return
      const cur = snap.currentVersion
      setCurrent(cur)
      const seen = localStorage.getItem(SEEN_KEY)
      // Erststart / frische Installation: nur merken, nichts zeigen
      if (!seen || cmpVersion(cur, seen) <= 0) {
        localStorage.setItem(SEEN_KEY, cur)
        return
      }
      const since = CHANGELOG.filter((e) => cmpVersion(e.version, seen) > 0 && cmpVersion(e.version, cur) <= 0)
      if (since.length === 0) {
        localStorage.setItem(SEEN_KEY, cur) // Update ohne Changelog-Eintrag → still quittieren
        return
      }
      setEntries(since)
    })
    return () => {
      alive = false
    }
  }, [])

  const close = useCallback(() => {
    if (current) localStorage.setItem(SEEN_KEY, current)
    setEntries([])
  }, [current])

  useEffect(() => {
    if (entries.length === 0) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [entries, close])

  if (entries.length === 0) return null

  return (
    <div className="whatsnew" role="dialog" aria-modal="true" onClick={close}>
      <div className="whatsnew__card" onClick={(e) => e.stopPropagation()}>
        <header className="whatsnew__head">
          <span className="whatsnew__kicker">Aktualisiert auf Version {current}</span>
          <h2 className="whatsnew__title foil">Was ist neu</h2>
        </header>
        <div className="whatsnew__body">
          {entries.map((e) => (
            <section key={e.version} className="whatsnew__rel">
              <h3 className="whatsnew__relh">
                <span className="whatsnew__ver">{e.version}</span>
                {e.title}
              </h3>
              <ul className="whatsnew__list">
                {e.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <button className="btn btn--primary whatsnew__ok" onClick={close}>
          Los geht's
        </button>
      </div>
    </div>
  )
}
