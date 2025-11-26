import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { Website } from '../src/types'

const STORAGE_FILE = 'websites.json'

class StorageService {
  private storagePath: string

  constructor() {
    this.storagePath = path.join(app.getPath('userData'), STORAGE_FILE)
    this.initStorage()
  }

  private initStorage() {
    if (!fs.existsSync(this.storagePath)) {
      this.saveData([])
    }
  }

  private loadData(): Website[] {
    try {
      const data = fs.readFileSync(this.storagePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error loading data:', error)
      return []
    }
  }

  private saveData(websites: Website[]) {
    try {
      fs.writeFileSync(this.storagePath, JSON.stringify(websites, null, 2), 'utf-8')
    } catch (error) {
      console.error('Error saving data:', error)
    }
  }

  getWebsites(): Website[] {
    return this.loadData()
  }

  addWebsite(website: Omit<Website, 'id'>): Website {
    const websites = this.loadData()
    const newWebsite: Website = {
      ...website,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      customButtons: website.customButtons || []
    }
    websites.push(newWebsite)
    this.saveData(websites)
    return newWebsite
  }

  updateWebsite(id: string, updates: Partial<Website>): Website | null {
    const websites = this.loadData()
    const index = websites.findIndex(w => w.id === id)
    if (index === -1) return null

    websites[index] = { ...websites[index], ...updates }
    this.saveData(websites)
    return websites[index]
  }

  deleteWebsite(id: string): boolean {
    const websites = this.loadData()
    const index = websites.findIndex(w => w.id === id)
    if (index === -1) return false

    websites.splice(index, 1)
    this.saveData(websites)
    return true
  }

  addCustomButton(websiteId: string, button: any) {
    const websites = this.loadData()
    const website = websites.find(w => w.id === websiteId)
    if (!website) return null

    const newButton = {
      ...button,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
    website.customButtons.push(newButton)
    this.saveData(websites)
    return newButton
  }

  updateCustomButton(websiteId: string, buttonId: string, updates: any) {
    const websites = this.loadData()
    const website = websites.find(w => w.id === websiteId)
    if (!website) return null

    const buttonIndex = website.customButtons.findIndex(b => b.id === buttonId)
    if (buttonIndex === -1) return null

    website.customButtons[buttonIndex] = { ...website.customButtons[buttonIndex], ...updates }
    this.saveData(websites)
    return website.customButtons[buttonIndex]
  }

  deleteCustomButton(websiteId: string, buttonId: string): boolean {
    const websites = this.loadData()
    const website = websites.find(w => w.id === websiteId)
    if (!website) return false

    const buttonIndex = website.customButtons.findIndex(b => b.id === buttonId)
    if (buttonIndex === -1) return false

    website.customButtons.splice(buttonIndex, 1)
    this.saveData(websites)
    return true
  }
}

export default new StorageService()
