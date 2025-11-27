import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import https from 'node:https'
import http from 'node:http'
import storageService from './storage'
import { settingsService } from './services/settingsService'
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

// 下载图标到本地（优化版本）
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

      // 设置更短的超时时间（3秒）
      const request = protocol.get(iconUrl, { timeout: 3000 }, (response) => {
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

      request.on('timeout', () => {
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

async function createWindow() {
  // 获取设置
  const savedSettings = settingsService.getSettings()

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    autoHideMenuBar: true,
    show: false, // 先不显示，等设置好大小后再显示
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false
    },
  })

  // 根据设置调整窗口大小
  if (savedSettings.homeWindowSize === 'maximized') {
    win.maximize()
  } else if (savedSettings.homeWindowSize === 'fullscreen') {
    win.setFullScreen(true)
  }

  // 显示窗口
  win.show()

  // 设置快捷键
  win.webContents.on('before-input-event', (event, input) => {
    // 阻止Alt键显示菜单栏
    if (input.key === 'Alt') {
      event.preventDefault()
      return
    }

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
async function createChildWindow(url: string, windowId: string, windowMode: 'normal' | 'maximized' | 'fullscreen' | boolean = 'maximized', websiteName?: string, websiteIcon?: string) {
  // 兼容旧的 boolean 类型（fullscreen 参数）
  let mode: 'normal' | 'maximized' | 'fullscreen'
  if (typeof windowMode === 'boolean') {
    mode = windowMode ? 'fullscreen' : 'maximized'
  } else {
    mode = windowMode
  }
  
  // 设置窗口图标
  let windowIcon = path.join(process.env.VITE_PUBLIC || __dirname, 'electron-vite.svg')

  // 如果有网站图标，尝试下载并使用
  if (websiteIcon) {
    try {
      const iconPath = await downloadIcon(websiteIcon, `window_${windowId}`)
      if (iconPath && fs.existsSync(iconPath)) {
        windowIcon = iconPath
      }
    } catch (error) {
      console.log('下载网站图标失败，使用默认图标')
    }
  }

  const childWin = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false, // 先不显示，等设置好大小后再显示
    fullscreen: mode === 'fullscreen',
    autoHideMenuBar: true,
    icon: windowIcon,
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

  // 加载包含功能栏的HTML页面
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${websiteName || 'WebTools'}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
          }
          .toolbar {
            height: 42px;
            background: #f0f2f5;
            border-bottom: 1px solid #d9d9d9;
            display: flex;
            align-items: center;
            padding: 0 12px;
            gap: 12px;
            flex-shrink: 0;
          }
          .toolbar-section {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .toolbar-section-1 {
            flex: 1;
            min-width: 0;
          }
          .toolbar-section-2 {
            flex: 2;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .toolbar-section-3 {
            flex: 1;
            justify-content: flex-end;
          }
          .custom-buttons {
            display: flex;
            gap: 6px;
            overflow-x: auto;
            flex-wrap: nowrap;
            padding: 4px 0;
          }
          /* Ant Design Vue 按钮样式 */
          .ant-btn {
            position: relative;
            display: inline-block;
            font-weight: 400;
            white-space: nowrap;
            text-align: center;
            background-image: none;
            border: 1px solid transparent;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
            user-select: none;
            touch-action: manipulation;
            height: 32px;
            padding: 4px 15px;
            font-size: 14px;
            border-radius: 6px;
            outline: 0;
            line-height: 1.5714285714285714;
            box-shadow: 0 2px 0 rgba(0, 0, 0, 0.015);
          }
          .ant-btn:hover, .ant-btn:focus {
            color: #40a9ff;
            border-color: #40a9ff;
          }
          .ant-btn:active {
            color: #096dd9;
            border-color: #096dd9;
          }
          /* 主要按钮 */
          .ant-btn-primary {
            color: #fff;
            background: #1890ff;
            border-color: #1890ff;
            text-shadow: 0 -1px 0 rgba(0,0,0,0.12);
            box-shadow: 0 2px #0000000b;
          }
          .ant-btn-primary:hover, .ant-btn-primary:focus {
            color: #fff;
            background: #40a9ff;
            border-color: #40a9ff;
          }
          .ant-btn-primary:active {
            color: #fff;
            background: #096dd9;
            border-color: #096dd9;
          }
          /* 成功按钮 */
          .ant-btn-success {
            color: #fff;
            background: #52c41a;
            border-color: #52c41a;
            text-shadow: 0 -1px 0 rgba(0,0,0,0.12);
            box-shadow: 0 2px #0000000b;
          }
          .ant-btn-success:hover, .ant-btn-success:focus {
            color: #fff;
            background: #73d13d;
            border-color: #73d13d;
          }
          .ant-btn-success:active {
            color: #fff;
            background: #389e0d;
            border-color: #389e0d;
          }
          /* 默认按钮 */
          .ant-btn-default {
            color: rgba(0, 0, 0, 0.88);
            background: #ffffff;
            border-color: #d9d9d9;
          }
          .ant-btn-default:hover, .ant-btn-default:focus {
            color: #40a9ff;
            border-color: #40a9ff;
          }
          .ant-btn-default:active {
            color: #096dd9;
            border-color: #096dd9;
          }
          /* 自定义按钮样式 */
          .custom-button {
            composes: ant-btn ant-btn-primary;
            font-size: 12px;
            padding: 2px 8px;
            height: 24px;
            line-height: 1.2;
          }
          .add-button {
            composes: ant-btn ant-btn-success;
            font-size: 12px;
            padding: 2px 8px;
            height: 24px;
            line-height: 1.2;
          }
          .tool-button {
            composes: ant-btn ant-btn-default;
            font-size: 12px;
            padding: 2px 8px;
            height: 24px;
            line-height: 1.2;
          }
          /* 导航按钮样式 */
          .url-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: white;
            border: 1px solid #d9d9d9;
            border-radius: 6px;
            padding: 0;
            min-height: 32px;
            overflow: hidden;
          }
          .url-display {
            flex: 1;
            padding: 6px 10px;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.88);
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            text-align: left;
          }
          .nav-buttons {
            display: flex;
            gap: 0;
            border-left: 1px solid #d9d9d9;
          }
          .nav-button {
            width: 32px;
            height: 32px;
            border: none;
            background: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
          }
          .nav-button:hover {
            background: #f5f5f5;
          }
          .nav-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .tool-buttons {
            display: flex;
            gap: 6px;
          }
          .webview-container {
            flex: 1;
            position: relative;
            overflow: hidden;
          }
          webview {
            width: 100%;
            height: 100%;
            border: none;
          }
          .app-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
          }
        </style>
      </head>
      <body>
        <div class="app-container">
          <div class="toolbar">
            <div class="toolbar-section toolbar-section-1">
              <div class="custom-buttons" id="customButtons">
                <!-- 自定义按钮将在这里动态生成 -->
              </div>
              <button class="ant-btn ant-btn-success" id="addBtn" title="添加自定义按钮" style="font-size: 12px; padding: 2px 8px; height: 24px;">+ 增加</button>
            </div>
            <div class="toolbar-section toolbar-section-2">
              <div class="url-container">
                <div class="url-display" id="urlDisplay" title="${url}">${url}</div>
                <div class="nav-buttons">
                  <button class="nav-button" id="backBtn" title="上一页">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <button class="nav-button" id="homeBtn" title="主页">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </button>
                  <button class="nav-button" id="forwardBtn" title="下一页">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="toolbar-section toolbar-section-3">
              <div class="tool-buttons">
                <button class="ant-btn ant-btn-default" id="refreshBtn" title="刷新" style="font-size: 12px; padding: 2px 8px; height: 24px;">刷新</button>
                <button class="ant-btn ant-btn-default" id="switchBtn" title="切换" style="font-size: 12px; padding: 2px 8px; height: 24px;">切换</button>
              </div>
            </div>
          </div>
          <div class="webview-container">
            <webview id="webview" src="${url}" nodeintegration="false" contextIsolation="true" webpreferences="contextIsolation=true,nodeIntegration=false"></webview>
          </div>
        </div>
        <script>
          const webview = document.getElementById('webview');
          const backBtn = document.getElementById('backBtn');
          const forwardBtn = document.getElementById('forwardBtn');
          const homeBtn = document.getElementById('homeBtn');
          const refreshBtn = document.getElementById('refreshBtn');
          const switchBtn = document.getElementById('switchBtn');
          const addBtn = document.getElementById('addBtn');
          const urlDisplay = document.getElementById('urlDisplay');

          // 导航功能
          backBtn.addEventListener('click', () => {
            if (webview.canGoBack()) {
              webview.goBack();
            }
          });

          forwardBtn.addEventListener('click', () => {
            if (webview.canGoForward()) {
              webview.goForward();
            }
          });

          homeBtn.addEventListener('click', () => {
            webview.src = '${url}';
          });

          // 刷新功能
          refreshBtn.addEventListener('click', () => {
            webview.reload();
          });

          // 切换功能（预留）
          switchBtn.addEventListener('click', () => {
            alert('切换功能开发中...');
          });

          // 增加按钮功能
          addBtn.addEventListener('click', () => {
            window.parent.postMessage({
              type: 'openAddCustomButton',
              url: webview.src,
              name: ''
            }, '*');
          });

          // 更新URL显示和按钮状态
          webview.addEventListener('dom-ready', () => {
            urlDisplay.textContent = webview.src;
            urlDisplay.title = webview.src;
            backBtn.disabled = !webview.canGoBack();
            forwardBtn.disabled = !webview.canGoForward();
          });

          webview.addEventListener('did-navigate', () => {
            urlDisplay.textContent = webview.src;
            urlDisplay.title = webview.src;
            backBtn.disabled = !webview.canGoBack();
            forwardBtn.disabled = !webview.canGoForward();
          });

          // 监听来自父窗口的消息
          window.addEventListener('message', (event) => {
            if (event.data.type === 'updateCustomButtons') {
              updateCustomButtons(event.data.buttons);
            } else if (event.data.type === 'navigateToUrl') {
              webview.src = event.data.url;
            }
          });

          // 更新自定义按钮
          function updateCustomButtons(buttons) {
            const container = document.getElementById('customButtons');
            container.innerHTML = '';

            if (buttons && buttons.length > 0) {
              buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.className = 'ant-btn ant-btn-primary';
                btn.textContent = button.name;
                btn.title = button.name;
                btn.style.cssText = 'font-size: 12px; padding: 2px 8px; height: 24px;';
                btn.addEventListener('click', () => {
                  if (button.openMode === 'currentPage') {
                    webview.src = button.url;
                  } else {
                    // 新窗口打开
                    window.parent.postMessage({
                      type: 'openNewWindow',
                      url: button.url,
                      name: button.name
                    }, '*');
                  }
                });
                container.appendChild(btn);
              });
            }

            // 如果没有自定义按钮，显示增加按钮
            if (!buttons || buttons.length === 0) {
              addBtn.style.display = 'inline-block';
            } else {
              addBtn.style.display = 'none';
            }
          }

          // 初始化时向父窗口请求自定义按钮数据
          window.parent.postMessage({ type: 'requestCustomButtons' }, '*');
        </script>
      </body>
    </html>
  `

  childWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent))

  // 设置窗口标题
  if (websiteName) {
    childWin.setTitle(websiteName)
  }

  // 监听来自功能栏的消息
  childWin.webContents.on('dom-ready', () => {
    // 向功能栏发送自定义按钮数据
    const websiteData = storageService.getWebsites().find(w => w.url === url)
    if (websiteData && websiteData.customButtons) {
      childWin.webContents.executeJavaScript(`
        window.postMessage({
          type: 'updateCustomButtons',
          buttons: ${JSON.stringify(websiteData.customButtons)}
        }, '*');
      `)
    }
  })

  childWin.webContents.on('ipc-message', (event, channel, ...args) => {
    if (channel === 'requestCustomButtons') {
      const websiteData = storageService.getWebsites().find(w => w.url === url)
      if (websiteData && websiteData.customButtons) {
        event.sender.send('updateCustomButtons', websiteData.customButtons)
      }
    } else if (channel === 'openNewWindow') {
      const [url, name] = args
      createChildWindow(url, Date.now().toString(), 'maximized', name)
    }
  })

  // 监听来自功能栏的消息（通过executeJavaScript）
  childWin.webContents.on('dom-ready', () => {
    // 设置消息监听器
    childWin.webContents.executeJavaScript(`
      window.addEventListener('message', (event) => {
        if (event.data.type === 'openAddCustomButton') {
          // 向主进程发送添加自定义按钮的请求
          require('electron').ipcRenderer.send('open-add-custom-button', {
            url: event.data.url,
            name: event.data.name
          });
        }
      });
    `)
  })

  childWindows.set(windowId, childWin)

  childWin.on('closed', () => {
    childWindows.delete(windowId)
  })

  // 处理页面标题更新
  childWin.webContents.on('page-title-updated', (event, title) => {
    // 如果webview中的页面标题更新，更新窗口标题
    if (websiteName) {
      event.preventDefault()
      childWin.setTitle(websiteName)
    } else {
      childWin.setTitle(title)
    }
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
  ipcMain.handle('create-window', async (_event, url, windowMode: 'normal' | 'maximized' | 'fullscreen' | boolean = 'maximized', websiteName?: string, websiteIcon?: string) => {
    const windowId = Date.now().toString()
    await createChildWindow(url, windowId, windowMode, websiteName, websiteIcon)
    return windowId
  })

  // 导航到指定 URL
  ipcMain.handle('navigate-to-url', (_event, windowId, url) => {
    const childWin = childWindows.get(windowId)
    if (childWin) {
      childWin.webContents.loadURL(url)
    }
  })

  // 添加到桌面（优化版本）
  ipcMain.handle('add-to-desktop', async (_event, websiteData) => {
    try {
      const desktopPath = app.getPath('desktop')
      const shortcutPath = path.join(desktopPath, `${websiteData.name}.lnk`)

      // 获取当前应用程序的路径
      const exePath = process.execPath

      // 图标获取策略优化
      let iconPath = exePath

      // 1. 首先尝试使用网站的favicon.ico
      if (websiteData.icon && websiteData.icon.includes('favicon.ico')) {
        try {
          const faviconPath = await downloadIcon(websiteData.icon, websiteData.id || Date.now().toString())
          if (faviconPath) {
            iconPath = faviconPath
          }
        } catch (err) {
          console.log('favicon.ico下载失败，尝试备用方案')
        }
      }

      // 2. 如果favicon失败，尝试从网站根目录获取
      if (iconPath === exePath && websiteData.url) {
        try {
          const urlObj = new URL(websiteData.url)
          const rootFaviconUrl = `${urlObj.origin}/favicon.ico`
          const rootFaviconPath = await downloadIcon(rootFaviconUrl, `root_${websiteData.id || Date.now().toString()}`)
          if (rootFaviconPath) {
            iconPath = rootFaviconPath
          }
        } catch (err) {
          console.log('根目录favicon获取失败')
        }
      }

      // 3. 如果都失败，使用应用图标，但确保图标存在
      if (iconPath === exePath) {
        const appIconPath = path.join(process.env.VITE_PUBLIC || __dirname, 'icon.ico')
        if (fs.existsSync(appIconPath)) {
          iconPath = appIconPath
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
        return { success: true, iconPath: iconPath }
      } else {
        throw new Error('创建快捷方式失败')
      }
    } catch (error) {
      console.error('添加到桌面失败:', error)
      throw error
    }
  })

  // 获取设置
  ipcMain.handle('get-settings', () => {
    return settingsService.getSettings()
  })

  // 保存设置
  ipcMain.handle('save-settings', (_event, settings) => {
    const updatedSettings = settingsService.updateSettings(settings)

    // 设置开机启动
    if (settings.autoStart !== undefined) {
      settingsService.setAutoStart(settings.autoStart).catch(console.error)
    }

    return updatedSettings
  })

  // 获取开机启动状态
  ipcMain.handle('get-auto-start-status', () => {
    return settingsService.getAutoStartStatus()
  })

  // 处理添加自定义按钮请求
  ipcMain.on('open-add-custom-button', (event, data) => {
    // 查找当前网站
    const websites = storageService.getWebsites()
    const currentWebsite = websites.find(w => event.sender.getURL().includes(w.url))

    if (currentWebsite) {
      // 打开自定义按钮编辑窗口（这里简化处理，实际应该打开编辑窗口）
      const newButton = {
        id: Date.now().toString(),
        name: '新按钮',
        url: data.url,
        openMode: 'currentPage' as const
      }

      // 添加到网站的自定义按钮列表
      if (!currentWebsite.customButtons) {
        currentWebsite.customButtons = []
      }
      currentWebsite.customButtons.push(newButton)

      // 保存更新
      storageService.updateWebsite(currentWebsite.id, currentWebsite)

      // 通知窗口更新按钮
      event.sender.executeJavaScript(`
        window.postMessage({
          type: 'updateCustomButtons',
          buttons: ${JSON.stringify(currentWebsite.customButtons)}
        }, '*');
      `)
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
    createWindow().catch(console.error)
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
    createChildWindow(url, windowId, 'maximized', websiteName).catch(console.error)
  } else {
    // 正常启动，打开主窗口
    createWindow().catch(console.error)
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
    createChildWindow(url, windowId, 'maximized', websiteName).catch(console.error)
  } else if (win) {
    // 如果是正常启动，聘焦主窗口
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})
