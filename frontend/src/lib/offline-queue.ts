/**
 * OfflineQueue — 离线操作队列
 * 确保断网时不丢失数据，所有操作持久化到 localStorage
 */

// ============================================================
// Types
// ============================================================

export interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: number;
  data: Record<string, unknown>;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
}

// ============================================================
// Constants
// ============================================================

const QUEUE_KEY = 'ai_student_hub_offline_queue';
const MAX_RETRY_COUNT = 5;

// ============================================================
// Helpers
// ============================================================

function generateOperationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================
// OfflineQueue
// ============================================================

export class OfflineQueue {
  private queue: QueuedOperation[] = [];

  constructor() {
    this.loadFromStorage();
  }

  // ----------------------------------------------------------
  // Persistence
  // ----------------------------------------------------------

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      if (raw) {
        this.queue = JSON.parse(raw) as QueuedOperation[];
      }
    } catch {
      this.queue = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch {
      // localStorage full or unavailable
    }
  }

  // ----------------------------------------------------------
  // Queue operations
  // ----------------------------------------------------------

  /**
   * 入队：将操作添加到队列末尾
   */
  enqueue(operation: Omit<QueuedOperation, 'id' | 'retryCount' | 'status'>): QueuedOperation {
    const queued: QueuedOperation = {
      id: generateOperationId(),
      retryCount: 0,
      status: 'pending',
      ...operation,
    };

    this.queue.push(queued);
    this.saveToStorage();
    return queued;
  }

  /**
   * 出队：返回下一个 pending 操作，状态改为 processing
   */
  dequeue(): QueuedOperation | null {
    const next = this.queue.find((op) => op.status === 'pending');
    if (!next) return null;

    next.status = 'processing';
    this.saveToStorage();
    return { ...next };
  }

  /**
   * 标记操作完成（从队列移除）
   */
  markComplete(id: string): void {
    this.queue = this.queue.filter((op) => op.id !== id);
    this.saveToStorage();
  }

  /**
   * 标记操作失败，增加 retryCount
   * 超过最大重试次数时标记为 failed
   */
  markFailed(id: string): void {
    const op = this.queue.find((op) => op.id === id);
    if (!op) return;

    op.retryCount += 1;

    if (op.retryCount >= MAX_RETRY_COUNT) {
      op.status = 'failed';
    } else {
      op.status = 'pending';
    }

    this.saveToStorage();
  }

  /**
   * 获取所有 pending 操作
   */
  getPendingOperations(): QueuedOperation[] {
    return this.queue
      .filter((op) => op.status === 'pending')
      .map((op) => ({ ...op }));
  }

  /**
   * 获取所有 failed 操作
   */
  getFailedOperations(): QueuedOperation[] {
    return this.queue
      .filter((op) => op.status === 'failed')
      .map((op) => ({ ...op }));
  }

  /**
   * 清理已完成和 failed 超限操作
   */
  clearCompleted(): void {
    this.queue = this.queue.filter(
      (op) => op.status === 'pending' || op.status === 'processing'
    );
    this.saveToStorage();
  }

  /**
   * 重置指定 failed 操作为 pending
   */
  retryOperation(id: string): void {
    const op = this.queue.find((op) => op.id === id);
    if (!op || op.status !== 'failed') return;

    op.status = 'pending';
    op.retryCount = 0;
    this.saveToStorage();
  }

  /**
   * 获取队列大小（所有状态）
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * 获取各状态计数
   */
  getStats(): { total: number; pending: number; processing: number; failed: number } {
    return {
      total: this.queue.length,
      pending: this.queue.filter((op) => op.status === 'pending').length,
      processing: this.queue.filter((op) => op.status === 'processing').length,
      failed: this.queue.filter((op) => op.status === 'failed').length,
    };
  }

  /**
   * 清空整个队列
   */
  clear(): void {
    this.queue = [];
    this.saveToStorage();
  }
}
