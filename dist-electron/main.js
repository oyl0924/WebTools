var M = Object.defineProperty;
var P = (i, e, t) => e in i ? M(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var k = (i, e, t) => P(i, typeof e != "symbol" ? e + "" : e, t);
import { app as g, BrowserWindow as h, ipcMain as l, shell as C } from "electron";
import { fileURLToPath as U } from "node:url";
import b from "node:path";
import p from "node:fs";
import $ from "node:https";
import j from "node:http";
import v from "fs";
import D from "path";
const A = "websites.json";
class _ {
  constructor() {
    k(this, "storagePath");
    this.storagePath = D.join(g.getPath("userData"), A), this.initStorage();
  }
  initStorage() {
    v.existsSync(this.storagePath) || this.saveData([]);
  }
  loadData() {
    try {
      const e = v.readFileSync(this.storagePath, "utf-8");
      return JSON.parse(e);
    } catch (e) {
      return console.error("Error loading data:", e), [];
    }
  }
  saveData(e) {
    try {
      v.writeFileSync(this.storagePath, JSON.stringify(e, null, 2), "utf-8");
    } catch (t) {
      console.error("Error saving data:", t);
    }
  }
  getWebsites() {
    return this.loadData();
  }
  addWebsite(e) {
    const t = this.loadData(), o = {
      ...e,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      customButtons: e.customButtons || []
    };
    return t.push(o), this.saveData(t), o;
  }
  updateWebsite(e, t) {
    const o = this.loadData(), r = o.findIndex((n) => n.id === e);
    return r === -1 ? null : (o[r] = { ...o[r], ...t }, this.saveData(o), o[r]);
  }
  deleteWebsite(e) {
    const t = this.loadData(), o = t.findIndex((r) => r.id === e);
    return o === -1 ? !1 : (t.splice(o, 1), this.saveData(t), !0);
  }
  addCustomButton(e, t) {
    const o = this.loadData(), r = o.find((a) => a.id === e);
    if (!r) return null;
    const n = {
      ...t,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    return r.customButtons.push(n), this.saveData(o), n;
  }
  updateCustomButton(e, t, o) {
    const r = this.loadData(), n = r.find((s) => s.id === e);
    if (!n) return null;
    const a = n.customButtons.findIndex((s) => s.id === t);
    return a === -1 ? null : (n.customButtons[a] = { ...n.customButtons[a], ...o }, this.saveData(r), n.customButtons[a]);
  }
  deleteCustomButton(e, t) {
    const o = this.loadData(), r = o.find((a) => a.id === e);
    if (!r) return !1;
    const n = r.customButtons.findIndex((a) => a.id === t);
    return n === -1 ? !1 : (r.customButtons.splice(n, 1), this.saveData(o), !0);
  }
}
const f = new _(), L = {
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
class N {
  constructor() {
    k(this, "settingsPath");
    k(this, "settings");
    this.settingsPath = D.join(g.getPath("userData"), "settings.json"), this.settings = this.loadSettings();
  }
  loadSettings() {
    try {
      if (v.existsSync(this.settingsPath)) {
        const e = v.readFileSync(this.settingsPath, "utf-8"), t = JSON.parse(e);
        return { ...L, ...t };
      }
    } catch (e) {
      console.error("加载设置失败:", e);
    }
    return { ...L };
  }
  saveSettings() {
    try {
      const e = JSON.stringify(this.settings, null, 2);
      v.writeFileSync(this.settingsPath, e, "utf-8");
    } catch (e) {
      console.error("保存设置失败:", e);
    }
  }
  getSettings() {
    return { ...this.settings };
  }
  updateSettings(e) {
    return this.settings = { ...this.settings, ...e }, this.saveSettings(), this.settings;
  }
  // 检测是否应该使用黑暗模式
  shouldUseDarkMode() {
    const { darkMode: e, darkModeTimeStart: t, darkModeTimeEnd: o, isDarkMode: r } = this.settings;
    if (e === "manual")
      return r;
    if (e === "system")
      return !1;
    if (e === "time") {
      const n = /* @__PURE__ */ new Date(), a = n.getHours() * 60 + n.getMinutes(), [s, u] = t.split(":").map(Number), [d, w] = o.split(":").map(Number), y = s * 60 + u, m = d * 60 + w;
      return y <= m ? a >= y && a <= m : a >= y || a <= m;
    }
    return !1;
  }
  // 设置开机启动
  async setAutoStart(e) {
    try {
      const { app: t } = await import("electron");
      t.setLoginItemSettings({
        openAtLogin: e,
        openAsHidden: !1,
        path: t.getPath("exe"),
        args: e ? [] : ["--disable-auto-start"]
      }), this.updateSettings({ autoStart: e }), console.log(`开机启动设置已${e ? "启用" : "禁用"}`);
    } catch (t) {
      throw console.error("设置开机启动失败:", t), t;
    }
  }
  // 获取开机启动状态
  getAutoStartStatus() {
    try {
      const { app: e } = require("electron"), t = e.getLoginItemSettings(), o = t.openAtLogin || (t.executableWillLaunchAtLogin ?? !1) || t.launchItems && t.launchItems.length > 0;
      return console.log(`获取开机启动状态: ${o ? "启用" : "禁用"}`, t), o;
    } catch (e) {
      return console.error("获取开机启动状态失败:", e), !1;
    }
  }
}
const B = new N(), x = b.dirname(U(import.meta.url));
process.env.APP_ROOT = b.join(x, "..");
const E = process.env.VITE_DEV_SERVER_URL, Z = b.join(process.env.APP_ROOT, "dist-electron"), z = b.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = E ? b.join(process.env.APP_ROOT, "public") : z;
let c;
const T = /* @__PURE__ */ new Map();
function O() {
  const i = b.join(g.getPath("userData"), "icons");
  return p.existsSync(i) || p.mkdirSync(i, { recursive: !0 }), i;
}
async function I(i, e) {
  return new Promise((t) => {
    try {
      const o = O(), r = b.extname(new URL(i).pathname) || ".ico", n = b.join(o, `${e}${r}`);
      if (p.existsSync(n)) {
        t(n);
        return;
      }
      const a = p.createWriteStream(n), u = (i.startsWith("https") ? $ : j).get(i, { timeout: 3e3 }, (d) => {
        if (d.statusCode === 301 || d.statusCode === 302) {
          const w = d.headers.location;
          if (w) {
            a.close(), p.unlinkSync(n), I(w, e).then(t);
            return;
          }
        }
        if (d.statusCode !== 200) {
          a.close(), p.unlinkSync(n), t(null);
          return;
        }
        d.pipe(a), a.on("finish", () => {
          a.close(), t(n);
        });
      });
      u.on("error", () => {
        a.close(), p.existsSync(n) && p.unlinkSync(n), t(null);
      }), u.on("timeout", () => {
        u.destroy(), a.close(), p.existsSync(n) && p.unlinkSync(n), t(null);
      });
    } catch (o) {
      console.error("下载图标失败:", o), t(null);
    }
  });
}
async function R() {
  const i = B.getSettings();
  c = new h({
    width: 1200,
    height: 800,
    icon: b.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    frame: !1,
    // 无边框窗口
    titleBarStyle: "hidden",
    // 隐藏系统标题栏
    autoHideMenuBar: !0,
    show: !1,
    // 先不显示，等设置好大小后再显示
    webPreferences: {
      preload: b.join(x, "preload.mjs"),
      webviewTag: !0,
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), i.homeWindowSize === "maximized" ? c.maximize() : i.homeWindowSize === "fullscreen" && c.setFullScreen(!0), c.show(), c.webContents.on("before-input-event", (e, t) => {
    if (t.key === "Alt") {
      e.preventDefault();
      return;
    }
    t.key === "F12" ? (c != null && c.webContents.isDevToolsOpened() ? c.webContents.closeDevTools() : c == null || c.webContents.openDevTools(), e.preventDefault()) : t.key === "F5" && (c == null || c.webContents.reload(), e.preventDefault());
  }), c.webContents.on("did-finish-load", () => {
    c == null || c.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), E ? c.loadURL(E) : c.loadFile(b.join(z, "index.html"));
}
async function W(i, e, t = "maximized", o, r) {
  let n;
  typeof t == "boolean" ? n = t ? "fullscreen" : "maximized" : n = t;
  let a = b.join(process.env.VITE_PUBLIC || x, "electron-vite.svg");
  if (r)
    try {
      const d = await I(r, `window_${e}`);
      d && p.existsSync(d) && (a = d);
    } catch {
      console.log("下载网站图标失败，使用默认图标");
    }
  const s = new h({
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
      preload: b.join(x, "preload.mjs"),
      webviewTag: !0,
      contextIsolation: !0,
      nodeIntegration: !1
    }
  });
  n === "maximized" && s.maximize(), s.once("ready-to-show", () => {
    s.show();
  }), s.webContents.on("before-input-event", (d, w) => {
    w.key === "F12" ? (s.webContents.isDevToolsOpened() ? s.webContents.closeDevTools() : s.webContents.openDevTools(), d.preventDefault()) : w.key === "F5" && (s.webContents.reload(), d.preventDefault());
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
                <div class="url-display" id="urlDisplay" title="${i}">${i}</div>
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
            <webview id="webview" src="${i}" nodeintegration="false" contextIsolation="true" webpreferences="contextIsolation=true,nodeIntegration=false"></webview>
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
          closeTabBtn.addEventListener('click', () => {
            // 暂时关闭整个窗口，后续实现多标签页管理
            if (window.ipcRenderer) {
              window.ipcRenderer.send('window-control', 'close');
            }
          });

          // 标签页管理
          let tabs = [];
          let activeTabId = null;

          // 新建标签页功能
          newTabBtn.addEventListener('click', () => {
            try {
              const currentUrl = webview.src || '${i}';
              const currentTitle = currentTab.querySelector('.tab-title').textContent || '新标签页';
              createNewTab(currentUrl, currentTitle);
            } catch (error) {
              console.error('Error creating new tab:', error);
              // 使用默认URL创建新标签页
              createNewTab('${i}', '新标签页');
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

            // 在当前标签页之前插入新标签页
            currentTab.parentNode.insertBefore(tabElement, newTabBtn);

            // 创建新的webview
            const newWebview = document.createElement('webview');
            newWebview.id = 'webview-' + tabId;
            newWebview.style.cssText = 'width: 100%; height: 100%; display: none;';
            newWebview.setAttribute('nodeintegration', 'false');
            newWebview.setAttribute('contextIsolation', 'true');
            newWebview.setAttribute('webpreferences', 'contextIsolation=true,nodeIntegration=false');

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
              targetWebview.style.display = 'block';
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
            wv.addEventListener('new-window', (event) => {
              event.preventDefault();
              try {
                const newUrl = event.url;
                if (newUrl && newUrl.startsWith('http')) {
                  const currentTitle = wv.getTitle() || '新标签页';
                  createNewTab(newUrl, currentTitle);
                } else {
                  console.warn('Invalid URL for new window:', newUrl);
                }
              } catch (error) {
                console.error('Error handling new-window event:', error);
              }
            });

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
            if (tabId === 'default') {
              // 不能关闭默认标签页，改为关闭整个窗口
              if (window.ipcRenderer) {
                window.ipcRenderer.send('window-control', 'close');
              }
              return;
            }

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
              currentWv.src = '${i}';
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
            url: '${i}',
            title: '${o || "新标签页"}',
            webview: webview
          });
          activeTabId = 'default';
        <\/script>
      </body>
    </html>
  `;
  return s.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(u)), o && s.setTitle(o), s.webContents.on("dom-ready", () => {
    const d = f.getWebsites().find((w) => w.url === i);
    d && d.customButtons && s.webContents.executeJavaScript(`
        window.postMessage({
          type: 'updateCustomButtons',
          buttons: ${JSON.stringify(d.customButtons)}
        }, '*');
      `);
  }), s.webContents.on("ipc-message", (d, w, ...y) => {
    if (w === "requestCustomButtons") {
      const m = f.getWebsites().find((S) => S.url === i);
      m && m.customButtons && d.sender.send("updateCustomButtons", m.customButtons);
    } else if (w === "openNewWindow") {
      const [m, S] = y;
      W(m, Date.now().toString(), "maximized", S);
    }
  }), s.webContents.on("dom-ready", () => {
    s.webContents.executeJavaScript(`
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
  }), T.set(e, s), s.on("closed", () => {
    T.delete(e);
  }), s.webContents.on("page-title-updated", (d, w) => {
    o ? (d.preventDefault(), s.setTitle(o)) : s.setTitle(w);
  }), s;
}
function F() {
  l.handle("get-websites", () => f.getWebsites()), l.handle("add-website", (i, e) => f.addWebsite(e)), l.handle("update-website", (i, e, t) => f.updateWebsite(e, t)), l.handle("delete-website", (i, e) => f.deleteWebsite(e)), l.handle("add-custom-button", (i, e, t) => f.addCustomButton(e, t)), l.handle("update-custom-button", (i, e, t, o) => f.updateCustomButton(e, t, o)), l.handle("delete-custom-button", (i, e, t) => f.deleteCustomButton(e, t)), l.handle("create-window", async (i, e, t = "maximized", o, r) => {
    const n = Date.now().toString();
    return await W(e, n, t, o, r), n;
  }), l.handle("navigate-to-url", (i, e, t) => {
    const o = T.get(e);
    o && o.webContents.loadURL(t);
  }), l.handle("add-to-desktop", async (i, e) => {
    try {
      const t = g.getPath("desktop"), o = b.join(t, `${e.name}.lnk`), r = process.execPath;
      let n = r;
      if (e.icon && e.icon.includes("favicon.ico"))
        try {
          const s = await I(e.icon, e.id || Date.now().toString());
          s && (n = s);
        } catch {
          console.log("favicon.ico下载失败，尝试备用方案");
        }
      if (n === r && e.url)
        try {
          const u = `${new URL(e.url).origin}/favicon.ico`, d = await I(u, `root_${e.id || Date.now().toString()}`);
          d && (n = d);
        } catch {
          console.log("根目录favicon获取失败");
        }
      if (n === r) {
        const s = b.join(process.env.VITE_PUBLIC || x, "icon.ico");
        p.existsSync(s) && (n = s);
      }
      if (C.writeShortcutLink(o, {
        target: r,
        args: `--website-url="${e.url}" --website-name="${e.name}"`,
        description: e.name,
        icon: n,
        iconIndex: 0
      }))
        return { success: !0, iconPath: n };
      throw new Error("创建快捷方式失败");
    } catch (t) {
      throw console.error("添加到桌面失败:", t), t;
    }
  }), l.handle("get-settings", () => B.getSettings()), l.handle("save-settings", (i, e) => {
    const t = B.updateSettings(e);
    return e.autoStart !== void 0 && B.setAutoStart(e.autoStart).catch(console.error), t;
  }), l.handle("get-auto-start-status", () => B.getAutoStartStatus()), l.on("open-add-custom-button", (i, e) => {
    console.log("Received open-add-custom-button message (legacy):", e);
  }), l.on("open-custom-button-manager", async (i, e) => {
    console.log("Opening custom button manager for:", e);
    const { websiteUrl: t } = e, r = f.getWebsites().find((u) => u.url === t);
    if (!r) {
      console.error("Website not found:", t);
      return;
    }
    const n = new h({
      width: 720,
      height: 650,
      parent: h.fromWebContents(i.sender) || void 0,
      // 设置为子窗口
      modal: !0,
      // 模态窗口
      frame: !1,
      titleBarStyle: "hidden",
      resizable: !1,
      show: !1,
      // 先不显示，等加载完成再显示
      webPreferences: {
        preload: b.join(x, "preload.mjs"),
        contextIsolation: !0,
        nodeIntegration: !1,
        webviewTag: !0
      }
    });
    n.setTitle(`管理自定义按钮 - ${r.name}`);
    const a = JSON.stringify(r), s = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>管理自定义按钮 - ${r.name}</title>
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
            <span class="app-title">管理自定义按钮 - ${r.name}</span>
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
                const updatedWebsite = websites.find(w => w.id === '${r.id}');
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
    n.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(s)}`), n.once("ready-to-show", () => {
      n.show();
    }), l.on("window-control", (u, d) => {
      if (u.sender === n.webContents)
        switch (d) {
          case "close":
            n.close();
            break;
        }
    }), n.on("closed", () => {
      const u = h.fromWebContents(i.sender);
      u && u.webContents.executeJavaScript(`
          window.postMessage({
            type: 'customButtonsUpdated',
            websiteId: '${r.id}'
          }, '*');
        `);
    });
  }), l.on("window-control", (i, e) => {
    const t = h.fromWebContents(i.sender);
    if (t)
      switch (e) {
        case "minimize":
          t.minimize();
          break;
        case "maximize":
          t.isMaximized() ? (t.unmaximize(), t.webContents.send("window-state-changed", !1)) : (t.maximize(), t.webContents.send("window-state-changed", !0));
          break;
        case "close":
          t.close();
          break;
      }
  }), l.on("open-external", (i, e) => {
    C.openExternal(e).catch((t) => {
      console.error("打开外部链接失败:", t);
    });
  });
}
g.on("window-all-closed", () => {
  process.platform !== "darwin" && (g.quit(), c = null);
});
g.on("activate", () => {
  h.getAllWindows().length === 0 && R().catch(console.error);
});
g.whenReady().then(() => {
  F();
  const i = process.argv.find((t) => t.startsWith("--website-url=")), e = process.argv.find((t) => t.startsWith("--website-name="));
  if (i) {
    const t = i.split("=")[1].replace(/"/g, ""), o = e ? e.split("=")[1].replace(/"/g, "") : void 0, r = Date.now().toString();
    W(t, r, "maximized", o).catch(console.error);
  } else
    R().catch(console.error);
});
g.on("second-instance", (i, e) => {
  const t = e.find((r) => r.startsWith("--website-url=")), o = e.find((r) => r.startsWith("--website-name="));
  if (t) {
    const r = t.split("=")[1].replace(/"/g, ""), n = o ? o.split("=")[1].replace(/"/g, "") : void 0, a = Date.now().toString();
    W(r, a, "maximized", n).catch(console.error);
  } else c && (c.isMinimized() && c.restore(), c.focus());
});
export {
  Z as MAIN_DIST,
  z as RENDERER_DIST,
  E as VITE_DEV_SERVER_URL
};
