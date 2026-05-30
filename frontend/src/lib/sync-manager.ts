/**
 * SyncManager — 同步管理器（协调层）
 * 整合 SyncClient 和 OfflineQueue，提供统一的同步控制接口
 */

import { SyncClient, SyncChange } from './sync-client';
import { OfflineQueue, QueuedOperation } from './offline-queue';

// ============================================================
// Types
// ============================================================

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingChanges: number;
  connected: boolean;
}

export type StatusChangeCallback = (status: SyncStatus) => void;

// ============================================================
// SyncManager
// ============================================================

export class SyncManager {
  private client: SyncClient;
  private queue: OfflineQueue;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private _isSyncing: boolean = false;
  private listeners: Set<StatusChangeCallback> = new Set();

  constructor(config?: { serverUrl?: string; syncInterval?: number }) {
    this.client = new SyncClient({
      serverUrl: config?.serverUrl,
      syncInterval: config?.syncInterval,
    });
    this.queue = new OfflineQueue();
  }

  // ----------------------------------------------------------
  // Lifecycle
  // ----------------------------------------------------------

  /**
   * 启动自动同步
   */
  start(): void {
    if (this.intervalId !== null) return;

    const interval = this.client.getConfig().syncInterval;

    this.intervalId = setInterval(() => {
      this.sync().catch(() => {
        // 同步失败由 status 事件通知，不中断定时器
      });
    }, interval);

    // 启动时立即执行一次同步
    this.sync().catch(() => {});
  }

  /**
   * 停止自动同步
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // ----------------------------------------------------------
  // Sync execution
  // ----------------------------------------------------------

  /**
   * 执行一次完整同步：推送离线队列 → 拉取新变更 → 更新状态
   */
  async sync(): Promise<SyncChange[]> {
    if (this._isSyncing) return [];
    if (!this.isOnline()) {
      this.notifyListeners();
      return [];
    }

    this._isSyncing = true;
    this.notifyListeners();

    try {
      // 1. 推送离线队列中的操作
      await this.pushQueuedChanges();

      // 2. 拉取服务器上的新变更
      const changes = await this.pullServerChanges();

      // 3. 更新同步时间
      this.client.setLastSyncTime(new Date().toISOString());

      this._isSyncing = false;
      this.notifyListeners();

      return changes;
    } catch {
      this._isSyncing = false;
      this.notifyListeners();
      return [];
    }
  }

  /**
   * 推送离线队列中的操作到服务器
   */
  private async pushQueuedChanges(): Promise<void> {
    const pending = this.queue.getPendingOperations();
    if (pending.length === 0) return;

    const changes: SyncChange[] = pending.map((op) => ({
      entityType: op.entityType as SyncChange['entityType'],
      entityId: op.entityId,
      data: op.data,
      version: 1,
      updatedAt: op.timestamp,
      deleted: op.type === 'delete',
    }));

    try {
      await this.client.pushChanges(changes);

      for (const op of pending) {
        this.queue.markComplete(op.id);
      }
    } catch {
      for (const op of pending) {
        this.queue.markFailed(op.id);
      }
    }
  }

  /**
   * 从服务器拉取新变更
   */
  private async pullServerChanges(): Promise<SyncChange[]> {
    try {
      return await this.client.pullChanges();
    } catch {
      return [];
    }
  }

  // ----------------------------------------------------------
  // Local change tracking
  // ----------------------------------------------------------

  /**
   * 记录本地变更（入队离线队列）
   */
  recordChange(
    entityType: string,
    entityId: number,
    type: 'create' | 'update' | 'delete',
    data: Record<string, unknown>
  ): QueuedOperation {
    const operation = this.queue.enqueue({
      type,
      entityType,
      entityId,
      data,
      timestamp: new Date().toISOString(),
    });

    this.notifyListeners();

    if (this.isOnline()) {
      this.sync().catch(() => {});
    }

    return operation;
  }

  // ----------------------------------------------------------
  // Status & events
  // ----------------------------------------------------------

  /**
   * 监听同步状态变化，返回取消订阅函数
   */
  onStatusChange(callback: StatusChangeCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * 获取当前同步状态
   */
  getStatus(): SyncStatus {
    const stats = this.queue.getStats();
    return {
      isSyncing: this._isSyncing,
      lastSyncTime: this.client.getLastSyncTime(),
      pendingChanges: stats.pending,
      connected: this.isOnline(),
    };
  }

  /**
   * 检测网络状态
   */
  isOnline(): boolean {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  }

  /**
   * 获取队列统计
   */
  getQueueStats(): { total: number; pending: number; processing: number; failed: number } {
    return this.queue.getStats();
  }

  /**
   * 获取底层 client
   */
  getClient(): SyncClient {
    return this.client;
  }

  /**
   * 获取底层 queue
   */
  getQueue(): OfflineQueue {
    return this.queue;
  }

  // ----------------------------------------------------------
  // Private
  // ----------------------------------------------------------

  private notifyListeners(): void {
    const status = this.getStatus();
    for (const listener of this.listeners) {
      try {
        listener(status);
      } catch {
        // listener error should not break others
      }
    }
  }
}

// ============================================================
// Singleton helper
// ============================================================

let _defaultManager: SyncManager | null = null;

export function getDefaultSyncManager(config?: {
  serverUrl?: string;
  syncInterval?: number;
}): SyncManager {
  if (!_defaultManager) {
    _defaultManager = new SyncManager(config);
  }
  return _defaultManager;
}
