import { createApp } from './src/app.js';
import { PORT, HOST, DB_PATH, NODE_ENV } from './src/config/index.js';
import { seedDatabase } from './src/database/seed.js';
import { closeDatabase } from './src/database/db.js';
import logger from './src/utils/logger.js';

async function bootstrap() {
  console.log('='.repeat(74));
  console.log('   SuryaReg (SELENE-REG) Lunar Image Registration Mission Workstation');
  console.log('   SIH Problem Statement 26166 | ISRO Space Applications Centre (SAC)');
  console.log('='.repeat(74));

  try {
    // 1. Initialize and seed SQLite database
    seedDatabase(false);
    logger.info(`[Database] SQLite connected and ready at: ${DB_PATH}`);

    // 2. Instantiate and mount Express application
    const app = createApp();

    const server = app.listen(PORT, HOST, () => {
      logger.info(`[Server] Live on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT} (${NODE_ENV})`);
      logger.info(`[API] Health Check:  http://localhost:${PORT}/api/health`);
      logger.info(`[API] Telemetry:     http://localhost:${PORT}/api/telemetry`);
      logger.info(`[API] Datasets:      http://localhost:${PORT}/api/datasets`);
      logger.info(`[API] Pairs:         http://localhost:${PORT}/api/pairs`);
      logger.info(`[API] Jobs:          http://localhost:${PORT}/api/jobs`);
      logger.info(`[API] Benchmarks:    http://localhost:${PORT}/api/benchmarks`);
      logger.info(`[Workstation UI]     http://localhost:${PORT}/`);
      console.log('='.repeat(74));
    });

    // Graceful Shutdown Handler
    let isShuttingDown = false;
    const gracefulShutdown = (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      logger.info(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

      server.close(() => {
        logger.info('[Server] HTTP listeners closed.');
        try {
          closeDatabase();
          logger.info('[Server] Mission database closed. Shutdown complete.');
          process.exit(0);
        } catch (err) {
          logger.error('[Server] Error closing database during shutdown:', err);
          process.exit(1);
        }
      });

      // Force terminate if graceful shutdown hangs
      setTimeout(() => {
        logger.error('[Server] Forced shutdown after timeout.');
        process.exit(1);
      }, 5000).unref();
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    process.on('uncaughtException', (err) => {
      logger.error('[Fatal] Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('[Fatal] Unhandled Promise Rejection:', reason);
    });

  } catch (err) {
    logger.error('[Bootstrap Error] Failed to initialize mission server:', err);
    process.exit(1);
  }
}

bootstrap();
