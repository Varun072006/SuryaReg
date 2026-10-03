import { Router } from 'express';
import datasetController from '../controllers/datasetController.js';
import pairController from '../controllers/pairController.js';
import jobController from '../controllers/jobController.js';
import benchmarkController from '../controllers/benchmarkController.js';
import exportController from '../controllers/exportController.js';
import telemetryController from '../controllers/telemetryController.js';

const router = Router();

// System Health & Telemetry
router.get('/health', telemetryController.getHealth);
router.get('/telemetry', telemetryController.getTelemetry);

// Datasets
router.get('/datasets', datasetController.getDatasets);
router.get('/datasets/:id', datasetController.getDatasetById);
router.post('/datasets', datasetController.createDataset);

// Pairs
router.get('/pairs', pairController.getPairs);
router.get('/pairs/:id', pairController.getPairById);
router.post('/pairs', pairController.createPair);

// Jobs & Pipeline
router.get('/jobs', jobController.getJobs);
router.get('/jobs/:id', jobController.getJobById);
router.post('/jobs', jobController.createJob);
router.post('/jobs/:id/start', jobController.startJob);
router.post('/jobs/:id/pause', jobController.pauseJob);
router.post('/jobs/:id/resume', jobController.resumeJob);
router.post('/jobs/:id/cancel', jobController.cancelJob);
router.post('/jobs/:id/retry', jobController.retryJob);
router.get('/jobs/:id/logs', jobController.getJobLogs);
router.get('/jobs/:id/tiepoints', jobController.getJobTiePoints);

// Benchmarks
router.get('/benchmarks', benchmarkController.getBenchmarks);

// Deliverables & Exports
router.get('/exports/:jobId/dossier', exportController.getDossier);
router.get('/exports/:jobId/csv', exportController.getTiePointsCsv);
router.get('/exports/:jobId/geotiff-meta', exportController.getGeoTiffMeta);

export default router;
