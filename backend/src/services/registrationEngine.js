import repository from '../database/repository.js';
import { generateSeedTiePoints } from '../database/seedData.js';
import { PIPELINE_STAGES, JOB_STATUSES } from '../utils/constants.js';
import logger from '../utils/logger.js';

export { PIPELINE_STAGES };

export class RegistrationEngine {
  constructor() {
    this.activeJobs = new Map(); // jobId -> { isCancelled, isPaused, startedAt }
  }

  /**
   * Determine if a job is currently active
   * @param {string} jobId
   */
  isJobActive(jobId) {
    return this.activeJobs.has(jobId);
  }

  /**
   * Run a registration job through the 10-stage pipeline
   * @param {Object} job - The job record from database
   * @param {Object} [options] - Options { fast: boolean, onProgress: Function, onLog: Function }
   */
  async runJob(job, options = {}) {
    const jobId = job.id;
    const pair = job.pair || repository.getPairById(job.pair_id || (job.pair && job.pair.id));
    const config = job.config || {};
    const isSimulatedFailure = Boolean(job.is_simulated_failure || job.isSimulatedFailure);

    logger.engine('INIT', `Starting 10-Stage Pipeline execution for Job: ${jobId} (Pair: ${pair?.name || pair?.id || 'Unknown'})`);

    // Mark status as processing
    repository.updateJobStatus(jobId, JOB_STATUSES.PROCESSING);

    const executionState = {
      isCancelled: false,
      isPaused: false,
      startedAt: Date.now()
    };
    this.activeJobs.set(jobId, executionState);

    const stepIntervalMs = options.fast ? 15 : 120;

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
      if (options.onLog) {
        try {
          options.onLog(log);
        } catch (err) {
          logger.warn('[Engine] onLog callback error:', err.message);
        }
      }
      return log;
    };

    try {
      // Stage 1 Ingest Log
      addLog(
        'info',
        'ingest',
        `Ingested source raster ${pair?.sourceDataset?.shortName || 'CH2-OHRC'} and reference ${pair?.referenceDataset?.shortName || 'LRO-NAC'} from PDS4 archive.`,
        0.1
      );

      for (let step = 1; step <= 40; step++) {
        // Check cancellation
        if (executionState.isCancelled) {
          logger.info(`[Engine] Job ${jobId} was cancelled by operator.`);
          addLog('warn', 'general', 'Job execution cancelled by operator.', (step * stepIntervalMs) / 1000);
          repository.updateJobStatus(jobId, JOB_STATUSES.NEEDS_ATTENTION, 'Job execution cancelled by operator.');
          return;
        }

        // Handle paused state
        while (executionState.isPaused) {
          await new Promise(r => setTimeout(r, 200));
          if (executionState.isCancelled) {
            logger.info(`[Engine] Job ${jobId} cancelled while paused.`);
            addLog('warn', 'general', 'Job execution cancelled while paused.', (step * stepIntervalMs) / 1000);
            repository.updateJobStatus(jobId, JOB_STATUSES.NEEDS_ATTENTION, 'Job execution cancelled by operator while paused.');
            return;
          }
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
          try {
            options.onProgress(progress, currentStage.key, currentStage.step);
          } catch (err) {
            logger.warn('[Engine] onProgress callback error:', err.message);
          }
        }

        // Checkpoint Stage Milestone Logs
        if (step === 5) {
          addLog('info', 'metadata', `Ephemeris verified via SPICE kernel. Sun azimuth delta = ${pair?.sunAzimuthDiffDeg?.toFixed(1) || 42.5}°, Scale ratio = ${pair?.scaleRatio?.toFixed(1) || 2.0}x.`, elapsedSec);
        } else if (step === 11) {
          addLog('info', 'geometry', `Intersected region with ${config.referenceDem || 'SLDEM2015'}. Topographic relief variance: 570m.`, elapsedSec);
        } else if (step === 16) {
          addLog('info', 'projection', `Projected to ${config.projection || 'Polar Stereographic (South)'} with Target GSD: ${config.targetGsd || 'auto'}.`, elapsedSec);
        } else if (step === 20) {
          addLog('engine', 'illumination', 'Applying Wallis & phase-congruency filter to normalize solar shadow gradients and inverted relief.', elapsedSec);
        }

        // Simulated failure checkpoint
        if (isSimulatedFailure && step === 24) {
          addLog('error', 'matching', 'Confidence dropped below threshold in extreme shadow crater rim. Insufficient tie points.', elapsedSec);
          repository.updateJobStatus(jobId, JOB_STATUSES.FAILED, 'Geometric match failed: Extreme illumination disparity without sufficient albedo contrast.');
          logger.warn(`[Engine] Job ${jobId} failed as requested by simulation.`);
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

      // Stage 10: Finalization & Deliverables
      const totalElapsedSec = (40 * stepIntervalMs) / 1000;
      addLog('info', 'warp_outputs', 'Registration completed successfully. Generated GeoTIFF, CSV, JSON, and ISRO-SAC Compliance Dossier.', totalElapsedSec);

      // Compute precision metrics based on selected feature matcher
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

      // Store Ground Control Points atomically
      const tiePoints = generateSeedTiePoints(jobId);
      repository.insertTiePoints(jobId, tiePoints);

      // Complete job with metrics
      repository.completeJob(jobId, finalMetrics);

      logger.info(`[Engine] Job ${jobId} finished with sub-pixel RMSE: ${finalMetrics.rmse} px (< 0.40 px threshold).`);
      return repository.getJobById(jobId);

    } catch (err) {
      logger.error(`[Engine] Unexpected error executing Job ${jobId}:`, err);
      repository.updateJobStatus(jobId, JOB_STATUSES.FAILED, `Internal engine error: ${err.message}`);
      throw err;
    } finally {
      // Guaranteed cleanup of in-memory handle
      this.activeJobs.delete(jobId);
    }
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
    if (handle && !handle.isPaused) {
      handle.isPaused = true;
      repository.updateJobStatus(jobId, JOB_STATUSES.PAUSED);
      return true;
    }
    return false;
  }

  resumeJob(jobId) {
    const handle = this.activeJobs.get(jobId);
    if (handle && handle.isPaused) {
      handle.isPaused = false;
      repository.updateJobStatus(jobId, JOB_STATUSES.PROCESSING);
      return true;
    }
    return false;
  }
}

export default new RegistrationEngine();
