import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initDatabase, closeDatabase } from './db.js';
import {
  registerDevice,
  pushChanges,
  pullChanges,
  getSyncStatus,
  acknowledgeChanges,
  cleanupSyncLog,
} from './sync-service.js';
import { initWebSocket } from './ws-server.js';

const app = express();
const PORT = process.env.PORT || 3001;

let server;
let wss;

// ============================================================
// Middleware
// ============================================================

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// ============================================================
// Routes
// ============================================================

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-student-hub-sync-server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Register Device
app.post('/api/sync/register', (req, res) => {
  try {
    const { deviceId, deviceName } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    const device = registerDevice(deviceId);

    res.json({
      success: true,
      device: {
        ...device,
        deviceName: deviceName || 'Unknown Device',
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Push Changes
app.post('/api/sync/push', (req, res) => {
  try {
    const { deviceId, changes } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    if (!Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({ error: 'changes array is required and must not be empty' });
    }

    const result = pushChanges(deviceId, changes);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Push error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pull Changes
app.post('/api/sync/pull', (req, res) => {
  try {
    const { deviceId, since } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    const sinceTimestamp = since || '1970-01-01T00:00:00.000Z';
    const changes = pullChanges(deviceId, sinceTimestamp);

    res.json({
      success: true,
      changes,
      count: changes.length,
    });
  } catch (error) {
    console.error('Pull error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync Status
app.get('/api/sync/status', (req, res) => {
  try {
    const { deviceId } = req.query;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId query parameter is required' });
    }

    const status = getSyncStatus(deviceId);

    res.json({
      success: true,
      deviceId,
      entities: status,
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Acknowledge Changes
app.post('/api/sync/ack', (req, res) => {
  try {
    const { deviceId, changeIds } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    if (!Array.isArray(changeIds)) {
      return res.status(400).json({ error: 'changeIds array is required' });
    }

    const result = acknowledgeChanges(deviceId, changeIds);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Ack error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// Error Handling
// ============================================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ============================================================
// Server Startup
// ============================================================

async function startServer() {
  try {
    await initDatabase();
    console.log('[Sync Server] Database initialized');

    // Run initial sync_log cleanup
    cleanupSyncLog(30);

    // Schedule periodic cleanup every hour
    setInterval(() => {
      try {
        cleanupSyncLog(30);
      } catch (err) {
        console.error('[Sync Server] Sync log cleanup failed:', err);
      }
    }, 3600_000);

    server = createServer(app);

    // Initialize WebSocket server
    wss = await initWebSocket(server);
    console.log('[Sync Server] WebSocket initialized');

    server.listen(PORT, () => {
      console.log(`[Sync Server] Running on http://localhost:${PORT}`);
      console.log(`[Sync Server] Health check: http://localhost:${PORT}/health`);
      console.log(`[Sync Server] WebSocket: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[Sync Server] Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Sync Server] Shutting down...');
  if (wss) wss.close();
  if (server) server.close();
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Sync Server] Shutting down...');
  if (wss) wss.close();
  if (server) server.close();
  closeDatabase();
  process.exit(0);
});

startServer();
