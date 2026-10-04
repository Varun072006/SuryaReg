// SuryaReg Input Validation & Sanitization Middleware
// Protects against injection, path traversal, header injection, and malformed payloads

import { sendError } from '../utils/response.js';
import { ALLOWED_MATCHERS } from '../utils/constants.js';

// Safe alphanumeric pattern for dataset, pair, and job identifiers
const SAFE_ID_REGEX = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Validates route parameters like :id, :jobId
 * @param {string} paramName
 */
export function validateParamId(paramName = 'id') {
  return (req, res, next) => {
    const val = req.params[paramName];
    if (!val || typeof val !== 'string' || !SAFE_ID_REGEX.test(val)) {
      return sendError(
        res,
        `Invalid parameter '${paramName}': must be 1-64 alphanumeric characters, dashes, or underscores.`,
        400,
        'INVALID_IDENTIFIER'
      );
    }
    next();
  };
}

/**
 * Validates Job creation payload
 */
export function validateCreateJob(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return sendError(res, 'Request body is required and must be an object.', 400, 'INVALID_BODY');
  }

  const pairId = body.pairId || body.pair_id;
  if (pairId && (!SAFE_ID_REGEX.test(pairId) || typeof pairId !== 'string')) {
    return sendError(res, 'Invalid pairId format.', 400, 'INVALID_PAIR_ID');
  }

  if (body.id && (!SAFE_ID_REGEX.test(body.id) || typeof body.id !== 'string')) {
    return sendError(res, 'Custom job id must be 1-64 alphanumeric characters.', 400, 'INVALID_JOB_ID');
  }

  if (body.name && (typeof body.name !== 'string' || body.name.length > 200)) {
    return sendError(res, 'Job name must be a string up to 200 characters.', 400, 'INVALID_JOB_NAME');
  }

  if (body.config && typeof body.config === 'object') {
    const { matcher, confidenceThreshold } = body.config;
    if (matcher && !ALLOWED_MATCHERS.includes(matcher)) {
      return sendError(
        res,
        `Invalid matcher '${matcher}'. Allowed matchers: ${ALLOWED_MATCHERS.join(', ')}`,
        400,
        'INVALID_MATCHER'
      );
    }
    if (
      confidenceThreshold !== undefined &&
      (typeof confidenceThreshold !== 'number' || confidenceThreshold < 0 || confidenceThreshold > 1)
    ) {
      return sendError(res, 'confidenceThreshold must be a number between 0.0 and 1.0.', 400, 'INVALID_THRESHOLD');
    }
  }

  next();
}

/**
 * Validates Dataset creation payload
 */
export function validateCreateDataset(req, res, next) {
  const ds = req.body;
  if (!ds || typeof ds !== 'object') {
    return sendError(res, 'Request body must be a valid JSON object.', 400, 'INVALID_BODY');
  }

  if (!ds.id || typeof ds.id !== 'string' || !SAFE_ID_REGEX.test(ds.id)) {
    return sendError(res, "Field 'id' is required (1-64 alphanumeric/dash/underscore chars).", 400, 'INVALID_FIELD');
  }

  if (!ds.name || typeof ds.name !== 'string' || ds.name.length > 150) {
    return sendError(res, "Field 'name' is required (max 150 chars).", 400, 'INVALID_FIELD');
  }

  if (ds.gsdMeters !== undefined && ds.gsd_meters !== undefined) {
    const gsd = ds.gsdMeters || ds.gsd_meters;
    if (typeof gsd !== 'number' || gsd <= 0) {
      return sendError(res, "Field 'gsdMeters' must be a positive number.", 400, 'INVALID_FIELD');
    }
  }

  next();
}

/**
 * Validates Image Pair creation payload
 */
export function validateCreatePair(req, res, next) {
  const p = req.body;
  if (!p || typeof p !== 'object') {
    return sendError(res, 'Request body must be a valid JSON object.', 400, 'INVALID_BODY');
  }

  if (!p.id || typeof p.id !== 'string' || !SAFE_ID_REGEX.test(p.id)) {
    return sendError(res, "Field 'id' is required (1-64 chars).", 400, 'INVALID_FIELD');
  }

  if (!p.name || typeof p.name !== 'string') {
    return sendError(res, "Field 'name' is required.", 400, 'INVALID_FIELD');
  }

  const srcId = p.sourceDatasetId || p.source_dataset_id;
  const refId = p.referenceDatasetId || p.reference_dataset_id;

  if (!srcId || !SAFE_ID_REGEX.test(srcId)) {
    return sendError(res, "Valid 'sourceDatasetId' is required.", 400, 'INVALID_FIELD');
  }

  if (!refId || !SAFE_ID_REGEX.test(refId)) {
    return sendError(res, "Valid 'referenceDatasetId' is required.", 400, 'INVALID_FIELD');
  }

  next();
}

/**
 * Sanitize filename to prevent HTTP Header Injection (CRLF) and directory traversal
 * @param {string} filename
 * @returns {string} Safe ASCII filename
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'download.bin';
  return filename
    .replace(/[\r\n]/g, '') // Remove CRLF
    .replace(/[\/\\?%*:|"<>]/g, '_') // Remove traversal & unsafe chars
    .trim()
    .slice(0, 100);
}

export default {
  validateParamId,
  validateCreateJob,
  validateCreateDataset,
  validateCreatePair,
  sanitizeFilename
};
