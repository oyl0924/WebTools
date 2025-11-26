var I = Object.defineProperty;
var T = (i, t, e) => t in i ? I(i, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[t] = e;
var P = (i, t, e) => T(i, typeof t != "symbol" ? t + "" : t, e);
import { app as f, BrowserWindow as v, ipcMain as d, shell as W } from "electron";
import { fileURLToPath as B } from "node:url";
import c from "node:path";
import u from "node:fs";
import R from "node:https";
import E from "node:http";
import w from "fs";
import j from "path";
const k = "websites.json";
class O {
  constructor() {
    P(this, "storagePath");
    this.storagePath = j.join(f.getPath("userData"), k), this.initStorage();
  }
  initStorage() {
    w.existsSync(this.storagePath) || this.saveData([]);
  }
  loadData() {
    try {
      const t = w.readFileSync(this.storagePath, "utf-8");
      return JSON.parse(t);
    } catch (t) {
      return console.error("Error loading data:", t), [];
    }
  }
  saveData(t) {
    try {
      w.writeFileSync(this.storagePath, JSON.stringify(t, null, 2), "utf-8");
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
    const o = this.loadData(), s = o.findIndex((n) => n.id === t);
    return s === -1 ? null : (o[s] = { ...o[s], ...e }, this.saveData(o), o[s]);
  }
  deleteWebsite(t) {
    const e = this.loadData(), o = e.findIndex((s) => s.id === t);
    return o === -1 ? !1 : (e.splice(o, 1), this.saveData(e), !0);
  }
  addCustomButton(t, e) {
    const o = this.loadData(), s = o.find((r) => r.id === t);
    if (!s) return null;
    const n = {
      ...e,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    return s.customButtons.push(n), this.saveData(o), n;
  }
  updateCustomButton(t, e, o) {
    const s = this.loadData(), n = s.find((l) => l.id === t);
    if (!n) return null;
    const r = n.customButtons.findIndex((l) => l.id === e);
    return r === -1 ? null : (n.customButtons[r] = { ...n.customButtons[r], ...o }, this.saveData(s), n.customButtons[r]);
  }
  deleteCustomButton(t, e) {
    const o = this.loadData(), s = o.find((r) => r.id === t);
    if (!s) return !1;
    const n = s.customButtons.findIndex((r) => r.id === e);
    return n === -1 ? !1 : (s.customButtons.splice(n, 1), this.saveData(o), !0);
  }
}
const h = new O(), D = c.dirname(B(import.meta.url));
process.env.APP_ROOT = c.join(D, "..");
const g = process.env.VITE_DEV_SERVER_URL, J = c.join(process.env.APP_ROOT, "dist-electron"), y = c.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = g ? c.join(process.env.APP_ROOT, "public") : y;
let a;
const b = /* @__PURE__ */ new Map();
function A() {
  const i = c.join(f.getPath("userData"), "icons");
  return u.existsSync(i) || u.mkdirSync(i, { recursive: !0 }), i;
}
async function _(i, t) {
  return new Promise((e) => {
    try {
      const o = A(), s = c.extname(new URL(i).pathname) || ".ico", n = c.join(o, `${t}${s}`);
      if (u.existsSync(n)) {
        e(n);
        return;
      }
      const r = u.createWriteStream(n), m = (i.startsWith("https") ? R : E).get(i, (p) => {
        if (p.statusCode === 301 || p.statusCode === 302) {
          const x = p.headers.location;
          if (x) {
            r.close(), u.unlinkSync(n), _(x, t).then(e);
            return;
          }
        }
        if (p.statusCode !== 200) {
          r.close(), u.unlinkSync(n), e(null);
          return;
        }
        p.pipe(r), r.on("finish", () => {
          r.close(), e(n);
        });
      });
      m.on("error", () => {
        r.close(), u.existsSync(n) && u.unlinkSync(n), e(null);
      }), m.setTimeout(1e4, () => {
        m.destroy(), r.close(), u.existsSync(n) && u.unlinkSync(n), e(null);
      });
    } catch (o) {
      console.error("下载图标失败:", o), e(null);
    }
  });
}
function C() {
  a = new v({
    width: 1200,
    height: 800,
    icon: c.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    autoHideMenuBar: !0,
    webPreferences: {
      preload: c.join(D, "preload.mjs"),
      webviewTag: !0,
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), a.webContents.on("before-input-event", (i, t) => {
    t.key === "F12" ? (a != null && a.webContents.isDevToolsOpened() ? a.webContents.closeDevTools() : a == null || a.webContents.openDevTools(), i.preventDefault()) : t.key === "F5" && (a == null || a.webContents.reload(), i.preventDefault());
  }), a.webContents.on("did-finish-load", () => {
    a == null || a.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), g ? a.loadURL(g) : a.loadFile(c.join(y, "index.html"));
}
function S(i, t, e = "maximized", o) {
  let s;
  typeof e == "boolean" ? s = e ? "fullscreen" : "maximized" : s = e;
  const n = new v({
    width: 1e3,
    height: 700,
    show: !1,
    // 先不显示，等设置好大小后再显示
    fullscreen: s === "fullscreen",
    autoHideMenuBar: !0,
    webPreferences: {
      preload: c.join(D, "preload.mjs"),
      webviewTag: !0,
      contextIsolation: !0,
      nodeIntegration: !1
    }
  });
  return s === "maximized" && n.maximize(), n.once("ready-to-show", () => {
    n.show();
  }), n.webContents.on("before-input-event", (r, l) => {
    l.key === "F12" ? (n.webContents.isDevToolsOpened() ? n.webContents.closeDevTools() : n.webContents.openDevTools(), r.preventDefault()) : l.key === "F5" && (n.webContents.reload(), r.preventDefault());
  }), n.loadURL(i), o && n.setTitle(o), n.webContents.on("page-title-updated", (r) => {
    o && (r.preventDefault(), n.setTitle(o));
  }), b.set(t, n), n.on("closed", () => {
    b.delete(t);
  }), n;
}
function L() {
  d.handle("get-websites", () => h.getWebsites()), d.handle("add-website", (i, t) => h.addWebsite(t)), d.handle("update-website", (i, t, e) => h.updateWebsite(t, e)), d.handle("delete-website", (i, t) => h.deleteWebsite(t)), d.handle("add-custom-button", (i, t, e) => h.addCustomButton(t, e)), d.handle("update-custom-button", (i, t, e, o) => h.updateCustomButton(t, e, o)), d.handle("delete-custom-button", (i, t, e) => h.deleteCustomButton(t, e)), d.handle("create-window", (i, t, e = "maximized", o) => {
    const s = Date.now().toString();
    return S(t, s, e, o), s;
  }), d.handle("navigate-to-url", (i, t, e) => {
    const o = b.get(t);
    o && o.webContents.loadURL(e);
  }), d.handle("add-to-desktop", async (i, t) => {
    try {
      const e = f.getPath("desktop"), o = c.join(e, `${t.name}.lnk`), s = process.execPath;
      let n = s;
      if (t.icon) {
        const l = await _(t.icon, t.id || Date.now().toString());
        l && (n = l);
      }
      if (W.writeShortcutLink(o, {
        target: s,
        args: `--website-url="${t.url}" --website-name="${t.name}"`,
        description: t.name,
        icon: n,
        iconIndex: 0
      }))
        return { success: !0 };
      throw new Error("创建快捷方式失败");
    } catch (e) {
      throw console.error("添加到桌面失败:", e), e;
    }
  });
}
f.on("window-all-closed", () => {
  process.platform !== "darwin" && (f.quit(), a = null);
});
f.on("activate", () => {
  v.getAllWindows().length === 0 && C();
});
f.whenReady().then(() => {
  L();
  const i = process.argv.find((e) => e.startsWith("--website-url=")), t = process.argv.find((e) => e.startsWith("--website-name="));
  if (i) {
    const e = i.split("=")[1].replace(/"/g, ""), o = t ? t.split("=")[1].replace(/"/g, "") : void 0, s = Date.now().toString();
    S(e, s, "maximized", o);
  } else
    C();
});
f.on("second-instance", (i, t) => {
  const e = t.find((s) => s.startsWith("--website-url=")), o = t.find((s) => s.startsWith("--website-name="));
  if (e) {
    const s = e.split("=")[1].replace(/"/g, ""), n = o ? o.split("=")[1].replace(/"/g, "") : void 0, r = Date.now().toString();
    S(s, r, "maximized", n);
  } else a && (a.isMinimized() && a.restore(), a.focus());
});
export {
  J as MAIN_DIST,
  y as RENDERER_DIST,
  g as VITE_DEV_SERVER_URL
};
