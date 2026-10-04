import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DB_PATH, DATA_DIR } from '../config/index.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbInstance = null;

export function getDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  logger.info(`[Database] Connecting to SQLite database at: ${DB_PATH}`);
  dbInstance = new DatabaseSync(DB_PATH);

  // Performance & Integrity PRAGMAs
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  dbInstance.exec('PRAGMA synchronous = NORMAL;');
  dbInstance.exec('PRAGMA temp_store = MEMORY;');
  dbInstance.exec('PRAGMA cache_size = -64000;'); // 64MB memory cache

  // Read and apply schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  dbInstance.exec(schemaSql);

  logger.info('[Database] Schema verified and applied successfully with WAL mode enabled.');
  return dbInstance;
}

/**
 * Executes a callback within an atomic SQLite transaction
 * @param {Function} callback
 * @returns {*} Result of callback
 */
export function runTransaction(callback) {
  const db = getDatabase();
  db.exec('BEGIN TRANSACTION;');
  try {
    const result = callback(db);
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch (rollbackErr) {
      logger.error('[Database] Rollback failed:', rollbackErr);
    }
    throw err;
  }
}

export function closeDatabase() {
  if (dbInstance) {
    try {
      dbInstance.close();
      logger.info('[Database] Closed SQLite connection gracefully.');
    } catch (err) {
      logger.error('[Database] Error while closing SQLite connection:', err);
    } finally {
      dbInstance = null;
    }
  }
}

export default {
  getDatabase,
  runTransaction,
  closeDatabase
};
