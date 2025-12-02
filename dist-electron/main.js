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
    frame: false,
    // 无边框窗口
    titleBarStyle: "hidden",
    // 隐藏系统标题栏
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
    frame: false,
    // 无边框窗口
    titleBarStyle: "hidden",
    // 隐藏系统标题栏
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
  childWin.webContents.on("did-attach-webview", (_event, webContents) => {
    if (!webContents || !webContents.setWindowOpenHandler) return;
    webContents.setWindowOpenHandler((details) => {
      try {
        const url2 = details.url;
        if (url2 && (url2.startsWith("http://") || url2.startsWith("https://"))) {
          childWin.webContents.send("webview-new-window", url2);
          return { action: "deny" };
        }
      } catch (error) {
        console.error("Error in webview windowOpen handler:", error);
      }
      return { action: "allow" };
    });
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
          /* 自定义标题栏样式 */
          .title-bar {
            height: 32px;
            background: #ffffff;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0;
            -webkit-app-region: drag;
            user-select: none;
            flex-shrink: 0;
          }
          .title-bar-tabs {
            flex: 1;
            display: flex;
            align-items: center;
            height: 100%;
          }
          .tab {
            height: 28px;
            padding: 0 12px;
            margin: 2px 2px 0 2px;
            background: #f5f5f5;
            border: 1px solid #d0d0d0;
            border-bottom: none;
            border-radius: 8px 8px 0 0;
            display: flex;
            align-items: center;
            cursor: pointer;
            font-size: 12px;
            color: #333;
            transition: all 0.2s;
            position: relative;
            -webkit-app-region: no-drag;
            max-width: 200px;
            min-width: 80px;
          }
          .tab.active {
            background: #ffffff;
            border-color: #e0e0e0;
            color: #1890ff;
            font-weight: 500;
          }
          .tab:hover {
            background: #e8e8e8;
          }
          .tab-close {
            margin-left: 6px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.6;
            transition: all 0.2s;
            -webkit-app-region: no-drag;
          }
          .tab-close:hover {
            background: #ff4d4f;
            color: white;
            opacity: 1;
          }
          .tab-title {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            user-select: none;
          }
          .new-tab-btn {
            width: 28px;
            height: 28px;
            margin: 2px 4px 0 4px;
            border: 1px solid #d0d0d0;
            background: #f5f5f5;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
            color: #666;
            transition: all 0.2s;
            -webkit-app-region: no-drag;
          }
          .new-tab-btn:hover {
            background: #e0e0e0;
            color: #1890ff;
          }
          .window-controls {
            display: flex;
            align-items: center;
            height: 100%;
            -webkit-app-region: no-drag;
          }
          .window-control {
            width: 46px;
            height: 32px;
            border: none;
            background: transparent;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }
          .window-control:hover {
            background: #e5e5e5;
          }
          .window-control:active {
            background: #cccccc;
          }
          .window-control.close:hover {
            background: #e81123;
          }
          .window-control.close:hover svg {
            stroke: white;
          }
          .window-control svg {
            width: 12px;
            height: 12px;
            stroke: #333;
            fill: none;
            stroke-width: 1.5;
          }
          /* 功能栏样式 */
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
            composes: ant-btn ant-btn-primary;
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
          <!-- 自定义标题栏 -->
          <div class="title-bar">
            <div class="title-bar-tabs">
              <div class="tab active" id="default">
                <span class="tab-title">${websiteName || "新标签页"}</span>
                <span class="tab-close" id="closeTab">×</span>
              </div>
              <button class="new-tab-btn" id="newTabBtn" title="新标签页">+</button>
            </div>
            <div class="window-controls">
              <button class="window-control minimize" id="minimizeBtn" title="最小化">
                <svg viewBox="0 0 12 12">
                  <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" stroke-width="1"/>
                </svg>
              </button>
              <button class="window-control maximize" id="maximizeBtn" title="最大化">
                <svg viewBox="0 0 12 12">
                  <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"/>
                </svg>
              </button>
              <button class="window-control close" id="closeBtn" title="关闭">
                <svg viewBox="0 0 12 12">
                  <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1.5"/>
                  <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1.5"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="toolbar">
            <div class="toolbar-section toolbar-section-1">
              <div class="custom-buttons" id="customButtons">
                <!-- 自定义按钮将在这里动态生成 -->
              </div>
              <!-- 管理功能已移到首页 -->
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
            <webview id="webview" src="${url}" nodeintegration="false" contextIsolation="true" webpreferences="contextIsolation=true,nodeIntegration=false" allowpopups="true" webSecurity="true"></webview>
          </div>
        </div>
        <script>
          const webview = document.getElementById('webview');
          const backBtn = document.getElementById('backBtn');
          const forwardBtn = document.getElementById('forwardBtn');
          const homeBtn = document.getElementById('homeBtn');
          const refreshBtn = document.getElementById('refreshBtn');
          const switchBtn = document.getElementById('switchBtn');
          const urlDisplay = document.getElementById('urlDisplay');
          const minimizeBtn = document.getElementById('minimizeBtn');
          const maximizeBtn = document.getElementById('maximizeBtn');
          const closeBtn = document.getElementById('closeBtn');
          const closeTabBtn = document.getElementById('closeTab');
          const newTabBtn = document.getElementById('newTabBtn');
          const currentTab = document.getElementById('default');

          // 窗口控制功能 - 使用预加载的ipcRenderer
          minimizeBtn.addEventListener('click', () => {
            if (window.ipcRenderer) {
              window.ipcRenderer.send('window-control', 'minimize');
            }
          });

          maximizeBtn.addEventListener('click', () => {
            if (window.ipcRenderer) {
              window.ipcRenderer.send('window-control', 'maximize');
            }
          });

          closeBtn.addEventListener('click', () => {
            if (window.ipcRenderer) {
              window.ipcRenderer.send('window-control', 'close');
            }
          });

          // 默认标签页的关闭按钮事件
          closeTabBtn.addEventListener('click', () => {
            closeTab('default'); // 使用统一的标签页关闭函数
          });

          // 标签页管理
          let tabs = [];
          let activeTabId = null;

          // 新建标签页功能
          newTabBtn.addEventListener('click', () => {
            try {
              // 使用首页URL创建新标签页，而不是当前URL
              const homeUrl = '${url}';
              createNewTab(homeUrl, '新标签页');
            } catch (error) {
              console.error('Error creating new tab:', error);
              // 使用默认URL创建新标签页
              createNewTab('${url}', '新标签页');
            }
          });

          // 创建新标签页
          function createNewTab(url, title) {
            const tabId = 'tab-' + Date.now();
            const tabElement = document.createElement('div');
            tabElement.className = 'tab';
            tabElement.id = tabId;
            tabElement.innerHTML = \`
              <span class="tab-title">\${title || '新标签页'}</span>
              <span class="tab-close" data-tab-id="\${tabId}">×</span>
            \`;

            // 在新标签页按钮之前插入新标签页
            const newTabBtn = document.getElementById('newTabBtn');
            if (newTabBtn && newTabBtn.parentNode) {
              newTabBtn.parentNode.insertBefore(tabElement, newTabBtn);
            } else {
              // 如果找不到新标签页按钮，插入到标题栏标签容器中
              const titleBarTabs = document.querySelector('.title-bar-tabs');
              if (titleBarTabs) {
                titleBarTabs.appendChild(tabElement);
              }
            }

            // 创建新的webview
            const newWebview = document.createElement('webview');
            newWebview.id = 'webview-' + tabId;
            newWebview.style.cssText = 'width: 100%; height: 100%; display: none;';
            newWebview.setAttribute('nodeintegration', 'false');
            newWebview.setAttribute('contextIsolation', 'true');
            newWebview.setAttribute('webpreferences', 'contextIsolation=true,nodeIntegration=false');
            newWebview.setAttribute('allowpopups', 'true'); // 明确设置为true以允许弹出窗口被拦截
            newWebview.setAttribute('webSecurity', 'true'); // 启用Web安全

            document.querySelector('.webview-container').appendChild(newWebview);

            // 延迟设置src，确保WebView完全附加到DOM
            setTimeout(() => {
              if (url && url.startsWith('http')) {
                newWebview.src = url;
              } else {
                console.warn('Invalid URL for new webview:', url);
                newWebview.src = 'about:blank';
              }
            }, 50);

            // 保存标签页信息
            tabs.push({
              id: tabId,
              url: url,
              title: title || '新标签页',
              webview: newWebview
            });

            // 切换到新标签页
            switchToTab(tabId);

            // 为新标签页添加事件监听
            setupWebviewListeners(newWebview);
          }

          // 切换到指定标签页
          function switchToTab(tabId) {
            // 隐藏所有标签页和webview
            document.querySelectorAll('.tab').forEach(tab => {
              tab.classList.remove('active');
            });
            document.querySelectorAll('webview').forEach(wv => {
              wv.style.display = 'none';
            });

            // 显示选中的标签页和webview
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
              targetTab.classList.add('active');
            }

            let targetWebview;
            if (tabId === 'default') {
              targetWebview = webview;
            } else {
              targetWebview = document.getElementById('webview-' + tabId);
            }

            if (targetWebview) {
              // 取消使用 display:block，避免高度异常问题
              targetWebview.style.display = '';
              // 更新当前活动的webview引用
              window.currentWebview = targetWebview;

              // 延迟更新UI，确保WebView完全显示
              setTimeout(() => {
                // 更新URL显示
                urlDisplay.textContent = targetWebview.src;
                urlDisplay.title = targetWebview.src;
                // 更新导航按钮状态
                updateNavButtons();
              }, 100);
            }

            activeTabId = tabId;
          }

          // 为webview添加事件监听
          function setupWebviewListeners(wv) {
            wv.addEventListener('dom-ready', () => {
              if (wv === window.currentWebview) {
                urlDisplay.textContent = wv.src;
                urlDisplay.title = wv.src;
                updateNavButtons();
              }
            });

            wv.addEventListener('did-navigate', () => {
              if (wv === window.currentWebview) {
                urlDisplay.textContent = wv.src;
                urlDisplay.title = wv.src;
                updateNavButtons();
              }
            });

            // 处理新窗口打开请求（target="_blank"）
            // 注意：具体拦截逻辑已移动到主进程的 webContents.setWindowOpenHandler，
            // 然后通过 'webview-new-window' 事件通知当前窗口在标签页中打开。
            // 这里不再直接使用 webview 的 new-window 事件，以避免在不同 Electron 版本下行为不一致。

            // 处理页面标题更新
            wv.addEventListener('page-title-updated', (event) => {
              const tabId = wv.id.replace('webview-', '');
              const tab = document.getElementById(tabId);
              if (tab) {
                const titleElement = tab.querySelector('.tab-title');
                if (titleElement) {
                  titleElement.textContent = event.title || '新标签页';
                }
              }

              // 更新存储的标签页信息
              const tabInfo = tabs.find(t => t.id === tabId);
              if (tabInfo) {
                tabInfo.title = event.title || '新标签页';
              }
            });
          }

          // 更新导航按钮状态
          function updateNavButtons() {
            const currentWv = window.currentWebview || webview;
            if (currentWv && currentWv.getWebContentsId) {
              try {
                backBtn.disabled = !currentWv.canGoBack();
                forwardBtn.disabled = !currentWv.canGoForward();
              } catch (error) {
                // WebView还未准备好，设置为默认状态
                backBtn.disabled = true;
                forwardBtn.disabled = true;
              }
            } else {
              // WebView还未附加到DOM
              backBtn.disabled = true;
              forwardBtn.disabled = true;
            }
          }

          // 标签页点击事件委托
          document.addEventListener('click', (e) => {
            // 标签页点击切换
            if (e.target.closest('.tab') && !e.target.classList.contains('tab-close')) {
              const tab = e.target.closest('.tab');
              const tabId = tab.id;
              if (tabs.find(t => t.id === tabId)) {
                switchToTab(tabId);
              }
            }

            // 标签页关闭按钮
            if (e.target.classList.contains('tab-close')) {
              const tabId = e.target.getAttribute('data-tab-id');
              closeTab(tabId);
            }
          });

          // 关闭标签页
          function closeTab(tabId) {
            const tabIndex = tabs.findIndex(t => t.id === tabId);
            if (tabIndex === -1) return;

            const tabInfo = tabs[tabIndex];

            // 移除标签页元素
            const tabElement = document.getElementById(tabId);
            if (tabElement) {
              tabElement.remove();
            }

            // 移除webview元素
            if (tabInfo.webview) {
              tabInfo.webview.remove();
            }

            // 从数组中移除
            tabs.splice(tabIndex, 1);

            // 如果关闭后没有标签页了，创建一个新的默认标签页
            if (tabs.length === 0) {
              const homeUrl = '${url}';
              createNewTab(homeUrl, '新标签页');
              return;
            }

            // 如果关闭的是当前活动标签页，切换到其他标签页
            if (activeTabId === tabId) {
              const newActiveTab = tabs[tabIndex] || tabs[tabIndex - 1] || tabs[0];
              if (newActiveTab) {
                switchToTab(newActiveTab.id);
              }
            }
          }

          // 监听窗口状态变化，更新最大化按钮图标
          if (window.ipcRenderer) {
            window.ipcRenderer.on('window-state-changed', (event, isMaximized) => {
              const maximizeIcon = maximizeBtn.querySelector('svg');
              if (isMaximized) {
                // VS Code风格的还原图标 - 两个重叠的方框
                maximizeIcon.innerHTML = '<rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1"/><rect x="4" y="4" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1"/>';
                maximizeBtn.title = '向下还原';
              } else {
                // 最大化图标 - 保持简洁的方框
                maximizeIcon.innerHTML = '<rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"/>';
                maximizeBtn.title = '最大化';
              }
            });

            // 从主进程接收 webview 新窗口请求，在当前子窗口中打开新标签页
            window.ipcRenderer.on('webview-new-window', (_event, url) => {
              try {
                if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                  createNewTab(url, '新标签页');
                }
              } catch (error) {
                console.error('Error handling webview-new-window IPC:', error);
              }
            });
          }


          // 当前活动的webview引用
          window.currentWebview = webview;

          // 导航按钮事件 - 作用于当前活动的webview
          backBtn.addEventListener('click', () => {
            const currentWv = window.currentWebview;
            if (currentWv && currentWv.canGoBack()) {
              currentWv.goBack();
            }
          });

          forwardBtn.addEventListener('click', () => {
            const currentWv = window.currentWebview;
            if (currentWv && currentWv.canGoForward()) {
              currentWv.goForward();
            }
          });

          homeBtn.addEventListener('click', () => {
            const currentWv = window.currentWebview;
            if (currentWv) {
              currentWv.src = '${url}';
            }
          });

          refreshBtn.addEventListener('click', () => {
            const currentWv = window.currentWebview;
            if (currentWv) {
              currentWv.reload();
            }
          });

          switchBtn.addEventListener('click', () => {
            const currentWv = window.currentWebview;
            if (currentWv && currentWv.src) {
              // 使用shell打开默认浏览器
              if (window.ipcRenderer) {
                window.ipcRenderer.send('open-external', currentWv.src);
              }
            }
          });

          // 为默认webview添加事件监听
          setupWebviewListeners(webview);

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

          }

          // 初始化时向父窗口请求自定义按钮数据
          window.parent.postMessage({ type: 'requestCustomButtons' }, '*');

          // 初始化默认标签页
          tabs.push({
            id: 'default',
            url: '${url}',
            title: '${websiteName || "新标签页"}',
            webview: webview
          });
          activeTabId = 'default';
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
          if (window.ipcRenderer) {
            window.ipcRenderer.send('open-add-custom-button', {
              url: event.data.url,
              name: event.data.name
            });
          }
        } else if (event.data.type === 'windowControl') {
          // 处理窗口控制消息
          if (window.ipcRenderer) {
            window.ipcRenderer.send('window-control', event.data.action);
          }
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
  ipcMain.on("open-add-custom-button", (_event, data) => {
    console.log("Received open-add-custom-button message (legacy):", data);
  });
  ipcMain.on("open-custom-button-manager", async (event, data) => {
    console.log("Opening custom button manager for:", data);
    const { websiteUrl } = data;
    const websites = storageService.getWebsites();
    const website = websites.find((w) => w.url === websiteUrl);
    if (!website) {
      console.error("Website not found:", websiteUrl);
      return;
    }
    const managerWindow = new BrowserWindow({
      width: 720,
      height: 650,
      parent: BrowserWindow.fromWebContents(event.sender) || void 0,
      // 设置为子窗口
      modal: true,
      // 模态窗口
      frame: false,
      titleBarStyle: "hidden",
      resizable: false,
      show: false,
      // 先不显示，等加载完成再显示
      webPreferences: {
        preload: path$1.join(__dirname$1, "preload.mjs"),
        contextIsolation: true,
        nodeIntegration: false,
        webviewTag: true
      }
    });
    managerWindow.setTitle(`管理自定义按钮 - ${website.name}`);
    const websiteData = JSON.stringify(website);
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>管理自定义按钮 - ${website.name}</title>
        <link rel="stylesheet" href="https://unpkg.com/ant-design-vue@3.2.20/dist/antd.css">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
          }
          #app {
            height: 100vh;
          }
          .title-bar {
            height: 32px;
            background: #ffffff;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0;
            -webkit-app-region: drag;
            user-select: none;
          }
          .title-bar-content {
            flex: 1;
            display: flex;
            align-items: center;
            height: 100%;
            padding: 0 12px;
          }
          .app-title {
            font-size: 14px;
            color: #333;
            font-weight: 500;
          }
          .window-controls {
            display: flex;
            align-items: center;
            height: 100%;
            -webkit-app-region: no-drag;
          }
          .window-control {
            width: 46px;
            height: 32px;
            border: none;
            background: transparent;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }
          .window-control:hover {
            background: #e5e5e5;
          }
          .window-control.close:hover {
            background: #e81123;
          }
          .window-control.close:hover svg {
            stroke: white;
          }
          .window-control svg {
            width: 12px;
            height: 12px;
            stroke: #333;
            fill: none;
            stroke-width: 1.5;
          }
          .modal-container {
            padding: 24px;
            height: calc(100vh - 32px);
            overflow-y: auto;
          }
        </style>
      </head>
      <body>
        <!-- 自定义标题栏 -->
        <div class="title-bar">
          <div class="title-bar-content">
            <span class="app-title">管理自定义按钮 - ${website.name}</span>
          </div>
          <div class="window-controls">
            <button class="window-control close" id="closeBtn" title="关闭">
              <svg viewBox="0 0 12 12">
                <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1.5"/>
                <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </button>
          </div>
        </div>

        <div id="app" class="modal-container">
          <div style="margin-bottom: 16px;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">管理自定义按钮</h3>
            <button class="ant-btn ant-btn-dashed" id="addBtn" style="width: 100%;">
              <span style="margin-right: 8px;">+</span> 添加按钮
            </button>
          </div>

          <div id="buttonList" style="margin: 0 -8px;"></div>

          <div id="emptyState" style="text-align: center; padding: 64px 0; color: rgba(0, 0, 0, 0.45); display: none;">
            <div style="font-size: 48px; margin-bottom: 8px;">📦</div>
            <div>暂无自定义按钮</div>
          </div>
        </div>

        <script>
          // 简化的自定义按钮管理 - 使用原生JavaScript + Ant Design样式
          let currentWebsite = ${websiteData};

          // 初始化
          document.addEventListener('DOMContentLoaded', function() {
            loadButtons();
            setupEventListeners();
          });

          function setupEventListeners() {
            document.getElementById('closeBtn').addEventListener('click', () => {
              window.ipcRenderer.send('window-control', 'close');
            });

            document.getElementById('addBtn').addEventListener('click', () => {
              addNewButton();
            });
          }

          function loadButtons() {
            if (!currentWebsite.customButtons || currentWebsite.customButtons.length === 0) {
              document.getElementById('emptyState').style.display = 'block';
              document.getElementById('buttonList').style.display = 'none';
              return;
            }

            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('buttonList').style.display = 'block';

            const buttonList = document.getElementById('buttonList');
            buttonList.innerHTML = '';

            // 使用Ant Design的List Grid布局
            const gridContainer = document.createElement('div');
            gridContainer.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 8px;';

            currentWebsite.customButtons.forEach(button => {
              const buttonCard = document.createElement('div');
              buttonCard.style.cssText = 'border: 1px solid #f0f0f0; border-radius: 8px; background: #fff; transition: all 0.3s;';
              buttonCard.innerHTML = \`
                <div style="padding: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="color: rgba(0, 0, 0, 0.88); font-weight: 500; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      \${button.name}
                    </div>
                    <div style="display: flex; gap: 8px; flex-shrink: 0;">
                      <button onclick="editButton('\${button.id}', '\${button.name.replace(/'/g, "\\'")}', '\${button.url.replace(/'/g, "\\'")}', '\${button.openMode}')"
                              class="ant-btn" style="padding: 4px 8px; font-size: 12px;">编辑</button>
                      <button onclick="deleteButton('\${button.id}', '\${button.name.replace(/'/g, "\\'")}')"
                              class="ant-btn ant-btn-danger" style="padding: 4px 8px; font-size: 12px;">删除</button>
                    </div>
                  </div>
                  <div style="color: rgba(0, 0, 0, 0.45); font-size: 12px; margin-bottom: 8px; word-break: break-all; line-height: 1.5;">
                    \${button.url}
                  </div>
                  <span class="ant-tag">\${getOpenModeLabel(button.openMode)}</span>
                </div>
              \`;
              gridContainer.appendChild(buttonCard);
            });

            buttonList.appendChild(gridContainer);
          }

          function getOpenModeLabel(mode) {
            const labels = {
              'newWindow': '新窗口',
              'newTab': '新标签页',
              'currentPage': '当前页面'
            };
            return labels[mode] || mode;
          }

          function addNewButton() {
            const name = prompt('请输入按钮名称：');
            if (!name || !name.trim()) return;

            const url = prompt('请输入网址：');
            if (!url || !url.trim()) return;

            const openMode = prompt('请选择打开方式 (newWindow/newTab/currentPage)：', 'newWindow');
            if (!openMode) return;

            const buttonData = {
              name: name.trim(),
              url: url.trim(),
              openMode: openMode.trim()
            };

            if (window.ipcRenderer) {
              window.ipcRenderer.invoke('add-custom-button', currentWebsite.id, buttonData)
                .then(() => {
                  alert('添加成功！');
                  reloadWebsite();
                })
                .catch(error => {
                  alert('添加失败: ' + error.message);
                });
            }
          }

          function editButton(buttonId, buttonName, buttonUrl, buttonOpenMode) {
            const name = prompt('编辑按钮名称：', buttonName);
            if (!name || !name.trim()) return;

            const url = prompt('编辑网址：', buttonUrl);
            if (!url || !url.trim()) return;

            const openMode = prompt('选择打开方式 (newWindow/newTab/currentPage)：', buttonOpenMode);
            if (!openMode) return;

            const buttonData = {
              name: name.trim(),
              url: url.trim(),
              openMode: openMode.trim()
            };

            if (window.ipcRenderer) {
              window.ipcRenderer.invoke('update-custom-button', currentWebsite.id, buttonId, buttonData)
                .then(() => {
                  alert('更新成功！');
                  reloadWebsite();
                })
                .catch(error => {
                  alert('更新失败: ' + error.message);
                });
            }
          }

          function deleteButton(buttonId, buttonName) {
            if (confirm('确定要删除按钮 "' + buttonName + '" 吗？')) {
              if (window.ipcRenderer) {
                window.ipcRenderer.invoke('delete-custom-button', currentWebsite.id, buttonId)
                  .then(() => {
                    alert('删除成功！');
                    reloadWebsite();
                  })
                  .catch(error => {
                    alert('删除失败: ' + error.message);
                  });
              }
            }
          }

          function reloadWebsite() {
            if (window.ipcRenderer) {
              window.ipcRenderer.invoke('get-websites').then(websites => {
                const updatedWebsite = websites.find(w => w.id === '${website.id}');
                if (updatedWebsite) {
                  currentWebsite = updatedWebsite;
                  loadButtons();
                }
              });
            }
          }
        <\/script>
      </body>
      </html>
    `;
    managerWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    managerWindow.once("ready-to-show", () => {
      managerWindow.show();
    });
    ipcMain.on("window-control", (event2, action) => {
      if (event2.sender === managerWindow.webContents) {
        switch (action) {
          case "close":
            managerWindow.close();
            break;
        }
      }
    });
    managerWindow.on("closed", () => {
      const parentWindow = BrowserWindow.fromWebContents(event.sender);
      if (parentWindow) {
        parentWindow.webContents.executeJavaScript(`
          window.postMessage({
            type: 'customButtonsUpdated',
            websiteId: '${website.id}'
          }, '*');
        `);
      }
    });
  });
  ipcMain.on("window-control", (event, action) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      switch (action) {
        case "minimize":
          window.minimize();
          break;
        case "maximize":
          if (window.isMaximized()) {
            window.unmaximize();
            window.webContents.send("window-state-changed", false);
          } else {
            window.maximize();
            window.webContents.send("window-state-changed", true);
          }
          break;
        case "close":
          window.close();
          break;
      }
    }
  });
  ipcMain.on("open-external", (_event, url) => {
    shell.openExternal(url).catch((err) => {
      console.error("打开外部链接失败:", err);
    });
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
