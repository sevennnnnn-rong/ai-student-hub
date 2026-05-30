/**
 * SyncClient — 同步客户端
 * 管理与同步服务器的通信
 */

// ============================================================
// Types
// ============================================================

export interface SyncChange {
  entityType: 'task' | 'course' | 'note' | 'pomodoro_session';
  entityId: number;
  data: Record<string, unknown>;
  version: number;
  updatedAt: string;
  deleted: boolean;
}

export interface SyncConfig {
  serverUrl: string;
  deviceId: string;
  syncInterval: number;
}

export interface SyncStatusResponse {
  lastSyncTime: string | null;
  deviceId: string;
  serverTime: string;
  pendingChanges: number;
}

// ============================================================
// Constants
// ============================================================

const DEVICE_ID_KEY = 'ai_student_hub_device_id';
const LAST_SYNC_KEY = 'ai_student_hub_last_sync_time';

const DEFAULT_CONFIG: SyncConfig = {
  serverUrl: 'http://localhost:3001',
  deviceId: '',
  syncInterval: 30000,
};

// ============================================================
// Helpers
// ============================================================

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================
// SyncClient
// ============================================================

export class SyncClient {
  private config: SyncConfig;

  constructor(config?: Partial<SyncConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    if (!this.config.deviceId) {
      this.config.deviceId = this.loadOrCreateDeviceId();
    }
  }

  // ----------------------------------------------------------
  // Device ID
  // ----------------------------------------------------------

  private loadOrCreateDeviceId(): string {
    try {
      const stored = localStorage.getItem(DEVICE_ID_KEY);
      if (stored) return stored;
    } catch {
      // localStorage unavailable
    }

    const id = generateUUID();
    try {
      localStorage.setItem(DEVICE_ID_KEY, id);
    } catch {
      // ignore
    }
    return id;
  }

  generateDeviceId(): string {
    const id = generateUUID();
    this.config.deviceId = id;
    try {
      localStorage.setItem(DEVICE_ID_KEY, id);
    } catch {
      // ignore
    }
    return id;
  }

  // ----------------------------------------------------------
  // Sync time persistence
  // ----------------------------------------------------------

  getLastSyncTime(): string | null {
    try {
      return localStorage.getItem(LAST_SYNC_KEY);
    } catch {
      return null;
    }
  }

  setLastSyncTime(time: string): void {
    try {
      localStorage.setItem(LAST_SYNC_KEY, time);
    } catch {
      // ignore
    }
  }

  // ----------------------------------------------------------
  // Server communication
  // ----------------------------------------------------------

  /**
   * 推送变更到服务器
   */
  async pushChanges(changes: SyncChange[]): Promise<{ success: boolean; synced: number }> {
    const response = await fetch(`${this.config.serverUrl}/api/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': this.config.deviceId,
      },
      body: JSON.stringify({ deviceId: this.config.deviceId, changes }),
    });

    if (!response.ok) {
      throw new Error(`Push failed: ${response.status} ${response.statusText}`);
    }

    await response.json();
    return { success: true, synced: changes.length };
  }

  /**
   * 从服务器拉取变更
   */
  async pullChanges(since?: string): Promise<SyncChange[]> {
    const lastSync = since || this.getLastSyncTime();

    const response = await fetch(`${this.config.serverUrl}/api/sync/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': this.config.deviceId,
      },
      body: JSON.stringify({ deviceId: this.config.deviceId, since: lastSync }),
    });

    if (!response.ok) {
      throw new Error(`Pull failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.changes || [];
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(): Promise<SyncStatusResponse> {
    const response = await fetch(
      `${this.config.serverUrl}/api/sync/status?deviceId=${this.config.deviceId}`,
      {
        method: 'GET',
        headers: {
          'X-Device-Id': this.config.deviceId,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Status fetch failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 获取配置
   */
  getConfig(): SyncConfig {
    return { ...this.config };
  }
}
