import express from 'express';
import path from 'path';
import fs from 'fs';
import apiRoutes from './routes/apiRoutes.js';
import { DIST_DIR, IMG_DIR, IS_PRODUCTION } from './config/index.js';
import { securityHeadersMiddleware, corsMiddleware, rateLimitMiddleware } from './middleware/security.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

export function createApp() {
  const app = express();

  // 1. Security Headers & Hardening
  app.use(securityHeadersMiddleware);

  // 2. CORS Handling
  app.use(corsMiddleware);

  // 3. Body Parsers with reasonable bounds to prevent DoS
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Rate Limiter for API endpoints
  app.use(rateLimitMiddleware);

  // 5. Request Logger & Performance Profiler
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path.startsWith('/api')) {
        logger.info(`${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
      }
    });
    next();
  });

  // 6. Mount Primary API Router
  app.use('/api', apiRoutes);

  // 7. Serve Static Mission Imagery
  if (fs.existsSync(IMG_DIR)) {
    app.use('/images', express.static(IMG_DIR, { maxAge: IS_PRODUCTION ? '1d' : '0' }));
  }
  const distImages = path.join(DIST_DIR, 'images');
  if (fs.existsSync(distImages)) {
    app.use('/images', express.static(distImages, { maxAge: IS_PRODUCTION ? '1d' : '0' }));
  }

  // 8. Serve Static Frontend SPA from dist
  if (fs.existsSync(DIST_DIR)) {
    logger.info(`[Static] Serving frontend static assets from: ${DIST_DIR}`);
    app.use(express.static(DIST_DIR));

    // SPA fallback: any non-API GET route returns dist/index.html
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(DIST_DIR, 'index.html'));
      }
      next();
    });
  } else {
    logger.warn(`[Static] Production build directory not found at ${DIST_DIR}. Serving API-only mode.`);
  }

  // 9. 404 Handler for Unmatched API Endpoints
  app.use(notFoundHandler);

  // 10. Global Centralized Error Handler
  app.use(globalErrorHandler);

  return app;
}

export default createApp;
