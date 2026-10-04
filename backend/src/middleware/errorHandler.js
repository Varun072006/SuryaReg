// SuryaReg Centralized Error Handling Middleware
// Formats operational & system errors safely without leaking internal paths

import { IS_PRODUCTION } from '../config/index.js';
import logger from '../utils/logger.js';
import { sendError } from '../utils/response.js';

/**
 * 404 Not Found Handler for unmatched API routes
 */
export function notFoundHandler(req, res, _next) {
  if (req.path.startsWith('/api')) {
    return sendError(
      res,
      `API endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`,
      404,
      'NOT_FOUND'
    );
  }
  _next();
}

/**
 * Global Error Handler
 */
export function globalErrorHandler(err, req, res, _next) {
  // Catch JSON parsing errors from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 'Malformed JSON in request payload.', 400, 'INVALID_JSON');
  }

  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const errorCode = err.errorCode || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');

  // Log error with context
  if (statusCode >= 500) {
    logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  } else {
    logger.warn(`[Client Error] ${req.method} ${req.originalUrl} (${statusCode}): ${err.message}`);
  }

  // Sanitize internal error messages in production
  let clientMessage = err.message || 'An unexpected error occurred.';
  if (IS_PRODUCTION && statusCode >= 500) {
    clientMessage = 'An internal mission server error occurred. Please contact the mission control administrator.';
  }

  return sendError(res, clientMessage, statusCode, errorCode, err.details || null);
}

export default {
  notFoundHandler,
  globalErrorHandler
};
