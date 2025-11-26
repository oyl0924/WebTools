var C = Object.defineProperty;
var I = (r, e, t) => e in r ? C(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var g = (r, e, t) => I(r, typeof e != "symbol" ? e + "" : e, t);
import { app as h, BrowserWindow as m, ipcMain as l, shell as P } from "electron";
import { fileURLToPath as x } from "node:url";
import d from "node:path";
import p from "fs";
import S from "path";
const T = "websites.json";
class B {
  constructor() {
    g(this, "storagePath");
    this.storagePath = S.join(h.getPath("userData"), T), this.initStorage();
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
    const s = this.loadData(), o = s.find((c) => c.id === e);
    if (!o) return null;
    const a = o.customButtons.findIndex((c) => c.id === t);
    return a === -1 ? null : (o.customButtons[a] = { ...o.customButtons[a], ...n }, this.saveData(s), o.customButtons[a]);
  }
  deleteCustomButton(e, t) {
    const n = this.loadData(), s = n.find((a) => a.id === e);
    if (!s) return !1;
    const o = s.customButtons.findIndex((a) => a.id === t);
    return o === -1 ? !1 : (s.customButtons.splice(o, 1), this.saveData(n), !0);
  }
}
const u = new B(), b = d.dirname(x(import.meta.url));
process.env.APP_ROOT = d.join(b, "..");
const f = process.env.VITE_DEV_SERVER_URL, U = d.join(process.env.APP_ROOT, "dist-electron"), v = d.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = f ? d.join(process.env.APP_ROOT, "public") : v;
let i;
const w = /* @__PURE__ */ new Map();
function D() {
  i = new m({
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
  }), i.webContents.on("before-input-event", (r, e) => {
    e.key === "F12" ? (i != null && i.webContents.isDevToolsOpened() ? i.webContents.closeDevTools() : i == null || i.webContents.openDevTools(), r.preventDefault()) : e.key === "F5" && (i == null || i.webContents.reload(), r.preventDefault());
  }), i.webContents.on("did-finish-load", () => {
    i == null || i.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), f ? i.loadURL(f) : i.loadFile(d.join(v, "index.html"));
}
function _(r, e, t = "maximized", n) {
  let s;
  typeof t == "boolean" ? s = t ? "fullscreen" : "maximized" : s = t;
  const o = new m({
    width: 1e3,
    height: 700,
    fullscreen: s === "fullscreen",
    autoHideMenuBar: !0,
    webPreferences: {
      preload: d.join(b, "preload.mjs"),
      webviewTag: !0,
      contextIsolation: !0,
      nodeIntegration: !1
    }
  });
  return s === "maximized" && o.maximize(), o.webContents.on("before-input-event", (a, c) => {
    c.key === "F12" ? (o.webContents.isDevToolsOpened() ? o.webContents.closeDevTools() : o.webContents.openDevTools(), a.preventDefault()) : c.key === "F5" && (o.webContents.reload(), a.preventDefault());
  }), f ? o.loadURL(`${f}#/webview?url=${encodeURIComponent(r)}`) : o.loadFile(d.join(v, "index.html"), {
    hash: `/webview?url=${encodeURIComponent(r)}`
  }), n && o.setTitle(n), o.webContents.on("page-title-updated", (a) => {
    n && (a.preventDefault(), o.setTitle(n));
  }), w.set(e, o), o.on("closed", () => {
    w.delete(e);
  }), o;
}
function R() {
  l.handle("get-websites", () => u.getWebsites()), l.handle("add-website", (r, e) => u.addWebsite(e)), l.handle("update-website", (r, e, t) => u.updateWebsite(e, t)), l.handle("delete-website", (r, e) => u.deleteWebsite(e)), l.handle("add-custom-button", (r, e, t) => u.addCustomButton(e, t)), l.handle("update-custom-button", (r, e, t, n) => u.updateCustomButton(e, t, n)), l.handle("delete-custom-button", (r, e, t) => u.deleteCustomButton(e, t)), l.handle("create-window", (r, e, t = "maximized", n) => {
    const s = Date.now().toString();
    return _(e, s, t, n), s;
  }), l.handle("navigate-to-url", (r, e, t) => {
    const n = w.get(e);
    n && n.webContents.loadURL(t);
  }), l.handle("add-to-desktop", async (r, e) => {
    try {
      const t = h.getPath("desktop"), n = d.join(t, `${e.name}.lnk`), s = process.execPath;
      if (P.writeShortcutLink(n, {
        target: s,
        args: `--website-url="${e.url}"`,
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
h.on("window-all-closed", () => {
  process.platform !== "darwin" && (h.quit(), i = null);
});
h.on("activate", () => {
  m.getAllWindows().length === 0 && D();
});
h.whenReady().then(() => {
  R();
  const r = process.argv.find((e) => e.startsWith("--website-url="));
  if (r) {
    const e = r.split("=")[1].replace(/"/g, ""), t = Date.now().toString();
    _(e, t, "maximized");
  } else
    D();
});
export {
  U as MAIN_DIST,
  v as RENDERER_DIST,
  f as VITE_DEV_SERVER_URL
};
