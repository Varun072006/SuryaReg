import { Router } from 'express';
import datasetController from '../controllers/datasetController.js';
import pairController from '../controllers/pairController.js';
import jobController from '../controllers/jobController.js';
import benchmarkController from '../controllers/benchmarkController.js';
import exportController from '../controllers/exportController.js';
import telemetryController from '../controllers/telemetryController.js';
import {
  validateParamId,
  validateCreateJob,
  validateCreateDataset,
  validateCreatePair
} from '../middleware/validator.js';

const router = Router();

// System Health & Telemetry
router.get('/health', telemetryController.getHealth);
router.get('/telemetry', telemetryController.getTelemetry);

// Datasets
router.get('/datasets', datasetController.getDatasets);
router.get('/datasets/:id', validateParamId('id'), datasetController.getDatasetById);
router.post('/datasets', validateCreateDataset, datasetController.createDataset);

// Image Pairs
router.get('/pairs', pairController.getPairs);
router.get('/pairs/:id', validateParamId('id'), pairController.getPairById);
router.post('/pairs', validateCreatePair, pairController.createPair);

// Registration Jobs & Pipeline
router.get('/jobs', jobController.getJobs);
router.get('/jobs/:id', validateParamId('id'), jobController.getJobById);
router.post('/jobs', validateCreateJob, jobController.createJob);
router.delete('/jobs/:id', validateParamId('id'), jobController.deleteJob);
router.post('/jobs/:id/start', validateParamId('id'), jobController.startJob);
router.post('/jobs/:id/pause', validateParamId('id'), jobController.pauseJob);
router.post('/jobs/:id/resume', validateParamId('id'), jobController.resumeJob);
router.post('/jobs/:id/cancel', validateParamId('id'), jobController.cancelJob);
router.post('/jobs/:id/retry', validateParamId('id'), jobController.retryJob);
router.get('/jobs/:id/logs', validateParamId('id'), jobController.getJobLogs);
router.get('/jobs/:id/tiepoints', validateParamId('id'), jobController.getJobTiePoints);

// Benchmarks
router.get('/benchmarks', benchmarkController.getBenchmarks);

// Deliverables & Export Products
router.get('/exports/:jobId/dossier', validateParamId('jobId'), exportController.getDossier);
router.get('/exports/:jobId/csv', validateParamId('jobId'), exportController.getTiePointsCsv);
router.get('/exports/:jobId/geotiff-meta', validateParamId('jobId'), exportController.getGeoTiffMeta);

export default router;
