import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '../../../');
export const BACKEND_DIR = path.resolve(__dirname, '../../');
export const DATA_DIR = path.join(BACKEND_DIR, 'data');
export const DB_PATH = path.join(DATA_DIR, 'suryareg.db');
export const DIST_DIR = path.join(ROOT_DIR, 'dist');
export const IMG_DIR = path.join(ROOT_DIR, 'img');

export const PORT = process.env.PORT || 5173;
export const NODE_ENV = process.env.NODE_ENV || 'development';

export default {
  ROOT_DIR,
  BACKEND_DIR,
  DATA_DIR,
  DB_PATH,
  DIST_DIR,
  IMG_DIR,
  PORT,
  NODE_ENV
};
