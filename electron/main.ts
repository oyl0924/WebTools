import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import storageService from './storage'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
const childWindows: Map<string, BrowserWindow> = new Map()

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false
    },
  })

  // 设置快捷键
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      win?.webContents.toggleDevTools()
      event.preventDefault()
    } else if (input.key === 'F5') {
      win?.webContents.reload()
      event.preventDefault()
    }
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// 创建子窗口
function createChildWindow(url: string, windowId: string) {
  const childWin = new BrowserWindow({
    width: 1000,
    height: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false
    },
  })

  // 设置快捷键
  childWin.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      childWin.webContents.toggleDevTools()
      event.preventDefault()
    } else if (input.key === 'F5') {
      childWin.webContents.reload()
      event.preventDefault()
    }
  })

  if (VITE_DEV_SERVER_URL) {
    childWin.loadURL(`${VITE_DEV_SERVER_URL}#/webview?url=${encodeURIComponent(url)}`)
  } else {
    childWin.loadFile(path.join(RENDERER_DIST, 'index.html'), {
      hash: `/webview?url=${encodeURIComponent(url)}`
    })
  }

  childWindows.set(windowId, childWin)

  childWin.on('closed', () => {
    childWindows.delete(windowId)
  })

  return childWin
}

// IPC 通信处理
function setupIpcHandlers() {
  // 获取所有网站
  ipcMain.handle('get-websites', () => {
    return storageService.getWebsites()
  })

  // 添加网站
  ipcMain.handle('add-website', (_event, website) => {
    return storageService.addWebsite(website)
  })

  // 更新网站
  ipcMain.handle('update-website', (_event, id, updates) => {
    return storageService.updateWebsite(id, updates)
  })

  // 删除网站
  ipcMain.handle('delete-website', (_event, id) => {
    return storageService.deleteWebsite(id)
  })

  // 添加自定义按钮
  ipcMain.handle('add-custom-button', (_event, websiteId, button) => {
    return storageService.addCustomButton(websiteId, button)
  })

  // 更新自定义按钮
  ipcMain.handle('update-custom-button', (_event, websiteId, buttonId, updates) => {
    return storageService.updateCustomButton(websiteId, buttonId, updates)
  })

  // 删除自定义按钮
  ipcMain.handle('delete-custom-button', (_event, websiteId, buttonId) => {
    return storageService.deleteCustomButton(websiteId, buttonId)
  })

  // 创建新窗口
  ipcMain.handle('create-window', (_event, url) => {
    const windowId = Date.now().toString()
    createChildWindow(url, windowId)
    return windowId
  })

  // 导航到指定 URL
  ipcMain.handle('navigate-to-url', (_event, windowId, url) => {
    const childWin = childWindows.get(windowId)
    if (childWin) {
      childWin.webContents.loadURL(url)
    }
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  setupIpcHandlers()
  createWindow()
})
