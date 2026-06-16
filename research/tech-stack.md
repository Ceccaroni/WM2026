# Tech-Stack-Recherche: WM-2026-Tippspiel als macOS-Desktop-App

**Stand: Juni 2026** · Anforderungen: .dmg-Verteilung an Freunde ohne Apple Developer Account, glossy Panini-Sticker-UI, lokale Persistenz mit Auto-Save, JSON-Export/-Import, HTTP-Fetches zu öffentlichen APIs. Entwicklung auf macOS 26 (Darwin 25).

---

## TL;DR — Empfehlung

**Electron + electron-builder + React 19 + Vite + TypeScript + Motion (ex Framer Motion) + electron-store.**

Der entscheidende Punkt vorweg: **Bei der Gatekeeper-Hürde für die Empfänger sind alle drei Optionen exakt gleich schlecht.** Ohne bezahlten Developer Account (kein Notarizing) müssen die Freunde auf Sequoia/Tahoe in jedem Fall den Umweg über *Systemeinstellungen → Datenschutz & Sicherheit → „Dennoch öffnen"* gehen — egal ob Electron, Tauri oder SwiftUI. Die Wahl entscheidet sich also **nicht** an Gatekeeper, sondern an UI-Gestaltungsfreiheit, Entwicklungsgeschwindigkeit und Robustheit des unsignierten Build-Pfads. Da gewinnt Electron klar (Begründung in Abschnitt 5).

**Wichtigste technische Erkenntnis:** Die App muss **ad-hoc-signiert** werden (`identity: "-"`), **nicht** komplett unsigniert (`identity: null`). Komplett unsignierte Apps werden auf Apple Silicon nach dem Download als „beschädigt" gemeldet und lassen sich nur per Terminal (`xattr`) retten. Ad-hoc-signierte Apps bekommen dagegen den normalen „Dennoch öffnen"-Pfad, ganz ohne Terminal.

---

## 1. Gatekeeper-Realität auf Sequoia (15) und Tahoe (26) — der kritische Teil

### 1.1 Rechtsklick → Öffnen ist tot

Seit **macOS 15 Sequoia (Sept. 2024)** hat Apple den klassischen Bypass entfernt: **Ctrl-Klick/Rechtsklick → „Öffnen" überschreibt Gatekeeper nicht mehr** bei nicht-notarisierten Apps. Das gilt unverändert auch auf macOS 26 Tahoe. Jede Anleitung, die noch „einfach Rechtsklick → Öffnen" empfiehlt, ist veraltet.

### 1.2 Der einzige offizielle Weg: „Dennoch öffnen"

Der Ablauf für eine ad-hoc-signierte, nicht-notarisierte App auf Sequoia/Tahoe:

1. App per Doppelklick starten → Dialog *„… kann nicht geöffnet werden. Apple konnte nicht überprüfen, ob die App frei von Schadsoftware ist."* → **„Fertig"** klicken (nicht „In den Papierkorb legen"!).
2. **Systemeinstellungen → Datenschutz & Sicherheit** öffnen, **ganz nach unten** scrollen.
3. Dort erscheint *„‚App' wurde blockiert…"* mit Button **„Dennoch öffnen"** → klicken.
4. Erneuter Bestätigungsdialog; auf **Tahoe zusätzlich Admin-Passwort** (bzw. Touch ID) erforderlich.
5. Danach startet die App dauerhaft normal (Ausnahme wird pro App gespeichert).

Wichtige Details:

- Der „Dennoch öffnen"-Button erscheint **nur innerhalb von ca. 1 Stunde** nach dem ersten Startversuch. Falls er fehlt: App einfach erneut per Doppelklick starten, dann wieder in die Systemeinstellungen.
- Der Vorgang ist **einmalig pro App** (und pro Update mit geänderter Signatur).

### 1.3 „App ist beschädigt" — der Fall, den man vermeiden muss

Es gibt zwei verschiedene Fehlerbilder, und der Unterschied ist signiert vs. unsigniert:

| Zustand der App | Verhalten nach Download (mit Quarantäne-Flag) |
|---|---|
| **Ad-hoc-signiert** (`codesign --sign -`) | Dialog „Apple konnte nicht überprüfen…" → **„Dennoch öffnen"-Weg funktioniert** |
| **Komplett unsigniert** | **„‚App' ist beschädigt und kann nicht geöffnet werden"** → kein „Dennoch öffnen"-Angebot; auf Apple Silicon verweigert der Kernel unsignierten Code grundsätzlich |

Seit ca. macOS 15.1 ist das nochmals verschärft: Gänzlich unsignierte Apps lassen sich praktisch gar nicht mehr per GUI starten. Rettung dann nur per Terminal:

```bash
xattr -cr "/Applications/WM2026 Tippspiel.app"        # Quarantäne-Attribut entfernen
# falls weiterhin "beschädigt" (fehlende/kaputte Signatur):
codesign --force --deep --sign - "/Applications/WM2026 Tippspiel.app"
```

**Konsequenz für uns:** Ad-hoc signieren (siehe Build-Konfig), dann ist `xattr` für die Empfänger **nicht** nötig — der reine Systemeinstellungs-Weg reicht.

### 1.4 Wann das Quarantäne-Flag überhaupt gesetzt wird

`com.apple.quarantine` wird gesetzt bei: Browser-Download, AirDrop, Mail, Messages. **Nicht** gesetzt bei: USB-Stick, externe Festplatte, `curl`/`scp` im Terminal. Eine per USB-Stick weitergegebene ad-hoc-signierte App startet also oft komplett ohne Gatekeeper-Dialog. Darauf verlassen sollte man sich aber nicht — die Anleitung für Empfänger (Abschnitt 7) deckt den Normalfall (Download) ab.

---

## 2. Option A: Electron + electron-builder

- **Unsignierter/ad-hoc .dmg-Build:** Bestens dokumentierter, seit Jahren etablierter Pfad. Relevante Optionen in der `mac`-Sektion:
  - `identity: null` → **überspringt Signierung komplett** (führt zum „beschädigt"-Problem, s.o. — **nicht verwenden**)
  - `identity: "-"` → **explizite Ad-hoc-Signierung** (das wollen wir)
  - Ohne Angabe sucht electron-builder im Schlüsselbund nach einem Zertifikat und überspringt das Signieren, wenn keins da ist — also lieber explizit `"-"` setzen.
  - `hardenedRuntime: false` setzen: Hardened Runtime + Ad-hoc-Signatur führt ohne `com.apple.security.cs.disable-library-validation`-Entitlement zu Startabstürzen.
  - `notarize: false` explizit setzen, damit der Build nicht nach Apple-Credentials sucht.
- **Stolperfallen:**
  1. **macOS 26 Tahoe DMG-Bug:** electron-builder erzeugte temporäre Sparse-Images als HFS+; Tahoe mountet HFS+ teils nicht mehr automatisch → Build-Fehler `hdiutil: attach failed – no mountable file systems` (Issue #9615, Fix via PR #9616: Umstellung auf APFS). **electron-builder auf die neueste 26.x-Version aktualisieren**; falls der Fehler trotzdem auftritt, übergangsweise `--mac zip` bauen oder den Fix manuell einspielen.
  2. **Multi-Arch:** arm64 + x64 gleichzeitig mit `identity: null/-` war fehleranfällig (bekannte Issues). Sauberer: pro Architektur einzeln bauen (`--arm64`, `--x64`) oder — wenn alle Freunde Apple Silicon haben — nur arm64.
  3. arm64-Builds auf Intel-CI können „beschädigte" Apps erzeugen — irrelevant, da lokal auf dem M-Mac gebaut wird.
- **Reifegrad:** Maximal. Riesige Community, jede Fehlermeldung ist gegoogelt in 2 Minuten gelöst.
- **Kosten:** .dmg wird ~100–130 MB groß (Chromium-Runtime). Für eine Handvoll Freunde irrelevant.
- **HTTP-Fetches:** trivial (`fetch` im Main- oder Renderer-Prozess, keine CORS-Probleme im Main-Prozess).

## 3. Option B: Tauri v2

- **Reifegrad:** Gut. Tauri 2.0 stabil seit Okt. 2024, aktuelle Linie 2.9.x (Ende 2025), produktionsreif, wird breit eingesetzt.
- **Ad-hoc-Build:** Offiziell dokumentiert:
  ```json
  { "bundle": { "macOS": { "signingIdentity": "-" } } }
  ```
  oder Umgebungsvariable `APPLE_SIGNING_IDENTITY="-"`. Die Tauri-Doku sagt explizit: Ad-hoc-Signierung verhindert die Gatekeeper-Hürde **nicht** — Empfänger müssen denselben „Dennoch öffnen"-Weg gehen wie bei Electron. `tauri build` erzeugt .app + .dmg automatisch.
- **Voraussetzungen:** Rust-Toolchain (rustup, ~1 GB), Xcode Command Line Tools. Frontend identisch zu Electron (beliebiges Web-Framework), aber Backend-Logik (Dateizugriff, Store-Plugins, IPC-Capabilities/Permissions-Modell) läuft über Rust bzw. Plugin-Konfiguration.
- **Vorteile:** Winzige Bundles (~3–10 MB), geringer RAM-Verbrauch, nutzt System-WKWebView (auf macOS 26 modern genug für alle Glossy-CSS-Features).
- **Nachteile für dieses Projekt:** Zusätzliche Toolchain und ein zweites mentales Modell (Rust + Capability-System) für null Empfänger-Vorteil; kleinere Community bei Spezialproblemen; Persistenz via `tauri-plugin-store` ist okay, aber das Node-Ökosystem (electron-store, better-sqlite3) ist reicher.

## 4. Option C: Natives SwiftUI (Xcode, ohne bezahlten Account)

- **Signierung:** Xcode ohne Account: „Sign to Run Locally" (= Ad-hoc). Mit kostenlosem Account: Development-Zertifikat, das auf fremden Macs ebenfalls nicht verifizierbar ist. **Empfänger landen in exakt demselben „Dennoch öffnen"-Flow.** Kein Vorteil bei der Verteilung; .dmg muss manuell erstellt werden (`hdiutil`/`create-dmg`).
- **UI:** SwiftUI kann Verläufe/Animationen gut, aber die Panini-Glossy-Ästhetik (Shine-Sweeps, conic-gradients, backdrop-blur, Hover-Mikrointeraktionen, Folien-Glanz via `mix-blend-mode`) ist im Web-Stack mit CSS + Motion deutlich schneller und freier umsetzbar; zudem ist SwiftUI auf Tahoe mitten in der „Liquid Glass"-Redesign-Umstellung (API-Churn).
- **Persistenz/Export:** SwiftData/Codable-JSON solide, aber mehr Boilerplate für Profile + Import/Export-Dialoge.
- **Fazit:** Nur sinnvoll, wenn man ohnehin Swift lernen/nutzen will. Für dieses Projekt: dritter Platz.

## 5. Entscheidung

| Kriterium | Electron | Tauri v2 | SwiftUI |
|---|---|---|---|
| Gatekeeper-Hürde für Empfänger | identisch | identisch | identisch |
| Glossy-Custom-UI | ★★★ (CSS + Motion) | ★★★ (CSS + Motion) | ★★ |
| Unsignierter .dmg-Pfad dokumentiert | ★★★ | ★★ | ★ (manuell) |
| Toolchain-Aufwand | npm only | npm + Rust | Xcode |
| Persistenz-Ökosystem | ★★★ | ★★ | ★★ |
| Bundle-Größe | ~120 MB | ~10 MB | ~5 MB |
| Reifegrad/Community | ★★★ | ★★ | ★★★ |

**Empfehlung: Electron.** Begründung: Bei identischer Empfänger-Erfahrung zählt nur Entwicklungsgeschwindigkeit und Risikominimierung. Electron hat den am besten ausgetretenen Pfad für unsignierte/ad-hoc-.dmg-Verteilung, eine reine JS/TS-Toolchain (kein Rust), das reichste Persistenz-Ökosystem und identische UI-Möglichkeiten wie Tauri. Die Bundle-Größe — Tauris Haupttrumpf — ist bei einer Handvoll Empfängern bedeutungslos. Tauri ist die klare Nummer 2 und wäre die Wahl, wenn Bundle-Größe/RAM wichtig wären oder Rust-Kenntnisse vorhanden sind.

---

## 6. Persistenz: electron-store statt better-sqlite3

**Empfehlung: `electron-store` (v11+).**

| | electron-store | better-sqlite3 |
|---|---|---|
| Datenmodell | JSON-Datei in `app.getPath('userData')` | echte SQL-DB |
| Atomare Writes | **ja, eingebaut** („Changes are written to disk atomically, so if the process crashes during a write, it will not corrupt the existing config") | ja (WAL) |
| Auto-Save | jeder `store.set()` schreibt sofort atomar | manuell/Transaktionen |
| Schema-Validierung | JSON Schema (ajv) eingebaut | selbst bauen |
| Migrationen | eingebaut (semver-basiert) | selbst bauen |
| JSON-Export/-Import | trivial (`store.store` ist bereits das JSON-Objekt) | Serialisierung nötig |
| Natives Modul / Rebuild | **nein** | **ja** — ABI-Rebuild (`@electron/rebuild`) bei jedem Electron-Major-Update; häufigste Fehlerquelle in Electron-Projekten |
| Wartung | aktiv (v11.0.2, Okt. 2025, sindresorhus) | aktiv |

Für ein Tippspiel mit wenigen MB (Tipps, Spielplan-Cache, eine Handvoll Profile) ist SQLite Overkill und kauft sich die Native-Module-Hölle ein (Node-ABI vs. Electron-ABI, Rebuild nach jedem Update). electron-store deckt alles ab: Auto-Save = einfach bei jeder Tipp-Änderung `store.set(...)` aufrufen (atomar, crash-sicher), Profile als Top-Level-Objekt, Export = `JSON.stringify(store.store)` in eine Datei via `dialog.showSaveDialog`, Import = einlesen, per Schema validieren, mergen.

**Stolperfalle:** electron-store ≥ v9 ist **ESM-only** und braucht **Electron ≥ 30**. Mit electron-vite (ESM-Main-Prozess) kein Problem. Wer CommonJS braucht: bei v8 bleiben oder `electron-conf` als Alternative.

Struktur-Vorschlag:

```ts
// store.ts (Main-Prozess)
import Store from 'electron-store';

const schema = {
  profiles: { type: 'object', default: {} },   // { [profileId]: { name, avatar, tips: {...} } }
  activeProfile: { type: 'string', default: '' },
  settings: { type: 'object', default: {} },
} as const;

export const store = new Store({ schema, name: 'wm2026-data' });
// Jede Änderung: store.set(`profiles.${id}.tips.${matchId}`, tip) → sofort atomar gespeichert.
```

## 7. UI-Stack: React + Vite + TypeScript + Motion

**Empfehlung: electron-vite (Vite 7) + React 19 + TypeScript + Motion v12 + Tailwind CSS 4 (optional).**

- **React + Vite + TS** via [`electron-vite`](https://electron-vite.org): HMR im Renderer, vorkonfigurierte Main/Preload/Renderer-Pipelines, ESM. Alternativen (Svelte, Vue, SolidJS) funktionieren genauso gut, aber React hat das größte Ökosystem an Animations-/UI-Bausteinen und Beispielmaterial für Karten-/Sticker-Effekte (3D-Tilt, Holo-Folien-Shader als CSS).
- **Animationen: Motion v12** — Framer Motion wurde 2025 als unabhängiges Projekt in **`motion`** umbenannt (Import: `motion/react`, Website motion.dev). API-kompatibel, React-19-ready, Hardware-beschleunigte Animationen. Perfekt für: `whileHover`-Tilt/Glanz auf Sticker-Karten, `AnimatePresence` für Einkleben-Animationen, Spring-Physik, Layout-Animationen beim Albumblättern.
- **Glossy-Rezeptur (reines CSS, kein Extra-Paket):** `conic-gradient`/`linear-gradient` für Folien-Shine, `backdrop-filter: blur()` für Glas-Panels, `mix-blend-mode: overlay` + animierte `background-position` für den Holo-Sweep, `transform: perspective() rotateX/Y` an Mausposition gekoppelt (Motion `useMotionValue`/`useTransform`).
- **HTTP:** `fetch` direkt; Live-Ergebnis-Polling am besten im Main-Prozess (keine CORS-Beschränkung) und via IPC/`webContents.send` an den Renderer pushen.

---

## 8. Konkrete Build-Konfiguration (lauffähig)

### `package.json` (Auszug)

```json
{
  "name": "wm2026-tippspiel",
  "productName": "WM2026 Tippspiel",
  "version": "1.0.0",
  "type": "module",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "dist:mac": "electron-vite build && electron-builder --mac --arm64",
    "dist:mac:intel": "electron-vite build && electron-builder --mac --x64"
  },
  "dependencies": {
    "electron-store": "^11.0.2",
    "motion": "^12.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "electron": "^37.0.0",
    "electron-builder": "^26.0.0",
    "electron-vite": "^4.0.0",
    "typescript": "^5.6.0",
    "vite": "^7.0.0"
  }
}
```

### `electron-builder.yml`

```yaml
appId: me.lanz.wm2026
productName: WM2026 Tippspiel
directories:
  output: release
files:
  - out/**

mac:
  category: public.app-category.games
  target:
    - target: dmg
      arch: [arm64]        # für Intel-Freunde separat: npm run dist:mac:intel
  identity: "-"            # WICHTIG: Ad-hoc-Signierung. NICHT null (sonst "beschädigt"-Meldung)!
  hardenedRuntime: false   # Pflicht bei Ad-hoc, sonst Startabsturz (Library Validation)
  gatekeeperAssess: false
  notarize: false          # explizit aus, sonst sucht der Build nach Apple-Credentials

dmg:
  title: "WM2026 Tippspiel"
  contents:
    - { x: 130, y: 220 }                                  # App-Icon
    - { x: 410, y: 220, type: link, path: /Applications } # Applications-Link
```

Build: `npm run dist:mac` → `release/WM2026 Tippspiel-1.0.0-arm64.dmg`.

**Hinweise:**
- electron-builder **aktuell halten** (≥ 26.x neueste): behebt den Tahoe-HFS+-DMG-Bug (Issue #9615 / PR #9616). Tritt `hdiutil: attach failed – no mountable file systems` auf → Version prüfen, notfalls übergangsweise `target: zip`.
- arm64 und x64 **getrennt** bauen (zwei .dmg), nicht beide Archs in einem Aufruf — Multi-Arch + ad-hoc ist eine bekannte Fehlerquelle. Universal-Build nur bei Bedarf.
- Verifikation nach dem Build: `codesign -dv "release/mac-arm64/WM2026 Tippspiel.app"` muss `Signature=adhoc` zeigen.
- Selbsttest des Empfänger-Flows: `xattr -w com.apple.quarantine "0083;00000000;Safari;" <App>` setzt das Quarantäne-Flag künstlich.

### Alternative (falls doch Tauri): `tauri.conf.json` (Auszug)

```json
{
  "bundle": {
    "active": true,
    "targets": ["dmg"],
    "macOS": {
      "signingIdentity": "-",
      "minimumSystemVersion": "12.0"
    }
  }
}
```

Build: `npm run tauri build` (benötigt Rust via rustup). Ergebnis in `src-tauri/target/release/bundle/dmg/`.

---

## 9. Anleitung für die Empfänger (zum Mitschicken)

> **WM2026 Tippspiel installieren (macOS 15 Sequoia / macOS 26 Tahoe)**
>
> Die App ist privat gebaut und nicht bei Apple registriert. macOS warnt deshalb beim ersten Start — das ist normal. So geht's:
>
> 1. **Installieren:** `WM2026 Tippspiel.dmg` doppelklicken und das App-Icon in den Ordner **Programme** ziehen. DMG auswerfen.
> 2. **Erster Start:** App in „Programme" doppelklicken. Es erscheint: *„…kann nicht geöffnet werden. Apple konnte nicht überprüfen…"* → auf **„Fertig"** klicken (**nicht** „In den Papierkorb legen"!).
> 3. **Freigeben:** **Systemeinstellungen** öffnen → **Datenschutz & Sicherheit** → ganz **nach unten scrollen**. Dort steht *„‚WM2026 Tippspiel' wurde blockiert…"* → auf **„Dennoch öffnen"** klicken.
> 4. Im nächsten Dialog nochmals **„Dennoch öffnen"** bestätigen und ggf. das **Mac-Passwort** eingeben (macOS 26).
> 5. Fertig — ab jetzt startet die App immer ganz normal per Doppelklick.
>
> **Wichtig:** Rechtsklick → „Öffnen" funktioniert seit macOS 15 **nicht mehr** als Abkürzung. Und: Schritt 3 muss innerhalb von ca. 1 Stunde nach Schritt 2 passieren — sonst einfach Schritt 2 wiederholen.
>
> **Falls** (sollte nicht passieren) die Meldung *„…ist beschädigt und kann nicht geöffnet werden"* erscheint: Terminal öffnen und eingeben:
> `xattr -cr "/Applications/WM2026 Tippspiel.app"` — danach normal starten.

---

## 10. Quellen

**Gatekeeper Sequoia/Tahoe:**
- [iDownloadBlog: macOS Sequoia removes the Control-click method to bypass Gatekeeper](https://www.idownloadblog.com/2024/08/07/apple-macos-sequoia-gatekeeper-change-install-unsigned-apps-mac/)
- [AppleInsider: Apple removes Control-click option for skipping Gatekeeper in macOS Sequoia](https://forums.appleinsider.com/discussion/237235/apple-removes-control-click-option-for-skipping-gatekeeper-in-macos-sequoia)
- [Sweetwater: MacOS Security Warnings and Gatekeeper De-Mystified (Sequoia & Tahoe)](https://www.sweetwater.com/sweetcare/articles/macos-security-warnings-and-gatekeeper-de-mystified/)
- [swissmacuser.ch: Fix macOS Tahoe „App is Damaged and can't be Opened"](https://swissmacuser.ch/fix-macos-tahoe-app-is-damaged-and-cant-be-opened-move-trash/)
- [MacRumors Forum: macOS 15.1 completely removes ability to launch unsigned applications](https://forums.macrumors.com/threads/macos-15-1-completely-removes-ability-to-launch-unsigned-applications.2441792/)
- [MacRumors Forum: Command line to allow app past Gatekeeper (xattr)](https://forums.macrumors.com/threads/command-line-to-allow-app-past-gatekeeper.2459418/)
- [Homebrew Issue #17979: quarantine/ad-hoc auf Apple Silicon](https://github.com/Homebrew/brew/issues/17979)
- [iBoysoft: Allow Apps from Anywhere on macOS Sequoia](https://iboysoft.com/tips/allow-apps-to-run-sequoia.html)

**electron-builder:**
- [electron-builder macOS-Doku (identity, hardenedRuntime, notarize)](https://www.electron.build/docs/mac/)
- [Issue #9615: DMG build fails on macOS 26 Tahoe (HFS+ → APFS-Fix)](https://github.com/electron-userland/electron-builder/issues/9615)
- [Issue #9529: Ad-hoc signing Seiteneffekte (Kamera/Mikrofon)](https://github.com/electron-userland/electron-builder/issues/9529)
- [Issue #5850: arm64-DMG „damaged" bei Cross-Build](https://github.com/electron-userland/electron-builder/issues/5850)

**Tauri v2:**
- [Tauri v2: macOS Code Signing (Ad-hoc, signingIdentity "-")](https://v2.tauri.app/distribute/sign/macos/)
- [Tauri 2.0 Stable Release (Okt. 2024)](https://v2.tauri.app/blog/tauri-20/)
- [Tauri Releases (2.9.x, Stand Ende 2025)](https://github.com/tauri-apps/tauri/releases)
- [Tauri Issue #8763: Ad-hoc code signing ohne Zertifikat](https://github.com/tauri-apps/tauri/issues/8763)

**Persistenz & UI:**
- [electron-store (v11.0.2, atomare Writes, Schema, Migrationen, ESM/Electron ≥30)](https://github.com/sindresorhus/electron-store)
- [Motion (ex Framer Motion), motion.dev](https://motion.dev/)
- [Motion for React Doku](https://motion.dev/docs/react)
- [LogRocket: Creating React animations in Motion (formerly Framer Motion)](https://blog.logrocket.com/creating-react-animations-with-motion/)
- [DEV: better-sqlite3 + Electron (Rebuild-Aufwand)](https://dev.to/arindam1997007/a-step-by-step-guide-to-integrating-better-sqlite3-with-electron-js-app-using-create-react-app-3k16)
- [electron-vite](https://electron-vite.org)
