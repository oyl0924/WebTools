import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import https from 'node:https'
import http from 'node:http'
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

// 获取图标存储目录
function getIconsDir() {
  const iconsDir = path.join(app.getPath('userData'), 'icons')
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }
  return iconsDir
}

// 下载图标到本地
async function downloadIcon(iconUrl: string, websiteId: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const iconsDir = getIconsDir()
      const ext = path.extname(new URL(iconUrl).pathname) || '.ico'
      const iconPath = path.join(iconsDir, `${websiteId}${ext}`)
      
      // 如果图标已存在，直接返回
      if (fs.existsSync(iconPath)) {
        resolve(iconPath)
        return
      }
      
      const file = fs.createWriteStream(iconPath)
      const protocol = iconUrl.startsWith('https') ? https : http
      
      const request = protocol.get(iconUrl, (response) => {
        // 处理重定向
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            file.close()
            fs.unlinkSync(iconPath)
            downloadIcon(redirectUrl, websiteId).then(resolve)
            return
          }
        }
        
        if (response.statusCode !== 200) {
          file.close()
          fs.unlinkSync(iconPath)
          resolve(null)
          return
        }
        
        response.pipe(file)
        
        file.on('finish', () => {
          file.close()
          resolve(iconPath)
        })
      })
      
      request.on('error', () => {
        file.close()
        if (fs.existsSync(iconPath)) {
          fs.unlinkSync(iconPath)
        }
        resolve(null)
      })
      
      request.setTimeout(10000, () => {
        request.destroy()
        file.close()
        if (fs.existsSync(iconPath)) {
          fs.unlinkSync(iconPath)
        }
        resolve(null)
      })
    } catch (error) {
      console.error('下载图标失败:', error)
      resolve(null)
    }
  })
}

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
function createChildWindow(url: string, windowId: string, windowMode: 'normal' | 'maximized' | 'fullscreen' | boolean = 'maximized', websiteName?: string) {
  // 兼容旧的 boolean 类型（fullscreen 参数）
  let mode: 'normal' | 'maximized' | 'fullscreen'
  if (typeof windowMode === 'boolean') {
    mode = windowMode ? 'fullscreen' : 'maximized'
  } else {
    mode = windowMode
  }
  
  const childWin = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false, // 先不显示，等设置好大小后再显示
    fullscreen: mode === 'fullscreen',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false
    },
  })

  // 根据窗口模式设置窗口状态
  if (mode === 'maximized') {
    childWin.maximize()
  } else if (mode === 'normal') {
    // 正常模式不做特殊处理，使用默认大小
  }
  // fullscreen 已经在 BrowserWindow 配置中设置
  
  // 窗口准备好后再显示，避免闪烁
  childWin.once('ready-to-show', () => {
    childWin.show()
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

  // 直接加载网站 URL，不通过 webview，提高性能
  childWin.loadURL(url)

  // 设置窗口标题
  if (websiteName) {
    childWin.setTitle(websiteName)
  }

  // 等待页面加载后更新标题
  childWin.webContents.on('page-title-updated', (event) => {
    // 如果有网站名称，阻止默认行为，使用自定义名称
    if (websiteName) {
      event.preventDefault()
      childWin.setTitle(websiteName)
    }
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
  ipcMain.handle('create-window', (_event, url, windowMode: 'normal' | 'maximized' | 'fullscreen' | boolean = 'maximized', websiteName?: string) => {
    const windowId = Date.now().toString()
    createChildWindow(url, windowId, windowMode, websiteName)
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
  ipcMain.handle('add-to-desktop', async (_event, websiteData) => {
    try {
      const desktopPath = app.getPath('desktop')
      const shortcutPath = path.join(desktopPath, `${websiteData.name}.lnk`)
      
      // 获取当前应用程序的路径
      const exePath = process.execPath
      
      // 尝试下载网站图标
      let iconPath = exePath
      if (websiteData.icon) {
        const downloadedIcon = await downloadIcon(websiteData.icon, websiteData.id || Date.now().toString())
        if (downloadedIcon) {
          iconPath = downloadedIcon
        }
      }
      
      // 创建快捷方式，传递 URL 和网站名称
      const success = shell.writeShortcutLink(shortcutPath, {
        target: exePath,
        args: `--website-url="${websiteData.url}" --website-name="${websiteData.name}"`,
        description: websiteData.name,
        icon: iconPath,
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
  
  // 检查命令行参数，看是否是从桌面快捷方式启动
  const websiteUrlArg = process.argv.find(arg => arg.startsWith('--website-url='))
  const websiteNameArg = process.argv.find(arg => arg.startsWith('--website-name='))
  
  if (websiteUrlArg) {
    // 从快捷方式启动，直接打开网站，不创建主窗口
    const url = websiteUrlArg.split('=')[1].replace(/"/g, '')
    const websiteName = websiteNameArg ? websiteNameArg.split('=')[1].replace(/"/g, '') : undefined
    const windowId = Date.now().toString()
    createChildWindow(url, windowId, 'maximized', websiteName)
  } else {
    // 正常启动，打开主窗口
    createWindow()
  }
})

// 处理第二个实例启动（支持多个桌面图标同时打开）
app.on('second-instance', (_event, commandLine) => {
  // 检查第二个实例的命令行参数
  const websiteUrlArg = commandLine.find(arg => arg.startsWith('--website-url='))
  const websiteNameArg = commandLine.find(arg => arg.startsWith('--website-name='))
  
  if (websiteUrlArg) {
    // 打开新的网站窗口
    const url = websiteUrlArg.split('=')[1].replace(/"/g, '')
    const websiteName = websiteNameArg ? websiteNameArg.split('=')[1].replace(/"/g, '') : undefined
    const windowId = Date.now().toString()
    createChildWindow(url, windowId, 'maximized', websiteName)
  } else if (win) {
    // 如果是正常启动，聘焦主窗口
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})
