import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import storageService from './storage'
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
      if (win?.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools()
      } else {
        win?.webContents.openDevTools()
      }
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
function createChildWindow(url: string, windowId: string, fullscreen: boolean = false) {
  const childWin = new BrowserWindow({
    width: 1000,
    height: 700,
    fullscreen: fullscreen,
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
      if (childWin.webContents.isDevToolsOpened()) {
        childWin.webContents.closeDevTools()
      } else {
        childWin.webContents.openDevTools()
      }
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

  // 等待页面加载后更新标题
  childWin.webContents.on('page-title-updated', () => {
    // 不阻止默认行为，让窗口显示网页自己的 title
  })

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
  ipcMain.handle('create-window', (_event, url, fullscreen = false) => {
    const windowId = Date.now().toString()
    createChildWindow(url, windowId, fullscreen)
    return windowId
  })

  // 导航到指定 URL
  ipcMain.handle('navigate-to-url', (_event, windowId, url) => {
    const childWin = childWindows.get(windowId)
    if (childWin) {
      childWin.webContents.loadURL(url)
    }
  })

  // 添加到桌面
  ipcMain.handle('add-to-desktop', async (_event, website) => {
    try {
      const desktopPath = app.getPath('desktop')
      const shortcutPath = path.join(desktopPath, `${website.name}.lnk`)
      
      // 获取当前应用程序的路径
      const exePath = process.execPath
      
      // 创建快捷方式
      const success = shell.writeShortcutLink(shortcutPath, {
        target: exePath,
        args: `--website-url="${website.url}"`,
        description: website.name,
        icon: website.icon || exePath,
        iconIndex: 0
      })
      
      if (success) {
        return { success: true }
      } else {
        throw new Error('创建快捷方式失败')
      }
    } catch (error) {
      console.error('添加到桌面失败:', error)
      throw error
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
