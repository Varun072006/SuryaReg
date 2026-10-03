import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DB_PATH, DATA_DIR } from '../config/index.js';

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

  console.log(`[Database] Connecting to SQLite database at: ${DB_PATH}`);
  dbInstance = new DatabaseSync(DB_PATH);

  // Enable WAL mode for high concurrency & performance
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  dbInstance.exec('PRAGMA foreign_keys = ON;');

  // Read and apply schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  dbInstance.exec(schemaSql);

  console.log('[Database] Schema verified and applied successfully.');
  return dbInstance;
}

export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('[Database] Closed connection.');
  }
}

export default {
  getDatabase,
  closeDatabase
};
