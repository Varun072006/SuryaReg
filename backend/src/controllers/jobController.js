import repository from '../database/repository.js';
import registrationEngine from '../services/registrationEngine.js';

export const getJobs = (req, res) => {
  try {
    const jobs = repository.getAllJobs();
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getJobById = (req, res) => {
  try {
    const job = repository.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createJob = (req, res) => {
  try {
    const body = req.body || {};
    const pairId = body.pairId || body.pair_id || 'pair-ohrc-nac-demo';
    const pair = repository.getPairById(pairId);
    if (!pair) {
      return res.status(400).json({ success: false, error: `Invalid pairId: ${pairId}` });
    }

    const allJobs = repository.getAllJobs();
    const nextNum = allJobs.length + 1;
    const jobId = body.id || `JOB-26166-${String(nextNum).padStart(2, '0')}`;

    const newJob = {
      id: jobId,
      name: body.name || `Reg-${jobId.slice(-2)}: ${pair.region} (${pair.sourceDataset?.shortName} → ${pair.referenceDataset?.shortName})`,
      pair_id: pair.id,
      status: 'queued',
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

    // Initial log
    repository.insertJobLog({
      id: `log-init-${Date.now()}`,
      job_id: jobId,
      timestamp: new Date().toLocaleTimeString() + ' UTC',
      elapsed_sec: 0,
      level: 'engine',
      stage_key: 'ingest',
      message: `Job ${jobId} queued for execution on workstation backend.`
    });

    // Auto-start if requested
    if (body.autoStart !== false) {
      // Run asynchronously in background
      registrationEngine.runJob(newJob, { fast: body.fastExecution || false }).catch(err => {
        console.error(`[Engine] Error running job ${jobId}:`, err);
      });
    }

    const created = repository.getJobById(jobId);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const startJob = async (req, res) => {
  try {
    const job = repository.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    if (job.status === 'processing') {
      return res.status(400).json({ success: false, error: 'Job is already processing' });
    }

    // Launch execution asynchronously
    registrationEngine.runJob(job, { fast: req.body?.fast || false }).catch(err => {
      console.error(`[Engine] Execution error for job ${job.id}:`, err);
    });

    res.json({ success: true, message: `Job ${job.id} started`, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const pauseJob = (req, res) => {
  try {
    const success = registrationEngine.pauseJob(req.params.id);
    res.json({ success, message: success ? 'Job paused' : 'Job not currently active' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const resumeJob = (req, res) => {
  try {
    const success = registrationEngine.resumeJob(req.params.id);
    res.json({ success, message: success ? 'Job resumed' : 'Job not currently paused' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const cancelJob = (req, res) => {
  try {
    const success = registrationEngine.cancelJob(req.params.id);
    repository.updateJobStatus(req.params.id, 'needs-attention', 'Cancelled by user');
    res.json({ success: true, message: 'Job cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const retryJob = (req, res) => {
  try {
    const job = repository.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    repository.updateJobStatus(job.id, 'queued', null);
    registrationEngine.runJob(job).catch(err => {
      console.error(`[Engine] Retry execution error:`, err);
    });

    res.json({ success: true, message: `Retrying job ${job.id}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getJobLogs = (req, res) => {
  try {
    const logs = repository.getJobLogs(req.params.id);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getJobTiePoints = (req, res) => {
  try {
    const points = repository.getJobTiePoints(req.params.id);
    res.json({ success: true, count: points.length, data: points });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
  getJobLogs,
  getJobTiePoints
};
