import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export interface AccountStorageSnapshot {
  localStorage: Record<string, string | null>;
  sessionStorage: Record<string, string | null>;
}

export interface AccountSlot {
  id: string;
  name: string;
  partition: string;
  storageSnapshot?: AccountStorageSnapshot;
}

export interface WebsiteAccountGroup {
  key: string; // 站点标识，例如 origin 或 websiteId
  accounts: AccountSlot[];
  lastUsedAccountId?: string;
}

interface AccountsFileSchema {
  version: number;
  items: WebsiteAccountGroup[];
}

const STORAGE_FILE = 'accounts.json';
const CURRENT_VERSION = 2;

class AccountStorageService {
  private storagePath: string;

  constructor() {
    this.storagePath = path.join(app.getPath('userData'), STORAGE_FILE);
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (!fs.existsSync(this.storagePath)) {
      this.saveData({ version: CURRENT_VERSION, items: [] });
      return;
    }

    try {
      const raw = fs.readFileSync(this.storagePath, 'utf-8');
      const parsed = JSON.parse(raw) as AccountsFileSchema;
      if (typeof parsed.version !== 'number' || !Array.isArray(parsed.items)) {
        this.saveData({ version: CURRENT_VERSION, items: [] });
      }
    } catch {
      this.saveData({ version: CURRENT_VERSION, items: [] });
    }
  }

  private loadData(): AccountsFileSchema {
    try {
      const raw = fs.readFileSync(this.storagePath, 'utf-8');
      const parsed = JSON.parse(raw) as AccountsFileSchema;
      if (!parsed || typeof parsed.version !== 'number' || !Array.isArray(parsed.items)) {
        return { version: CURRENT_VERSION, items: [] };
      }
      return parsed;
    } catch {
      return { version: CURRENT_VERSION, items: [] };
    }
  }

  private saveData(data: AccountsFileSchema) {
    const normalized: AccountsFileSchema = {
      version: CURRENT_VERSION,
      items: data.items || [],
    };
    fs.writeFileSync(this.storagePath, JSON.stringify(normalized, null, 2), 'utf-8');
  }

  private findGroup(items: WebsiteAccountGroup[], key: string): WebsiteAccountGroup | undefined {
    return items.find((group) => group.key === key);
  }

  private createPartitionName(siteKey: string, id: string): string {
    const safeKey = siteKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    return `persist:webtools_${safeKey}_${id}`;
  }

  getAccountsForKey(key: string): WebsiteAccountGroup {
    const data = this.loadData();
    const existing = this.findGroup(data.items, key);
    if (existing) {
      return existing;
    }
    const created: WebsiteAccountGroup = { key, accounts: [] };
    data.items.push(created);
    this.saveData(data);
    return created;
  }

  saveAccount(key: string, account: { id?: string; name: string; partition?: string; storageSnapshot?: AccountStorageSnapshot }): WebsiteAccountGroup {
    const data = this.loadData();
    let group = this.findGroup(data.items, key);
    if (!group) {
      group = { key, accounts: [] };
      data.items.push(group);
    }

    if (account.id) {
      const index = group.accounts.findIndex((a) => a.id === account.id);
      if (index !== -1) {
        const existing = group.accounts[index];
        const partition = account.partition || existing.partition || this.createPartitionName(key, existing.id);
        group.accounts[index] = {
          ...existing,
          name: account.name,
          partition,
          storageSnapshot: account.storageSnapshot ?? existing.storageSnapshot,
        };
      } else {
        const id = account.id;
        const partition = account.partition || this.createPartitionName(key, id);
        group.accounts.push({ id, name: account.name, partition, storageSnapshot: account.storageSnapshot });
      }
    } else {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      const partition = account.partition || this.createPartitionName(key, id);
      group.accounts.push({ id, name: account.name, partition, storageSnapshot: account.storageSnapshot });
      group.lastUsedAccountId = id;
    }

    this.saveData(data);
    return group;
  }

  deleteAccount(key: string, accountId: string): WebsiteAccountGroup {
    const data = this.loadData();
    let group = this.findGroup(data.items, key);
    if (!group) {
      group = { key, accounts: [] };
      data.items.push(group);
    }

    const beforeLength = group.accounts.length;
    group.accounts = group.accounts.filter((a) => a.id !== accountId);

    if (group.lastUsedAccountId === accountId) {
      group.lastUsedAccountId = group.accounts.length > 0 ? group.accounts[0].id : undefined;
    }

    if (beforeLength !== group.accounts.length) {
      this.saveData(data);
    }

    return group;
  }

  setLastUsedAccount(key: string, accountId: string | undefined): WebsiteAccountGroup {
    const data = this.loadData();
    let group = this.findGroup(data.items, key);
    if (!group) {
      group = { key, accounts: [] };
      data.items.push(group);
    }

    group.lastUsedAccountId = accountId;
    this.saveData(data);
    return group;
  }
}

export const accountStorageService = new AccountStorageService();
