// App-Icon bauen: build/icon.html mit Chromium rendern (1024×1024, Alpha),
// dann per sips/iconutil das macOS-Iconset → build/icon.icns generieren.
// Aufruf: npm run icon   (electron-builder zieht build/icon.icns automatisch)
import { execSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow } from 'electron'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const buildDir = join(root, 'build')

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 1024,
    show: false,
    frame: false,
    transparent: true,
    webPreferences: { offscreen: true }
  })
  await win.loadFile(join(buildDir, 'icon.html'))
  await new Promise((r) => setTimeout(r, 1200)) // Font + Emoji fertig laden

  const png = join(buildDir, 'icon-1024.png')
  writeFileSync(png, (await win.webContents.capturePage()).toPNG())
  console.log('gerendert:', png)

  const iconset = join(buildDir, 'icon.iconset')
  rmSync(iconset, { recursive: true, force: true })
  mkdirSync(iconset)
  const sizes = [
    [16, 'icon_16x16.png'],
    [32, 'icon_16x16@2x.png'],
    [32, 'icon_32x32.png'],
    [64, 'icon_32x32@2x.png'],
    [128, 'icon_128x128.png'],
    [256, 'icon_128x128@2x.png'],
    [256, 'icon_256x256.png'],
    [512, 'icon_256x256@2x.png'],
    [512, 'icon_512x512.png'],
    [1024, 'icon_512x512@2x.png']
  ]
  for (const [size, name] of sizes) {
    execSync(`sips -z ${size} ${size} '${png}' --out '${join(iconset, name)}'`, { stdio: 'ignore' })
  }
  execSync(`iconutil -c icns '${iconset}' -o '${join(buildDir, 'icon.icns')}'`)
  console.log('geschrieben:', join(buildDir, 'icon.icns'))
  app.quit()
})
