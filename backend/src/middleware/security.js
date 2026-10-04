// SuryaReg Enterprise Security Middleware
// Implements secure HTTP headers, CORS validation, and sliding-window rate limiting

import { IS_PRODUCTION, CORS_ORIGINS, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from '../config/index.js';
import { sendError } from '../utils/response.js';

/**
 * Apply hardened HTTP Security Headers
 */
export function securityHeadersMiddleware(req, res, next) {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking via iframes
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Modern browsers: disable legacy buggy XSS auditor
  res.setHeader('X-XSS-Protection', '0');

  // Strict referrer privacy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Cross-origin resource sharing policy
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  // Restrict browser permissions/features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // HSTS when serving over HTTPS / in production
  if (IS_PRODUCTION || req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Content Security Policy (allows local images, fonts, and SPA scripts)
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: http: https:",
      "connect-src 'self' http: https: ws: wss:",
      "frame-ancestors 'self'"
    ].join('; ')
  );

  next();
}

/**
 * Enterprise CORS Handler
 */
export function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;

  // If no origin (e.g. same-origin request, cURL, server-to-server), allow
  if (!origin) {
    return next();
  }

  const isAllowed =
    !IS_PRODUCTION ||
    CORS_ORIGINS.includes('*') ||
    CORS_ORIGINS.includes(origin) ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:');

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours preflight cache
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
}

/**
 * Sliding Window Token Rate Limiter
 * Zero external dependency, memory-leak-safe rate limiter
 */
class SlidingWindowRateLimiter {
  constructor(windowMs = 60000, maxRequests = 600) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.hits = new Map(); // ip -> [timestamps]

    // Periodic garbage collection every 3 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 180000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [ip, timestamps] of this.hits.entries()) {
      const valid = timestamps.filter(t => now - t < this.windowMs);
      if (valid.length === 0) {
        this.hits.delete(ip);
      } else {
        this.hits.set(ip, valid);
      }
    }
  }

  middleware() {
    return (req, res, next) => {
      // Skip rate limiting for static assets and health checks
      if (
        !req.path.startsWith('/api') ||
        req.path === '/api/health' ||
        req.path === '/api/telemetry'
      ) {
        return next();
      }

      const ip =
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      const now = Date.now();
      const windowStart = now - this.windowMs;

      let timestamps = this.hits.get(ip) || [];
      timestamps = timestamps.filter(t => t > windowStart);

      if (timestamps.length >= this.maxRequests) {
        const oldest = timestamps[0];
        const resetSec = Math.ceil((oldest + this.windowMs - now) / 1000);

        res.setHeader('Retry-After', resetSec);
        res.setHeader('X-RateLimit-Limit', this.maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil((oldest + this.windowMs) / 1000));

        return sendError(
          res,
          `Rate limit exceeded. Please retry after ${resetSec} seconds.`,
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }

      timestamps.push(now);
      this.hits.set(ip, timestamps);

      const remaining = Math.max(0, this.maxRequests - timestamps.length);
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);

      next();
    };
  }
}

export const rateLimiter = new SlidingWindowRateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);
export const rateLimitMiddleware = rateLimiter.middleware();

export default {
  securityHeadersMiddleware,
  corsMiddleware,
  rateLimitMiddleware
};
