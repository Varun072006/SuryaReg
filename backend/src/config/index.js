import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load simple .env file if present
function loadEnvFile(envPath) {
  try {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {
    // Gracefully ignore .env parsing errors
  }
}

export const BACKEND_DIR = path.resolve(__dirname, '../../');
export const ROOT_DIR = path.resolve(__dirname, '../../../');

// Load environment from backend/.env or root .env
loadEnvFile(path.join(ROOT_DIR, '.env'));
loadEnvFile(path.join(BACKEND_DIR, '.env'));

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';

export const PORT = Number.parseInt(process.env.PORT || '5173', 10);
export const HOST = process.env.HOST || '0.0.0.0';

export const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(BACKEND_DIR, 'data'));
export const DB_PATH = path.resolve(process.env.DB_PATH || path.join(DATA_DIR, 'suryareg.db'));

export const DIST_DIR = path.resolve(process.env.DIST_DIR || path.join(ROOT_DIR, 'dist'));
export const IMG_DIR = path.resolve(process.env.IMG_DIR || path.join(ROOT_DIR, 'img'));

export const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'];

export const RATE_LIMIT_WINDOW_MS = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
export const RATE_LIMIT_MAX_REQUESTS = Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '600', 10);

export const LOG_LEVEL = process.env.LOG_LEVEL || (IS_PRODUCTION ? 'INFO' : 'DEBUG');

export default {
  ROOT_DIR,
  BACKEND_DIR,
  DATA_DIR,
  DB_PATH,
  DIST_DIR,
  IMG_DIR,
  PORT,
  HOST,
  NODE_ENV,
  IS_PRODUCTION,
  CORS_ORIGINS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  LOG_LEVEL
};
