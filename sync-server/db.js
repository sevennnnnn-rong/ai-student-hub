import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'sync.db');

let db = null;
let sql = null;

async function initDatabase() {
  sql = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new sql.Database(fileBuffer);
  } else {
    db = new sql.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS sync_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      UNIQUE(device_id, entity_type, entity_id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      timestamp TEXT NOT NULL,
      details TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      device_id TEXT PRIMARY KEY,
      registered_at TEXT NOT NULL,
      last_seen TEXT NOT NULL
    );
  `);

  db.run(`CREATE INDEX IF NOT EXISTS ix_sync_entity ON sync_metadata(entity_type, entity_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS ix_sync_log_ts ON sync_log(timestamp)`);

  saveDatabase();
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('[DB] Failed to save:', err);
  }
}

function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

// Helper: run a SELECT query and return all rows as objects
function queryAll(sqlStr, params = []) {
  const conn = getDb();
  const stmt = conn.prepare(sqlStr);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a SELECT query and return first row as object
function queryOne(sqlStr, params = []) {
  const rows = queryAll(sqlStr, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: run INSERT/UPDATE/DELETE and return changes info
function run(sqlStr, params = []) {
  const conn = getDb();
  conn.run(sqlStr, params);
  saveDatabase();
  return { changes: conn.getRowsModified() };
}

export { getDb, initDatabase, closeDatabase, saveDatabase, queryAll, queryOne, run };
export default getDb;
