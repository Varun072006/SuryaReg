// SuryaReg Mission Constants & Pipeline Specifications
// Smart India Hackathon Problem Statement 26166: ISRO Space Applications Centre

export const MISSION_METRICS = {
  SUBPIXEL_THRESHOLD_PX: 0.40,
  TARGET_INLIER_RATIO: 0.70,
  TARGET_SPATIAL_UNIFORMITY: 0.80,
  MIN_REQUIRED_GCPS: 30,
  MOON_EQUATORIAL_RADIUS_M: 1737400.0,
  DEFAULT_CRS: 'IAU2000:30120'
};

export const JOB_STATUSES = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  NEEDS_ATTENTION: 'needs-attention'
};

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

export const ALLOWED_MATCHERS = ['LoFTR', 'RoMa', 'MINIMA', 'RIFT', 'LightGlue', 'SIFT-Baseline'];

export default {
  MISSION_METRICS,
  JOB_STATUSES,
  PIPELINE_STAGES,
  ALLOWED_MATCHERS
};
