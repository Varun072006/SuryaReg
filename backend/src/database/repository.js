import { getDatabase, runTransaction } from './db.js';
import logger from '../utils/logger.js';

function safeJsonParse(jsonString, fallback = null) {
  if (!jsonString || typeof jsonString !== 'string') return fallback;
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    logger.warn('[Repository] Failed to parse JSON string:', err.message);
    return fallback;
  }
}

export class Repository {
  constructor() {
    this._db = null;
  }

  get db() {
    if (!this._db) {
      this._db = getDatabase();
    }
    return this._db;
  }

  // --- DATASETS ---
  getAllDatasets() {
    const stmt = this.db.prepare('SELECT * FROM datasets ORDER BY id ASC');
    const rows = stmt.all();
    return rows.map(r => this.mapDataset(r));
  }

  getDatasetById(id) {
    if (!id) return null;
    const stmt = this.db.prepare('SELECT * FROM datasets WHERE id = ?');
    const r = stmt.get(id);
    return r ? this.mapDataset(r) : null;
  }

  datasetExists(id) {
    if (!id) return false;
    const stmt = this.db.prepare('SELECT 1 FROM datasets WHERE id = ? LIMIT 1');
    return Boolean(stmt.get(id));
  }

  insertDataset(ds) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO datasets (
        id, name, short_name, mission, instrument, resolution, gsd_meters,
        coverage, data_type, status, source, spectral_type, swath,
        acquisition_date, sun_azimuth_deg, sun_elevation_deg, projection,
        crs, file_type, preview_color, sample_region, footprint_coordinates,
        description, image_url
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?
      )
    `);

    stmt.run(
      ds.id,
      ds.name,
      ds.short_name || ds.shortName || ds.name.slice(0, 20),
      ds.mission || 'Chandrayaan-2',
      ds.instrument || 'Unknown',
      ds.resolution || 'N/A',
      Number(ds.gsd_meters || ds.gsdMeters || 1.0),
      ds.coverage || null,
      ds.data_type || ds.dataType || 'Panchromatic',
      ds.status || 'Ready',
      ds.source || null,
      ds.spectral_type || ds.spectralType || null,
      ds.swath || null,
      ds.acquisition_date || ds.acquisitionDate || new Date().toISOString(),
      Number(ds.sun_azimuth_deg || ds.sunAzimuthDeg || 0),
      Number(ds.sun_elevation_deg || ds.sunElevationDeg || 0),
      ds.projection || 'Polar Stereographic (South)',
      ds.crs || 'IAU2000:30120',
      ds.file_type || ds.fileType || '.tif',
      ds.preview_color || ds.previewColor || '#38bdf8',
      ds.sample_region || ds.sampleRegion || null,
      typeof ds.footprint_coordinates === 'string'
        ? ds.footprint_coordinates
        : JSON.stringify(ds.footprintCoordinates || ds.footprint_coordinates || []),
      ds.description || null,
      ds.image_url || ds.imageUrl || null
    );
  }

  mapDataset(r) {
    return {
      id: r.id,
      name: r.name,
      shortName: r.short_name,
      mission: r.mission,
      instrument: r.instrument,
      resolution: r.resolution,
      gsdMeters: r.gsd_meters,
      coverage: r.coverage,
      dataType: r.data_type,
      status: r.status,
      source: r.source,
      spectralType: r.spectral_type,
      swath: r.swath,
      acquisitionDate: r.acquisition_date,
      sunAzimuthDeg: r.sun_azimuth_deg,
      sunElevationDeg: r.sun_elevation_deg,
      projection: r.projection,
      crs: r.crs,
      fileType: r.file_type,
      previewColor: r.preview_color,
      sampleRegion: r.sample_region,
      footprintCoordinates: safeJsonParse(r.footprint_coordinates, []),
      description: r.description,
      imageUrl: r.image_url,
      createdAt: r.created_at
    };
  }

  // --- PAIRS ---
  getAllPairs() {
    const stmt = this.db.prepare('SELECT * FROM pairs ORDER BY id ASC');
    const rows = stmt.all();
    return rows.map(r => this.mapPair(r));
  }

  getPairById(id) {
    if (!id) return null;
    const stmt = this.db.prepare('SELECT * FROM pairs WHERE id = ?');
    const r = stmt.get(id);
    return r ? this.mapPair(r) : null;
  }

  pairExists(id) {
    if (!id) return false;
    const stmt = this.db.prepare('SELECT 1 FROM pairs WHERE id = ? LIMIT 1');
    return Boolean(stmt.get(id));
  }

  insertPair(p) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO pairs (
        id, name, source_dataset_id, reference_dataset_id, region, category,
        scale_ratio, sun_azimuth_diff_deg, sun_elevation_diff_deg,
        estimated_overlap_pct, description, source_image_url, ref_image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      p.id,
      p.name,
      p.source_dataset_id || p.sourceDatasetId,
      p.reference_dataset_id || p.referenceDatasetId,
      p.region || 'Lunar Polar Region',
      p.category || 'cross-modal',
      Number(p.scale_ratio || p.scaleRatio || 1.0),
      Number(p.sun_azimuth_diff_deg || p.sunAzimuthDiffDeg || 0),
      Number(p.sun_elevation_diff_deg || p.sunElevationDiffDeg || 0),
      Number(p.estimated_overlap_pct || p.estimatedOverlapPct || 50),
      p.description || null,
      p.source_image_url || p.sourceImageUrl || null,
      p.ref_image_url || p.refImageUrl || null
    );
  }

  mapPair(r) {
    const src = this.getDatasetById(r.source_dataset_id);
    const ref = this.getDatasetById(r.reference_dataset_id);
    return {
      id: r.id,
      name: r.name,
      sourceDataset: src,
      referenceDataset: ref,
      sourceDatasetId: r.source_dataset_id,
      referenceDatasetId: r.reference_dataset_id,
      region: r.region,
      category: r.category,
      scaleRatio: r.scale_ratio,
      sunAzimuthDiffDeg: r.sun_azimuth_diff_deg,
      sunElevationDiffDeg: r.sun_elevation_diff_deg,
      estimatedOverlapPct: r.estimated_overlap_pct,
      description: r.description,
      sourceImageUrl: r.source_image_url,
      refImageUrl: r.ref_image_url,
      createdAt: r.created_at
    };
  }

  // --- JOBS ---
  getAllJobs() {
    const stmt = this.db.prepare('SELECT * FROM jobs ORDER BY created_at DESC');
    const rows = stmt.all();
    return rows.map(r => this.mapJob(r));
  }

  getJobById(id) {
    if (!id) return null;
    const stmt = this.db.prepare('SELECT * FROM jobs WHERE id = ?');
    const r = stmt.get(id);
    return r ? this.mapJob(r) : null;
  }

  jobExists(id) {
    if (!id) return false;
    const stmt = this.db.prepare('SELECT 1 FROM jobs WHERE id = ? LIMIT 1');
    return Boolean(stmt.get(id));
  }

  insertJob(j) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO jobs (
        id, name, pair_id, status, current_stage_key, stage_step,
        progress, runtime_sec, config_json, metrics_json, failure_reason,
        is_simulated_failure, created_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      j.id,
      j.name,
      j.pair_id || (j.pair && j.pair.id),
      j.status || 'queued',
      j.current_stage_key || j.currentStageKey || 'ingest',
      Number(j.stage_step || j.stageStep || 1),
      Number(j.progress || 0),
      Number(j.runtime_sec || j.runtimeSec || 0),
      typeof j.config === 'object' ? JSON.stringify(j.config) : (j.config_json || null),
      typeof j.metrics === 'object' ? JSON.stringify(j.metrics) : (j.metrics_json || null),
      j.failure_reason || j.failureReason || null,
      j.is_simulated_failure || j.isSimulatedFailure ? 1 : 0,
      j.created_at || j.createdAt || new Date().toISOString().replace('T', ' ').slice(0, 19),
      j.completed_at || j.completedAt || null
    );
  }

  updateJobProgress(id, progress, stageKey, stageStep, runtimeSec = 0) {
    const stmt = this.db.prepare(`
      UPDATE jobs SET
        progress = ?,
        current_stage_key = ?,
        stage_step = ?,
        runtime_sec = runtime_sec + ?
      WHERE id = ?
    `);
    stmt.run(progress, stageKey, stageStep, runtimeSec, id);
  }

  updateJobStatus(id, status, failureReason = null) {
    const stmt = this.db.prepare(`
      UPDATE jobs SET
        status = ?,
        failure_reason = ?
      WHERE id = ?
    `);
    stmt.run(status, failureReason, id);
  }

  completeJob(id, metrics, completedAt = null) {
    const stmt = this.db.prepare(`
      UPDATE jobs SET
        status = 'completed',
        progress = 100,
        current_stage_key = 'warp_outputs',
        stage_step = 10,
        metrics_json = ?,
        completed_at = ?
      WHERE id = ?
    `);
    stmt.run(
      JSON.stringify(metrics),
      completedAt || new Date().toISOString().replace('T', ' ').slice(0, 19),
      id
    );
  }

  deleteJob(id) {
    return runTransaction(() => {
      this.db.prepare('DELETE FROM tie_points WHERE job_id = ?').run(id);
      this.db.prepare('DELETE FROM job_logs WHERE job_id = ?').run(id);
      this.db.prepare('DELETE FROM reports WHERE job_id = ?').run(id);
      const res = this.db.prepare('DELETE FROM jobs WHERE id = ?').run(id);
      return res;
    });
  }

  mapJob(r) {
    const pair = this.getPairById(r.pair_id);
    const logs = this.getJobLogs(r.id);
    const tiePoints = this.getJobTiePoints(r.id);
    return {
      id: r.id,
      name: r.name,
      pair,
      pairId: r.pair_id,
      status: r.status,
      currentStageKey: r.current_stage_key,
      stageStep: r.stage_step,
      progress: r.progress,
      runtimeSec: r.runtime_sec,
      config: safeJsonParse(r.config_json, null),
      metrics: safeJsonParse(r.metrics_json, null),
      failureReason: r.failure_reason,
      isSimulatedFailure: Boolean(r.is_simulated_failure),
      createdAt: r.created_at,
      completedAt: r.completed_at,
      logs,
      matchPoints: tiePoints
    };
  }

  // --- LOGS ---
  getJobLogs(jobId) {
    const stmt = this.db.prepare('SELECT * FROM job_logs WHERE job_id = ? ORDER BY id ASC');
    const rows = stmt.all(jobId);
    return rows.map(r => ({
      id: r.id,
      jobId: r.job_id,
      timestamp: r.timestamp,
      elapsedSec: r.elapsed_sec,
      level: r.level,
      stageKey: r.stage_key,
      message: r.message
    }));
  }

  insertJobLog(log) {
    const stmt = this.db.prepare(`
      INSERT INTO job_logs (id, job_id, timestamp, elapsed_sec, level, stage_key, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      log.id,
      log.job_id || log.jobId,
      log.timestamp || new Date().toISOString(),
      Number(log.elapsed_sec || log.elapsedSec || 0),
      log.level || 'info',
      log.stage_key || log.stageKey || 'ingest',
      log.message || ''
    );
  }

  // --- TIE POINTS ---
  getJobTiePoints(jobId) {
    const stmt = this.db.prepare('SELECT * FROM tie_points WHERE job_id = ? ORDER BY point_index ASC');
    const rows = stmt.all(jobId);
    return rows.map(r => ({
      id: r.point_index,
      jobId: r.job_id,
      sourceX: r.source_x,
      sourceY: r.source_y,
      refX: r.ref_x,
      refY: r.ref_y,
      residualX: r.residual_x,
      residualY: r.residual_y,
      residualMagnitude: r.residual_magnitude,
      confidence: r.confidence,
      isInlier: Boolean(r.is_inlier),
      gridCellId: r.grid_cell_id
    }));
  }

  /**
   * Atomic batch replacement of tie points for a job
   */
  insertTiePoints(jobId, points) {
    return runTransaction(() => {
      const deleteStmt = this.db.prepare('DELETE FROM tie_points WHERE job_id = ?');
      deleteStmt.run(jobId);

      const insertStmt = this.db.prepare(`
        INSERT INTO tie_points (
          job_id, point_index, source_x, source_y, ref_x, ref_y,
          residual_x, residual_y, residual_magnitude, confidence, is_inlier, grid_cell_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const p of points) {
        insertStmt.run(
          jobId,
          Number(p.id ?? p.point_index ?? 0),
          Number(p.sourceX ?? p.source_x ?? 0),
          Number(p.sourceY ?? p.source_y ?? 0),
          Number(p.refX ?? p.ref_x ?? 0),
          Number(p.refY ?? p.ref_y ?? 0),
          Number(p.residualX ?? p.residual_x ?? 0),
          Number(p.residualY ?? p.residual_y ?? 0),
          Number(p.residualMagnitude ?? p.residual_magnitude ?? 0),
          Number(p.confidence ?? 0.8),
          p.isInlier || p.is_inlier ? 1 : 0,
          p.gridCellId || p.grid_cell_id || 'A1'
        );
      }
    });
  }

  // --- BENCHMARKS ---
  getAllBenchmarks() {
    const stmt = this.db.prepare('SELECT * FROM benchmarks ORDER BY overall_rmse ASC');
    const rows = stmt.all();
    return rows.map(r => ({
      id: r.id,
      method: r.method,
      category: r.category,
      overallRmse: r.overall_rmse,
      subpixelResidual: r.subpixel_residual,
      inlierRatio: r.inlier_ratio,
      spatialCoverage: r.spatial_coverage,
      polarRobustness: r.polar_robustness,
      runtimeSec: r.runtime_sec,
      description: r.description
    }));
  }

  insertBenchmark(bm) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO benchmarks (
        id, method, category, overall_rmse, subpixel_residual,
        inlier_ratio, spatial_coverage, polar_robustness, runtime_sec, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      bm.id,
      bm.method,
      bm.category,
      Number(bm.overall_rmse || bm.overallRmse || 0),
      bm.subpixel_residual !== undefined ? Number(bm.subpixel_residual || bm.subpixelResidual) : null,
      Number(bm.inlier_ratio || bm.inlierRatio || 0),
      Number(bm.spatial_coverage || bm.spatialCoverage || 0),
      bm.polar_robustness || bm.polarRobustness || 'High',
      Number(bm.runtime_sec || bm.runtimeSec || 0),
      bm.description || null
    );
  }

  // --- REPORTS ---
  getReportsByJob(jobId) {
    const stmt = this.db.prepare('SELECT * FROM reports WHERE job_id = ? ORDER BY created_at DESC');
    return stmt.all(jobId);
  }

  saveReport(rep) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO reports (id, job_id, report_type, title, filename, format, content)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      rep.id,
      rep.job_id || rep.jobId,
      rep.report_type || rep.reportType,
      rep.title,
      rep.filename,
      rep.format,
      rep.content
    );
  }
}

export default new Repository();
