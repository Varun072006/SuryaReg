import { getDatabase } from './db.js';

export class Repository {
  constructor() {
    this.db = getDatabase();
  }

  // --- DATASETS ---
  getAllDatasets() {
    const stmt = this.db.prepare('SELECT * FROM datasets ORDER BY id ASC');
    const rows = stmt.all();
    return rows.map(r => ({
      ...r,
      footprintCoordinates: r.footprint_coordinates ? JSON.parse(r.footprint_coordinates) : null,
      shortName: r.short_name,
      gsdMeters: r.gsd_meters,
      dataType: r.data_type,
      spectralType: r.spectral_type,
      acquisitionDate: r.acquisition_date,
      sunAzimuthDeg: r.sun_azimuth_deg,
      sunElevationDeg: r.sun_elevation_deg,
      fileType: r.file_type,
      previewColor: r.preview_color,
      sampleRegion: r.sample_region,
      imageUrl: r.image_url
    }));
  }

  getDatasetById(id) {
    const stmt = this.db.prepare('SELECT * FROM datasets WHERE id = ?');
    const r = stmt.get(id);
    if (!r) return null;
    return {
      ...r,
      footprintCoordinates: r.footprint_coordinates ? JSON.parse(r.footprint_coordinates) : null,
      shortName: r.short_name,
      gsdMeters: r.gsd_meters,
      dataType: r.data_type,
      spectralType: r.spectral_type,
      acquisitionDate: r.acquisition_date,
      sunAzimuthDeg: r.sun_azimuth_deg,
      sunElevationDeg: r.sun_elevation_deg,
      fileType: r.file_type,
      previewColor: r.preview_color,
      sampleRegion: r.sample_region,
      imageUrl: r.image_url
    };
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
      ds.id, ds.name, ds.short_name || ds.shortName, ds.mission, ds.instrument, ds.resolution, ds.gsd_meters || ds.gsdMeters,
      ds.coverage, ds.data_type || ds.dataType, ds.status || 'Ready', ds.source, ds.spectral_type || ds.spectralType, ds.swath,
      ds.acquisition_date || ds.acquisitionDate, ds.sun_azimuth_deg || ds.sunAzimuthDeg, ds.sun_elevation_deg || ds.sunElevationDeg, ds.projection,
      ds.crs, ds.file_type || ds.fileType, ds.preview_color || ds.previewColor, ds.sample_region || ds.sampleRegion,
      typeof ds.footprint_coordinates === 'string' ? ds.footprint_coordinates : JSON.stringify(ds.footprintCoordinates || ds.footprint_coordinates || []),
      ds.description, ds.image_url || ds.imageUrl
    );
  }

  // --- PAIRS ---
  getAllPairs() {
    const stmt = this.db.prepare('SELECT * FROM pairs ORDER BY id ASC');
    const rows = stmt.all();
    return rows.map(r => {
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
        refImageUrl: r.ref_image_url
      };
    });
  }

  getPairById(id) {
    const stmt = this.db.prepare('SELECT * FROM pairs WHERE id = ?');
    const r = stmt.get(id);
    if (!r) return null;
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
      refImageUrl: r.ref_image_url
    };
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
      p.id, p.name, p.source_dataset_id || p.sourceDatasetId, p.reference_dataset_id || p.referenceDatasetId,
      p.region, p.category, p.scale_ratio || p.scaleRatio, p.sun_azimuth_diff_deg || p.sunAzimuthDiffDeg,
      p.sun_elevation_diff_deg || p.sunElevationDiffDeg, p.estimated_overlap_pct || p.estimatedOverlapPct,
      p.description, p.source_image_url || p.sourceImageUrl, p.ref_image_url || p.refImageUrl
    );
  }

  // --- JOBS ---
  getAllJobs() {
    const stmt = this.db.prepare('SELECT * FROM jobs ORDER BY created_at DESC');
    const rows = stmt.all();
    return rows.map(r => {
      const pair = this.getPairById(r.pair_id);
      const logs = this.getJobLogs(r.id);
      const tiePoints = this.getJobTiePoints(r.id);
      return {
        id: r.id,
        name: r.name,
        pair,
        status: r.status,
        currentStageKey: r.current_stage_key,
        stageStep: r.stage_step,
        progress: r.progress,
        runtimeSec: r.runtime_sec,
        config: r.config_json ? JSON.parse(r.config_json) : null,
        metrics: r.metrics_json ? JSON.parse(r.metrics_json) : null,
        failureReason: r.failure_reason,
        isSimulatedFailure: Boolean(r.is_simulated_failure),
        createdAt: r.created_at,
        completedAt: r.completed_at,
        logs,
        matchPoints: tiePoints
      };
    });
  }

  getJobById(id) {
    const stmt = this.db.prepare('SELECT * FROM jobs WHERE id = ?');
    const r = stmt.get(id);
    if (!r) return null;
    const pair = this.getPairById(r.pair_id);
    const logs = this.getJobLogs(r.id);
    const tiePoints = this.getJobTiePoints(r.id);
    return {
      id: r.id,
      name: r.name,
      pair,
      status: r.status,
      currentStageKey: r.current_stage_key,
      stageStep: r.stage_step,
      progress: r.progress,
      runtimeSec: r.runtime_sec,
      config: r.config_json ? JSON.parse(r.config_json) : null,
      metrics: r.metrics_json ? JSON.parse(r.metrics_json) : null,
      failureReason: r.failure_reason,
      isSimulatedFailure: Boolean(r.is_simulated_failure),
      createdAt: r.created_at,
      completedAt: r.completed_at,
      logs,
      matchPoints: tiePoints
    };
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
      j.id, j.name, j.pair_id || (j.pair && j.pair.id), j.status || 'queued',
      j.current_stage_key || j.currentStageKey || 'ingest', j.stage_step || j.stageStep || 1,
      j.progress || 0, j.runtime_sec || j.runtimeSec || 0,
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
    const stmt = this.db.prepare('DELETE FROM jobs WHERE id = ?');
    stmt.run(id);
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
      log.timestamp,
      log.elapsed_sec || log.elapsedSec || 0,
      log.level || 'info',
      log.stage_key || log.stageKey,
      log.message
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

  insertTiePoints(jobId, points) {
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
        p.id || p.point_index,
        p.sourceX || p.source_x,
        p.sourceY || p.source_y,
        p.refX || p.ref_x,
        p.refY || p.ref_y,
        p.residualX || p.residual_x,
        p.residualY || p.residual_y,
        p.residualMagnitude || p.residual_magnitude,
        p.confidence,
        p.isInlier || p.is_inlier ? 1 : 0,
        p.gridCellId || p.grid_cell_id
      );
    }
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
      bm.id, bm.method, bm.category, bm.overall_rmse || bm.overallRmse,
      bm.subpixel_residual || bm.subpixelResidual || null,
      bm.inlier_ratio || bm.inlierRatio, bm.spatial_coverage || bm.spatialCoverage,
      bm.polar_robustness || bm.polarRobustness, bm.runtime_sec || bm.runtimeSec,
      bm.description
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
