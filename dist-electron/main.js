var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { fileURLToPath } from "node:url";
import path$1 from "node:path";
import fs$1 from "node:fs";
import https from "node:https";
import http from "node:http";
import fs from "fs";
import path from "path";
const STORAGE_FILE = "websites.json";
class StorageService {
  constructor() {
    __publicField(this, "storagePath");
    this.storagePath = path.join(app.getPath("userData"), STORAGE_FILE);
    this.initStorage();
  }
  initStorage() {
    if (!fs.existsSync(this.storagePath)) {
      this.saveData([]);
    }
  }
  loadData() {
    try {
      const data = fs.readFileSync(this.storagePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading data:", error);
      return [];
    }
  }
  saveData(websites) {
    try {
      fs.writeFileSync(this.storagePath, JSON.stringify(websites, null, 2), "utf-8");
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }
  getWebsites() {
    return this.loadData();
  }
  addWebsite(website) {
    const websites = this.loadData();
    const newWebsite = {
      ...website,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      customButtons: website.customButtons || []
    };
    websites.push(newWebsite);
    this.saveData(websites);
    return newWebsite;
  }
  updateWebsite(id, updates) {
    const websites = this.loadData();
    const index = websites.findIndex((w) => w.id === id);
    if (index === -1) return null;
    websites[index] = { ...websites[index], ...updates };
    this.saveData(websites);
    return websites[index];
  }
  deleteWebsite(id) {
    const websites = this.loadData();
    const index = websites.findIndex((w) => w.id === id);
    if (index === -1) return false;
    websites.splice(index, 1);
    this.saveData(websites);
    return true;
  }
  addCustomButton(websiteId, button) {
    const websites = this.loadData();
    const website = websites.find((w) => w.id === websiteId);
    if (!website) return null;
    const newButton = {
      ...button,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    website.customButtons.push(newButton);
    this.saveData(websites);
    return newButton;
  }
  updateCustomButton(websiteId, buttonId, updates) {
    const websites = this.loadData();
    const website = websites.find((w) => w.id === websiteId);
    if (!website) return null;
    const buttonIndex = website.customButtons.findIndex((b) => b.id === buttonId);
    if (buttonIndex === -1) return null;
    website.customButtons[buttonIndex] = { ...website.customButtons[buttonIndex], ...updates };
    this.saveData(websites);
    return website.customButtons[buttonIndex];
  }
  deleteCustomButton(websiteId, buttonId) {
    const websites = this.loadData();
    const website = websites.find((w) => w.id === websiteId);
    if (!website) return false;
    const buttonIndex = website.customButtons.findIndex((b) => b.id === buttonId);
    if (buttonIndex === -1) return false;
    website.customButtons.splice(buttonIndex, 1);
    this.saveData(websites);
    return true;
  }
}
const storageService = new StorageService();
const DEFAULT_SETTINGS = {
  darkMode: "manual",
  darkModeTimeStart: "18:00",
  darkModeTimeEnd: "06:00",
  isDarkMode: false,
  homeWindowSize: "maximized",
  autoStart: false,
  backgroundType: "default",
  backgroundColor: "#f0f2f5",
  backgroundImage: ""
};
class SettingsService {
  constructor() {
    __publicField(this, "settingsPath");
    __publicField(this, "settings");
    this.settingsPath = path.join(app.getPath("userData"), "settings.json");
    this.settings = this.loadSettings();
  }
  loadSettings() {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, "utf-8");
        const parsed = JSON.parse(data);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error("加载设置失败:", error);
    }
    return { ...DEFAULT_SETTINGS };
  }
  saveSettings() {
    try {
      const data = JSON.stringify(this.settings, null, 2);
      fs.writeFileSync(this.settingsPath, data, "utf-8");
    } catch (error) {
      console.error("保存设置失败:", error);
    }
  }
  getSettings() {
    return { ...this.settings };
  }
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    return this.settings;
  }
  // 检测是否应该使用黑暗模式
  shouldUseDarkMode() {
    const { darkMode, darkModeTimeStart, darkModeTimeEnd, isDarkMode } = this.settings;
    if (darkMode === "manual") {
      return isDarkMode;
    } else if (darkMode === "system") {
      return false;
    } else if (darkMode === "time") {
      const now = /* @__PURE__ */ new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = darkModeTimeStart.split(":").map(Number);
      const [endHour, endMin] = darkModeTimeEnd.split(":").map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      if (startTime <= endTime) {
        return currentTime >= startTime && currentTime <= endTime;
      } else {
        return currentTime >= startTime || currentTime <= endTime;
      }
    }
    return false;
  }
  // 设置开机启动
  async setAutoStart(enabled) {
    try {
      const { app: app2 } = await import("electron");
      app2.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: false,
        path: app2.getPath("exe"),
        args: enabled ? [] : ["--disable-auto-start"]
      });
      this.updateSettings({ autoStart: enabled });
      console.log(`开机启动设置已${enabled ? "启用" : "禁用"}`);
    } catch (error) {
      console.error("设置开机启动失败:", error);
      throw error;
    }
  }
  // 获取开机启动状态
  getAutoStartStatus() {
    try {
      const { app: app2 } = require("electron");
      const loginSettings = app2.getLoginItemSettings();
      const isEnabled = loginSettings.openAtLogin || (loginSettings.executableWillLaunchAtLogin ?? false) || loginSettings.launchItems && loginSettings.launchItems.length > 0;
      console.log(`获取开机启动状态: ${isEnabled ? "启用" : "禁用"}`, loginSettings);
      return isEnabled;
    } catch (error) {
      console.error("获取开机启动状态失败:", error);
      return false;
    }
  }
}
const settingsService = new SettingsService();
const __dirname$1 = path$1.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path$1.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
const childWindows = /* @__PURE__ */ new Map();
function getIconsDir() {
  const iconsDir = path$1.join(app.getPath("userData"), "icons");
  if (!fs$1.existsSync(iconsDir)) {
    fs$1.mkdirSync(iconsDir, { recursive: true });
  }
  return iconsDir;
}
async function downloadIcon(iconUrl, websiteId) {
  return new Promise((resolve) => {
    try {
      const iconsDir = getIconsDir();
      const ext = path$1.extname(new URL(iconUrl).pathname) || ".ico";
      const iconPath = path$1.join(iconsDir, `${websiteId}${ext}`);
      if (fs$1.existsSync(iconPath)) {
        resolve(iconPath);
        return;
      }
      const file = fs$1.createWriteStream(iconPath);
      const protocol = iconUrl.startsWith("https") ? https : http;
      const request = protocol.get(iconUrl, { timeout: 3e3 }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            fs$1.unlinkSync(iconPath);
            downloadIcon(redirectUrl, websiteId).then(resolve);
            return;
          }
        }
        if (response.statusCode !== 200) {
          file.close();
          fs$1.unlinkSync(iconPath);
          resolve(null);
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(iconPath);
        });
      });
      request.on("error", () => {
        file.close();
        if (fs$1.existsSync(iconPath)) {
          fs$1.unlinkSync(iconPath);
        }
        resolve(null);
      });
      request.on("timeout", () => {
        request.destroy();
        file.close();
        if (fs$1.existsSync(iconPath)) {
          fs$1.unlinkSync(iconPath);
        }
        resolve(null);
      });
    } catch (error) {
      console.error("下载图标失败:", error);
      resolve(null);
    }
  });
}
async function createWindow() {
  const savedSettings = settingsService.getSettings();
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path$1.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    autoHideMenuBar: true,
    show: false,
    // 先不显示，等设置好大小后再显示
    webPreferences: {
      preload: path$1.join(__dirname$1, "preload.mjs"),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (savedSettings.homeWindowSize === "maximized") {
    win.maximize();
  } else if (savedSettings.homeWindowSize === "fullscreen") {
    win.setFullScreen(true);
  }
  win.show();
  win.webContents.on("before-input-event", (event, input) => {
    if (input.key === "Alt") {
      event.preventDefault();
      return;
    }
    if (input.key === "F12") {
      if (win == null ? void 0 : win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools();
      } else {
        win == null ? void 0 : win.webContents.openDevTools();
      }
      event.preventDefault();
    } else if (input.key === "F5") {
      win == null ? void 0 : win.webContents.reload();
      event.preventDefault();
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$1.join(RENDERER_DIST, "index.html"));
  }
}
async function createChildWindow(url, windowId, windowMode = "maximized", websiteName, websiteIcon) {
  let mode;
  if (typeof windowMode === "boolean") {
    mode = windowMode ? "fullscreen" : "maximized";
  } else {
    mode = windowMode;
  }
  let windowIcon = path$1.join(process.env.VITE_PUBLIC || __dirname$1, "electron-vite.svg");
  if (websiteIcon) {
    try {
      const iconPath = await downloadIcon(websiteIcon, `window_${windowId}`);
      if (iconPath && fs$1.existsSync(iconPath)) {
        windowIcon = iconPath;
      }
    } catch (error) {
      console.log("下载网站图标失败，使用默认图标");
    }
  }
  const childWin = new BrowserWindow({
    width: 1e3,
    height: 700,
    show: false,
    // 先不显示，等设置好大小后再显示
    fullscreen: mode === "fullscreen",
    autoHideMenuBar: true,
    icon: windowIcon,
    webPreferences: {
      preload: path$1.join(__dirname$1, "preload.mjs"),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (mode === "maximized") {
    childWin.maximize();
  }
  childWin.once("ready-to-show", () => {
    childWin.show();
  });
  childWin.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F12") {
      if (childWin.webContents.isDevToolsOpened()) {
        childWin.webContents.closeDevTools();
      } else {
        childWin.webContents.openDevTools();
      }
      event.preventDefault();
    } else if (input.key === "F5") {
      childWin.webContents.reload();
      event.preventDefault();
    }
  });
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${websiteName || "WebTools"}</title>
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
        <\/script>
      </body>
    </html>
  `;
  childWin.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(htmlContent));
  if (websiteName) {
    childWin.setTitle(websiteName);
  }
  childWin.webContents.on("dom-ready", () => {
    const websiteData = storageService.getWebsites().find((w) => w.url === url);
    if (websiteData && websiteData.customButtons) {
      childWin.webContents.executeJavaScript(`
        window.postMessage({
          type: 'updateCustomButtons',
          buttons: ${JSON.stringify(websiteData.customButtons)}
        }, '*');
      `);
    }
  });
  childWin.webContents.on("ipc-message", (event, channel, ...args) => {
    if (channel === "requestCustomButtons") {
      const websiteData = storageService.getWebsites().find((w) => w.url === url);
      if (websiteData && websiteData.customButtons) {
        event.sender.send("updateCustomButtons", websiteData.customButtons);
      }
    } else if (channel === "openNewWindow") {
      const [url2, name] = args;
      createChildWindow(url2, Date.now().toString(), "maximized", name);
    }
  });
  childWin.webContents.on("dom-ready", () => {
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
    `);
  });
  childWindows.set(windowId, childWin);
  childWin.on("closed", () => {
    childWindows.delete(windowId);
  });
  childWin.webContents.on("page-title-updated", (event, title) => {
    if (websiteName) {
      event.preventDefault();
      childWin.setTitle(websiteName);
    } else {
      childWin.setTitle(title);
    }
  });
  return childWin;
}
function setupIpcHandlers() {
  ipcMain.handle("get-websites", () => {
    return storageService.getWebsites();
  });
  ipcMain.handle("add-website", (_event, website) => {
    return storageService.addWebsite(website);
  });
  ipcMain.handle("update-website", (_event, id, updates) => {
    return storageService.updateWebsite(id, updates);
  });
  ipcMain.handle("delete-website", (_event, id) => {
    return storageService.deleteWebsite(id);
  });
  ipcMain.handle("add-custom-button", (_event, websiteId, button) => {
    return storageService.addCustomButton(websiteId, button);
  });
  ipcMain.handle("update-custom-button", (_event, websiteId, buttonId, updates) => {
    return storageService.updateCustomButton(websiteId, buttonId, updates);
  });
  ipcMain.handle("delete-custom-button", (_event, websiteId, buttonId) => {
    return storageService.deleteCustomButton(websiteId, buttonId);
  });
  ipcMain.handle("create-window", async (_event, url, windowMode = "maximized", websiteName, websiteIcon) => {
    const windowId = Date.now().toString();
    await createChildWindow(url, windowId, windowMode, websiteName, websiteIcon);
    return windowId;
  });
  ipcMain.handle("navigate-to-url", (_event, windowId, url) => {
    const childWin = childWindows.get(windowId);
    if (childWin) {
      childWin.webContents.loadURL(url);
    }
  });
  ipcMain.handle("add-to-desktop", async (_event, websiteData) => {
    try {
      const desktopPath = app.getPath("desktop");
      const shortcutPath = path$1.join(desktopPath, `${websiteData.name}.lnk`);
      const exePath = process.execPath;
      let iconPath = exePath;
      if (websiteData.icon && websiteData.icon.includes("favicon.ico")) {
        try {
          const faviconPath = await downloadIcon(websiteData.icon, websiteData.id || Date.now().toString());
          if (faviconPath) {
            iconPath = faviconPath;
          }
        } catch (err) {
          console.log("favicon.ico下载失败，尝试备用方案");
        }
      }
      if (iconPath === exePath && websiteData.url) {
        try {
          const urlObj = new URL(websiteData.url);
          const rootFaviconUrl = `${urlObj.origin}/favicon.ico`;
          const rootFaviconPath = await downloadIcon(rootFaviconUrl, `root_${websiteData.id || Date.now().toString()}`);
          if (rootFaviconPath) {
            iconPath = rootFaviconPath;
          }
        } catch (err) {
          console.log("根目录favicon获取失败");
        }
      }
      if (iconPath === exePath) {
        const appIconPath = path$1.join(process.env.VITE_PUBLIC || __dirname$1, "icon.ico");
        if (fs$1.existsSync(appIconPath)) {
          iconPath = appIconPath;
        }
      }
      const success = shell.writeShortcutLink(shortcutPath, {
        target: exePath,
        args: `--website-url="${websiteData.url}" --website-name="${websiteData.name}"`,
        description: websiteData.name,
        icon: iconPath,
        iconIndex: 0
      });
      if (success) {
        return { success: true, iconPath };
      } else {
        throw new Error("创建快捷方式失败");
      }
    } catch (error) {
      console.error("添加到桌面失败:", error);
      throw error;
    }
  });
  ipcMain.handle("get-settings", () => {
    return settingsService.getSettings();
  });
  ipcMain.handle("save-settings", (_event, settings) => {
    const updatedSettings = settingsService.updateSettings(settings);
    if (settings.autoStart !== void 0) {
      settingsService.setAutoStart(settings.autoStart).catch(console.error);
    }
    return updatedSettings;
  });
  ipcMain.handle("get-auto-start-status", () => {
    return settingsService.getAutoStartStatus();
  });
  ipcMain.on("open-add-custom-button", (event, data) => {
    const websites = storageService.getWebsites();
    const currentWebsite = websites.find((w) => event.sender.getURL().includes(w.url));
    if (currentWebsite) {
      const newButton = {
        id: Date.now().toString(),
        name: "新按钮",
        url: data.url,
        openMode: "currentPage"
      };
      if (!currentWebsite.customButtons) {
        currentWebsite.customButtons = [];
      }
      currentWebsite.customButtons.push(newButton);
      storageService.updateWebsite(currentWebsite.id, currentWebsite);
      event.sender.executeJavaScript(`
        window.postMessage({
          type: 'updateCustomButtons',
          buttons: ${JSON.stringify(currentWebsite.customButtons)}
        }, '*');
      `);
    }
  });
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch(console.error);
  }
});
app.whenReady().then(() => {
  setupIpcHandlers();
  const websiteUrlArg = process.argv.find((arg) => arg.startsWith("--website-url="));
  const websiteNameArg = process.argv.find((arg) => arg.startsWith("--website-name="));
  if (websiteUrlArg) {
    const url = websiteUrlArg.split("=")[1].replace(/"/g, "");
    const websiteName = websiteNameArg ? websiteNameArg.split("=")[1].replace(/"/g, "") : void 0;
    const windowId = Date.now().toString();
    createChildWindow(url, windowId, "maximized", websiteName).catch(console.error);
  } else {
    createWindow().catch(console.error);
  }
});
app.on("second-instance", (_event, commandLine) => {
  const websiteUrlArg = commandLine.find((arg) => arg.startsWith("--website-url="));
  const websiteNameArg = commandLine.find((arg) => arg.startsWith("--website-name="));
  if (websiteUrlArg) {
    const url = websiteUrlArg.split("=")[1].replace(/"/g, "");
    const websiteName = websiteNameArg ? websiteNameArg.split("=")[1].replace(/"/g, "") : void 0;
    const windowId = Date.now().toString();
    createChildWindow(url, windowId, "maximized", websiteName).catch(console.error);
  } else if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
