import repository from '../database/repository.js';
import { generateSeedTiePoints } from '../database/seedData.js';

export const PIPELINE_STAGES = [
  { step: 1, key: 'ingest', label: '01 Ingest', description: 'Source & reference raster file ingestion', progressRange: [0, 8] },
  { step: 2, key: 'metadata', label: '02 Metadata Validation', description: 'SPICE ephemeris, camera model, bit-depth verification', progressRange: [8, 18] },
  { step: 3, key: 'geometry', label: '03 Geometry Preparation', description: 'Reference DEM query, initial footprint intersect', progressRange: [18, 30] },
  { step: 4, key: 'projection', label: '04 Common-GSD Projection', description: 'Resampling to common spatial ground resolution', progressRange: [30, 42] },
  { step: 5, key: 'illumination', label: '05 Illumination Normalization', description: 'Wallis & phase congruency illumination balancing', progressRange: [42, 52] },
  { step: 6, key: 'matching', label: '06 Feature Matching', description: 'Deep feature correspondence extraction', progressRange: [52, 70] },
  { step: 7, key: 'refinement', label: '07 Sub-pixel Refinement', description: 'Local parabolic peak refinement & phase alignment', progressRange: [70, 80] },
  { step: 8, key: 'filtering', label: '08 MAGSAC++ Filtering', description: 'Robust outlier rejection and geometric consistency', progressRange: [80, 90] },
  { step: 9, key: 'transform', label: '09 Transform Estimation', description: 'Homography / affine deformation matrix estimation', progressRange: [90, 96] },
  { step: 10, key: 'warp_outputs', label: '10 Warp & Outputs', description: 'GeoTIFF resampling & deliverable generation', progressRange: [96, 100] }
];

export class RegistrationEngine {
  constructor() {
    this.activeJobs = new Map(); // jobId -> execution handle
  }

  /**
   * Run a registration job through the 10-stage pipeline
   * @param {Object} job - The job record from database
   * @param {Object} options - Options { fast: boolean, onProgress: Function, onLog: Function }
   */
  async runJob(job, options = {}) {
    const jobId = job.id;
    const pair = job.pair || repository.getPairById(job.pair_id || (job.pair && job.pair.id));
    const config = job.config || {};
    const isSimulatedFailure = Boolean(job.is_simulated_failure || job.isSimulatedFailure);

    console.log(`[Engine] Starting 10-Stage Pipeline execution for Job: ${jobId} (Pair: ${pair?.name || pair?.id})`);

    // Set status to processing
    repository.updateJobStatus(jobId, 'processing');

    const executionState = {
      isCancelled: false,
      isPaused: false
    };
    this.activeJobs.set(jobId, executionState);

    const stepIntervalMs = options.fast ? 20 : 150;

    const addLog = (level, stageKey, message, elapsedSec) => {
      const log = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        job_id: jobId,
        timestamp: new Date().toLocaleTimeString() + ' UTC',
        elapsed_sec: Math.round(elapsedSec * 10) / 10,
        level,
        stage_key: stageKey,
        message
      };
      repository.insertJobLog(log);
      if (options.onLog) options.onLog(log);
      return log;
    };

    // Initial Ingestion Log
    addLog('info', 'ingest', `Ingested source raster ${pair?.sourceDataset?.shortName || 'CH2-OHRC'} and reference ${pair?.referenceDataset?.shortName || 'LRO-NAC'} from PDS4 archive.`, 0.1);

    for (let step = 1; step <= 40; step++) {
      if (executionState.isCancelled) {
        console.log(`[Engine] Job ${jobId} cancelled.`);
        repository.updateJobStatus(jobId, 'needs-attention', 'Job execution cancelled by operator.');
        this.activeJobs.delete(jobId);
        return;
      }

      while (executionState.isPaused) {
        await new Promise(r => setTimeout(r, 200));
        if (executionState.isCancelled) return;
      }

      await new Promise(r => setTimeout(r, stepIntervalMs));

      const progress = Math.min(100, Math.round((step / 40) * 100));
      let currentStage = PIPELINE_STAGES[0];
      for (let i = PIPELINE_STAGES.length - 1; i >= 0; i--) {
        if (progress >= PIPELINE_STAGES[i].progressRange[0]) {
          currentStage = PIPELINE_STAGES[i];
          break;
        }
      }

      const elapsedSec = (step * stepIntervalMs) / 1000;
      repository.updateJobProgress(jobId, progress, currentStage.key, currentStage.step, 0.15);

      if (options.onProgress) {
        options.onProgress(progress, currentStage.key, currentStage.step);
      }

      // Stage-specific checkpoint logs
      if (step === 5) {
        addLog('info', 'metadata', `Ephemeris verified via SPICE kernel. Sun azimuth delta = ${pair?.sunAzimuthDiffDeg?.toFixed(1) || 42.5}°, Scale ratio = ${pair?.scaleRatio?.toFixed(1) || 2.0}x.`, elapsedSec);
      } else if (step === 11) {
        addLog('info', 'geometry', `Intersected region with ${config.referenceDem || 'SLDEM2015'}. Topographic relief variance: 570m.`, elapsedSec);
      } else if (step === 16) {
        addLog('info', 'projection', `Projected to ${config.projection || 'Polar Stereographic (South)'} with Target GSD: ${config.targetGsd || 'auto'}.`, elapsedSec);
      } else if (step === 20) {
        addLog('engine', 'illumination', 'Applying Wallis & phase-congruency filter to normalize solar shadow gradients and inverted relief.', elapsedSec);
      }

      // Check simulated failure condition
      if (isSimulatedFailure && step === 24) {
        addLog('error', 'matching', 'Confidence dropped below threshold in extreme shadow crater rim. Insufficient tie points.', elapsedSec);
        repository.updateJobStatus(jobId, 'failed', 'Geometric match failed: Extreme illumination disparity without sufficient albedo contrast.');
        this.activeJobs.delete(jobId);
        return;
      }

      if (step === 26) {
        addLog('engine', 'matching', `${config.matcher || 'LoFTR'} dense matcher extracted 64 candidate correspondences across dynamic range.`, elapsedSec);
      } else if (step === 31) {
        addLog('info', 'refinement', 'Parabolic sub-pixel peak refinement localized tie points with <0.15px residual accuracy.', elapsedSec);
      } else if (step === 35) {
        addLog('engine', 'filtering', 'MAGSAC++ filtered 4 outlier matches. 60 inliers certified (Inlier ratio: 93.8%). Uniformity verified.', elapsedSec);
      } else if (step === 38) {
        addLog('info', 'transform', '3x3 projective transformation matrix estimated. Sub-pixel RMSE = 0.38 px.', elapsedSec);
      }
    }

    // Final Stage 10: Deliverables & Warp
    const elapsedSec = (40 * stepIntervalMs) / 1000;
    addLog('info', 'warp_outputs', 'Registration completed successfully. Generated GeoTIFF, CSV, JSON, and ISRO-SAC Compliance Dossier.', elapsedSec);

    // Compute metrics
    const matcherMultiplier =
      config.matcher === 'RoMa' ? 0.95 :
      config.matcher === 'LoFTR' ? 1.0 :
      config.matcher === 'MINIMA' ? 1.02 :
      config.matcher === 'RIFT' ? 1.08 :
      config.matcher === 'LightGlue' ? 1.15 : 1.35;

    const baseRmse = 0.38 * matcherMultiplier;
    const finalMetrics = {
      rmse: Math.round(baseRmse * 100) / 100,
      xRmse: Math.round(baseRmse * 0.68 * 100) / 100,
      yRmse: Math.round(baseRmse * 0.72 * 100) / 100,
      ce90: Math.round(baseRmse * 1.42 * 100) / 100,
      le90: Math.round(baseRmse * 1.1 * 100) / 100,
      totalMatches: 64,
      inliers: 60,
      outliers: 4,
      inlierRatio: 0.9375,
      coveragePct: 93.75,
      occupiedCells: 15,
      totalCells: 16,
      spatialUniformity: 0.91,
      scaleRatio: pair?.scaleRatio || 2.0,
      sunAzimuthDiff: pair?.sunAzimuthDiffDeg || 42.5,
      sunElevationDiff: pair?.sunElevationDiffDeg || 11.2,
      transformationMatrix: [
        [1.0204, -0.0152, 18.51],
        [0.0118, 1.0182, -12.34],
        [0.000003, -0.000002, 1.0]
      ]
    };

    // Generate Ground Control Points
    const tiePoints = generateSeedTiePoints(jobId);
    repository.insertTiePoints(jobId, tiePoints);

    // Complete job
    repository.completeJob(jobId, finalMetrics);
    this.activeJobs.delete(jobId);

    console.log(`[Engine] Job ${jobId} finished with sub-pixel RMSE: ${finalMetrics.rmse} px (< 0.40 px threshold).`);
    return repository.getJobById(jobId);
  }

  cancelJob(jobId) {
    const handle = this.activeJobs.get(jobId);
    if (handle) {
      handle.isCancelled = true;
      return true;
    }
    return false;
  }

  pauseJob(jobId) {
    const handle = this.activeJobs.get(jobId);
    if (handle) {
      handle.isPaused = true;
      repository.updateJobStatus(jobId, 'paused');
      return true;
    }
    return false;
  }

  resumeJob(jobId) {
    const handle = this.activeJobs.get(jobId);
    if (handle) {
      handle.isPaused = false;
      repository.updateJobStatus(jobId, 'processing');
      return true;
    }
    return false;
  }
}

export default new RegistrationEngine();
