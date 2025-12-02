var R = Object.defineProperty;
var P = (s, t, e) => t in s ? R(s, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : s[t] = e;
var k = (s, t, e) => P(s, typeof t != "symbol" ? t + "" : t, e);
import { app as g, BrowserWindow as h, ipcMain as c, shell as M } from "electron";
import { fileURLToPath as j } from "node:url";
import p from "node:path";
import f from "node:fs";
import $ from "node:https";
import _ from "node:http";
import v from "fs";
import W from "path";
const U = "websites.json";
class A {
  constructor() {
    k(this, "storagePath");
    this.storagePath = W.join(g.getPath("userData"), U), this.initStorage();
  }
  initStorage() {
    v.existsSync(this.storagePath) || this.saveData([]);
  }
  loadData() {
    try {
      const t = v.readFileSync(this.storagePath, "utf-8");
      return JSON.parse(t);
    } catch (t) {
      return console.error("Error loading data:", t), [];
    }
  }
  saveData(t) {
    try {
      v.writeFileSync(this.storagePath, JSON.stringify(t, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving data:", e);
    }
  }
  getWebsites() {
    return this.loadData();
  }
  addWebsite(t) {
    const e = this.loadData(), o = {
      ...t,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      customButtons: t.customButtons || []
    };
    return e.push(o), this.saveData(e), o;
  }
  updateWebsite(t, e) {
    const o = this.loadData(), i = o.findIndex((n) => n.id === t);
    return i === -1 ? null : (o[i] = { ...o[i], ...e }, this.saveData(o), o[i]);
  }
  deleteWebsite(t) {
    const e = this.loadData(), o = e.findIndex((i) => i.id === t);
    return o === -1 ? !1 : (e.splice(o, 1), this.saveData(e), !0);
  }
  addCustomButton(t, e) {
    const o = this.loadData(), i = o.find((a) => a.id === t);
    if (!i) return null;
    const n = {
      ...e,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    return i.customButtons.push(n), this.saveData(o), n;
  }
  updateCustomButton(t, e, o) {
    const i = this.loadData(), n = i.find((r) => r.id === t);
    if (!n) return null;
    const a = n.customButtons.findIndex((r) => r.id === e);
    return a === -1 ? null : (n.customButtons[a] = { ...n.customButtons[a], ...o }, this.saveData(i), n.customButtons[a]);
  }
  deleteCustomButton(t, e) {
    const o = this.loadData(), i = o.find((a) => a.id === t);
    if (!i) return !1;
    const n = i.customButtons.findIndex((a) => a.id === e);
    return n === -1 ? !1 : (i.customButtons.splice(n, 1), this.saveData(o), !0);
  }
}
const w = new A(), D = {
  darkMode: "manual",
  darkModeTimeStart: "18:00",
  darkModeTimeEnd: "06:00",
  isDarkMode: !1,
  homeWindowSize: "maximized",
  autoStart: !1,
  backgroundType: "default",
  backgroundColor: "#f0f2f5",
  backgroundImage: ""
};
class O {
  constructor() {
    k(this, "settingsPath");
    k(this, "settings");
    this.settingsPath = W.join(g.getPath("userData"), "settings.json"), this.settings = this.loadSettings();
  }
  loadSettings() {
    try {
      if (v.existsSync(this.settingsPath)) {
        const t = v.readFileSync(this.settingsPath, "utf-8"), e = JSON.parse(t);
        return { ...D, ...e };
      }
    } catch (t) {
      console.error("加载设置失败:", t);
    }
    return { ...D };
  }
  saveSettings() {
    try {
      const t = JSON.stringify(this.settings, null, 2);
      v.writeFileSync(this.settingsPath, t, "utf-8");
    } catch (t) {
      console.error("保存设置失败:", t);
    }
  }
  getSettings() {
    return { ...this.settings };
  }
  updateSettings(t) {
    return this.settings = { ...this.settings, ...t }, this.saveSettings(), this.settings;
  }
  // 检测是否应该使用黑暗模式
  shouldUseDarkMode() {
    const { darkMode: t, darkModeTimeStart: e, darkModeTimeEnd: o, isDarkMode: i } = this.settings;
    if (t === "manual")
      return i;
    if (t === "system")
      return !1;
    if (t === "time") {
      const n = /* @__PURE__ */ new Date(), a = n.getHours() * 60 + n.getMinutes(), [r, u] = e.split(":").map(Number), [d, b] = o.split(":").map(Number), y = r * 60 + u, m = d * 60 + b;
      return y <= m ? a >= y && a <= m : a >= y || a <= m;
    }
    return !1;
  }
  // 设置开机启动
  async setAutoStart(t) {
    try {
      const { app: e } = await import("electron");
      e.setLoginItemSettings({
        openAtLogin: t,
        openAsHidden: !1,
        path: e.getPath("exe"),
        args: t ? [] : ["--disable-auto-start"]
      }), this.updateSettings({ autoStart: t }), console.log(`开机启动设置已${t ? "启用" : "禁用"}`);
    } catch (e) {
      throw console.error("设置开机启动失败:", e), e;
    }
  }
  // 获取开机启动状态
  getAutoStartStatus() {
    try {
      const { app: t } = require("electron"), e = t.getLoginItemSettings(), o = e.openAtLogin || (e.executableWillLaunchAtLogin ?? !1) || e.launchItems && e.launchItems.length > 0;
      return console.log(`获取开机启动状态: ${o ? "启用" : "禁用"}`, e), o;
    } catch (t) {
      return console.error("获取开机启动状态失败:", t), !1;
    }
  }
}
const B = new O(), x = p.dirname(j(import.meta.url));
process.env.APP_ROOT = p.join(x, "..");
const I = process.env.VITE_DEV_SERVER_URL, Z = p.join(process.env.APP_ROOT, "dist-electron"), z = p.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = I ? p.join(process.env.APP_ROOT, "public") : z;
let l;
const T = /* @__PURE__ */ new Map();
function N() {
  const s = p.join(g.getPath("userData"), "icons");
  return f.existsSync(s) || f.mkdirSync(s, { recursive: !0 }), s;
}
async function S(s, t) {
  return new Promise((e) => {
    try {
      const o = N(), i = p.extname(new URL(s).pathname) || ".ico", n = p.join(o, `${t}${i}`);
      if (f.existsSync(n)) {
        e(n);
        return;
      }
      const a = f.createWriteStream(n), u = (s.startsWith("https") ? $ : _).get(s, { timeout: 3e3 }, (d) => {
        if (d.statusCode === 301 || d.statusCode === 302) {
          const b = d.headers.location;
          if (b) {
            a.close(), f.unlinkSync(n), S(b, t).then(e);
            return;
          }
        }
        if (d.statusCode !== 200) {
          a.close(), f.unlinkSync(n), e(null);
          return;
        }
        d.pipe(a), a.on("finish", () => {
          a.close(), e(n);
        });
      });
      u.on("error", () => {
        a.close(), f.existsSync(n) && f.unlinkSync(n), e(null);
      }), u.on("timeout", () => {
        u.destroy(), a.close(), f.existsSync(n) && f.unlinkSync(n), e(null);
      });
    } catch (o) {
      console.error("下载图标失败:", o), e(null);
    }
  });
}
async function L() {
  const s = B.getSettings();
  l = new h({
    width: 1200,
    height: 800,
    icon: p.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    frame: !1,
    // 无边框窗口
    titleBarStyle: "hidden",
    // 隐藏系统标题栏
    autoHideMenuBar: !0,
    show: !1,
    // 先不显示，等设置好大小后再显示
    webPreferences: {
      preload: p.join(x, "preload.mjs"),
      webviewTag: !0,
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), s.homeWindowSize === "maximized" ? l.maximize() : s.homeWindowSize === "fullscreen" && l.setFullScreen(!0), l.show(), l.webContents.on("before-input-event", (t, e) => {
    if (e.key === "Alt") {
      t.preventDefault();
      return;
    }
    e.key === "F12" ? (l != null && l.webContents.isDevToolsOpened() ? l.webContents.closeDevTools() : l == null || l.webContents.openDevTools(), t.preventDefault()) : e.key === "F5" && (l == null || l.webContents.reload(), t.preventDefault());
  }), l.webContents.on("did-finish-load", () => {
    l == null || l.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), I ? l.loadURL(I) : l.loadFile(p.join(z, "index.html"));
}
async function C(s, t, e = "maximized", o, i) {
  let n;
  typeof e == "boolean" ? n = e ? "fullscreen" : "maximized" : n = e;
  let a = p.join(process.env.VITE_PUBLIC || x, "electron-vite.svg");
  if (i)
    try {
      const d = await S(i, `window_${t}`);
      d && f.existsSync(d) && (a = d);
    } catch {
      console.log("下载网站图标失败，使用默认图标");
    }
  const r = new h({
    width: 1e3,
    height: 700,
    show: !1,
    // 先不显示，等设置好大小后再显示
    fullscreen: n === "fullscreen",
    frame: !1,
    // 无边框窗口
    titleBarStyle: "hidden",
    // 隐藏系统标题栏
    autoHideMenuBar: !0,
    icon: a,
    webPreferences: {
      preload: p.join(x, "preload.mjs"),
      webviewTag: !0,
      contextIsolation: !0,
      nodeIntegration: !1
    }
  });
  n === "maximized" && r.maximize(), r.once("ready-to-show", () => {
    r.show();
  }), r.webContents.on("before-input-event", (d, b) => {
    b.key === "F12" ? (r.webContents.isDevToolsOpened() ? r.webContents.closeDevTools() : r.webContents.openDevTools(), d.preventDefault()) : b.key === "F5" && (r.webContents.reload(), d.preventDefault());
  });
  const u = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${o || "WebTools"}</title>
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
              <div class="tab active" id="currentTab">
                <span class="tab-title">${o || "新标签页"}</span>
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
                <div class="url-display" id="urlDisplay" title="${s}">${s}</div>
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
            <webview id="webview" src="${s}" nodeintegration="false" contextIsolation="true" webpreferences="contextIsolation=true,nodeIntegration=false"></webview>
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
          const closeTab = document.getElementById('closeTab');
          const newTabBtn = document.getElementById('newTabBtn');
          const currentTab = document.getElementById('currentTab');

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

          // 标签页控制（预留功能）
          closeTab.addEventListener('click', () => {
            // 暂时关闭整个窗口，后续实现多标签页管理
            if (window.ipcRenderer) {
              window.ipcRenderer.send('window-control', 'close');
            }
          });

          newTabBtn.addEventListener('click', () => {
            // 预留新标签页功能
            alert('多标签页功能开发中...');
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

          }

          // 初始化时向父窗口请求自定义按钮数据
          window.parent.postMessage({ type: 'requestCustomButtons' }, '*');
        <\/script>
      </body>
    </html>
  `;
  return r.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(u)), o && r.setTitle(o), r.webContents.on("dom-ready", () => {
    const d = w.getWebsites().find((b) => b.url === s);
    d && d.customButtons && r.webContents.executeJavaScript(`
        window.postMessage({
          type: 'updateCustomButtons',
          buttons: ${JSON.stringify(d.customButtons)}
        }, '*');
      `);
  }), r.webContents.on("ipc-message", (d, b, ...y) => {
    if (b === "requestCustomButtons") {
      const m = w.getWebsites().find((E) => E.url === s);
      m && m.customButtons && d.sender.send("updateCustomButtons", m.customButtons);
    } else if (b === "openNewWindow") {
      const [m, E] = y;
      C(m, Date.now().toString(), "maximized", E);
    }
  }), r.webContents.on("dom-ready", () => {
    r.webContents.executeJavaScript(`
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
  }), T.set(t, r), r.on("closed", () => {
    T.delete(t);
  }), r.webContents.on("page-title-updated", (d, b) => {
    o ? (d.preventDefault(), r.setTitle(o)) : r.setTitle(b);
  }), r;
}
function F() {
  c.handle("get-websites", () => w.getWebsites()), c.handle("add-website", (s, t) => w.addWebsite(t)), c.handle("update-website", (s, t, e) => w.updateWebsite(t, e)), c.handle("delete-website", (s, t) => w.deleteWebsite(t)), c.handle("add-custom-button", (s, t, e) => w.addCustomButton(t, e)), c.handle("update-custom-button", (s, t, e, o) => w.updateCustomButton(t, e, o)), c.handle("delete-custom-button", (s, t, e) => w.deleteCustomButton(t, e)), c.handle("create-window", async (s, t, e = "maximized", o, i) => {
    const n = Date.now().toString();
    return await C(t, n, e, o, i), n;
  }), c.handle("navigate-to-url", (s, t, e) => {
    const o = T.get(t);
    o && o.webContents.loadURL(e);
  }), c.handle("add-to-desktop", async (s, t) => {
    try {
      const e = g.getPath("desktop"), o = p.join(e, `${t.name}.lnk`), i = process.execPath;
      let n = i;
      if (t.icon && t.icon.includes("favicon.ico"))
        try {
          const r = await S(t.icon, t.id || Date.now().toString());
          r && (n = r);
        } catch {
          console.log("favicon.ico下载失败，尝试备用方案");
        }
      if (n === i && t.url)
        try {
          const u = `${new URL(t.url).origin}/favicon.ico`, d = await S(u, `root_${t.id || Date.now().toString()}`);
          d && (n = d);
        } catch {
          console.log("根目录favicon获取失败");
        }
      if (n === i) {
        const r = p.join(process.env.VITE_PUBLIC || x, "icon.ico");
        f.existsSync(r) && (n = r);
      }
      if (M.writeShortcutLink(o, {
        target: i,
        args: `--website-url="${t.url}" --website-name="${t.name}"`,
        description: t.name,
        icon: n,
        iconIndex: 0
      }))
        return { success: !0, iconPath: n };
      throw new Error("创建快捷方式失败");
    } catch (e) {
      throw console.error("添加到桌面失败:", e), e;
    }
  }), c.handle("get-settings", () => B.getSettings()), c.handle("save-settings", (s, t) => {
    const e = B.updateSettings(t);
    return t.autoStart !== void 0 && B.setAutoStart(t.autoStart).catch(console.error), e;
  }), c.handle("get-auto-start-status", () => B.getAutoStartStatus()), c.on("open-add-custom-button", (s, t) => {
    console.log("Received open-add-custom-button message (legacy):", t);
  }), c.on("open-custom-button-manager", async (s, t) => {
    console.log("Opening custom button manager for:", t);
    const { websiteUrl: e } = t, i = w.getWebsites().find((u) => u.url === e);
    if (!i) {
      console.error("Website not found:", e);
      return;
    }
    const n = new h({
      width: 720,
      height: 650,
      parent: h.fromWebContents(s.sender) || void 0,
      // 设置为子窗口
      modal: !0,
      // 模态窗口
      frame: !1,
      titleBarStyle: "hidden",
      resizable: !1,
      show: !1,
      // 先不显示，等加载完成再显示
      webPreferences: {
        preload: p.join(x, "preload.mjs"),
        contextIsolation: !0,
        nodeIntegration: !1,
        webviewTag: !0
      }
    });
    n.setTitle(`管理自定义按钮 - ${i.name}`);
    const a = JSON.stringify(i), r = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>管理自定义按钮 - ${i.name}</title>
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
            <span class="app-title">管理自定义按钮 - ${i.name}</span>
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
          let currentWebsite = ${a};

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
                const updatedWebsite = websites.find(w => w.id === '${i.id}');
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
    n.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(r)}`), n.once("ready-to-show", () => {
      n.show();
    }), c.on("window-control", (u, d) => {
      if (u.sender === n.webContents)
        switch (d) {
          case "close":
            n.close();
            break;
        }
    }), n.on("closed", () => {
      const u = h.fromWebContents(s.sender);
      u && u.webContents.executeJavaScript(`
          window.postMessage({
            type: 'customButtonsUpdated',
            websiteId: '${i.id}'
          }, '*');
        `);
    });
  }), c.on("window-control", (s, t) => {
    const e = h.fromWebContents(s.sender);
    if (e)
      switch (t) {
        case "minimize":
          e.minimize();
          break;
        case "maximize":
          e.isMaximized() ? (e.unmaximize(), e.webContents.send("window-state-changed", !1)) : (e.maximize(), e.webContents.send("window-state-changed", !0));
          break;
        case "close":
          e.close();
          break;
      }
  });
}
g.on("window-all-closed", () => {
  process.platform !== "darwin" && (g.quit(), l = null);
});
g.on("activate", () => {
  h.getAllWindows().length === 0 && L().catch(console.error);
});
g.whenReady().then(() => {
  F();
  const s = process.argv.find((e) => e.startsWith("--website-url=")), t = process.argv.find((e) => e.startsWith("--website-name="));
  if (s) {
    const e = s.split("=")[1].replace(/"/g, ""), o = t ? t.split("=")[1].replace(/"/g, "") : void 0, i = Date.now().toString();
    C(e, i, "maximized", o).catch(console.error);
  } else
    L().catch(console.error);
});
g.on("second-instance", (s, t) => {
  const e = t.find((i) => i.startsWith("--website-url=")), o = t.find((i) => i.startsWith("--website-name="));
  if (e) {
    const i = e.split("=")[1].replace(/"/g, ""), n = o ? o.split("=")[1].replace(/"/g, "") : void 0, a = Date.now().toString();
    C(i, a, "maximized", n).catch(console.error);
  } else l && (l.isMinimized() && l.restore(), l.focus());
});
export {
  Z as MAIN_DIST,
  z as RENDERER_DIST,
  I as VITE_DEV_SERVER_URL
};
