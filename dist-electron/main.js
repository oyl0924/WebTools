var I = Object.defineProperty;
var C = (i, e, t) => e in i ? I(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var D = (i, e, t) => C(i, typeof e != "symbol" ? e + "" : e, t);
import { app as u, BrowserWindow as m, ipcMain as l, shell as x } from "electron";
import { fileURLToPath as P } from "node:url";
import d from "node:path";
import p from "fs";
import S from "path";
const T = "websites.json";
class B {
  constructor() {
    D(this, "storagePath");
    this.storagePath = S.join(u.getPath("userData"), T), this.initStorage();
  }
  initStorage() {
    p.existsSync(this.storagePath) || this.saveData([]);
  }
  loadData() {
    try {
      const e = p.readFileSync(this.storagePath, "utf-8");
      return JSON.parse(e);
    } catch (e) {
      return console.error("Error loading data:", e), [];
    }
  }
  saveData(e) {
    try {
      p.writeFileSync(this.storagePath, JSON.stringify(e, null, 2), "utf-8");
    } catch (t) {
      console.error("Error saving data:", t);
    }
  }
  getWebsites() {
    return this.loadData();
  }
  addWebsite(e) {
    const t = this.loadData(), n = {
      ...e,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      customButtons: e.customButtons || []
    };
    return t.push(n), this.saveData(t), n;
  }
  updateWebsite(e, t) {
    const n = this.loadData(), s = n.findIndex((o) => o.id === e);
    return s === -1 ? null : (n[s] = { ...n[s], ...t }, this.saveData(n), n[s]);
  }
  deleteWebsite(e) {
    const t = this.loadData(), n = t.findIndex((s) => s.id === e);
    return n === -1 ? !1 : (t.splice(n, 1), this.saveData(t), !0);
  }
  addCustomButton(e, t) {
    const n = this.loadData(), s = n.find((a) => a.id === e);
    if (!s) return null;
    const o = {
      ...t,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    return s.customButtons.push(o), this.saveData(n), o;
  }
  updateCustomButton(e, t, n) {
    const s = this.loadData(), o = s.find((h) => h.id === e);
    if (!o) return null;
    const a = o.customButtons.findIndex((h) => h.id === t);
    return a === -1 ? null : (o.customButtons[a] = { ...o.customButtons[a], ...n }, this.saveData(s), o.customButtons[a]);
  }
  deleteCustomButton(e, t) {
    const n = this.loadData(), s = n.find((a) => a.id === e);
    if (!s) return !1;
    const o = s.customButtons.findIndex((a) => a.id === t);
    return o === -1 ? !1 : (s.customButtons.splice(o, 1), this.saveData(n), !0);
  }
}
const c = new B(), b = d.dirname(P(import.meta.url));
process.env.APP_ROOT = d.join(b, "..");
const f = process.env.VITE_DEV_SERVER_URL, A = d.join(process.env.APP_ROOT, "dist-electron"), v = d.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = f ? d.join(process.env.APP_ROOT, "public") : v;
let r;
const w = /* @__PURE__ */ new Map();
function _() {
  r = new m({
    width: 1200,
    height: 800,
    icon: d.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    autoHideMenuBar: !0,
    webPreferences: {
      preload: d.join(b, "preload.mjs"),
      webviewTag: !0,
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), r.webContents.on("before-input-event", (i, e) => {
    e.key === "F12" ? (r != null && r.webContents.isDevToolsOpened() ? r.webContents.closeDevTools() : r == null || r.webContents.openDevTools(), i.preventDefault()) : e.key === "F5" && (r == null || r.webContents.reload(), i.preventDefault());
  }), r.webContents.on("did-finish-load", () => {
    r == null || r.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), f ? r.loadURL(f) : r.loadFile(d.join(v, "index.html"));
}
function g(i, e, t = "maximized", n) {
  let s;
  typeof t == "boolean" ? s = t ? "fullscreen" : "maximized" : s = t;
  const o = new m({
    width: 1e3,
    height: 700,
    show: !1,
    // 先不显示，等设置好大小后再显示
    fullscreen: s === "fullscreen",
    autoHideMenuBar: !0,
    webPreferences: {
      preload: d.join(b, "preload.mjs"),
      webviewTag: !0,
      contextIsolation: !0,
      nodeIntegration: !1
    }
  });
  return s === "maximized" && o.maximize(), o.once("ready-to-show", () => {
    o.show();
  }), o.webContents.on("before-input-event", (a, h) => {
    h.key === "F12" ? (o.webContents.isDevToolsOpened() ? o.webContents.closeDevTools() : o.webContents.openDevTools(), a.preventDefault()) : h.key === "F5" && (o.webContents.reload(), a.preventDefault());
  }), f ? o.loadURL(`${f}#/webview?url=${encodeURIComponent(i)}`) : o.loadFile(d.join(v, "index.html"), {
    hash: `/webview?url=${encodeURIComponent(i)}`
  }), n && o.setTitle(n), o.webContents.on("page-title-updated", (a) => {
    n && (a.preventDefault(), o.setTitle(n));
  }), w.set(e, o), o.on("closed", () => {
    w.delete(e);
  }), o;
}
function R() {
  l.handle("get-websites", () => c.getWebsites()), l.handle("add-website", (i, e) => c.addWebsite(e)), l.handle("update-website", (i, e, t) => c.updateWebsite(e, t)), l.handle("delete-website", (i, e) => c.deleteWebsite(e)), l.handle("add-custom-button", (i, e, t) => c.addCustomButton(e, t)), l.handle("update-custom-button", (i, e, t, n) => c.updateCustomButton(e, t, n)), l.handle("delete-custom-button", (i, e, t) => c.deleteCustomButton(e, t)), l.handle("create-window", (i, e, t = "maximized", n) => {
    const s = Date.now().toString();
    return g(e, s, t, n), s;
  }), l.handle("navigate-to-url", (i, e, t) => {
    const n = w.get(e);
    n && n.webContents.loadURL(t);
  }), l.handle("add-to-desktop", async (i, e) => {
    try {
      const t = u.getPath("desktop"), n = d.join(t, `${e.name}.lnk`), s = process.execPath;
      if (x.writeShortcutLink(n, {
        target: s,
        args: `--website-url="${e.url}" --website-name="${e.name}"`,
        description: e.name,
        icon: s,
        iconIndex: 0
      }))
        return { success: !0 };
      throw new Error("创建快捷方式失败");
    } catch (t) {
      throw console.error("添加到桌面失败:", t), t;
    }
  });
}
u.on("window-all-closed", () => {
  process.platform !== "darwin" && (u.quit(), r = null);
});
u.on("activate", () => {
  m.getAllWindows().length === 0 && _();
});
u.whenReady().then(() => {
  R();
  const i = process.argv.find((t) => t.startsWith("--website-url=")), e = process.argv.find((t) => t.startsWith("--website-name="));
  if (i) {
    const t = i.split("=")[1].replace(/"/g, ""), n = e ? e.split("=")[1].replace(/"/g, "") : void 0, s = Date.now().toString();
    g(t, s, "maximized", n);
  } else
    _();
});
u.on("second-instance", (i, e) => {
  const t = e.find((s) => s.startsWith("--website-url=")), n = e.find((s) => s.startsWith("--website-name="));
  if (t) {
    const s = t.split("=")[1].replace(/"/g, ""), o = n ? n.split("=")[1].replace(/"/g, "") : void 0, a = Date.now().toString();
    g(s, a, "maximized", o);
  } else r && (r.isMinimized() && r.restore(), r.focus());
});
export {
  A as MAIN_DIST,
  v as RENDERER_DIST,
  f as VITE_DEV_SERVER_URL
};
