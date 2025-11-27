import { app } from 'electron'
import path from 'path'
import fs from 'fs'

interface Settings {
  darkMode: 'manual' | 'system' | 'time'
  darkModeTimeStart: string
  darkModeTimeEnd: string
  isDarkMode: boolean
  homeWindowSize: 'normal' | 'maximized' | 'fullscreen'
  autoStart: boolean
}

const DEFAULT_SETTINGS: Settings = {
  darkMode: 'manual',
  darkModeTimeStart: '18:00',
  darkModeTimeEnd: '06:00',
  isDarkMode: false,
  homeWindowSize: 'maximized',
  autoStart: false
}

class SettingsService {
  private settingsPath: string
  private settings: Settings

  constructor() {
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json')
    this.settings = this.loadSettings()
  }

  private loadSettings(): Settings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8')
        const parsed = JSON.parse(data)
        return { ...DEFAULT_SETTINGS, ...parsed }
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
    return { ...DEFAULT_SETTINGS }
  }

  private saveSettings(): void {
    try {
      const data = JSON.stringify(this.settings, null, 2)
      fs.writeFileSync(this.settingsPath, data, 'utf-8')
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  getSettings(): Settings {
    return { ...this.settings }
  }

  updateSettings(newSettings: Partial<Settings>): Settings {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()
    return this.settings
  }

  // 检测是否应该使用黑暗模式
  shouldUseDarkMode(): boolean {
    const { darkMode, darkModeTimeStart, darkModeTimeEnd, isDarkMode } = this.settings

    if (darkMode === 'manual') {
      return isDarkMode
    } else if (darkMode === 'system') {
      // 这个将在渲染进程中检测
      return false
    } else if (darkMode === 'time') {
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()
      const [startHour, startMin] = darkModeTimeStart.split(':').map(Number)
      const [endHour, endMin] = darkModeTimeEnd.split(':').map(Number)
      const startTime = startHour * 60 + startMin
      const endTime = endHour * 60 + endMin

      if (startTime <= endTime) {
        return currentTime >= startTime && currentTime <= endTime
      } else {
        return currentTime >= startTime || currentTime <= endTime
      }
    }

    return false
  }

  // 设置开机启动
  async setAutoStart(enabled: boolean): Promise<void> {
    try {
      const { app } = await import('electron')
      app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: false
      })
      this.updateSettings({ autoStart: enabled })
    } catch (error) {
      console.error('设置开机启动失败:', error)
      throw error
    }
  }

  // 获取开机启动状态
  getAutoStartStatus(): boolean {
    try {
      const app = require('electron').app
      const loginSettings = app.getLoginItemSettings()
      return loginSettings.openAtLogin
    } catch (error) {
      console.error('获取开机启动状态失败:', error)
      return false
    }
  }
}

export const settingsService = new SettingsService()