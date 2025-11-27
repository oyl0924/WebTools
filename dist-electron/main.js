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
      const request = protocol.get(iconUrl, (response) => {
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
      request.setTimeout(1e4, () => {
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
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path$1.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path$1.join(__dirname$1, "preload.mjs"),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.webContents.on("before-input-event", (event, input) => {
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
function createChildWindow(url, windowId, windowMode = "maximized", websiteName) {
  let mode;
  if (typeof windowMode === "boolean") {
    mode = windowMode ? "fullscreen" : "maximized";
  } else {
    mode = windowMode;
  }
  const childWin = new BrowserWindow({
    width: 1e3,
    height: 700,
    show: false,
    // 先不显示，等设置好大小后再显示
    fullscreen: mode === "fullscreen",
    autoHideMenuBar: true,
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
  childWin.loadURL(url);
  if (websiteName) {
    childWin.setTitle(websiteName);
  }
  childWin.webContents.on("page-title-updated", (event) => {
    if (websiteName) {
      event.preventDefault();
      childWin.setTitle(websiteName);
    }
  });
  childWindows.set(windowId, childWin);
  childWin.on("closed", () => {
    childWindows.delete(windowId);
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
  ipcMain.handle("create-window", (_event, url, windowMode = "maximized", websiteName) => {
    const windowId = Date.now().toString();
    createChildWindow(url, windowId, windowMode, websiteName);
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
      if (websiteData.icon) {
        const downloadedIcon = await downloadIcon(websiteData.icon, websiteData.id || Date.now().toString());
        if (downloadedIcon) {
          iconPath = downloadedIcon;
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
        return { success: true };
      } else {
        throw new Error("创建快捷方式失败");
      }
    } catch (error) {
      console.error("添加到桌面失败:", error);
      throw error;
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
    createWindow();
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
    createChildWindow(url, windowId, "maximized", websiteName);
  } else {
    createWindow();
  }
});
app.on("second-instance", (_event, commandLine) => {
  const websiteUrlArg = commandLine.find((arg) => arg.startsWith("--website-url="));
  const websiteNameArg = commandLine.find((arg) => arg.startsWith("--website-name="));
  if (websiteUrlArg) {
    const url = websiteUrlArg.split("=")[1].replace(/"/g, "");
    const websiteName = websiteNameArg ? websiteNameArg.split("=")[1].replace(/"/g, "") : void 0;
    const windowId = Date.now().toString();
    createChildWindow(url, windowId, "maximized", websiteName);
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
