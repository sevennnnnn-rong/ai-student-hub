/**
 * WebSocket 实时同步服务器
 *
 * 管理多设备连接，支持变更广播和心跳检测。
 * 不自行监听端口，通过 initWebSocket(server) 接入已有的 HTTP server。
 */

const HEARTBEAT_INTERVAL = 30_000; // 30 秒心跳检测
const CLIENT_HEARTBEAT_INTERVAL = 25_000; // 客户端应以 25 秒间隔发送 ping
const MAX_CONNECTIONS = 100;

/**
 * 设备连接注册表
 * deviceId -> Set<WebSocket>
 */
const deviceClients = new Map();

/**
 * ws -> { deviceId, alive }
 */
const clientMeta = new Map();

let heartbeatTimer = null;

/**
 * 初始化 WebSocket 服务器
 * @param {import('http').Server} server - 已创建的 HTTP server 实例
 * @returns {import('ws').WebSocketServer} ws 实例
 */
export async function initWebSocket(server) {
  const { WebSocketServer } = await import('ws');
  const wss = new WebSocketServer({
    server,
    maxPayload: 1024 * 1024, // 1MB
  });

  wss.on('connection', (ws, req) => {
    if (clientMeta.size >= MAX_CONNECTIONS) {
      console.warn(`[ws] 连接数已达上限 (${MAX_CONNECTIONS})，拒绝新连接`);
      ws.close(1013, 'Server is full');
      return;
    }

    const meta = { deviceId: null, alive: true };
    clientMeta.set(ws, meta);

    console.log(`[ws] 新连接建立，来源: ${req.socket.remoteAddress}`);

    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        sendError(ws, '消息格式错误：无法解析 JSON');
        return;
      }
      handleMessage(ws, msg);
    });

    ws.on('close', () => {
      const { deviceId } = clientMeta.get(ws) || {};
      if (deviceId) {
        const clients = deviceClients.get(deviceId);
        if (clients) {
          clients.delete(ws);
          if (clients.size === 0) {
            deviceClients.delete(deviceId);
          }
        }
        console.log(`[ws] 设备 ${deviceId} 断开连接`);
      }
      clientMeta.delete(ws);
    });

    ws.on('pong', () => {
      const meta = clientMeta.get(ws);
      if (meta) {
        meta.alive = true;
      }
    });

    ws.on('error', (err) => {
      console.error(`[ws] 连接错误:`, err.message);
    });
  });

  // 启动心跳检测
  startHeartbeat(wss);

  console.log('[ws] WebSocket 服务器已初始化');
  return wss;
}

/**
 * 处理客户端消息
 */
function handleMessage(ws, msg) {
  const meta = clientMeta.get(ws);
  if (!meta) return;

  switch (msg.type) {
    case 'subscribe':
      subscribe(msg.deviceId, ws);
      break;

    case 'push':
      if (!msg.deviceId || !Array.isArray(msg.changes)) {
        sendError(ws, 'push 消息缺少 deviceId 或 changes');
        return;
      }
      handlePush(msg.deviceId, msg.changes);
      break;

    case 'ping':
      send(ws, { type: 'pong' });
      break;

    default:
      sendError(ws, `未知消息类型: ${msg.type}`);
  }
}

/**
 * 注册设备监听
 * @param {string} deviceId
 * @param {import('ws').WebSocket} ws
 */
export function subscribe(deviceId, ws) {
  if (!deviceId) {
    sendError(ws, 'subscribe 缺少 deviceId');
    return;
  }

  const meta = clientMeta.get(ws);
  if (meta) {
    // 如果该 ws 已经订阅了其他设备，先移除旧注册
    if (meta.deviceId && meta.deviceId !== deviceId) {
      const oldClients = deviceClients.get(meta.deviceId);
      if (oldClients) {
        oldClients.delete(ws);
        if (oldClients.size === 0) {
          deviceClients.delete(meta.deviceId);
        }
      }
    }
    meta.deviceId = deviceId;
  }

  if (!deviceClients.has(deviceId)) {
    deviceClients.set(deviceId, new Set());
  }
  deviceClients.get(deviceId).add(ws);

  send(ws, { type: 'subscribed', deviceId });
  console.log(`[ws] 设备 ${deviceId} 已注册，当前连接数: ${deviceClients.get(deviceId).size}`);
}

/**
 * 向除发送者外的所有设备广播变更
 * @param {string} senderDeviceId
 * @param {Array} changes
 */
export function broadcastChanges(senderDeviceId, changes) {
  const payload = JSON.stringify({ type: 'changes', changes });

  for (const [deviceId, clients] of deviceClients) {
    if (deviceId === senderDeviceId) continue;
    for (const ws of clients) {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(payload);
      }
    }
  }

  console.log(
    `[ws] 已向设备 [${senderDeviceId} 以外的设备] 广播 ${changes.length} 条变更`
  );
}

/**
 * 处理客户端推送的变更
 * @param {string} deviceId
 * @param {Array} changes
 */
export function handlePush(deviceId, changes) {
  // 将变更广播给该设备的其他连接以及所有其他设备
  for (const [did, clients] of deviceClients) {
    if (did === deviceId) continue;
    const payload = JSON.stringify({ type: 'changes', changes });
    for (const ws of clients) {
      if (ws.readyState === 1) {
        ws.send(payload);
      }
    }
  }

  console.log(`[ws] 处理设备 ${deviceId} 的 push，广播 ${changes.length} 条变更`);
}

/**
 * 获取当前在线设备列表
 * @returns {string[]}
 */
export function getConnectedDevices() {
  return Array.from(deviceClients.keys());
}

// ---------------------------------------------------------------------------
// 内部工具函数
// ---------------------------------------------------------------------------

function send(ws, data) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(data));
  }
}

function sendError(ws, message) {
  send(ws, { type: 'error', message });
}

/**
 * 启动心跳检测：每 30 秒检查所有连接，断开无响应的客户端
 */
function startHeartbeat(wss) {
  heartbeatTimer = setInterval(() => {
    for (const [ws, meta] of clientMeta) {
      if (!meta.alive) {
        console.log(`[ws] 心跳超时，断开连接`);
        ws.terminate();
        // Don't delete from clientMeta here — let the 'close' handler do it
        // so deviceClients cleanup runs correctly
        continue;
      }
      meta.alive = false;
      ws.ping();
    }
  }, HEARTBEAT_INTERVAL);

  // 当服务器关闭时清理定时器
  wss.on('close', () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  });
}
