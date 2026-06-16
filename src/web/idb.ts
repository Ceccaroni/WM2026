// Winziger IndexedDB-Key-Value-Store für die PWA — ersetzt die fs-Atomic-Stores des
// Main-Prozesses (wm26-store.json, wm26-results.json). Eine Datenbank, ein Object-Store,
// schlichtes get/set über String-Schlüssel ('state', 'results'). Bewusst minimal: die
// Datenmengen sind klein (Profile/Tipps, letzter Ergebnis-Snapshot), Transaktionalität
// liefert IndexedDB selbst — kein tmp+rename nötig wie bei der Datei-Variante.

const DB_NAME = 'wm26'
const STORE = 'kv'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
