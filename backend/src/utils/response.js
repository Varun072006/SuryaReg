// SuryaReg Standardized API Response Utilities

/**
 * Send a standardized success response
 * @param {object} res Express response object
 * @param {*} data Payload to send
 * @param {object} [meta] Metadata (count, pagination, etc.)
 * @param {number} [statusCode=200]
 */
export function sendSuccess(res, data = null, meta = {}, statusCode = 200) {
  const response = {
    success: true,
    timestamp: new Date().toISOString()
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  if (meta && Object.keys(meta).length > 0) {
    Object.assign(response, meta);
  }

  return res.status(statusCode).json(response);
}

/**
 * Send a standardized error response
 * @param {object} res Express response object
 * @param {string} message Error message
 * @param {number} [statusCode=500] HTTP status code
 * @param {string} [errorCode='INTERNAL_ERROR'] Custom error code
 * @param {*} [details=null] Optional validation details or errors
 */
export function sendError(res, message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) {
  const response = {
    success: false,
    error: {
      code: errorCode,
      message
    },
    timestamp: new Date().toISOString()
  };

  if (details !== null && details !== undefined) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
}

export default {
  sendSuccess,
  sendError
};
