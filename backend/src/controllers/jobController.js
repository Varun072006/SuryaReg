import repository from '../database/repository.js';
import registrationEngine from '../services/registrationEngine.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { JOB_STATUSES } from '../utils/constants.js';
import logger from '../utils/logger.js';

export const getJobs = (req, res, next) => {
  try {
    const jobs = repository.getAllJobs();
    return sendSuccess(res, jobs, { count: jobs.length });
  } catch (err) {
    next(err);
  }
};

export const getJobById = (req, res, next) => {
  try {
    const job = repository.getJobById(req.params.id);
    if (!job) {
      return sendError(res, `Job '${req.params.id}' was not found.`, 404, 'JOB_NOT_FOUND');
    }
    return sendSuccess(res, job);
  } catch (err) {
    next(err);
  }
};

export const createJob = (req, res, next) => {
  try {
    const body = req.body || {};
    const pairId = body.pairId || body.pair_id || 'pair-ohrc-nac-demo';
    const pair = repository.getPairById(pairId);
    if (!pair) {
      return sendError(res, `Invalid pairId: Target pairing '${pairId}' does not exist.`, 400, 'INVALID_PAIR_ID');
    }

    const allJobs = repository.getAllJobs();
    const nextNum = allJobs.length + 1;
    const jobId = body.id || `JOB-26166-${String(nextNum).padStart(2, '0')}`;

    const newJob = {
      id: jobId,
      name: body.name || `Reg-${jobId.slice(-2)}: ${pair.region} (${pair.sourceDataset?.shortName} → ${pair.referenceDataset?.shortName})`,
      pair_id: pair.id,
      status: JOB_STATUSES.QUEUED,
      current_stage_key: 'ingest',
      stage_step: 1,
      progress: 0,
      runtime_sec: 0,
      config: body.config || {
        matcher: 'LoFTR',
        referenceDem: 'SLDEM2015',
        targetGsd: 'auto',
        projection: 'Polar Stereographic (South)',
        autoNormalizeIllumination: true,
        subPixelRefinement: true,
        magsacFiltering: true,
        uniformDistribution: true,
        anmsGridSelection: true,
        confidenceThreshold: 0.75
      },
      metrics: null,
      failure_reason: null,
      is_simulated_failure: Boolean(body.simulateFailure),
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    repository.insertJob(newJob);

    // Initial Audit Log
    repository.insertJobLog({
      id: `log-init-${Date.now()}`,
      job_id: jobId,
      timestamp: new Date().toLocaleTimeString() + ' UTC',
      elapsed_sec: 0,
      level: 'engine',
      stage_key: 'ingest',
      message: `Job ${jobId} registered and queued for execution on SuryaReg workstation.`
    });

    // Auto-start asynchronous execution if requested
    if (body.autoStart !== false) {
      registrationEngine.runJob(newJob, { fast: Boolean(body.fastExecution) }).catch(err => {
        logger.error(`[Engine] Background execution error for ${jobId}:`, err);
      });
    }

    const created = repository.getJobById(jobId);
    return sendSuccess(res, created, { message: `Job ${jobId} successfully created.` }, 201);
  } catch (err) {
    next(err);
  }
};

export const startJob = async (req, res, next) => {
  try {
    const job = repository.getJobById(req.params.id);
    if (!job) {
      return sendError(res, `Job '${req.params.id}' was not found.`, 404, 'JOB_NOT_FOUND');
    }

    if (job.status === JOB_STATUSES.PROCESSING) {
      return sendError(res, `Job '${job.id}' is already processing.`, 400, 'JOB_ALREADY_RUNNING');
    }

    // Launch execution asynchronously
    registrationEngine.runJob(job, { fast: Boolean(req.body?.fast) }).catch(err => {
      logger.error(`[Engine] Execution failure for job ${job.id}:`, err);
    });

    return sendSuccess(res, job, { message: `Job ${job.id} started execution.` });
  } catch (err) {
    next(err);
  }
};

export const pauseJob = (req, res, next) => {
  try {
    const job = repository.getJobById(req.params.id);
    if (!job) {
      return sendError(res, `Job '${req.params.id}' was not found.`, 404, 'JOB_NOT_FOUND');
    }

    if (job.status !== JOB_STATUSES.PROCESSING) {
      return sendError(res, `Job '${job.id}' cannot be paused because its status is '${job.status}'.`, 400, 'INVALID_JOB_STATE');
    }

    const paused = registrationEngine.pauseJob(job.id);
    return sendSuccess(res, { paused }, { message: paused ? `Job ${job.id} paused.` : `Could not pause job ${job.id}.` });
  } catch (err) {
    next(err);
  }
};

export const resumeJob = (req, res, next) => {
  try {
    const job = repository.getJobById(req.params.id);
    if (!job) {
      return sendError(res, `Job '${req.params.id}' was not found.`, 404, 'JOB_NOT_FOUND');
    }

    if (job.status !== JOB_STATUSES.PAUSED) {
      return sendError(res, `Job '${job.id}' cannot be resumed because it is not currently paused.`, 400, 'INVALID_JOB_STATE');
    }

    const resumed = registrationEngine.resumeJob(job.id);
    return sendSuccess(res, { resumed }, { message: resumed ? `Job ${job.id} resumed.` : `Could not resume job ${job.id}.` });
  } catch (err) {
    next(err);
  }
};

export const cancelJob = (req, res, next) => {
  try {
    const job = repository.getJobById(req.params.id);
    if (!job) {
      return sendError(res, `Job '${req.params.id}' was not found.`, 404, 'JOB_NOT_FOUND');
    }

    if (job.status === JOB_STATUSES.COMPLETED || job.status === JOB_STATUSES.FAILED) {
      return sendError(res, `Job '${job.id}' has already reached terminal state '${job.status}'.`, 400, 'INVALID_JOB_STATE');
    }

    registrationEngine.cancelJob(job.id);
    repository.updateJobStatus(job.id, JOB_STATUSES.NEEDS_ATTENTION, 'Cancelled by operator');

    return sendSuccess(res, { cancelled: true }, { message: `Job ${job.id} has been cancelled.` });
  } catch (err) {
    next(err);
  }
};

export const retryJob = (req, res, next) => {
  try {
    const job = repository.getJobById(req.params.id);
    if (!job) {
      return sendError(res, `Job '${req.params.id}' was not found.`, 404, 'JOB_NOT_FOUND');
    }

    repository.updateJobStatus(job.id, JOB_STATUSES.QUEUED, null);
    registrationEngine.runJob(job, { fast: Boolean(req.body?.fast) }).catch(err => {
      logger.error(`[Engine] Retry execution failure for job ${job.id}:`, err);
    });

    return sendSuccess(res, { retried: true }, { message: `Retrying job ${job.id}.` });
  } catch (err) {
    next(err);
  }
};

export const deleteJob = (req, res, next) => {
  try {
    const job = repository.getJobById(req.params.id);
    if (!job) {
      return sendError(res, `Job '${req.params.id}' was not found.`, 404, 'JOB_NOT_FOUND');
    }

    if (registrationEngine.isJobActive(job.id)) {
      registrationEngine.cancelJob(job.id);
    }

    repository.deleteJob(job.id);
    return sendSuccess(res, { deleted: true }, { message: `Job ${job.id} deleted successfully.` });
  } catch (err) {
    next(err);
  }
};

export const getJobLogs = (req, res, next) => {
  try {
    const logs = repository.getJobLogs(req.params.id);
    return sendSuccess(res, logs, { count: logs.length });
  } catch (err) {
    next(err);
  }
};

export const getJobTiePoints = (req, res, next) => {
  try {
    const points = repository.getJobTiePoints(req.params.id);
    return sendSuccess(res, points, { count: points.length });
  } catch (err) {
    next(err);
  }
};

export default {
  getJobs,
  getJobById,
  createJob,
  startJob,
  pauseJob,
  resumeJob,
  cancelJob,
  retryJob,
  deleteJob,
  getJobLogs,
  getJobTiePoints
};
