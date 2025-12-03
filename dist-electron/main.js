var q = Object.defineProperty;
var H = (a, t, e) => t in a ? q(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var A = (a, t, e) => H(a, typeof t != "symbol" ? t + "" : t, e);
import { app as x, BrowserWindow as z, ipcMain as l, shell as R } from "electron";
import { fileURLToPath as J } from "node:url";
import f from "node:path";
import m from "node:fs";
import V from "node:https";
import G from "node:http";
import y from "fs";
import N from "path";
const K = "websites.json";
class Y {
  constructor() {
    A(this, "storagePath");
    this.storagePath = N.join(x.getPath("userData"), K), this.initStorage();
  }
  initStorage() {
    y.existsSync(this.storagePath) || this.saveData([]);
  }
  loadData() {
    try {
      const t = y.readFileSync(this.storagePath, "utf-8");
      return JSON.parse(t);
    } catch (t) {
      return console.error("Error loading data:", t), [];
    }
  }
  saveData(t) {
    try {
      y.writeFileSync(this.storagePath, JSON.stringify(t, null, 2), "utf-8");
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
    const o = this.loadData(), n = o.findIndex((r) => r.id === t);
    return n === -1 ? null : (o[n] = { ...o[n], ...e }, this.saveData(o), o[n]);
  }
  deleteWebsite(t) {
    const e = this.loadData(), o = e.findIndex((n) => n.id === t);
    return o === -1 ? !1 : (e.splice(o, 1), this.saveData(e), !0);
  }
  addCustomButton(t, e) {
    const o = this.loadData(), n = o.find((i) => i.id === t);
    if (!n) return null;
    const r = {
      ...e,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    return n.customButtons.push(r), this.saveData(o), r;
  }
  updateCustomButton(t, e, o) {
    const n = this.loadData(), r = n.find((d) => d.id === t);
    if (!r) return null;
    const i = r.customButtons.findIndex((d) => d.id === e);
    return i === -1 ? null : (r.customButtons[i] = { ...r.customButtons[i], ...o }, this.saveData(n), r.customButtons[i]);
  }
  deleteCustomButton(t, e) {
    const o = this.loadData(), n = o.find((i) => i.id === t);
    if (!n) return !1;
    const r = n.customButtons.findIndex((i) => i.id === e);
    return r === -1 ? !1 : (n.customButtons.splice(r, 1), this.saveData(o), !0);
  }
}
const v = new Y(), _ = {
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
class Z {
  constructor() {
    A(this, "settingsPath");
    A(this, "settings");
    this.settingsPath = N.join(x.getPath("userData"), "settings.json"), this.settings = this.loadSettings();
  }
  loadSettings() {
    try {
      if (y.existsSync(this.settingsPath)) {
        const t = y.readFileSync(this.settingsPath, "utf-8"), e = JSON.parse(t);
        return { ..._, ...e };
      }
    } catch (t) {
      console.error("加载设置失败:", t);
    }
    return { ..._ };
  }
  saveSettings() {
    try {
      const t = JSON.stringify(this.settings, null, 2);
      y.writeFileSync(this.settingsPath, t, "utf-8");
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
    const { darkMode: t, darkModeTimeStart: e, darkModeTimeEnd: o, isDarkMode: n } = this.settings;
    if (t === "manual")
      return n;
    if (t === "system")
      return !1;
    if (t === "time") {
      const r = /* @__PURE__ */ new Date(), i = r.getHours() * 60 + r.getMinutes(), [d, b] = e.split(":").map(Number), [g, I] = o.split(":").map(Number), B = d * 60 + b, s = g * 60 + I;
      return B <= s ? i >= B && i <= s : i >= B || i <= s;
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
const E = new Z();
function Q(a, t, e, o) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${t || "WebTools"}</title>
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
            overflow-x: auto;
            scrollbar-width: thin;
            min-width: 0;
          }
          .title-bar-tabs::-webkit-scrollbar {
            height: 4px;
          }
          .title-bar-tabs::-webkit-scrollbar-track {
            background: transparent;
          }
          .title-bar-tabs::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 2px;
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
            flex-shrink: 0;
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
          .url-input {
            flex: 1;
            padding: 6px 10px;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.88);
            min-width: 0;
            border: none;
            outline: none;
            background: transparent;
            width: 100%;
          }
          .url-input:focus {
            background: #fff;
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
          /* 账号管理弹窗样式 */
          .account-modal-mask {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.35);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 999;
          }
          .account-modal-mask.show {
            display: flex;
          }
          .account-modal {
            width: 420px;
            max-width: calc(100% - 40px);
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            padding: 16px 20px 20px;
            box-sizing: border-box;
          }
          .account-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
          }
          .account-modal-title {
            font-size: 16px;
            font-weight: 600;
            color: rgba(0, 0, 0, 0.88);
          }
          .account-modal-close {
            border: none;
            background: transparent;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            padding: 4px;
          }
          .account-modal-toolbar {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 8px;
            margin-bottom: 12px;
          }
          .account-list {
            max-height: 260px;
            overflow-y: auto;
            border: 1px solid #f0f0f0;
            border-radius: 6px;
          }
          .account-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            border-bottom: 1px solid #f0f0f0;
          }
          .account-item:last-child {
            border-bottom: none;
          }
          .account-item-left {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
          }
          .account-name {
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .account-tag-default {
            font-size: 11px;
            color: #52c41a;
            padding: 0 6px;
            border-radius: 10px;
            background: #f6ffed;
            border: 1px solid #b7eb8f;
          }
          .account-actions {
            display: flex;
            gap: 6px;
          }
          .account-small-btn {
            border: 1px solid #d9d9d9;
            border-radius: 4px;
            background: #ffffff;
            padding: 2px 6px;
            font-size: 12px;
            cursor: pointer;
          }
          .account-small-btn:hover {
            color: #40a9ff;
            border-color: #40a9ff;
          }
          .account-small-btn-danger {
            border-color: #ff4d4f;
            color: #ff4d4f;
          }
          .account-small-btn-danger:hover {
            background: #fff1f0;
          }
          .account-empty {
            padding: 24px 12px;
            text-align: center;
            color: rgba(0, 0, 0, 0.45);
            font-size: 13px;
          }
          .account-input-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
          }
          .account-input {
            flex: 1;
            height: 28px;
            border-radius: 4px;
            border: 1px solid #d9d9d9;
            padding: 0 8px;
            font-size: 13px;
            outline: none;
          }
          .account-input:focus {
            border-color: #40a9ff;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
          }
          .account-input-error {
            border-color: #ff4d4f;
          }
          .account-input-error-text {
            margin-top: 4px;
            font-size: 12px;
            color: #ff4d4f;
          }
          .account-modal-footer {
            margin-top: 12px;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }
        </style>
      </head>
      <body>
        <div class="app-container">
          <!-- 自定义标题栏 -->
          <div class="title-bar">
            <div class="title-bar-tabs">
              <div class="tab active" id="default">
                <span class="tab-title">${t || "新标签页"}</span>
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
                <input type="text" class="url-input" id="urlInput" value="${a}" spellcheck="false">
                <div class="nav-buttons">
                  <button class="nav-button" id="addBtn" title="新增">
                    <svg viewBox="64 64 896 896" focusable="false" data-icon="plus" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z"></path><path d="M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z"></path></svg>
                  </button>
                  <button class="nav-button" id="reloadBtn" title="刷新">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <polyline points="1 20 1 14 7 14"></polyline>
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                  </button>
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
                <button class="ant-btn ant-btn-default" id="switchBtn" title="切换" style="font-size: 12px; padding: 2px 8px; height: 24px;">切换</button>
              </div>
            </div>
          </div>
          <div class="webview-container">
            <webview id="webview" src="${a}" ${o ? 'partition="' + o + '"' : ""} nodeintegration="false" contextIsolation="true" webpreferences="contextIsolation=true,nodeIntegration=false" allowpopups="true" webSecurity="true"></webview>
          </div>
          <!-- 账号管理弹窗 -->
          <div class="account-modal-mask" id="accountModalMask">
            <div class="account-modal">
              <div class="account-modal-header">
                <div class="account-modal-title">添加账号</div>
                <button class="account-modal-close" id="accountModalClose">×</button>
              </div>
              <div class="account-modal-toolbar">
                <button class="ant-btn ant-btn-primary" id="accountAddBtn" style="font-size: 12px; padding: 2px 10px; height: 28px;">添加</button>
              </div>
              <div class="account-list" id="accountList"></div>
              <div class="account-modal-footer">
                <button class="ant-btn ant-btn-default" id="accountCancelBtn" style="font-size: 12px; padding: 2px 10px; height: 28px;">取消</button>
                <button class="ant-btn ant-btn-success" id="accountConfirmBtn" style="font-size: 12px; padding: 2px 10px; height: 28px;">确定</button>
              </div>
              <!-- 内部添加/编辑账号的输入区域 -->
              <div class="account-input-row" id="accountInputRow" style="display: none;">
                <input class="account-input" id="accountNameInput" placeholder="账号名称" />
                <button class="ant-btn ant-btn-primary" id="accountSaveBtn" style="font-size: 12px; padding: 0 10px; height: 28px;">保存</button>
              </div>
              <div class="account-input-error-text" id="accountNameError" style="display: none;">账号名称不能为空</div>
            </div>
          </div>
        </div>
        <script>
          const websiteId = '${e || ""}';
          const webview = document.getElementById('webview');
          const accountModalMask = document.getElementById('accountModalMask');
          const accountModalClose = document.getElementById('accountModalClose');
          const accountAddBtn = document.getElementById('accountAddBtn');
          const accountList = document.getElementById('accountList');
          const accountCancelBtn = document.getElementById('accountCancelBtn');
          const accountConfirmBtn = document.getElementById('accountConfirmBtn');
          const accountInputRow = document.getElementById('accountInputRow');
          const accountNameInput = document.getElementById('accountNameInput');
          const accountNameError = document.getElementById('accountNameError');
          const accountSaveBtn = document.getElementById('accountSaveBtn');

          let accountState = {
            key: '',
            list: [],
            selectedAccountId: '',
            editingAccountId: '',
          };
          const backBtn = document.getElementById('backBtn');
          const forwardBtn = document.getElementById('forwardBtn');
          const homeBtn = document.getElementById('homeBtn');
          const reloadBtn = document.getElementById('reloadBtn');
          const switchBtn = document.getElementById('switchBtn');
          const urlInput = document.getElementById('urlInput');
          const addBtn = document.getElementById('addBtn');
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
              const homeUrl = '${a}';
              createNewTab(homeUrl, '新标签页');
            } catch (error) {
              console.error('Error creating new tab:', error);
              // 使用默认URL创建新标签页
              createNewTab('${a}', '新标签页');
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
            const basePartition = webview && webview.getAttribute('partition');
            if (basePartition) {
              newWebview.setAttribute('partition', basePartition);
            }

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
                if (urlInput) {
                  urlInput.value = targetWebview.src;
                  urlInput.title = targetWebview.src;
                }
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
                if (urlInput) {
                  urlInput.value = wv.src;
                  urlInput.title = wv.src;
                }
                updateNavButtons();
              }

              // 如果有待恢复的存储快照，在首次 dom-ready 时应用
              if (window.__pendingStorageSnapshot) {
                try {
                  var snapshot = window.__pendingStorageSnapshot;
                  window.__pendingStorageSnapshot = null;
                  var script = '(function(){try{var snapshot=' + JSON.stringify(snapshot) + ';' +
                    'var apply=function(target,data){if(!target||!data)return;for(var key in data){if(!Object.prototype.hasOwnProperty.call(data,key))continue;try{var value=data[key];if(value===null||typeof value==="undefined"){target.removeItem(key);}else{target.setItem(key,String(value));}}catch(e){}}};' +
                    'apply(window.localStorage,snapshot.localStorage);' +
                    'apply(window.sessionStorage,snapshot.sessionStorage);' +
                    '}catch(e){console.warn("恢复本地存储快照失败:",e);}})();';
                  wv.executeJavaScript(script).catch(function(e){console.error('应用存储快照失败:', e);});
                } catch (e) {
                  console.error('构造存储快照脚本失败:', e);
                  window.__pendingStorageSnapshot = null;
                }
              }
            });

            wv.addEventListener('did-navigate', () => {
              if (wv === window.currentWebview) {
                if (urlInput) {
                  urlInput.value = wv.src;
                  urlInput.title = wv.src;
                }
                updateNavButtons();
              }
            });

            // 处理新窗口打开请求（target="_blank"）
            // 注意：具体拦截逻辑已移动到主进程的 webContents.setWindowOpenHandler，
            // 然后通过 'webview-new-window' 事件通知当前窗口在标签页中打开。
            // 这里不再直接使用 webview 的 new-window 事件，以避免在不同 Electron 版本下行为不一致。

            // 处理页面标题更新
            wv.addEventListener('page-title-updated', (event) => {
              // 默认标签页的 webview.id 是 'webview'，需要特殊处理成 'default'
              const rawId = wv.id || '';
              const tabId = rawId === 'webview' ? 'default' : rawId.replace('webview-', '');
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

          // 根据账号 partition 重建 webview，会清空所有标签页并只保留一个默认标签页
          function switchToAccountPartition(partition, storageSnapshot) {
            if (!partition) {
              return;
            }
            var container = document.querySelector('.webview-container');
            if (!container) {
              return;
            }

            // 记录待应用的存储快照，在新 webview dom-ready 时恢复
            if (storageSnapshot) {
              window.__pendingStorageSnapshot = storageSnapshot;
            } else {
              window.__pendingStorageSnapshot = null;
            }

            // 移除容器内所有 webview
            var existingWebviews = container.querySelectorAll('webview');
            existingWebviews.forEach(function (wv) {
              try {
                wv.remove();
              } catch (e) {}
            });

            // 重置标签页状态，只保留默认标签配置
            tabs = [];
            activeTabId = 'default';

            var newWebview = document.createElement('webview');
            newWebview.id = 'webview';
            newWebview.style.cssText = 'width: 100%; height: 100%;';
            newWebview.setAttribute('nodeintegration', 'false');
            newWebview.setAttribute('contextIsolation', 'true');
            newWebview.setAttribute('webpreferences', 'contextIsolation=true,nodeIntegration=false');
            newWebview.setAttribute('allowpopups', 'true');
            newWebview.setAttribute('webSecurity', 'true');
            newWebview.setAttribute('partition', partition);

            var targetUrl = (urlInput && urlInput.value) || '${a}';
            if (targetUrl && (targetUrl.indexOf('http://') === 0 || targetUrl.indexOf('https://') === 0)) {
              newWebview.src = targetUrl;
            } else {
              newWebview.src = '${a}';
            }

            container.appendChild(newWebview);

            window.currentWebview = newWebview;
            setupWebviewListeners(newWebview);

            tabs.push({
              id: 'default',
              url: newWebview.src,
              title: '${t || "新标签页"}',
              webview: newWebview,
            });

            setTimeout(function () {
              if (urlInput) {
                urlInput.value = newWebview.src;
                urlInput.title = newWebview.src;
              }
              updateNavButtons();
            }, 200);
          }

          // 标签页点击事件委托
          document.addEventListener('click', (e) => {
            const target = e.target;
            if (!(target instanceof HTMLElement)) {
              return;
            }
            // 标签页点击切换
            if (target.closest('.tab') && !target.classList.contains('tab-close')) {
              const tab = target.closest('.tab');
              const tabId = tab && tab.id;
              if (tabId && tabs.find(t => t.id === tabId)) {
                switchToTab(tabId);
              }
            }

            // 标签页关闭按钮（左键点击关闭图标）
            if (target.classList.contains('tab-close')) {
              const tabId = target.getAttribute('data-tab-id');
              if (tabId) {
                closeTab(tabId);
              }
            }
          });

          // 标签页鼠标中键关闭功能
          document.addEventListener('auxclick', (e) => {
            if (e.button !== 1) return;
            const target = e.target;
            if (!(target instanceof HTMLElement)) return;
            const tabElement = target.closest('.tab');
            if (!tabElement) return;
            const tabId = tabElement.id;
            if (!tabId) return;
            closeTab(tabId);
          });

          // 关闭标签页
          function closeTab(tabId) {
            const tabIndex = tabs.findIndex(t => t.id === tabId);
            if (tabIndex === -1) return;

            const tabInfo = tabs[tabIndex];

            const tabElement = document.getElementById(tabId);
            if (tabElement) {
              tabElement.remove();
            }

            if (tabInfo.webview) {
              tabInfo.webview.remove();
            }

            tabs.splice(tabIndex, 1);

            if (tabs.length === 0) {
              const homeUrl = '${a}';
              createNewTab(homeUrl, '新标签页');
              return;
            }

            if (activeTabId === tabId) {
              const newActiveTab = tabs[tabIndex] || tabs[tabIndex - 1] || tabs[0];
              if (newActiveTab) {
                switchToTab(newActiveTab.id);
              }
            }
          }

          if (window.ipcRenderer) {
            window.ipcRenderer.on('window-state-changed', (_event, isMaximized) => {
              const maximizeIcon = maximizeBtn.querySelector('svg');
              if (!maximizeIcon) return;
              if (isMaximized) {
                maximizeIcon.innerHTML = '<rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1"/><rect x="4" y="4" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1"/>';
                maximizeBtn.title = '向下还原';
              } else {
                maximizeIcon.innerHTML = '<rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"/>';
                maximizeBtn.title = '最大化';
              }
            });

            window.ipcRenderer.on('webview-new-window', (_event, newUrl) => {
              try {
                if (newUrl && (newUrl.startsWith('http://') || newUrl.startsWith('https://'))) {
                  createNewTab(newUrl, '新标签页');
                }
              } catch (error) {
                console.error('Error handling webview-new-window IPC:', error);
              }
            });
          }

          window.currentWebview = webview;

          backBtn.addEventListener('click', () => {
            const currentWv = window.currentWebview;
            if (currentWv && currentWv.canGoBack && currentWv.canGoBack()) {
              currentWv.goBack();
            }
          });

          forwardBtn.addEventListener('click', () => {
            const currentWv = window.currentWebview;
            if (currentWv && currentWv.canGoForward && currentWv.canGoForward()) {
              currentWv.goForward();
            }
          });

          homeBtn.addEventListener('click', () => {
            const currentWv = window.currentWebview;
            if (currentWv) {
              currentWv.src = '${a}';
            }
          });

          if (reloadBtn) {
            reloadBtn.addEventListener('click', () => {
              const currentWv = window.currentWebview;
              if (currentWv) {
                currentWv.reload();
              }
            });
          }
          
          if (addBtn) {
            addBtn.addEventListener('click', () => {
              if (window.ipcRenderer) {
                // 即使 websiteId 为空，也发送消息，让主进程尝试通过 URL 查找
                window.ipcRenderer.send('open-add-button-modal', websiteId);
              }
            });
          }
          
          if (urlInput) {
            urlInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                const url = urlInput.value;
                if (url) {
                  let finalUrl = url;
                  if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    finalUrl = 'http://' + url;
                  }
                  const currentWv = window.currentWebview;
                  if (currentWv) {
                    currentWv.src = finalUrl;
                    urlInput.blur();
                  }
                }
              } else if (e.key === 'Escape') {
                const currentWv = window.currentWebview;
                if (currentWv) {
                  urlInput.value = currentWv.src;
                  urlInput.blur();
                }
              }
            });
            
            urlInput.addEventListener('focus', () => {
              urlInput.select();
            });
            
            urlInput.addEventListener('blur', () => {
              const currentWv = window.currentWebview;
              if (currentWv) {
                // Delay slightly to allow click events on other buttons to process
                setTimeout(() => {
                   if (document.activeElement !== urlInput) {
                     urlInput.value = currentWv.src;
                   }
                }, 200);
              }
            });
          }

          function getAccountKey() {
            try {
              const currentWv = window.currentWebview || webview;
              const currentUrl = currentWv && currentWv.src ? currentWv.src : '${a}';
              const u = new URL(currentUrl);
              return u.origin;
            } catch (e) {
              try {
                const u = new URL('${a}');
                return u.origin;
              } catch {
                return websiteId || 'default-account-key';
              }
            }
          }

          async function loadAccounts() {
            if (!window.ipcRenderer) return;
            const key = getAccountKey();
            accountState.key = key;
            try {
              let group = await window.ipcRenderer.invoke('account-get-list', { key });

              if (!group || !Array.isArray(group.accounts)) {
                group = { key, accounts: [], lastUsedAccountId: undefined };
              }

              if ((!group.accounts || group.accounts.length === 0) && window.currentWebview && window.currentWebview.getWebContentsId && window.currentWebview.executeJavaScript) {
                const currentWv = window.currentWebview;
                const webContentsId = currentWv.getWebContentsId();
                const currentUrl = currentWv.src || '${a}';
                try {
                  const storageSnapshot = await currentWv.executeJavaScript('(function(){try{var makePlain=function(storage){var result={};if(!storage)return result;for(var i=0;i<storage.length;i++){var key=storage.key(i);try{result[key]=storage.getItem(key);}catch(e){result[key]=null;}}return result;};return{localStorage:makePlain(window.localStorage),sessionStorage:makePlain(window.sessionStorage)};}catch(e){console.warn("读取本地存储快照失败:",e);return{localStorage:{},sessionStorage:{}};}})();');
                  group = await window.ipcRenderer.invoke('account-save-from-cookies', {
                    key,
                    name: '默认',
                    webContentsId,
                    url: currentUrl,
                    storage: storageSnapshot,
                  });
                } catch (autoError) {
                  console.warn('自动创建默认账号失败，将继续使用空列表:', autoError);
                }
              }

              accountState.list = Array.isArray(group.accounts) ? group.accounts : [];
              accountState.selectedAccountId = group.lastUsedAccountId || (accountState.list[0] && accountState.list[0].id) || '';
              renderAccountList();
            } catch (error) {
              console.error('加载账号列表失败:', error);
            }
          }

          function openAccountModal() {
            if (!accountModalMask) return;
            accountModalMask.classList.add('show');
            accountInputRow.style.display = 'none';
            accountNameError.style.display = 'none';
            accountNameInput.value = '';
            accountState.editingAccountId = '';
            loadAccounts();
          }

          function closeAccountModal() {
            if (!accountModalMask) return;
            accountModalMask.classList.remove('show');
          }

          function renderAccountList() {
            if (!accountList) return;
            accountList.innerHTML = '';

            if (!accountState.list || accountState.list.length === 0) {
              const empty = document.createElement('div');
              empty.className = 'account-empty';
              empty.textContent = '暂无账号，点击上方“添加”保存当前登录状态为一个账号。';
              accountList.appendChild(empty);
              return;
            }

            accountState.list.forEach((item) => {
              const row = document.createElement('div');
              row.className = 'account-item';

              const left = document.createElement('div');
              left.className = 'account-item-left';

              const radio = document.createElement('input');
              radio.type = 'radio';
              radio.name = 'account-radio';
              radio.value = item.id;
              if (item.id === accountState.selectedAccountId) {
                radio.checked = true;
              }

              const nameSpan = document.createElement('span');
              nameSpan.className = 'account-name';
              nameSpan.textContent = item.name || '未命名账号';

              left.appendChild(radio);
              left.appendChild(nameSpan);

              if (item.id === accountState.list[0].id) {
                const tag = document.createElement('span');
                tag.className = 'account-tag-default';
                tag.textContent = '默认';
                left.appendChild(tag);
              }

              const actions = document.createElement('div');
              actions.className = 'account-actions';

              const editBtn = document.createElement('button');
              editBtn.className = 'account-small-btn';
              editBtn.textContent = '编辑';
              editBtn.addEventListener('click', () => {
                accountInputRow.style.display = 'flex';
                accountNameError.style.display = 'none';
                accountNameInput.value = item.name || '';
                accountState.editingAccountId = item.id;
                accountNameInput.focus();
              });

              const deleteBtn = document.createElement('button');
              deleteBtn.className = 'account-small-btn account-small-btn-danger';
              deleteBtn.textContent = '删除';
              deleteBtn.addEventListener('click', async () => {
                if (!window.ipcRenderer) return;
                try {
                  await window.ipcRenderer.invoke('account-delete', { key: accountState.key || getAccountKey(), accountId: item.id });
                  await loadAccounts();
                } catch (error) {
                  console.error('删除账号失败:', error);
                }
              });

              actions.appendChild(editBtn);
              actions.appendChild(deleteBtn);

              row.appendChild(left);
              row.appendChild(actions);

              row.addEventListener('click', (event) => {
                if (event.target === editBtn || event.target === deleteBtn) {
                  return;
                }
                accountState.selectedAccountId = item.id;
                renderAccountList();
              });

              radio.addEventListener('change', () => {
                accountState.selectedAccountId = item.id;
              });

              accountList.appendChild(row);
            });
          }

          async function captureAndSaveCurrentAccountSnapshot() {
            if (!window.ipcRenderer) return;
            const currentWv = window.currentWebview || webview;
            if (!currentWv || !currentWv.executeJavaScript) return;

            const key = accountState.key || getAccountKey();
            try {
              let group = await window.ipcRenderer.invoke('account-get-list', { key });
              if (!group || !Array.isArray(group.accounts)) {
                group = { key: key, accounts: [], lastUsedAccountId: undefined };
              }

              const partitionAttr = currentWv.getAttribute && currentWv.getAttribute('partition');
              let currentAccount = null;
              if (group.accounts && group.accounts.length > 0) {
                if (partitionAttr) {
                  currentAccount = group.accounts.find(function (item) { return item.partition === partitionAttr; });
                }
                if (!currentAccount) {
                  const fallbackId = group.lastUsedAccountId || (group.accounts[0] && group.accounts[0].id);
                  if (fallbackId) {
                    currentAccount = group.accounts.find(function (item) { return item.id === fallbackId; }) || currentAccount;
                  }
                }
              }

              const storageSnapshot = await currentWv.executeJavaScript('(function(){try{var makePlain=function(storage){var result={};if(!storage)return result;for(var i=0;i<storage.length;i++){var key=storage.key(i);try{result[key]=storage.getItem(key);}catch(e){result[key]=null;}}return result;};return{localStorage:makePlain(window.localStorage),sessionStorage:makePlain(window.sessionStorage)};}catch(e){console.warn("读取本地存储快照失败:",e);return{localStorage:{},sessionStorage:{}};}})();');

              const payload = {
                key: key,
                accountId: currentAccount ? currentAccount.id : undefined,
                name: currentAccount ? (currentAccount.name || '默认') : '默认',
                storage: storageSnapshot,
              };
              await window.ipcRenderer.invoke('account-save-from-cookies', payload);
            } catch (error) {
              console.error('保存当前账号存储快照失败:', error);
            }
          }

          if (switchBtn) {
            switchBtn.addEventListener('click', async () => {
              await captureAndSaveCurrentAccountSnapshot();
              openAccountModal();
            });
          }

          if (accountModalClose) {
            accountModalClose.addEventListener('click', () => {
              closeAccountModal();
            });
          }

          if (accountCancelBtn) {
            accountCancelBtn.addEventListener('click', () => {
              closeAccountModal();
            });
          }

          if (accountAddBtn) {
            accountAddBtn.addEventListener('click', () => {
              accountInputRow.style.display = 'flex';
              accountNameError.style.display = 'none';
              accountNameInput.value = '';
              accountState.editingAccountId = '';
              accountNameInput.focus();
            });
          }

          function validateAccountName() {
            const name = (accountNameInput.value || '').trim();
            if (!name) {
              accountNameError.style.display = 'block';
              accountNameInput.classList.add('account-input-error');
              return false;
            }
            accountNameError.style.display = 'none';
            accountNameInput.classList.remove('account-input-error');
            return true;
          }

          if (accountSaveBtn) {
            accountSaveBtn.addEventListener('click', async () => {
              if (!validateAccountName()) return;
              if (!window.ipcRenderer) return;

              const name = accountNameInput.value.trim();
              const currentWv = window.currentWebview || webview;
              if (!currentWv || !currentWv.getWebContentsId || !currentWv.executeJavaScript) return;
              const webContentsId = currentWv.getWebContentsId();
              const currentUrl = currentWv.src || '${a}';

              try {
                const storageSnapshot = await currentWv.executeJavaScript('(function(){try{var makePlain=function(storage){var result={};if(!storage)return result;for(var i=0;i<storage.length;i++){var key=storage.key(i);try{result[key]=storage.getItem(key);}catch(e){result[key]=null;}}return result;};return{localStorage:makePlain(window.localStorage),sessionStorage:makePlain(window.sessionStorage)};}catch(e){console.warn("读取本地存储快照失败:",e);return{localStorage:{},sessionStorage:{}};}})();');

                const group = await window.ipcRenderer.invoke('account-save-from-cookies', {
                  key: accountState.key || getAccountKey(),
                  accountId: accountState.editingAccountId || undefined,
                  name,
                  webContentsId,
                  url: currentUrl,
                  storage: storageSnapshot,
                });
                accountState.list = Array.isArray(group.accounts) ? group.accounts : [];
                accountState.selectedAccountId = group.lastUsedAccountId || (accountState.list[0] && accountState.list[0].id) || '';
                accountInputRow.style.display = 'none';
                accountNameInput.value = '';
                accountState.editingAccountId = '';
                renderAccountList();
              } catch (error) {
                console.error('保存账号失败:', error);
              }
            });
          }

          if (accountNameInput) {
            accountNameInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                accountSaveBtn.click();
              }
            });
          }

          if (accountConfirmBtn) {
            accountConfirmBtn.addEventListener('click', async () => {
              if (!window.ipcRenderer) {
                closeAccountModal();
                return;
              }

              if (!accountState.selectedAccountId && accountState.list.length > 0) {
                accountState.selectedAccountId = accountState.list[0].id;
              }

              if (!accountState.selectedAccountId) {
                closeAccountModal();
                return;
              }

              try {
                const key = accountState.key || getAccountKey();
                const accountId = accountState.selectedAccountId;
                const group = await window.ipcRenderer.invoke('account-apply', {
                  key: key,
                  accountId: accountId,
                });

                if (group && group.accounts && group.accounts.length > 0) {
                  accountState.list = group.accounts;
                  accountState.selectedAccountId = group.lastUsedAccountId || accountId;

                  var targetAccount = group.accounts.find(function (item) {
                    return item.id === accountState.selectedAccountId;
                  });

                  if (targetAccount && targetAccount.partition) {
                    switchToAccountPartition(targetAccount.partition, targetAccount.storageSnapshot || null);
                  }
                }
              } catch (error) {
                console.error('切换账号失败:', error);
              }

              closeAccountModal();
            });
          }

          setupWebviewListeners(webview);

          window.addEventListener('message', (event) => {
            if (event.data.type === 'updateCustomButtons') {
              updateCustomButtons(event.data.buttons);
            } else if (event.data.type === 'navigateToUrl') {
              webview.src = event.data.url;
            }
          });

          function updateCustomButtons(buttons) {
            const container = document.getElementById('customButtons');
            if (!container) return;
            container.innerHTML = '';

            if (buttons && buttons.length > 0) {
              buttons.forEach((button) => {
                const btn = document.createElement('button');
                btn.className = 'ant-btn ant-btn-primary';
                btn.textContent = button.name;
                btn.title = button.name;
                btn.style.cssText = 'font-size: 12px; padding: 2px 8px; height: 24px;';
                btn.addEventListener('click', () => {
                  const targetWebview = window.currentWebview || webview;
                  if (button.openMode === 'currentPage') {
                    if (targetWebview) {
                      targetWebview.src = button.url;
                    }
                  } else if (button.openMode === 'newTab') {
                    try {
                      createNewTab(button.url, button.name || '新标签页');
                    } catch (error) {
                      console.error('createNewTab failed, fallback to new window:', error);
                      window.parent.postMessage({
                        type: 'openNewWindow',
                        url: button.url,
                        name: button.name
                      }, '*');
                    }
                  } else {
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

          window.parent.postMessage({ type: 'requestCustomButtons' }, '*');

          tabs.push({
            id: 'default',
            url: '${a}',
            title: '${t || "新标签页"}',
            webview: webview
          });
          activeTabId = 'default';
        <\/script>
      </body>
    </html>
  `;
}
const X = "accounts.json", W = 2;
class tt {
  constructor() {
    A(this, "storagePath");
    this.storagePath = N.join(x.getPath("userData"), X), this.ensureInitialized();
  }
  ensureInitialized() {
    if (!y.existsSync(this.storagePath)) {
      this.saveData({ version: W, items: [] });
      return;
    }
    try {
      const t = y.readFileSync(this.storagePath, "utf-8"), e = JSON.parse(t);
      (typeof e.version != "number" || !Array.isArray(e.items)) && this.saveData({ version: W, items: [] });
    } catch {
      this.saveData({ version: W, items: [] });
    }
  }
  loadData() {
    try {
      const t = y.readFileSync(this.storagePath, "utf-8"), e = JSON.parse(t);
      return !e || typeof e.version != "number" || !Array.isArray(e.items) ? { version: W, items: [] } : e;
    } catch {
      return { version: W, items: [] };
    }
  }
  saveData(t) {
    const e = {
      version: W,
      items: t.items || []
    };
    y.writeFileSync(this.storagePath, JSON.stringify(e, null, 2), "utf-8");
  }
  findGroup(t, e) {
    return t.find((o) => o.key === e);
  }
  createPartitionName(t, e) {
    return `persist:webtools_${t.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40)}_${e}`;
  }
  getAccountsForKey(t) {
    const e = this.loadData(), o = this.findGroup(e.items, t);
    if (o)
      return o;
    const n = { key: t, accounts: [] };
    return e.items.push(n), this.saveData(e), n;
  }
  saveAccount(t, e) {
    const o = this.loadData();
    let n = this.findGroup(o.items, t);
    if (n || (n = { key: t, accounts: [] }, o.items.push(n)), e.id) {
      const r = n.accounts.findIndex((i) => i.id === e.id);
      if (r !== -1) {
        const i = n.accounts[r], d = e.partition || i.partition || this.createPartitionName(t, i.id);
        n.accounts[r] = {
          ...i,
          name: e.name,
          partition: d,
          storageSnapshot: e.storageSnapshot ?? i.storageSnapshot
        };
      } else {
        const i = e.id, d = e.partition || this.createPartitionName(t, i);
        n.accounts.push({ id: i, name: e.name, partition: d, storageSnapshot: e.storageSnapshot });
      }
    } else {
      const r = Date.now().toString(36) + Math.random().toString(36).slice(2, 10), i = e.partition || this.createPartitionName(t, r);
      n.accounts.push({ id: r, name: e.name, partition: i, storageSnapshot: e.storageSnapshot }), n.lastUsedAccountId = r;
    }
    return this.saveData(o), n;
  }
  deleteAccount(t, e) {
    const o = this.loadData();
    let n = this.findGroup(o.items, t);
    n || (n = { key: t, accounts: [] }, o.items.push(n));
    const r = n.accounts.length;
    return n.accounts = n.accounts.filter((i) => i.id !== e), n.lastUsedAccountId === e && (n.lastUsedAccountId = n.accounts.length > 0 ? n.accounts[0].id : void 0), r !== n.accounts.length && this.saveData(o), n;
  }
  setLastUsedAccount(t, e) {
    const o = this.loadData();
    let n = this.findGroup(o.items, t);
    return n || (n = { key: t, accounts: [] }, o.items.push(n)), n.lastUsedAccountId = e, this.saveData(o), n;
  }
}
const k = new tt(), C = f.dirname(J(import.meta.url));
process.env.APP_ROOT = f.join(C, "..");
const U = process.env.VITE_DEV_SERVER_URL, D = f.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = U ? f.join(process.env.APP_ROOT, "public") : D;
let c;
const T = /* @__PURE__ */ new Map();
function $(a) {
  a.on("maximize", () => {
    a.webContents.send("window-state-changed", !0);
  }), a.on("unmaximize", () => {
    a.webContents.send("window-state-changed", !1);
  }), a.on("enter-full-screen", () => {
    a.webContents.send("window-state-changed", !0);
  }), a.on("leave-full-screen", () => {
    a.webContents.send("window-state-changed", !1);
  }), a.webContents.on("did-finish-load", () => {
    const t = a.isMaximized() || a.isFullScreen();
    a.webContents.send("window-state-changed", t);
  });
}
function et() {
  const a = f.join(x.getPath("userData"), "icons");
  return m.existsSync(a) || m.mkdirSync(a, { recursive: !0 }), a;
}
async function L(a, t) {
  return new Promise((e) => {
    try {
      const o = et(), n = f.extname(new URL(a).pathname) || ".ico", r = f.join(o, `${t}${n}`);
      if (m.existsSync(r)) {
        e(r);
        return;
      }
      const i = m.createWriteStream(r), b = (a.startsWith("https") ? V : G).get(a, { timeout: 3e3 }, (g) => {
        if (g.statusCode === 301 || g.statusCode === 302) {
          const I = g.headers.location;
          if (I) {
            i.close(), m.unlinkSync(r), L(I, t).then(e);
            return;
          }
        }
        if (g.statusCode !== 200) {
          i.close(), m.unlinkSync(r), e(null);
          return;
        }
        g.pipe(i), i.on("finish", () => {
          i.close(), e(r);
        });
      });
      b.on("error", () => {
        i.close(), m.existsSync(r) && m.unlinkSync(r), e(null);
      }), b.on("timeout", () => {
        b.destroy(), i.close(), m.existsSync(r) && m.unlinkSync(r), e(null);
      });
    } catch (o) {
      console.error("下载图标失败:", o), e(null);
    }
  });
}
async function j() {
  const a = E.getSettings();
  c = new z({
    width: 1200,
    height: 800,
    icon: f.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    frame: !1,
    // 无边框窗口
    titleBarStyle: "hidden",
    // 隐藏系统标题栏
    autoHideMenuBar: !0,
    show: !1,
    // 先不显示，等设置好大小后再显示
    webPreferences: {
      preload: f.join(C, "preload.mjs"),
      webviewTag: !0,
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), $(c), a.homeWindowSize === "maximized" ? c.maximize() : a.homeWindowSize === "fullscreen" && c.setFullScreen(!0), c.show(), c.webContents.on("before-input-event", (t, e) => {
    if (e.key === "Alt") {
      t.preventDefault();
      return;
    }
    e.key === "F12" ? (c != null && c.webContents.isDevToolsOpened() ? c.webContents.closeDevTools() : c == null || c.webContents.openDevTools(), t.preventDefault()) : e.key === "F5" && (c == null || c.webContents.reload(), t.preventDefault());
  }), c.webContents.on("did-finish-load", () => {
    c == null || c.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), U ? c.loadURL(U) : c.loadFile(f.join(D, "index.html"));
}
function nt(a, t) {
  try {
    return new URL(a).origin;
  } catch {
    return t || "default-account-key";
  }
}
async function M(a, t, e = "maximized", o, n, r = 1200, i = 800, d) {
  let b;
  typeof e == "boolean" ? b = e ? "fullscreen" : "maximized" : b = e;
  const g = nt(a, d);
  let I;
  try {
    let u = k.getAccountsForKey(g);
    (!u.accounts || u.accounts.length === 0) && (u = k.saveAccount(g, { name: "默认" }));
    const w = u.accounts[0] ? u.accounts[0].id : void 0, S = u.lastUsedAccountId || w, p = S ? u.accounts.find((h) => h.id === S) : void 0;
    p && p.partition && (I = p.partition);
  } catch (u) {
    console.error("解析账号 partition 失败:", u);
  }
  let B = f.join(process.env.VITE_PUBLIC || C, "electron-vite.svg");
  if (n)
    try {
      const u = await L(n, `window_${t}`);
      u && m.existsSync(u) && (B = u);
    } catch {
      console.log("下载网站图标失败，使用默认图标");
    }
  const s = new z({
    width: 1200,
    height: 800,
    show: !1,
    // 先不显示，等设置好大小后再显示
    fullscreen: b === "fullscreen",
    frame: !1,
    // 无边框窗口
    titleBarStyle: "hidden",
    // 隐藏系统标题栏
    autoHideMenuBar: !0,
    icon: B,
    webPreferences: {
      preload: f.join(C, "preload.mjs"),
      webviewTag: !0,
      contextIsolation: !0,
      nodeIntegration: !1
    }
  });
  s.__websiteUrl = a, $(s), b === "maximized" && s.maximize(), s.once("ready-to-show", () => {
    s.show();
  }), s.webContents.on("before-input-event", (u, w) => {
    w.key === "F12" ? (s.webContents.isDevToolsOpened() ? s.webContents.closeDevTools() : s.webContents.openDevTools(), u.preventDefault()) : w.key === "F5" && (s.webContents.reload(), u.preventDefault());
  }), s.webContents.on("did-attach-webview", (u, w) => {
    !w || !w.setWindowOpenHandler || w.setWindowOpenHandler((S) => {
      try {
        const p = S.url;
        if (p && (p.startsWith("http://") || p.startsWith("https://")))
          return s.webContents.send("webview-new-window", p), { action: "deny" };
      } catch (p) {
        console.error("Error in webview windowOpen handler:", p);
      }
      return { action: "allow" };
    });
  });
  const O = Q(a, o, d, I);
  return s.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(O)), o && s.setTitle(o), s.webContents.on("dom-ready", () => {
    const u = v.getWebsites().find((w) => w.url === a);
    u && u.customButtons && s.webContents.executeJavaScript(`
        window.postMessage({
          type: 'updateCustomButtons',
          buttons: ${JSON.stringify(u.customButtons)}
        }, '*');
      `);
  }), s.webContents.on("ipc-message", (u, w, ...S) => {
    if (w === "requestCustomButtons") {
      const p = v.getWebsites().find((h) => h.url === a);
      p && p.customButtons && u.sender.send("updateCustomButtons", p.customButtons);
    } else if (w === "openNewWindow") {
      const [p, h] = S;
      M(p, Date.now().toString(), "maximized", h);
    } else if (w === "openAddButtonModal") {
      let h = S[0];
      if (!h) {
        const P = v.getWebsites().find((F) => F.url === a);
        P && (h = P.id);
      }
      h && c && (c.webContents.send("open-add-button-modal", h), c.show(), c.isMinimized() && c.restore());
    }
  }), T.set(t, s), s.on("closed", () => {
    T.delete(t);
  }), s.webContents.on("page-title-updated", (u, w) => {
    o ? (u.preventDefault(), s.setTitle(o)) : s.setTitle(w);
  }), s;
}
function ot() {
  l.handle("account-get-list", async (a, t) => {
    const { key: e } = t;
    return k.getAccountsForKey(e);
  }), l.handle("account-save-from-cookies", async (a, t) => {
    const { key: e, accountId: o, name: n, storage: r } = t;
    try {
      return k.saveAccount(e, {
        id: o,
        name: n,
        storageSnapshot: r
      });
    } catch (i) {
      throw console.error("保存账号失败:", i), i;
    }
  }), l.handle("account-apply", async (a, t) => {
    const { key: e, accountId: o } = t;
    try {
      const n = k.getAccountsForKey(e);
      return n.accounts.find((d) => d.id === o) ? k.setLastUsedAccount(e, o) : n;
    } catch (n) {
      throw console.error("应用账号失败:", n), n;
    }
  }), l.handle("account-delete", async (a, t) => {
    const { key: e, accountId: o } = t;
    try {
      return k.deleteAccount(e, o);
    } catch (n) {
      throw console.error("删除账号失败:", n), n;
    }
  }), l.handle("get-websites", () => v.getWebsites()), l.handle("add-website", (a, t) => v.addWebsite(t)), l.handle("update-website", (a, t, e) => v.updateWebsite(t, e)), l.handle("delete-website", (a, t) => v.deleteWebsite(t)), l.handle("add-custom-button", (a, t, e) => v.addCustomButton(t, e)), l.handle("update-custom-button", (a, t, e, o) => v.updateCustomButton(t, e, o)), l.handle("delete-custom-button", (a, t, e) => v.deleteCustomButton(t, e)), l.handle("create-window", async (a, t, e = "maximized", o, n, r, i, d) => {
    const b = Date.now().toString();
    return await M(t, b, e, o, n, r, i, d), b;
  }), l.handle("navigate-to-url", (a, t, e) => {
    const o = T.get(t);
    o && o.webContents.loadURL(e);
  }), l.handle("add-to-desktop", async (a, t) => {
    try {
      const e = x.getPath("desktop"), o = f.join(e, `${t.name}.lnk`), n = process.execPath;
      let r = n;
      if (t.icon && t.icon.includes("favicon.ico"))
        try {
          const d = await L(t.icon, t.id || Date.now().toString());
          d && (r = d);
        } catch {
          console.log("favicon.ico下载失败，尝试备用方案");
        }
      if (r === n && t.url)
        try {
          const b = `${new URL(t.url).origin}/favicon.ico`, g = await L(b, `root_${t.id || Date.now().toString()}`);
          g && (r = g);
        } catch {
          console.log("根目录favicon获取失败");
        }
      if (r === n) {
        const d = f.join(process.env.VITE_PUBLIC || C, "icon.ico");
        m.existsSync(d) && (r = d);
      }
      if (R.writeShortcutLink(o, {
        target: n,
        args: `--website-url="${t.url}" --website-name="${t.name}"`,
        description: t.name,
        icon: r,
        iconIndex: 0
      }))
        return { success: !0, iconPath: r };
      throw new Error("创建快捷方式失败");
    } catch (e) {
      throw console.error("添加到桌面失败:", e), e;
    }
  }), l.handle("get-settings", () => E.getSettings()), l.handle("save-settings", (a, t) => {
    const e = E.updateSettings(t);
    return t.autoStart !== void 0 && E.setAutoStart(t.autoStart).catch(console.error), e;
  }), l.handle("get-auto-start-status", () => E.getAutoStartStatus()), l.on("open-add-custom-button", (a, t) => {
    console.log("Received open-add-custom-button message (legacy, no-op):", t);
  }), l.on("open-custom-button-manager", (a, t) => {
    console.log("open-custom-button-manager is deprecated, data:", t);
  }), l.on("window-control", (a, t) => {
    const e = z.fromWebContents(a.sender);
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
  }), l.on("open-external", (a, t) => {
    R.openExternal(t).catch((e) => {
      console.error("打开外部链接失败:", e);
    });
  }), l.on("custom-buttons-updated", (a, t) => {
    try {
      const o = v.getWebsites().find((r) => r.id === t);
      if (!o) return;
      const n = o.customButtons || [];
      T.forEach((r) => {
        const i = r.__websiteUrl;
        !i || i !== o.url || r.webContents.executeJavaScript(`
          window.postMessage({
            type: 'updateCustomButtons',
            buttons: ${JSON.stringify(n)}
          }, '*');
        `);
      });
    } catch (e) {
      console.error("同步自定义按钮到子窗口失败:", e);
    }
  });
}
x.on("window-all-closed", () => {
  process.platform !== "darwin" && (x.quit(), c = null);
});
x.on("activate", () => {
  z.getAllWindows().length === 0 && j().catch(console.error);
});
x.whenReady().then(() => {
  ot();
  const a = process.argv.find((e) => e.startsWith("--website-url=")), t = process.argv.find((e) => e.startsWith("--website-name="));
  if (a) {
    const e = a.split("=")[1].replace(/"/g, ""), o = t ? t.split("=")[1].replace(/"/g, "") : void 0, n = Date.now().toString();
    M(e, n, "maximized", o).catch(console.error);
  } else
    j().catch(console.error);
});
x.on("second-instance", (a, t) => {
  const e = t.find((n) => n.startsWith("--website-url=")), o = t.find((n) => n.startsWith("--website-name="));
  if (e) {
    const n = e.split("=")[1].replace(/"/g, ""), r = o ? o.split("=")[1].replace(/"/g, "") : void 0, i = Date.now().toString();
    M(n, i, "maximized", r).catch(console.error);
  } else c && (c.isMinimized() && c.restore(), c.focus());
});
export {
  D as RENDERER_DIST,
  U as VITE_DEV_SERVER_URL
};
