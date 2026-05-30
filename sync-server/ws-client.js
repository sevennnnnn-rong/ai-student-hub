/**
 * WebSocket 同步客户端
 *
 * 提供自动重连、心跳保活、消息队列和事件回调系统。
 * 适用于前端集成（也可在 Node.js 环境中使用）。
 */

const DEFAULT_RECONNECT_BASE = 1000;  // 重连初始延迟 1 秒
const DEFAULT_RECONNECT_MAX = 30_000;  // 最大重连延迟 30 秒
const DEFAULT_HEARTBEAT_INTERVAL = 25_000; // 心跳间隔 25 秒

/**
 * 连接状态枚举
 * @readonly
 * @enum {string}
 */
export const ConnectionState = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
};

export class SyncWebSocket {
  /**
   * @param {string} baseUrl WebSocket 服务地址
   * @param {object} [options]
   * @param {number} [options.reconnectBaseDelay] 重连初始延迟（毫秒）
   * @param {number} [options.reconnectMaxDelay] 最大重连延迟（毫秒）
   * @param {number} [options.heartbeatInterval] 心跳间隔（毫秒）
   */
  constructor(baseUrl = 'ws://localhost:3001', options = {}) {
    this.baseUrl = baseUrl;
    this.reconnectBaseDelay = options.reconnectBaseDelay ?? DEFAULT_RECONNECT_BASE;
    this.reconnectMaxDelay = options.reconnectMaxDelay ?? DEFAULT_RECONNECT_MAX;
    this.heartbeatInterval = options.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL;

    /** @type {WebSocket|null} */
    this.ws = null;
    /** @type {string} */
    this.state = ConnectionState.DISCONNECTED;
    /** @type {number} */
    this.reconnectAttempts = 0;
    /** @type {number|null} */
    this.reconnectTimer = null;
    /** @type {number|null} */
    this.heartbeatTimer = null;
    /** @type {Array<{type: string, deviceId?: string, changes?: Array}>} */
    this.messageQueue = [];

    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
  }

  /**
   * 建立 WebSocket 连接
   * @returns {Promise<void>}
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.state === ConnectionState.CONNECTED) {
        resolve();
        return;
      }

      this.state = ConnectionState.CONNECTING;
      this._emit('stateChange', this.state);

      // 在浏览器环境使用原生 WebSocket；Node.js 环境需安装 ws 包
      const createSocket = () => {
        if (typeof WebSocket !== 'undefined') {
          return Promise.resolve(new WebSocket(this.baseUrl));
        }
        return import('ws').then(({ default: WS }) => new WS(this.baseUrl));
      };

      createSocket()
        .then((socket) => {
          this.ws = socket;

          this.ws.onopen = () => {
            this.state = ConnectionState.CONNECTED;
            this.reconnectAttempts = 0;
            this._emit('stateChange', this.state);
            this._startHeartbeat();
            this._flushQueue();
            resolve();
          };

          this.ws.onmessage = (event) => {
            let msg;
            try {
              msg = JSON.parse(event.data);
            } catch {
              return;
            }
            this._handleMessage(msg);
          };

          this.ws.onclose = () => {
            this._stopHeartbeat();
            this.state = ConnectionState.DISCONNECTED;
            this._emit('stateChange', this.state);
            this._scheduleReconnect();
          };

          this.ws.onerror = (err) => {
            this._emit('error', err);
          };
        })
        .catch((err) => {
          this.state = ConnectionState.DISCONNECTED;
          this._emit('stateChange', this.state);
          reject(err);
        });
    });
  }

  /**
   * 订阅设备变更
   * @param {string} deviceId
   */
  subscribe(deviceId) {
    this._send({ type: 'subscribe', deviceId });
  }

  /**
   * 推送变更到服务端
   * @param {Array} changes
   * @param {string} deviceId
   */
  push(changes, deviceId) {
    this._send({ type: 'push', deviceId, changes });
  }

  /**
   * 注册变更回调
   * @param {function(Array): void} callback - 接收 changes 数组
   * @returns {function(): void} 取消订阅函数
   */
  onChanges(callback) {
    return this._on('changes', callback);
  }

  /**
   * 注册连接状态变化回调
   * @param {function(string): void} callback
   * @returns {function(): void}
   */
  onStateChange(callback) {
    return this._on('stateChange', callback);
  }

  /**
   * 注册错误回调
   * @param {function(Error): void} callback
   * @returns {function(): void}
   */
  onError(callback) {
    return this._on('error', callback);
  }

  /**
   * 断开连接
   */
  disconnect() {
    this._stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;

    if (this.ws) {
      this.ws.onclose = null; // 阻止触发重连
      this.ws.close();
      this.ws = null;
    }

    this.state = ConnectionState.DISCONNECTED;
    this._emit('stateChange', this.state);
  }

  /**
   * 手动触发重连
   */
  reconnect() {
    this.disconnect();
    this.connect().catch(() => {
      // 重连失败已在内部处理
    });
  }

  // ---------------------------------------------------------------------------
  // 内部方法
  // ---------------------------------------------------------------------------

  _send(data) {
    const json = JSON.stringify(data);
    if (this.state === ConnectionState.CONNECTED && this.ws?.readyState === 1) {
      this.ws.send(json);
    } else {
      this.messageQueue.push(data);
    }
  }

  _handleMessage(msg) {
    switch (msg.type) {
      case 'changes':
        this._emit('changes', msg.changes);
        break;
      case 'pong':
        // 心跳响应，无需额外处理
        break;
      case 'error':
        this._emit('error', new Error(msg.message));
        break;
      case 'subscribed':
        this._emit('subscribed', msg.deviceId);
        break;
      default:
        break;
    }
  }

  _flushQueue() {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      this._send(msg);
    }
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this._send({ type: 'ping' });
    }, this.heartbeatInterval);
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;

    const delay = Math.min(
      this.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts),
      this.reconnectMaxDelay
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {
        // 重连失败将在 onclose 中再次触发
      });
    }, delay);
  }

  /**
   * 注册事件监听
   * @returns {function(): void} 取消监听函数
   */
  _on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  _emit(event, ...args) {
    const cbs = this.listeners.get(event);
    if (cbs) {
      for (const cb of cbs) {
        try {
          cb(...args);
        } catch (err) {
          console.error(`[SyncWebSocket] 事件 "${event}" 回调异常:`, err);
        }
      }
    }
  }
}

export default SyncWebSocket;
