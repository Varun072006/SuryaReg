-- SuryaReg / SELENE-REG Database Schema
-- SIH Problem Statement 26166: Multi-Modal, Sun-Angle and Scale-Invariant Lunar Image Registration

PRAGMA foreign_keys = ON;

-- Datasets Table (Chandrayaan-2, LRO, Kaguya basemaps)
CREATE TABLE IF NOT EXISTS datasets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  mission TEXT NOT NULL,
  instrument TEXT NOT NULL,
  resolution TEXT NOT NULL,
  gsd_meters REAL NOT NULL,
  coverage TEXT,
  data_type TEXT,
  status TEXT DEFAULT 'Ready',
  source TEXT,
  spectral_type TEXT,
  swath TEXT,
  acquisition_date TEXT,
  sun_azimuth_deg REAL,
  sun_elevation_deg REAL,
  projection TEXT,
  crs TEXT,
  file_type TEXT DEFAULT '.tif',
  preview_color TEXT DEFAULT '#38bdf8',
  sample_region TEXT,
  footprint_coordinates TEXT, -- JSON array of [lat, lon]
  description TEXT,
  image_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Image Pairs Table (Target registration pairings)
CREATE TABLE IF NOT EXISTS pairs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_dataset_id TEXT NOT NULL,
  reference_dataset_id TEXT NOT NULL,
  region TEXT NOT NULL,
  category TEXT NOT NULL, -- 'equatorial', 'polar', 'cross-modal'
  scale_ratio REAL NOT NULL,
  sun_azimuth_diff_deg REAL NOT NULL,
  sun_elevation_diff_deg REAL NOT NULL,
  estimated_overlap_pct REAL NOT NULL,
  description TEXT,
  source_image_url TEXT,
  ref_image_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (source_dataset_id) REFERENCES datasets(id),
  FOREIGN KEY (reference_dataset_id) REFERENCES datasets(id)
);

-- Registration Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pair_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed', 'paused', 'needs-attention'
  current_stage_key TEXT DEFAULT 'ingest',
  stage_step INTEGER DEFAULT 1,
  progress INTEGER DEFAULT 0,
  runtime_sec REAL DEFAULT 0,
  config_json TEXT, -- JSON of wizard configuration
  metrics_json TEXT, -- JSON of accuracy & error metrics
  failure_reason TEXT,
  is_simulated_failure INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (pair_id) REFERENCES pairs(id)
);

-- Job Execution Logs Table
CREATE TABLE IF NOT EXISTS job_logs (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  elapsed_sec REAL DEFAULT 0,
  level TEXT DEFAULT 'info', -- 'info', 'engine', 'warning', 'error'
  stage_key TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Tie Points / Ground Control Points (GCPs) Table
CREATE TABLE IF NOT EXISTS tie_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT NOT NULL,
  point_index INTEGER NOT NULL,
  source_x REAL NOT NULL,
  source_y REAL NOT NULL,
  ref_x REAL NOT NULL,
  ref_y REAL NOT NULL,
  residual_x REAL NOT NULL,
  residual_y REAL NOT NULL,
  residual_magnitude REAL NOT NULL,
  confidence REAL NOT NULL,
  is_inlier INTEGER DEFAULT 1,
  grid_cell_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Benchmarks Table (Comparison against baselines)
CREATE TABLE IF NOT EXISTS benchmarks (
  id TEXT PRIMARY KEY,
  method TEXT NOT NULL,
  category TEXT NOT NULL,
  overall_rmse REAL,
  subpixel_residual REAL,
  inlier_ratio REAL,
  spatial_coverage REAL,
  polar_robustness TEXT,
  runtime_sec REAL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Reports & Deliverables Table
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'isro_dossier', 'gcp_csv', 'geotiff_meta', 'audit_json'
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  format TEXT NOT NULL, -- 'markdown', 'csv', 'json', 'xml'
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_logs_job ON job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_tie_points_job ON tie_points(job_id);
CREATE INDEX IF NOT EXISTS idx_reports_job ON reports(job_id);
