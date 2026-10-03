import { createApp } from './src/app.js';
import { PORT, DB_PATH } from './src/config/index.js';
import { seedDatabase } from './src/database/seed.js';

async function bootstrap() {
  console.log('='.repeat(70));
  console.log('  SuryaReg (SELENE-REG) Lunar Image Registration Mission Backend');
  console.log('  SIH Problem Statement 26166 | ISRO Space Applications Centre');
  console.log('='.repeat(70));

  try {
    // 1. Initialize and seed SQLite database
    seedDatabase(false);
    console.log(`[Database] Connected & synced SQLite at: ${DB_PATH}`);

    // 2. Create and start Express server
    const app = createApp();

    const server = app.listen(PORT, () => {
      console.log(`[Server] Live on http://localhost:${PORT}`);
      console.log(`[API] Health Check: http://localhost:${PORT}/api/health`);
      console.log(`[API] Telemetry:    http://localhost:${PORT}/api/telemetry`);
      console.log(`[API] Datasets:     http://localhost:${PORT}/api/datasets`);
      console.log(`[API] Pairs:        http://localhost:${PORT}/api/pairs`);
      console.log(`[API] Jobs:         http://localhost:${PORT}/api/jobs`);
      console.log(`[API] Benchmarks:   http://localhost:${PORT}/api/benchmarks`);
      console.log(`[Workstation UI]    http://localhost:${PORT}/`);
      console.log('='.repeat(70));
    });

    const shutdown = () => {
      console.log('\n[Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (err) {
    console.error('[Bootstrap Error] Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
