import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import apiRoutes from './routes/apiRoutes.js';
import { DIST_DIR, IMG_DIR } from './config/index.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Request logger
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Mount API router
  app.use('/api', apiRoutes);

  // Serve static imagery from img/ and dist/images
  if (fs.existsSync(IMG_DIR)) {
    app.use('/images', express.static(IMG_DIR));
  }
  const distImages = path.join(DIST_DIR, 'images');
  if (fs.existsSync(distImages)) {
    app.use('/images', express.static(distImages));
  }

  // Serve static frontend from dist
  if (fs.existsSync(DIST_DIR)) {
    console.log(`[Static] Serving frontend static assets from: ${DIST_DIR}`);
    app.use(express.static(DIST_DIR));

    // SPA fallback: any non-API route returns dist/index.html
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(DIST_DIR, 'index.html'));
      }
      next();
    });
  } else {
    console.warn(`[Static] Warning: dist directory not found at ${DIST_DIR}`);
  }

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('[Error]', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal Server Error'
    });
  });

  return app;
}

export default createApp;
