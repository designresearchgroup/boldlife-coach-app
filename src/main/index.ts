import { app, shell, BrowserWindow, ipcMain, desktopCapturer, session, dialog } from 'electron'
import { join } from 'path'
import { writeFile } from 'fs/promises'

const isDev = !app.isPackaged

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0c0a09',
    title: 'The Bold Life Coach',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('ready-to-show', () => win.show())

  // External links open in the user's browser, never inside the app shell.
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // The coaching room needs camera, microphone and screen capture. Grant those
  // three; deny everything else by default.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    const allowed = ['media', 'display-capture', 'mediaKeySystem']
    callback(allowed.includes(permission))
  })

  // Return the available screens/windows so the renderer can offer a picker for
  // screen sharing. Thumbnails are small data URLs for a preview grid.
  ipcMain.handle('screen:getSources', async () => {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 320, height: 180 }
    })
    return sources.map((s) => ({
      id: s.id,
      name: s.name,
      thumbnail: s.thumbnail.toDataURL()
    }))
  })

  // Save a finished session recording (a WebM blob, passed as an ArrayBuffer)
  // to a location the user chooses. In demo mode this is how a coach keeps a
  // recorded session; the production build will also upload it to storage.
  ipcMain.handle('recording:save', async (_e, data: ArrayBuffer, suggestedName: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: suggestedName,
      filters: [{ name: 'WebM video', extensions: ['webm'] }]
    })
    if (canceled || !filePath) return { saved: false as const }
    await writeFile(filePath, Buffer.from(data))
    return { saved: true as const, filePath }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
