// SuryaReg (SELENE-REG) Structured Logger
// SIH Problem Statement 26166: Multi-Modal Lunar Image Registration

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  ENGINE: 2,
  WARN: 3,
  ERROR: 4
};

const CURRENT_LEVEL = process.env.LOG_LEVEL
  ? (LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] ?? LOG_LEVELS.INFO)
  : LOG_LEVELS.INFO;

function formatTimestamp() {
  return new Date().toISOString();
}

function safeSerialize(data) {
  if (data === undefined) return '';
  if (typeof data === 'string') return data;
  if (data instanceof Error) {
    return `${data.message}\n${data.stack || ''}`;
  }
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

export const logger = {
  debug(message, context) {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      console.debug(`[${formatTimestamp()}] [DEBUG] ${message}`, context !== undefined ? safeSerialize(context) : '');
    }
  },

  info(message, context) {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      console.log(`[${formatTimestamp()}] [INFO]  ${message}`, context !== undefined ? safeSerialize(context) : '');
    }
  },

  engine(stage, message, context) {
    if (CURRENT_LEVEL <= LOG_LEVELS.ENGINE) {
      console.log(`[${formatTimestamp()}] [ENGINE:${stage}] ${message}`, context !== undefined ? safeSerialize(context) : '');
    }
  },

  warn(message, context) {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(`[${formatTimestamp()}] [WARN]  ${message}`, context !== undefined ? safeSerialize(context) : '');
    }
  },

  error(message, error) {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(`[${formatTimestamp()}] [ERROR] ${message}`, error !== undefined ? safeSerialize(error) : '');
    }
  }
};

export default logger;
