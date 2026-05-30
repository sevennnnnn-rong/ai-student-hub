import { v4 as uuidv4 } from 'uuid';
import { getDb, queryAll, queryOne, run, saveDatabase } from './db.js';

// ============================================================
// Device Management
// ============================================================

const devices = new Map();
const MAX_DEVICES = 1000;

export function registerDevice(deviceId) {
  if (!devices.has(deviceId)) {
    if (devices.size >= MAX_DEVICES) {
      // Evict oldest (first inserted)
      const oldest = devices.keys().next().value;
      devices.delete(oldest);
      console.log(`[sync] Evicted oldest device ${oldest} (limit: ${MAX_DEVICES})`);
    }
    devices.set(deviceId, {
      id: deviceId,
      registeredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    });

    run(
      `INSERT OR IGNORE INTO sync_log (device_id, action, entity_type, entity_id, timestamp, details)
       VALUES (?, 'register', 'device', NULL, ?, ?)`,
      [deviceId, new Date().toISOString(), JSON.stringify({ action: 'device_registered' })]
    );
  } else {
    devices.get(deviceId).lastSeen = new Date().toISOString();
  }

  return devices.get(deviceId);
}

// ============================================================
// Push Changes
// ============================================================

export function pushChanges(deviceId, changes) {
  const db = getDb();
  const accepted = [];
  const conflicts = [];
  const now = new Date().toISOString();

  for (const change of changes) {
    const { entityType, entityId, data, version, updatedAt, deleted } = change;

    const existing = queryOne(
      `SELECT * FROM sync_metadata WHERE device_id = ? AND entity_type = ? AND entity_id = ?`,
      [deviceId, entityType, entityId]
    );

    const remoteVersions = queryAll(
      `SELECT * FROM sync_metadata WHERE entity_type = ? AND entity_id = ? AND device_id != ?`,
      [entityType, entityId, deviceId]
    );

    let shouldAccept = true;
    let conflictInfo = null;

    for (const remote of remoteVersions) {
      const resolution = getConflictResolution(
        existing ? existing.version : 0,
        remote.version,
        existing ? existing.updated_at : '1970-01-01T00:00:00.000Z',
        remote.updated_at
      );

      if (resolution === 'remote') {
        const pushResolution = getConflictResolution(
          version,
          remote.version,
          updatedAt,
          remote.updated_at
        );

        if (pushResolution === 'remote') {
          shouldAccept = false;
          conflictInfo = {
            entityType,
            entityId,
            localVersion: version,
            localTime: updatedAt,
            remoteVersion: remote.version,
            remoteTime: remote.updated_at,
            remoteDevice: remote.device_id,
            resolution: 'rejected',
          };
          break;
        }
      }
    }

    if (shouldAccept) {
      run(
        `INSERT INTO sync_metadata (device_id, entity_type, entity_id, version, updated_at, deleted)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(device_id, entity_type, entity_id) DO UPDATE SET
           version = excluded.version,
           updated_at = excluded.updated_at,
           deleted = excluded.deleted`,
        [deviceId, entityType, entityId, version, updatedAt, deleted ? 1 : 0]
      );

      run(
        `INSERT INTO sync_log (device_id, action, entity_type, entity_id, timestamp, details)
         VALUES (?, 'push', ?, ?, ?, ?)`,
        [deviceId, entityType, entityId, now, JSON.stringify({ version, deleted: !!deleted, data })]
      );

      accepted.push({
        entityType,
        entityId,
        version,
        resolvedAt: now,
      });
    } else {
      conflicts.push(conflictInfo);
    }
  }

  return { accepted, conflicts };
}

// ============================================================
// Pull Changes
// ============================================================

export function pullChanges(deviceId, since) {
  const rows = queryAll(
    `SELECT DISTINCT
       sm.entity_type,
       sm.entity_id,
       sm.version,
       sm.updated_at,
       sm.deleted,
       sm.device_id
     FROM sync_metadata sm
     WHERE sm.device_id != ?
       AND sm.updated_at > ?
     ORDER BY sm.updated_at ASC`,
    [deviceId, since]
  );

  run(
    `INSERT INTO sync_log (device_id, action, entity_type, entity_id, timestamp, details)
     VALUES (?, 'pull', 'all', NULL, ?, ?)`,
    [deviceId, new Date().toISOString(), JSON.stringify({ since, count: rows.length })]
  );

  return rows;
}

// ============================================================
// Conflict Resolution
// ============================================================

export function getConflictResolution(localVersion, remoteVersion, localTime, remoteTime) {
  if (localTime > remoteTime) {
    return 'local';
  }
  if (remoteTime > localTime) {
    return 'remote';
  }

  if (localVersion > remoteVersion) {
    return 'local';
  }
  if (remoteVersion > localVersion) {
    return 'remote';
  }

  return 'remote';
}

// ============================================================
// Status Query
// ============================================================

export function getSyncStatus(deviceId) {
  const rows = queryAll(
    `SELECT
       entity_type,
       MAX(version) as latest_version,
       MAX(updated_at) as latest_updated_at,
       COUNT(*) as entity_count
     FROM sync_metadata
     WHERE device_id = ?
     GROUP BY entity_type`,
    [deviceId]
  );

  const status = {};
  for (const row of rows) {
    status[row.entity_type] = {
      latestVersion: row.latest_version,
      latestUpdatedAt: row.latest_updated_at,
      entityCount: row.entity_count,
    };
  }

  return status;
}

// ============================================================
// Sync Log Cleanup
// ============================================================

export function cleanupSyncLog(maxAgeDays = 30) {
  const cutoff = new Date(Date.now() - maxAgeDays * 86400000).toISOString();
  run(`DELETE FROM sync_log WHERE timestamp < ?`, [cutoff]);
  console.log(`[sync] Cleaned sync_log entries older than ${maxAgeDays} days (cutoff: ${cutoff})`);
}

// ============================================================
// Acknowledgement
// ============================================================

export function acknowledgeChanges(deviceId, changeIds) {
  run(
    `INSERT INTO sync_log (device_id, action, entity_type, entity_id, timestamp, details)
     VALUES (?, 'ack', 'change', NULL, ?, ?)`,
    [deviceId, new Date().toISOString(), JSON.stringify({ changeIds })]
  );

  return { acknowledged: changeIds.length };
}
