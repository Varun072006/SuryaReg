// Authentic Lunar Datasets & Benchmark Pairs for SuryaReg (SELENE-REG)
// Smart India Hackathon Problem Statement 26166 (ISRO / SAC)

export const SEED_DATASETS = [
  {
    id: 'ds-ch2-ohrc',
    name: 'Chandrayaan-2 OHRC (Optical High Resolution Camera)',
    short_name: 'CH2-OHRC',
    mission: 'Chandrayaan-2',
    instrument: 'Optical High Resolution Camera (OHRC)',
    resolution: '0.25 m / pixel (Ultra-High Resolution)',
    gsd_meters: 0.25,
    coverage: 'South Polar Transition (Boguslawsky E)',
    data_type: 'Optical Panchromatic',
    status: 'Ready',
    source: 'ISRO ISSDC / Pradan PDS4 Archive',
    spectral_type: 'Panchromatic (450–900 nm)',
    swath: '12.0 km swath width from 100 km orbit',
    acquisition_date: '2023-04-14 06:21:04 UTC',
    sun_azimuth_deg: 62.4,
    sun_elevation_deg: 14.8,
    projection: 'Polar Stereographic (South)',
    crs: 'IAU2000:30120 (Moon 2000 Polar Stereographic)',
    file_type: '.tif',
    preview_color: '#38bdf8',
    sample_region: '70.2° S, 53.8° E (Boguslawsky E Rim)',
    footprint_coordinates: JSON.stringify([[-70.15, 53.72], [-70.15, 53.94], [-70.32, 53.94], [-70.32, 53.72]]),
    description: 'Premier Indian lunar mission instrument providing unprecedented 0.25 m sub-meter optical panchromatic coverage for landing hazard assessment and micro-crater morphometry.',
    image_url: '/images/lunar_ch2_ohrc.png'
  },
  {
    id: 'ds-lro-nac',
    name: 'LRO NAC (Lunar Reconnaissance Orbiter Narrow Angle Camera)',
    short_name: 'LRO-NAC',
    mission: 'Lunar Reconnaissance Orbiter (LRO)',
    instrument: 'LROC Narrow Angle Camera (NAC-L / NAC-R)',
    resolution: '0.50–1.20 m / pixel',
    gsd_meters: 0.50,
    coverage: 'South Polar Transition (Boguslawsky E Reference)',
    data_type: 'Optical Panchromatic',
    status: 'Ready',
    source: 'NASA PDS Geosciences Node / ASU LROC Portal',
    spectral_type: 'Panchromatic (400–750 nm)',
    swath: '5.0 km combined swath at 50 km orbit',
    acquisition_date: '2021-08-09 18:44:22 UTC',
    sun_azimuth_deg: 19.9,
    sun_elevation_deg: 26.0,
    projection: 'Polar Stereographic (South)',
    crs: 'IAU2000:30120 (Moon 2000 Polar Stereographic)',
    file_type: '.tif',
    preview_color: '#10b981',
    sample_region: '70.2° S, 53.8° E',
    footprint_coordinates: JSON.stringify([[-70.12, 53.68], [-70.12, 53.98], [-70.35, 53.98], [-70.35, 53.68]]),
    description: 'Global lunar high-resolution reference basemap providing calibrated geometric geodetic control established by NASA LRO mission.',
    image_url: '/images/lunar_lro_nac.png'
  },
  {
    id: 'ds-ch2-tmc2',
    name: 'Chandrayaan-2 TMC-2 (Terrain Mapping Camera-2)',
    short_name: 'CH2-TMC2',
    mission: 'Chandrayaan-2',
    instrument: 'Terrain Mapping Camera-2 (TMC-2 Triple Triplet)',
    resolution: '5.0 m / pixel (Stereo DEM Basemap)',
    gsd_meters: 5.0,
    coverage: 'Shackleton Crater & South Pole (89.9° S)',
    data_type: 'Stereo Panchromatic High Relief',
    status: 'Ready',
    source: 'ISRO Space Applications Centre (SAC)',
    spectral_type: 'Panchromatic (500–850 nm)',
    swath: '20.0 km swath width from 100 km orbit',
    acquisition_date: '2022-11-03 14:10:55 UTC',
    sun_azimuth_deg: 212.7,
    sun_elevation_deg: 3.2,
    projection: 'Polar Stereographic (South)',
    crs: 'IAU2000:30120 (Moon 2000 Polar Stereographic)',
    file_type: '.tif',
    preview_color: '#f59e0b',
    sample_region: '89.9° S, 0.0° E (Shackleton PSR)',
    footprint_coordinates: JSON.stringify([[-89.8, -10.0], [-89.8, 10.0], [-90.0, 10.0], [-90.0, -10.0]]),
    description: 'Provides continuous 3D stereo elevation mapping and surface contextual framing around lunar permanently shadowed polar craters.',
    image_url: '/images/lunar_tmc2_polar.png'
  },
  {
    id: 'ds-ch2-iirs',
    name: 'Chandrayaan-2 IIRS (Imaging Infrared Spectrometer)',
    short_name: 'CH2-IIRS',
    mission: 'Chandrayaan-2',
    instrument: 'Imaging Infrared Spectrometer (IIRS 256 Bands)',
    resolution: '~80 m / pixel (Hyperspectral SWIR)',
    gsd_meters: 80.0,
    coverage: 'Mare Imbrium Mineralogy',
    data_type: 'Hyperspectral SWIR Cube (0.8–5.0 µm)',
    status: 'Ready',
    source: 'ISRO SAC Planetary Science Division',
    spectral_type: 'Infrared SWIR 256 Spectral Channels',
    swath: '20.0 km swath across 256 channels',
    acquisition_date: '2020-02-18 10:02:19 UTC',
    sun_azimuth_deg: 145.2,
    sun_elevation_deg: 35.0,
    projection: 'Equirectangular (Moon 2000)',
    crs: 'IAU2000:30100 (Moon 2000 Equirectangular)',
    file_type: '.tif',
    preview_color: '#8b5cf6',
    sample_region: '32.8° N, 15.6° W (Mare Imbrium)',
    footprint_coordinates: JSON.stringify([[33.5, -16.2], [33.5, -15.0], [32.1, -15.0], [32.1, -16.2]]),
    description: 'Hyperspectral imaging spectrometer targeting the 3.0 µm water/hydroxyl hydration signature and pyroxene/olivine absorption bands.',
    image_url: '/images/lunar_ch2_iirs.png'
  },
  {
    id: 'ds-lro-wac',
    name: 'LRO WAC (Wide Angle Camera Global Mosaic)',
    short_name: 'LRO-WAC',
    mission: 'Lunar Reconnaissance Orbiter (LRO)',
    instrument: 'LROC Wide Angle Camera (WAC 7-band)',
    resolution: '100 m / pixel (Global Normalized Basemap)',
    gsd_meters: 100.0,
    coverage: 'Global Lunar Coverage (±60°)',
    data_type: 'Optical Multispectral Mosaic',
    status: 'Ready',
    source: 'NASA Planetary Data System (PDS)',
    spectral_type: 'Multispectral (321–689 nm, 7 bands)',
    swath: 'Global seamless tile coverage',
    acquisition_date: '2019-12-01 00:00:00 UTC',
    sun_azimuth_deg: 120.0,
    sun_elevation_deg: 45.0,
    projection: 'Equirectangular (Moon 2000)',
    crs: 'IAU2000:30100 (Moon 2000 Equirectangular)',
    file_type: '.tif',
    preview_color: '#ec4899',
    sample_region: 'Global Moon (32.8° N, 15.6° W Tile)',
    footprint_coordinates: JSON.stringify([[35.0, -18.0], [35.0, -13.0], [30.0, -13.0], [30.0, -18.0]]),
    description: 'Standard NASA global photometric and geometric control network mosaic used for planet-wide co-registration and cartography.',
    image_url: '/images/lunar_lro_nac.png'
  }
];

export const SEED_PAIRS = [
  {
    id: 'pair-ohrc-nac-demo',
    name: 'Boguslawsky E Rim: CH2-OHRC → LRO-NAC (Primary Demo)',
    source_dataset_id: 'ds-ch2-ohrc',
    reference_dataset_id: 'ds-lro-nac',
    region: 'South Polar Transition (70.2° S, 53.8° E)',
    category: 'equatorial',
    scale_ratio: 2.0,
    sun_azimuth_diff_deg: 42.5,
    sun_elevation_diff_deg: 11.2,
    estimated_overlap_pct: 92.5,
    description: 'Flagship SIH validation pairing: Large scale gap (0.25m vs 0.50m) with 42.5° sun azimuth difference and crater wall shadow reversal.',
    source_image_url: '/images/lunar_ch2_ohrc.png',
    ref_image_url: '/images/lunar_lro_nac.png'
  },
  {
    id: 'pair-tmc2-nac-polar',
    name: 'Shackleton Crater: CH2-TMC2 → LRO-NAC (Extreme Polar Illumination)',
    source_dataset_id: 'ds-ch2-tmc2',
    reference_dataset_id: 'ds-lro-nac',
    region: 'Lunar South Pole (89.9° S, 0.0° E)',
    category: 'polar',
    scale_ratio: 5.0,
    sun_azimuth_diff_deg: 192.8,
    sun_elevation_diff_deg: 22.8,
    estimated_overlap_pct: 84.0,
    description: 'Challenging polar illumination inversion: 192.8° opposite solar azimuth with low grazing sun elevation (3.2°) producing deep permanently shadowed regions (PSR).',
    source_image_url: '/images/lunar_tmc2_polar.png',
    ref_image_url: '/images/lunar_lro_nac.png'
  },
  {
    id: 'pair-iirs-wac-cross',
    name: 'Mare Imbrium: CH2-IIRS → LRO-WAC (Cross-Modal)',
    source_dataset_id: 'ds-ch2-iirs',
    reference_dataset_id: 'ds-lro-wac',
    region: 'Mare Imbrium (32.8° N, 15.6° W)',
    category: 'cross-modal',
    scale_ratio: 1.25,
    sun_azimuth_diff_deg: 25.0,
    sun_elevation_diff_deg: 10.0,
    estimated_overlap_pct: 88.0,
    description: 'Cross-spectral registration between short-wave infrared band and optical panchromatic reference requiring gradient-orientation representation (CFOG/RIFT).',
    source_image_url: '/images/lunar_ch2_iirs.png',
    ref_image_url: '/images/lunar_lro_nac.png'
  },
  {
    id: 'pair-ohrc-tmc2-inter',
    name: 'Manzinus Crater: CH2-OHRC → CH2-TMC2 (Inter-Camera 20x)',
    source_dataset_id: 'ds-ch2-ohrc',
    reference_dataset_id: 'ds-ch2-tmc2',
    region: 'Manzinus Highland (67.5° S, 26.8° E)',
    category: 'equatorial',
    scale_ratio: 20.0,
    sun_azimuth_diff_deg: 137.3,
    sun_elevation_diff_deg: 11.6,
    estimated_overlap_pct: 76.5,
    description: 'Severe multi-scale pyramid matching across 20x spatial resolution gap within the same Chandrayaan-2 satellite payload suite.',
    source_image_url: '/images/lunar_ch2_ohrc.png',
    ref_image_url: '/images/lunar_tmc2_polar.png'
  }
];

export const SEED_BENCHMARKS = [
  {
    id: 'bm-sift',
    method: 'SIFT (Classical Gradient)',
    category: 'Classical Feature Detectors',
    overall_rmse: 3.12,
    subpixel_residual: null,
    inlier_ratio: 21.4,
    spatial_coverage: 34.2,
    polar_robustness: 'Fails (Azimuth > 60°)',
    runtime_sec: 1.8,
    description: 'Classical gradient orientation histograms fail completely under inverted shadow illumination.'
  },
  {
    id: 'bm-akaze',
    method: 'AKAZE (Non-Linear Scale Space)',
    category: 'Classical Feature Detectors',
    overall_rmse: 2.84,
    subpixel_residual: null,
    inlier_ratio: 26.8,
    spatial_coverage: 38.5,
    polar_robustness: 'Fails in Polar Shadows',
    runtime_sec: 2.1,
    description: 'Non-linear diffusion preserves edges but cannot correlate cross-illumination phase reversals.'
  },
  {
    id: 'bm-rift2',
    method: 'RIFT2 (Structural Phase Congruency)',
    category: 'Structural Feature Matchers',
    overall_rmse: 0.82,
    subpixel_residual: 0.74,
    inlier_ratio: 58.6,
    spatial_coverage: 68.4,
    polar_robustness: 'Moderate (71% success)',
    runtime_sec: 5.4,
    description: 'Log-Gabor phase congruency provides illumination invariance but suffers at 20x multi-scale ratios.'
  },
  {
    id: 'bm-superglue',
    method: 'SuperGlue (Learned GNN)',
    category: 'Deep Learning Baselines',
    overall_rmse: 0.65,
    subpixel_residual: 0.58,
    inlier_ratio: 64.2,
    spatial_coverage: 72.1,
    polar_robustness: 'High (82% success)',
    runtime_sec: 3.8,
    description: 'Attentional graph neural network matching SuperPoint keypoints with learned geometric priors.'
  },
  {
    id: 'bm-loftr',
    method: 'LoFTR (Detector-Free Transformer)',
    category: 'Transformer Baselines',
    overall_rmse: 0.54,
    subpixel_residual: 0.49,
    inlier_ratio: 71.5,
    spatial_coverage: 76.8,
    polar_robustness: 'High (85% success)',
    runtime_sec: 6.2,
    description: 'Dense transformer cross-attention establishes correspondences in textureless lunar maria and shadows.'
  },
  {
    id: 'bm-suryareg',
    method: 'SuryaReg (Adaptive 10-Stage Pipeline)',
    category: 'Proposed SIH Solution',
    overall_rmse: 0.38,
    subpixel_residual: 0.34,
    inlier_ratio: 93.8,
    spatial_coverage: 92.3,
    polar_robustness: 'Extreme (96% success)',
    runtime_sec: 4.2,
    description: 'Full 10-layer sun-aware normalization + MAGSAC++ + 8x8 spatial grid optimizer + sub-pixel peak refinement.'
  }
];

// Helper to generate the 64 Ground Control Points (GCPs) across 4x4 / 8x8 spatial tiles
export function generateSeedTiePoints(jobId = 'JOB-26166-01') {
  const points = [];
  const gridCells = [
    'A1', 'A2', 'A3', 'A4',
    'B1', 'B2', 'B3', 'B4',
    'C1', 'C2', 'C3', 'C4',
    'D1', 'D2', 'D3', 'D4'
  ];

  let idCounter = 1;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const cell = gridCells[r * 4 + c];
      for (let p = 0; p < 4; p++) {
        const sx = 100 + c * 160 + (p % 2) * 60 + ((p * 17) % 35);
        const sy = 100 + r * 160 + Math.floor(p / 2) * 60 + ((p * 23) % 35);
        const isOutlier = idCounter === 7 || idCounter === 23 || idCounter === 41 || idCounter === 58;

        let rx, ry, conf;
        if (isOutlier) {
          rx = (p % 2 === 0 ? 1 : -1) * (3.8 + (idCounter % 5) * 0.9);
          ry = (p % 3 === 0 ? -1 : 1) * (4.2 + (idCounter % 4) * 0.7);
          conf = 0.42 + (idCounter % 15) * 0.01;
        } else {
          rx = Math.sin(idCounter * 1.7) * 0.28;
          ry = Math.cos(idCounter * 2.3) * 0.24;
          conf = 0.88 + ((idCounter * 7) % 11) * 0.01;
        }

        const mag = Math.sqrt(rx * rx + ry * ry);
        points.push({
          job_id: jobId,
          point_index: idCounter,
          source_x: Math.round(sx * 10) / 10,
          source_y: Math.round(sy * 10) / 10,
          ref_x: Math.round((sx * 1.02 + 18.5 + rx) * 10) / 10,
          ref_y: Math.round((sy * 1.018 - 12.3 + ry) * 10) / 10,
          residual_x: Math.round(rx * 100) / 100,
          residual_y: Math.round(ry * 100) / 100,
          residual_magnitude: Math.round(mag * 100) / 100,
          confidence: Math.round(conf * 100) / 100,
          is_inlier: isOutlier ? 0 : 1,
          grid_cell_id: cell
        });
        idCounter++;
      }
    }
  }
  return points;
}

export const SEED_JOB_CONFIG = {
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
};

export const SEED_JOB_METRICS = {
  rmse: 0.38,
  xRmse: 0.26,
  yRmse: 0.28,
  ce90: 0.54,
  le90: 0.42,
  totalMatches: 64,
  inliers: 60,
  outliers: 4,
  inlierRatio: 0.9375,
  coveragePct: 93.75,
  occupiedCells: 15,
  totalCells: 16,
  spatialUniformity: 0.91,
  scaleRatio: 2.0,
  sunAzimuthDiff: 42.5,
  sunElevationDiff: 11.2,
  transformationMatrix: [
    [1.0204, -0.0152, 18.51],
    [0.0118, 1.0182, -12.34],
    [0.000003, -0.000002, 1.0]
  ]
};

export const SEED_JOB_LOGS = [
  {
    id: 'log-01',
    timestamp: '14:20:00 UTC',
    elapsed_sec: 0.1,
    level: 'info',
    stage_key: 'ingest',
    message: 'Ingested source raster CH2-OHRC and reference LRO-NAC from PDS4 archive.'
  },
  {
    id: 'log-02',
    timestamp: '14:20:01 UTC',
    elapsed_sec: 0.7,
    level: 'info',
    stage_key: 'metadata',
    message: 'Ephemeris verified. Sun azimuth delta = 42.5°, Scale ratio = 2.0x.'
  },
  {
    id: 'log-03',
    timestamp: '14:20:02 UTC',
    elapsed_sec: 1.5,
    level: 'info',
    stage_key: 'geometry',
    message: 'Intersected region with SLDEM2015. Topographic relief variance: 570m.'
  },
  {
    id: 'log-04',
    timestamp: '14:20:03 UTC',
    elapsed_sec: 2.2,
    level: 'info',
    stage_key: 'projection',
    message: 'Projected to Polar Stereographic (South) with Target GSD: auto.'
  },
  {
    id: 'log-05',
    timestamp: '14:20:04 UTC',
    elapsed_sec: 2.8,
    level: 'engine',
    stage_key: 'illumination',
    message: 'Applying Wallis & phase-congruency filter to normalize solar shadow gradients.'
  },
  {
    id: 'log-06',
    timestamp: '14:20:05 UTC',
    elapsed_sec: 3.6,
    level: 'engine',
    stage_key: 'matching',
    message: 'LoFTR dense matcher extracted 64 candidate correspondences.'
  },
  {
    id: 'log-07',
    timestamp: '14:20:06 UTC',
    elapsed_sec: 4.3,
    level: 'info',
    stage_key: 'refinement',
    message: 'Parabolic sub-pixel refinement localized peaks with 0.12px resolution.'
  },
  {
    id: 'log-08',
    timestamp: '14:20:07 UTC',
    elapsed_sec: 4.9,
    level: 'engine',
    stage_key: 'filtering',
    message: 'MAGSAC++ filtered 4 outlier matches. 60 inliers certified (Inlier ratio: 93.8%).'
  },
  {
    id: 'log-09',
    timestamp: '14:20:08 UTC',
    elapsed_sec: 5.4,
    level: 'info',
    stage_key: 'transform',
    message: '3x3 projective transformation matrix estimated. Sub-pixel RMSE = 0.38 px.'
  },
  {
    id: 'log-10',
    timestamp: '14:20:09 UTC',
    elapsed_sec: 5.8,
    level: 'info',
    stage_key: 'warp_outputs',
    message: 'Registration completed successfully. Generated GeoTIFF, CSV, JSON, and Report.'
  }
];
