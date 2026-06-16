import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { NewsService } from './news'
import { ResultsService } from './results'
import { Store } from './store'
import { UpdateService } from './update'
import { DEFAULT_SCORING } from '../shared/types'
import type {
  EntryKind,
  ExchangeFileV1,
  LineupPlayer,
  LiveResult,
  MatchLineup,
  NewsSnapshot,
  Tip,
  UpdateSnapshot
} from '../shared/types'

// Debug: WM26_SHOT_DIR=<pfad> macht automatisierte Screenshots der Screens
// (eigenes userData, berührt echte Tipps nicht) und beendet die App danach.
// Profil/Tipps/Ergebnisse werden deterministisch geseedet, der Poller bleibt aus.
const SHOT_DIR = process.env['WM26_SHOT_DIR']
if (SHOT_DIR) {
  app.setPath('userData', join(SHOT_DIR, 'userData'))
  seedShotData(join(SHOT_DIR, 'userData'))
}

const store = new Store()
const results = new ResultsService()
const news = new NewsService()
const updates = new UpdateService()

/** Shot-Modus: fixe News statt Live-Feeds, damit Screenshot 12 deterministisch bleibt. */
function seededNews(): NewsSnapshot {
  return {
    items: [
      {
        id: 'seed-1',
        title: 'Nati-Auftakt gegen Katar: Yakin setzt auf Embolo',
        text: 'Murat Yakin hat die Startelf für das erste Gruppenspiel weitgehend festgelegt: Vorne soll Breel Embolo beginnen, dahinter zieht Granit Xhaka die Fäden. Offen ist nur noch die linke Seite — dort liefern sich zwei Kandidaten ein Duell im Abschlusstraining.',
        source: 'Blick',
        publishedAt: '2026-06-11T08:30:00Z',
        teamIds: ['SUI', 'QAT']
      },
      {
        id: 'seed-2',
        title: 'Kobel vor seiner ersten WM als Nummer 1',
        text: 'Nach dem Rücktritt von Yann Sommer gehört das Schweizer Tor nun Gregor Kobel. Der Dortmund-Goalie spricht über die neue Rolle, den Druck — und warum ihm die lauten Stadien in Nordamerika keine Angst machen.',
        source: 'Watson',
        publishedAt: '2026-06-10T17:00:00Z',
        teamIds: ['SUI']
      },
      {
        id: 'seed-3',
        title: 'Akanji reist als Meister an: «Wir wollen mehr als den Achtelfinal»',
        text: 'Manuel Akanji kommt mit dem Scudetto im Gepäck ins Schweizer Camp. Im Interview spricht der Innenverteidiger über den Wechsel zu Inter, die Favoritenrolle in der Gruppe B und das erklärte Ziel, erstmals einen WM-Viertelfinal zu erreichen.',
        source: 'SRF',
        publishedAt: '2026-06-10T09:15:00Z',
        teamIds: ['SUI']
      }
    ],
    fetchedAt: '2026-06-11T12:00:00Z'
  }
}

function registerIpc(): void {
  ipcMain.handle('state:get', () => store.state)

  ipcMain.handle('results:get', () => results.snapshot())

  ipcMain.handle('results:refresh', () => results.refresh())

  ipcMain.handle('lineups:get', () => results.lineupsSnapshot())

  ipcMain.handle('news:get', () => (SHOT_DIR ? seededNews() : news.snapshot()))

  ipcMain.handle('news:refresh', () => (SHOT_DIR ? seededNews() : news.refresh()))

  // Shot-Modus: kein Banner, keine Overrides — deterministische Screenshots
  ipcMain.handle('update:get', () =>
    SHOT_DIR
      ? ({ currentVersion: app.getVersion(), manifest: null, data: null, fetchedAt: null } as UpdateSnapshot)
      : updates.snapshot()
  )

  // „Nach Updates suchen": Sofort-Check mit Cache-Buster; im Shot-Modus kein Netz-Poll.
  ipcMain.handle('update:check', () =>
    SHOT_DIR
      ? ({ currentVersion: app.getVersion(), manifest: null, data: null, fetchedAt: null } as UpdateSnapshot)
      : updates.checkNow()
  )

  // Update-Banner „Herunterladen": Download im Browser starten und die App beenden,
  // damit das Ersetzen im Programme-Ordner nicht an der laufenden App scheitert.
  // URL bewusst aus dem eigenen Manifest, nicht vom Renderer.
  ipcMain.handle('update:download', async () => {
    const url = updates.snapshot().manifest?.downloadUrl
    if (!url) return
    console.log(`[update] Download geöffnet (${url}), beende App …`)
    await shell.openExternal(url)
    setTimeout(() => app.quit(), 800)
  })

  // Tipp-Wächter: Dock-Badge mit der Anzahl offener heutiger Tipps (nur macOS)
  ipcMain.on('badge:set', (_e, count: number) => {
    if (process.platform === 'darwin') app.dock?.setBadge(count > 0 ? String(count) : '')
  })

  ipcMain.handle('ics:export', async (_e, content: string, suggestedName: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: suggestedName,
      filters: [{ name: 'Kalender', extensions: ['ics'] }]
    })
    if (canceled || !filePath) return { ok: false, canceled: true }
    writeFileSync(filePath, content)
    return { ok: true, path: filePath }
  })

  // Turnier-Chronik als PDF: Der Renderer schaltet vorher in den Print-Modus
  // (@media print zeigt Deckblatt + alle Tagesseiten). Im Shot-Modus ohne Dialog
  // nach SHOT_DIR — so prüft der Screenshot-Lauf auch das PDF mit.
  ipcMain.handle('chronik:pdf', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return { ok: false, error: 'Kein Fenster.' }
    let filePath = SHOT_DIR ? join(SHOT_DIR, 'chronik.pdf') : undefined
    if (!filePath) {
      const r = await dialog.showSaveDialog({
        defaultPath: 'WM26-Chronik.pdf',
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      })
      if (r.canceled || !r.filePath) return { ok: false, canceled: true }
      filePath = r.filePath
    }
    // Fenster-Hintergrund (dunkle Bühne) schlägt sonst als schwarzer Seitenrand durch
    win.setBackgroundColor('#ffffff')
    try {
      const pdf = await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4' })
      writeFileSync(filePath, pdf)
    } finally {
      win.setBackgroundColor('#0E1116')
    }
    return { ok: true, path: filePath }
  })

  ipcMain.handle('profile:create', (_e, name: string, color: string) => {
    store.createProfile(name, color)
    return store.state
  })

  ipcMain.handle('profile:setActive', (_e, id: string) => {
    store.setActiveProfile(id)
    return store.state
  })

  ipcMain.handle('tip:set', (_e, profileId: string, entry: EntryKind, match: number, tip: Tip | null) => {
    store.setTip(profileId, entry, match, tip)
  })

  ipcMain.handle('profile:export', async (_e, profileId: string) => {
    const file = store.buildExport(profileId)
    if (!file) return { ok: false, error: 'Profil nicht gefunden.' }
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: `${file.profile.name}.wm26tipp`,
      filters: [{ name: 'WM26-Tipps', extensions: ['wm26tipp'] }]
    })
    if (canceled || !filePath) return { ok: false, canceled: true }
    writeFileSync(filePath, JSON.stringify(file, null, 2))
    return { ok: true, path: filePath }
  })

  ipcMain.handle('profile:import', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [{ name: 'WM26-Tipps', extensions: ['wm26tipp', 'json'] }],
      properties: ['openFile']
    })
    if (canceled || !filePaths[0]) return { ok: false, canceled: true, state: store.state }
    try {
      const file = JSON.parse(readFileSync(filePaths[0], 'utf8')) as ExchangeFileV1
      if (file.formatVersion !== 1 || !file.profile?.id) throw new Error('Unbekanntes Dateiformat.')
      const result = store.importProfile(file)
      return { ok: true, ...result, profileName: file.profile.name, state: store.state }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err), state: store.state }
    }
  })
}

/** Sofort-Splash (eigenes, abhängigkeitsfreies Fenster): überbrückt die schwarze Lücke vom
 *  Fenster-Öffnen bis der Renderer das Hauptfenster gemalt hat. Inline-HTML, System-Font,
 *  keine Assets/Bundles ⇒ malt sofort. Panini-Palette; Magenta-Akzent (Gold bleibt Belohnung). */
const SPLASH_HTML = `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}
  html,body{height:100%}
  body{background:#0E1116;color:#f2f4f8;
    font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
    -webkit-user-select:none;user-select:none}
  .logo svg{height:54px;width:auto;display:block}
  .logo svg path{fill:#fff}
  .mark{font-size:32px;font-weight:800;letter-spacing:.06em}
  .mark b{color:#e62e6b}
  .bar{width:184px;height:4px;border-radius:4px;background:rgba(255,255,255,.09);position:relative;overflow:hidden}
  .bar i{position:absolute;top:0;left:-45%;width:45%;height:100%;border-radius:4px;
    background:linear-gradient(90deg,#0b5fa5,#e62e6b);animation:slide 1.15s ease-in-out infinite}
  @keyframes slide{0%{left:-45%}100%{left:100%}}
  .sub{font-size:12.5px;color:#9aa3b2;letter-spacing:.02em}
</style></head><body>
  <div class="logo"><svg viewBox="0 0 454.57332 701.3333" xmlns="http://www.w3.org/2000/svg"><defs><clipPath clipPathUnits="userSpaceOnUse" id="clipPath622"><path d="M 0,295.739 H 228.526 V 0 H 0 Z"/></clipPath></defs><g transform="matrix(2.6666666,0,0,-2.6666666,-77.413598,744.98451)"><g><g clip-path="url(#clipPath622)"><g transform="translate(156.8791,144.2182)"><path d="m 0,0 h -85.232 c -23.538,0 -42.617,-19.08 -42.617,-42.616 v -42.616 c 0,-23.537 19.079,-42.617 42.617,-42.617 H 0 c 23.537,0 42.616,19.08 42.616,42.617 0,23.536 -19.079,42.616 -42.616,42.616 H 42.616 C 42.616,-19.08 23.537,0 0,0 m 0,135.151 h -85.232 c -23.538,0 -42.617,-19.08 -42.617,-42.616 h 42.617 c -23.538,0 -42.617,-19.079 -42.617,-42.616 V 7.302 H 42.616 V 49.919 H 0 c 23.537,0 42.616,19.08 42.616,42.616 0,23.536 -19.079,42.616 -42.616,42.616"/></g><g transform="translate(79.2931,66.1489)"><path d="m 0,0 v -24.857 h 7.68 v 8.977 h 5.528 l 1.966,5.432 H 7.68 v 5.032 h 9.308 L 18.947,0 Z"/></g><g transform="translate(100.589,66.1489)"><path d="M 0,0 0.001,-24.857 H 7.68 V 0 Z"/></g><g transform="translate(113.5534,66.1489)"><path d="m 0,0 v -24.857 h 7.68 v 8.977 h 5.528 l 1.966,5.432 H 7.68 v 5.032 h 9.308 L 18.947,0 Z"/></g><g transform="translate(141.3898,59.7612)"><path d="m 0,0 3.069,-10.354 h -6.037 z m -3.871,6.388 -8.989,-24.859 h 7.561 l 0.96,3.34 H 4.34 l 1.003,-3.34 h 7.756 L 4.113,6.388 Z"/></g><g transform="translate(194.9572,20.935)"><path d="M 0,0 H -0.722 V -4.565 H 0 v 1.818 h 3.662 v 0.922 H 0 Z"/></g><g transform="translate(198.6193,27.52)"><path d="m 0,0 h -3.984 c -0.125,0 -0.223,-0.033 -0.293,-0.1 -0.072,-0.067 -0.107,-0.163 -0.107,-0.287 v -1.018 l 3.47,-1.61 -3.47,-1.614 v -1.013 c 0,-0.121 0.035,-0.215 0.107,-0.287 0.07,-0.07 0.168,-0.106 0.293,-0.106 H 0 v 0.896 H -3.661 L 0,-3.462 v 0.883 l -3.661,1.683 H 0 Z"/></g></g></g></g></svg></div>
  <div class="mark">WM<b>26</b> TIPP</div>
  <div class="bar"><i></i></div>
  <div class="sub">Das Tschuttini-Album wird aufgeschlagen …</div>
</body></html>`

function createWindow(): void {
  // Debug: WM26_SHOT_W=<px> macht das Fenster schmal (z. B. 390) → rendert das ≤680px-Mobile-Layout
  // für Hochformat-Screenshots der PWA-Optik. minWidth muss dann mitschrumpfen.
  const shotW = process.env['WM26_SHOT_W'] ? Number(process.env['WM26_SHOT_W']) : 0
  const win = new BrowserWindow({
    width: shotW || 1320,
    height: 860,
    minWidth: shotW || 1080,
    minHeight: 700,
    title: 'WM26 Tipp',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0E1116',
    show: !!SHOT_DIR, // normal: erst zeigen, wenn gemalt — der Splash überbrückt; Shot-Modus zeigt sofort
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Marken-Splash sofort, bis das Hauptfenster gemalt ist (Shot-Modus: aus, Fenster ist sichtbar).
  if (!SHOT_DIR) {
    const splash = new BrowserWindow({
      width: 380,
      height: 250,
      frame: false,
      resizable: false,
      center: true,
      alwaysOnTop: true,
      fullscreenable: false,
      minimizable: false,
      maximizable: false,
      backgroundColor: '#0E1116',
      title: ''
    })
    void splash.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(SPLASH_HTML))
    const reveal = (): void => {
      if (!win.isDestroyed() && !win.isVisible()) win.show()
      if (!splash.isDestroyed()) splash.close()
    }
    win.once('ready-to-show', reveal)
    setTimeout(reveal, 8000) // Sicherheitsnetz: nie im Splash hängenbleiben
  }

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    win.webContents.on('console-message', (_e, _level, message, line, sourceId) => {
      console.log(`[renderer] ${message} (${sourceId}:${line})`)
    })
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  if (SHOT_DIR) {
    win.webContents.once('did-finish-load', () => void (shotW ? captureMobile(win) : captureScreens(win)))
  }
}

/** Fixe Spielstände für Screenshots: live, Halbzeit, Endstand, n.V., i.E., ohne Tipp, Rangliste. */
function seedShotData(dir: string): void {
  mkdirSync(dir, { recursive: true })
  const id = 'shot-profile'
  const tips: Record<number, Tip> = { 1: { h: 2, a: 0 }, 2: { h: 1, a: 1 }, 3: { h: 2, a: 1 }, 4: { h: 1, a: 1 } }
  // Zwei „importierte" Mittipper mit anderen Punktzahlen für die Rangliste; Spiel 1
  // (live, also ohne Wertung) zusätzlich für den Tipp-Vergleich („Was hat Reto getippt?")
  const tipsReto: Record<number, Tip> = { 1: { h: 1, a: 0 }, 3: { h: 1, a: 0 }, 4: { h: 1, a: 3 }, 5: { h: 3, a: 3 }, 7: { h: 1, a: 0 } }
  const tipsLivia: Record<number, Tip> = { 1: { h: 2, a: 0 }, 3: { h: 0, a: 1 }, 5: { h: 1, a: 1 }, 7: { h: 2, a: 0 } }
  writeFileSync(
    join(dir, 'wm26-store.json'),
    JSON.stringify({
      version: 1,
      profiles: [
        { id, name: 'Shot-Test', color: '#0B5FA5' },
        { id: 'shot-reto', name: 'Reto', color: '#E62E6B', imported: true },
        { id: 'shot-livia', name: 'Livia', color: '#1F8A4C', imported: true }
      ],
      activeProfileId: id,
      scoring: { ...DEFAULT_SCORING },
      entries: {
        [id]: {
          main: { tips },
          // Späteinstieg ab 1/16: Spiel 73 beendet (exakt getroffen), 74 angesetzt mit echten Teams
          fromR32: { tips: { 73: { h: 2, a: 1 }, 74: { h: 1, a: 1, adv: 'home' } } }
        },
        'shot-reto': { main: { tips: tipsReto }, fromR32: { tips: { 73: { h: 0, a: 2 } } } },
        'shot-livia': { main: { tips: tipsLivia } }
      }
    })
  )
  const t = new Date().toISOString()
  const r = (partial: Omit<LiveResult, 'updatedAt'>): LiveResult => ({ ...partial, updatedAt: t })
  const seeded: Record<number, LiveResult> = {
    1: r({
      match: 1,
      status: 'live',
      minute: "57'",
      homeScore: 1,
      awayScore: 0,
      homeTeam: 'MEX',
      awayTeam: 'RSA',
      // echte Ereignisse vom 11.06. — verifiziert auch das Torschützen-Matching auf die Kader-Karte
      events: [
        { minute: "9'", side: 'home', player: 'Julián Quiñones', jersey: '16', kind: 'goal' },
        { minute: "49'", side: 'away', player: 'Sphephelo Sithole', jersey: '13', kind: 'red' }
      ]
    }),
    2: r({ match: 2, status: 'ht', homeScore: 0, awayScore: 0, homeTeam: 'KOR', awayTeam: 'CZE' }),
    3: r({
      match: 3,
      status: 'finished',
      homeScore: 2,
      awayScore: 1,
      winner: 'home',
      homeTeam: 'CAN',
      awayTeam: 'BIH',
      // Doppelpack Larin → prüft Torschützen-Aggregation + Goldener Schuh
      events: [
        { minute: "23'", side: 'home', player: 'Cyle Larin', jersey: '9', kind: 'goal' },
        { minute: "67'", side: 'home', player: 'Cyle Larin', jersey: '9', kind: 'goal' },
        { minute: "80'", side: 'away', player: 'Jovo Lukic', jersey: '25', kind: 'goal' }
      ]
    }),
    4: r({ match: 4, status: 'finished', homeScore: 1, awayScore: 3, aet: true, winner: 'away', homeTeam: 'USA', awayTeam: 'PAR' }),
    5: r({ match: 5, status: 'finished', homeScore: 3, awayScore: 3, pens: { home: 4, away: 2 }, winner: 'home', homeTeam: 'HAI', awayTeam: 'SCO' }),
    7: r({
      match: 7,
      status: 'finished',
      homeScore: 2,
      awayScore: 0,
      winner: 'home',
      homeTeam: 'BRA',
      awayTeam: 'MAR',
      events: [
        { minute: "31'", side: 'home', player: 'Neymar', jersey: '10', kind: 'goal' },
        { minute: "58'", side: 'home', player: 'Vinícius Júnior', jersey: '7', kind: 'goal' }
      ]
    }),
    // Gruppen B & E vollständig, damit die KO-Tipp-Hilfe hinter Spiel 73 (GER–SUI) echte Tabellen + Herkunft zeigt
    ...Object.fromEntries(
      (
        [
          [9, 'CIV', 'ECU', 1, 2], [10, 'GER', 'CUW', 3, 0], [33, 'GER', 'CIV', 2, 1],
          [34, 'ECU', 'CUW', 2, 0], [55, 'CUW', 'CIV', 0, 1], [56, 'ECU', 'GER', 1, 2],
          [8, 'QAT', 'SUI', 0, 2], [26, 'SUI', 'BIH', 3, 1], [27, 'CAN', 'QAT', 2, 0],
          [51, 'SUI', 'CAN', 1, 0], [52, 'BIH', 'QAT', 1, 1]
        ] as Array<[number, string, string, number, number]>
      ).map(([match, homeTeam, awayTeam, homeScore, awayScore]) => [
        match,
        r({
          match,
          status: 'finished',
          homeScore,
          awayScore,
          winner: homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : undefined,
          homeTeam,
          awayTeam
        })
      ])
    ),
    // KO-Vorbefüllung: 73 beendet, 74 mit vorangekündigten Teams (Späteinstieg/Rangliste-Sektion);
    // 75–88 angesetzt mit Teams → „KO-Paarungen stehen fest"-Aufruf auf dem Heute-Screen
    73: r({ match: 73, status: 'finished', homeScore: 2, awayScore: 1, winner: 'home', homeTeam: 'GER', awayTeam: 'SUI' }),
    74: r({ match: 74, status: 'scheduled', homeTeam: 'FRA', awayTeam: 'MAR' }),
    ...Object.fromEntries(
      (
        [
          [75, 'ESP', 'URU'], [76, 'ARG', 'AUT'], [77, 'ENG', 'CRO'], [78, 'POR', 'COL'],
          [79, 'BRA', 'SCO'], [80, 'NED', 'JPN'], [81, 'BEL', 'EGY'], [82, 'MEX', 'KOR'],
          [83, 'USA', 'PAR'], [84, 'CAN', 'QAT'], [85, 'SEN', 'NOR'], [86, 'KSA', 'CPV'],
          [87, 'AUS', 'TUR'], [88, 'CIV', 'ECU']
        ] as Array<[number, string, string]>
      ).map(([match, homeTeam, awayTeam]) => [match, r({ match, status: 'scheduled', homeTeam, awayTeam })])
    )
  }
  // Aufstellungen für die beiden Live-Spiele (Spielfeld-Screenshot) — pos-Kürzel wie bei ESPN.
  const pl = (no: number, name: string, pos: string, subbedOut?: string): LineupPlayer => ({
    no,
    name,
    fullName: name,
    pos,
    starter: true,
    ...(subbedOut ? { subbedOut: true, outMinute: subbedOut } : {})
  })
  // Bank-Spieler; mit `in`/`forNo` als eingewechselt markiert (Slot-Zuordnung über forNo).
  const sub = (no: number, name: string, opts?: { in?: string; forNo?: number }): LineupPlayer => ({
    no,
    name,
    fullName: name,
    pos: 'SUB',
    starter: false,
    ...(opts?.in ? { subbedIn: true, inMinute: opts.in } : {}),
    ...(opts?.forNo ? { forNo: opts.forNo } : {})
  })
  const seededLineups: Record<number, MatchLineup> = {
    1: {
      match: 1,
      fetchedAt: t,
      home: {
        team: 'MEX',
        formation: '4-3-3',
        starters: [
          pl(1, 'Malagón', 'G'),
          pl(2, 'Sánchez', 'RB'),
          pl(5, 'Montes', 'CD-R'),
          pl(15, 'Vásquez', 'CD-L'),
          pl(23, 'Gallardo', 'LB'),
          pl(8, 'Pineda', 'RM'),
          pl(16, 'Álvarez', 'CM'),
          pl(14, 'Chávez', 'LM', '63'),
          pl(11, 'Quiñones', 'RF'),
          pl(9, 'Giménez', 'F'),
          pl(22, 'Lozano', 'LF')
        ],
        bench: [
          sub(7, 'Antuna', { in: '63', forNo: 14 }),
          sub(12, 'Acevedo'),
          sub(3, 'Araujo'),
          sub(17, 'Córdova'),
          sub(18, 'Romo'),
          sub(13, 'Vega')
        ]
      },
      away: {
        team: 'RSA',
        formation: '4-2-3-1',
        starters: [
          pl(1, 'Williams', 'G'),
          pl(2, 'Mudau', 'RB'),
          pl(4, 'Mbatha', 'CD-R'),
          pl(5, 'Xulu', 'CD-L'),
          pl(3, 'Modiba', 'LB'),
          pl(6, 'Mokoena', 'DM'),
          pl(8, 'Zwane', 'DM'),
          pl(20, 'Tau', 'RM'),
          pl(10, 'Mofokeng', 'AM'),
          pl(7, 'Appollis', 'LM', '70'),
          pl(9, 'Sithole', 'F')
        ],
        bench: [
          sub(11, 'Mahlangu', { in: '70', forNo: 7 }),
          sub(16, 'Williams R.'),
          sub(15, 'Sibisi'),
          sub(19, 'Mbule'),
          sub(21, 'Ngezana')
        ]
      }
    },
    2: {
      match: 2,
      fetchedAt: t,
      home: {
        team: 'KOR',
        formation: '4-4-2',
        starters: [
          pl(1, 'Kim S.', 'G'),
          pl(2, 'Kim M.', 'RB'),
          pl(4, 'Kim M-J.', 'CD-R'),
          pl(20, 'Kwon', 'CD-L'),
          pl(12, 'Lee', 'LB'),
          pl(7, 'Son', 'RM'),
          pl(13, 'Hwang I.', 'CM'),
          pl(6, 'Hwang H.', 'CM'),
          pl(17, 'Bae', 'LM'),
          pl(9, 'Cho', 'F'),
          pl(11, 'Hwang U.', 'F')
        ],
        bench: [sub(21, 'Jo'), sub(3, 'Kim J-S.'), sub(15, 'Jung'), sub(19, 'Oh'), sub(10, 'Lee J-S.'), sub(14, 'Hong')]
      },
      away: {
        team: 'CZE',
        formation: '4-3-3',
        starters: [
          pl(1, 'Staněk', 'G'),
          pl(2, 'Coufal', 'RB'),
          pl(3, 'Holeš', 'CD-R'),
          pl(4, 'Hranáč', 'CD-L'),
          pl(18, 'Doudera', 'LB'),
          pl(8, 'Souček', 'CM'),
          pl(10, 'Provod', 'RM'),
          pl(14, 'Černý', 'LM'),
          pl(7, 'Barák', 'RF'),
          pl(9, 'Kuchta', 'F'),
          pl(20, 'Schick', 'LF')
        ],
        bench: [sub(16, 'Jaroš'), sub(5, 'Krejčí'), sub(22, 'Sadílek'), sub(11, 'Chytil'), sub(19, 'Hložek'), sub(15, 'Lingr')]
      }
    }
  }
  writeFileSync(
    join(dir, 'wm26-results.json'),
    JSON.stringify({ version: 1, eventMap: {}, results: seeded, lineups: seededLineups, fetchedAt: t })
  )
}

/** Schlanke Hochformat-Sequenz (WM26_SHOT_W gesetzt): jeder Screen am oberen Rand, ohne
 *  Detail-Aufklapper — zum Verifizieren des ≤680px-Layouts. Eigenes „m-"-Präfix. */
async function captureMobile(win: BrowserWindow): Promise<void> {
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const js = (code: string) => win.webContents.executeJavaScript(code)
  const shot = async (name: string) => {
    const img = await win.webContents.capturePage()
    writeFileSync(join(SHOT_DIR!, name), img.toPNG())
    console.log(`[shot] ${name}`)
  }
  const nav = (i: number) => js(`document.querySelectorAll('.sidebar button')[${i}]?.click()`)
  const top = () => js(`document.querySelector('.screen')?.scrollTo(0, 0)`)
  const at = async (i: number, name: string) => {
    await nav(i)
    await wait(500)
    await top()
    await wait(180)
    await shot(name)
  }
  mkdirSync(SHOT_DIR!, { recursive: true })
  await wait(2000)
  await js(`(() => {
    const i = document.querySelector('.profileform input')
    if (!i) return false
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, 'Shot-Test')
    i.dispatchEvent(new Event('input', { bubbles: true }))
    document.querySelector('.profileform button.btn--primary')?.click()
    return true
  })()`)
  await wait(900)
  await at(0, 'm-heute.png')
  await at(1, 'm-spielplan.png')
  await at(4, 'm-rangliste.png')
  await at(5, 'm-ko.png')
  // Team-Detail: in die Mexiko-Seite und an den Kopf scrollen (Verbandslogo/Flagge/Button).
  await nav(6)
  await wait(400)
  await js(`[...document.querySelectorAll('.teamsticker')].find((b) => b.textContent.includes('Mexiko'))?.click()`)
  await wait(500)
  await top()
  await wait(180)
  await shot('m-team.png')
  await at(9, 'm-chronik.png')
  app.quit()
}

async function captureScreens(win: BrowserWindow): Promise<void> {
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const js = (code: string) => win.webContents.executeJavaScript(code)
  const shot = async (name: string) => {
    const img = await win.webContents.capturePage()
    writeFileSync(join(SHOT_DIR!, name), img.toPNG())
    console.log(`[shot] ${name}`)
  }
  mkdirSync(SHOT_DIR!, { recursive: true })
  await wait(2000)
  // Onboarding durchklicken, falls vorhanden (React-kontrollierter Input → nativer Setter)
  await js(`(() => {
    const i = document.querySelector('.profileform input')
    if (!i) return false
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, 'Shot-Test')
    i.dispatchEvent(new Event('input', { bubbles: true }))
    document.querySelector('.profileform button.btn--primary')?.click()
    return true
  })()`)
  await wait(900)
  // Sidebar-Indizes: 0 Heute · 1 Spielplan · 2 Tipps · 3 Live · 4 Rangliste · 5 KO · 6 Teams · 7 Stadien
  await js(`document.querySelectorAll('.sidebar button')[1]?.click()`)
  await wait(500)
  await shot('1-spielplan.png')
  const chip = (label: string) =>
    js(`[...document.querySelectorAll('.groupchip')].find((b) => b.textContent.trim().startsWith('${label}'))?.click()`)
  await js(`document.querySelectorAll('.sidebar button')[2]?.click()`)
  await wait(500)
  await shot('2-tipps-gruppe-a.png')
  await chip('1/16')
  await wait(400)
  await shot('3-tipps-r32.png')
  await chip('Finale')
  await wait(400)
  await shot('4-tipps-finale.png')
  await chip('Baum')
  await wait(400)
  await shot('5-baum.png')
  await js(`document.querySelectorAll('.sidebar button')[6]?.click()`)
  await wait(500)
  await shot('6-teams.png')
  await js(`document.querySelectorAll('.sidebar button')[3]?.click()`)
  await wait(500)
  await shot('7-live-spiele.png')
  // Aufstellungen: erste Live-Zeile aufklappen → Spielfeld mit beiden Startelfen
  await js(`document.querySelector('.liverow--expandable')?.click()`)
  await wait(450)
  await js(`document.querySelector('.pitch')?.scrollIntoView({ block: 'center' })`)
  await wait(250)
  await shot('27-aufstellung.png')
  await js(`document.querySelector('.liverow--expandable')?.click()`)
  await wait(150)
  await chip('Tabellen')
  await wait(400)
  await shot('8-live-tabellen.png')
  await chip('Baum')
  await wait(400)
  await shot('9-live-baum.png')
  await js(`document.querySelectorAll('.sidebar button')[4]?.click()`)
  await wait(500)
  await js(`document.querySelector('.rules__toggle')?.click()`)
  await js(`document.querySelector('.lbrow')?.click()`)
  await wait(400)
  await shot('10-rangliste.png')
  await js(`document.querySelectorAll('.sidebar button')[5]?.click()`)
  await wait(500)
  await shot('11-ko-einstieg.png')
  // KO-Tipp-Hilfe: erstes „Form & Quoten"-Panel aufklappen (Gruppe + Tabelle + Quoten, Vergleich)
  await js(`document.querySelector('.kohelp-toggle')?.click()`)
  await wait(350)
  await js(`document.querySelector('.kohelp')?.scrollIntoView({ block: 'center' })`)
  await wait(250)
  await shot('28-ko-hilfe.png')
  // M4: Team-Detailseite (Dossier + Quote) und Stadien
  await js(`document.querySelectorAll('.sidebar button')[6]?.click()`)
  await wait(400)
  await js(`[...document.querySelectorAll('.teamsticker')].find((b) => b.textContent.includes('Schweiz'))?.click()`)
  await wait(500)
  // erste Meldung aufklappen und in den Blick scrollen
  await js(`document.querySelector('.newslist__head')?.click()`)
  await js(`document.querySelector('.newslist')?.scrollIntoView({ block: 'center' })`)
  await wait(400)
  await shot('12-team-detail.png')
  await js(`document.querySelectorAll('.sidebar button')[7]?.click()`)
  await wait(600)
  await shot('13-stadien.png')
  await js(`document.querySelector('.flipcard')?.click()`)
  await wait(900)
  await shot('14-stadion-flip.png')
  // Heute-Dashboard mit aufgeklapptem Tipp-Vergleich
  await js(`document.querySelectorAll('.sidebar button')[0]?.click()`)
  await wait(500)
  await js(`document.querySelector('.liverow--expandable')?.click()`)
  await wait(400)
  await shot('15-heute.png')
  // Turnierbaum im Kompaktmodus (alles im Blick, Connectors neu vermessen)
  await js(`document.querySelectorAll('.sidebar button')[2]?.click()`)
  await wait(400)
  await chip('Baum')
  await wait(400)
  await js(`[...document.querySelectorAll('.bracket__zoom')].find((b) => b.textContent === 'Kompakt')?.click()`)
  await wait(500)
  await shot('16-baum-kompakt.png')
  // Kader-Unterseite mit umgedrehter Spielerkarte
  await js(`document.querySelectorAll('.sidebar button')[6]?.click()`)
  await wait(400)
  await js(`[...document.querySelectorAll('.teamsticker')].find((b) => b.textContent.includes('Schweiz'))?.click()`)
  await wait(400)
  await js(`document.querySelector('.squadbtn')?.click()`)
  await wait(500)
  await js(`document.querySelectorAll('.stargrid--squad .flipcard')[1]?.click()`)
  await wait(900)
  await shot('17-kader.png')
  // Erfolgs-Sticker (Sidebar-Index 8 — „Erfolge" steht bewusst nach den Indizes 0–7)
  await js(`document.querySelectorAll('.sidebar button')[8]?.click()`)
  await wait(500)
  await shot('18-erfolge.png')
  // Live-Ereignisse: Klick auf den Torschützen öffnet seine Panini-Karte (PlayerPeek)
  await js(`document.querySelectorAll('.sidebar button')[3]?.click()`)
  await wait(500)
  await js(`document.querySelector('.liverow__ev--card')?.click()`)
  await wait(600)
  await shot('19-playerpeek.png')
  // Team-Detail mit ECHTEM Verbandswappen (Schweiz in Shot 12 zeigt das Fallback-Schild)
  await js(`document.querySelector('.peek')?.click()`)
  await js(`document.querySelectorAll('.sidebar button')[6]?.click()`)
  await wait(400)
  await js(`[...document.querySelectorAll('.teamsticker')].find((b) => b.textContent.includes('Deutschland'))?.click()`)
  await wait(500)
  await shot('20-team-crest.png')
  // Turnier-Chronik (Sidebar-Index 9): letzte Tagesseite mit Tagespunkten + Stand
  await js(`document.querySelectorAll('.sidebar button')[9]?.click()`)
  await wait(500)
  await shot('21-chronik.png')
  // Chronik-PDF (Shot-Modus schreibt dialogfrei nach SHOT_DIR/chronik.pdf)
  await js(`[...document.querySelectorAll('.filters__ics')].find((b) => b.textContent.includes('PDF'))?.click()`)
  await wait(2500)
  console.log('[shot] chronik.pdf')
  // Torschützen-Rubrik (Sidebar-Index 10): Torjägerliste mit Goldenem Schuh
  await js(`document.querySelectorAll('.sidebar button')[10]?.click()`)
  await wait(500)
  await shot('22-torschuetzen.png')
  // Profile-Rubrik (Sidebar-Index 11): Austausch, Ton und „Nach Updates suchen"
  await js(`document.querySelectorAll('.sidebar button')[11]?.click()`)
  await wait(500)
  await shot('23-profile.png')
  // Siegerehrung-Rubrik (Sidebar-Index 12): Vorschau (vor Finale), dann Zeremonie + Triple per dev-Buttons
  await js(`document.querySelectorAll('.sidebar button')[12]?.click()`)
  await wait(700)
  await shot('24-siegerehrung-vorschau.png')
  await js(`document.querySelectorAll('.cer-devbar button')[0]?.click()`)
  await wait(700)
  await shot('25-siegerehrung-zeremonie.png')
  await js(`document.querySelectorAll('.cer-devbar button')[1]?.click()`)
  await wait(700)
  await shot('26-siegerehrung-triple.png')
  app.quit()
}

/** Deutsche macOS-Menüleiste — ohne eigenes Menü zeigt Electron die englische Default-Leiste.
 *  Die role liefert Funktion + Standard-Shortcut, das label setzen wir explizit auf Deutsch. */
function setGermanMenu(): void {
  const name = app.name
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: name,
        submenu: [
          { role: 'about', label: `Über ${name}` },
          { type: 'separator' },
          { role: 'services', label: 'Dienste' },
          { type: 'separator' },
          { role: 'hide', label: `${name} ausblenden` },
          { role: 'hideOthers', label: 'Andere ausblenden' },
          { role: 'unhide', label: 'Alle einblenden' },
          { type: 'separator' },
          { role: 'quit', label: `${name} beenden` }
        ]
      },
      {
        label: 'Bearbeiten',
        submenu: [
          { role: 'undo', label: 'Widerrufen' },
          { role: 'redo', label: 'Wiederholen' },
          { type: 'separator' },
          { role: 'cut', label: 'Ausschneiden' },
          { role: 'copy', label: 'Kopieren' },
          { role: 'paste', label: 'Einsetzen' },
          { role: 'selectAll', label: 'Alles auswählen' }
        ]
      },
      {
        label: 'Ansicht',
        submenu: [
          { role: 'resetZoom', label: 'Originalgröße' },
          { role: 'zoomIn', label: 'Vergrößern' },
          { role: 'zoomOut', label: 'Verkleinern' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: 'Vollbild' }
        ]
      },
      {
        label: 'Fenster',
        submenu: [
          { role: 'minimize', label: 'Im Dock ablegen' },
          { role: 'zoom', label: 'Zoomen' },
          { type: 'separator' },
          { role: 'front', label: 'Alle nach vorne bringen' }
        ]
      }
    ])
  )
}

app.whenReady().then(() => {
  setGermanMenu()
  registerIpc()
  if (!SHOT_DIR) {
    results.start()
    news.start()
    updates.start()
    // Daueroffener Sofa-Begleiter: bei jedem Fenster-Fokus frisch prüfen (gedrosselt im Service).
    app.on('browser-window-focus', () => void updates.maybeRefresh())
  }
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  results.stop()
  store.flush()
})

app.on('window-all-closed', () => {
  app.quit()
})
