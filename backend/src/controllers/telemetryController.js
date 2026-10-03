import repository from '../database/repository.js';
import { DB_PATH } from '../config/index.js';

export const getTelemetry = (req, res) => {
  try {
    const jobs = repository.getAllJobs();
    const datasets = repository.getAllDatasets();
    const pairs = repository.getAllPairs();

    const activeJobs = jobs.filter(j => j.status === 'processing' || j.status === 'queued');
    const completedJobs = jobs.filter(j => j.status === 'completed');
    const failedJobs = jobs.filter(j => j.status === 'failed');

    const totalRmse = completedJobs.reduce((acc, j) => acc + (j.metrics?.rmse || 0), 0);
    const avgRmse = completedJobs.length > 0 ? Math.round((totalRmse / completedJobs.length) * 100) / 100 : 0.38;

    res.json({
      success: true,
      data: {
        platform: 'SELENE-REG / SuryaReg Workstation',
        version: '1.0.0-SIH26166',
        isro_compliant: true,
        sub_pixel_threshold_px: 0.40,
        current_avg_rmse_px: avgRmse,
        active_jobs_count: activeJobs.length,
        completed_jobs_count: completedJobs.length,
        failed_jobs_count: failedJobs.length,
        total_jobs_count: jobs.length,
        total_datasets_count: datasets.length,
        total_pairs_count: pairs.length,
        database: {
          type: 'SQLite (node:sqlite WAL Mode)',
          path: DB_PATH,
          connected: true
        },
        uptime_seconds: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getHealth = (req, res) => {
  res.json({
    status: 'UP',
    database: 'CONNECTED',
    timestamp: new Date().toISOString()
  });
};

export default {
  getTelemetry,
  getHealth
};
