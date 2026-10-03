# SuryaReg Backend Architecture & API Documentation

Mission backend and database service for **SuryaReg (SELENE-REG)**: *Multi-Modal, Sun-Angle and Scale-Invariant Lunar Image Correspondence & Registration Platform for Chandrayaan-2* (SIH Problem Statement 26166 / ISRO SAC).

---

## 🏗️ Architecture Overview

The backend is organized into clean, decoupled layers adhering to clean code standards:

```
backend/
├── data/
│   └── suryareg.db            # Persistent SQLite Database (node:sqlite WAL mode)
├── src/
│   ├── config/
│   │   └── index.js           # Environment paths, port, and directory constants
│   ├── database/
│   │   ├── schema.sql         # SQL DDL with indexes, foreign keys, and constraints
│   │   ├── db.js              # Database connection and schema migration runner
│   │   ├── seedData.js        # Chandrayaan-2 & LRO mission data, pairs, benchmarks
│   │   ├── repository.js      # Type-safe data access layer for all database entities
│   │   └── seed.js            # Auto-initialization and seeding runner
│   ├── services/
│   │   ├── registrationEngine.js # 10-Stage ISRO Architectural Pipeline execution engine
│   │   └── exportService.js   # ISRO Dossier, Ground Control Point CSV, and GeoTIFF meta
│   ├── controllers/
│   │   ├── datasetController.js  # Endpoints for lunar datasets
│   │   ├── pairController.js     # Endpoints for benchmark image pairs
│   │   ├── jobController.js      # Endpoints for registration jobs and execution
│   │   ├── benchmarkController.js # Endpoints for comparative benchmark models
│   │   ├── exportController.js   # Endpoints for report and CSV downloads
│   │   └── telemetryController.js# Endpoints for health and system statistics
│   ├── routes/
│   │   └── apiRoutes.js       # Express router mapping /api/* endpoints
│   └── app.js                 # Express application configuration, CORS, and static SPA serving
├── package.json               # Backend package definition
├── README.md                  # This documentation
└── server.js                  # Main server entrypoint
```

---

## 🗄️ Database Schema & Storage

The database uses SQLite 3.50+ in WAL (Write-Ahead Logging) mode:

1. **`datasets`**: Metadata for Chandrayaan-2 OHRC, TMC-2, IIRS, LRO NAC, LRO WAC, and SLDEM2015.
2. **`pairs`**: Registration pairings with sun-azimuth delta, scale disparity ratio, and region.
3. **`jobs`**: Historical and live registration jobs with progress, status, metrics, and stage index.
4. **`job_logs`**: Step-by-step 10-stage execution logs with microsecond elapsed timestamps.
5. **`tie_points`**: Ground Control Points (GCPs) with `Source_X/Y`, `Ref_X/Y`, sub-pixel residual error `dX/dY`, confidence, inlier flag, and spatial grid cell ID (`A1`–`D4`).
6. **`benchmarks`**: Quantitative benchmarks comparing SIFT, AKAZE, RIFT2, SuperGlue, LoFTR, and SuryaReg.
7. **`reports`**: Generated ISRO-SAC Compliance Dossiers, CSV tie points, and GeoTIFF geocoding products.

---

## 📡 REST API Reference

### Health & Telemetry
- `GET /api/health` — Service health status
- `GET /api/telemetry` — Live workstation metrics (active/completed jobs, average RMSE, DB status)

### Datasets
- `GET /api/datasets` — List all mission datasets
- `GET /api/datasets/:id` — Get single dataset details
- `POST /api/datasets` — Ingest a new lunar raster dataset

### Benchmark Image Pairs
- `GET /api/pairs` — List benchmark pairs (Boguslawsky E, Shackleton, Mare Imbrium, Manzinus)
- `GET /api/pairs/:id` — Get single pair details

### Registration Jobs & 10-Stage Pipeline
- `GET /api/jobs` — List all registration jobs (ordered by date)
- `GET /api/jobs/:id` — Get job details including configuration and accuracy metrics
- `POST /api/jobs` — Create and trigger a new registration job
  ```json
  {
    "pairId": "pair-ohrc-nac-demo",
    "config": {
      "matcher": "LoFTR",
      "referenceDem": "SLDEM2015",
      "projection": "Polar Stereographic (South)",
      "autoNormalizeIllumination": true,
      "subPixelRefinement": true,
      "magsacFiltering": true,
      "confidenceThreshold": 0.75
    },
    "fastExecution": false
  }
  ```
- `POST /api/jobs/:id/start` — Start an unstarted/queued job
- `POST /api/jobs/:id/pause` — Pause a running job
- `POST /api/jobs/:id/resume` — Resume a paused job
- `POST /api/jobs/:id/cancel` — Cancel job execution
- `POST /api/jobs/:id/retry` — Retry a failed job
- `GET /api/jobs/:id/logs` — Get real-time execution logs for the 10 stages
- `GET /api/jobs/:id/tiepoints` — Get Ground Control Points with sub-pixel residual vectors

### Comparative Benchmarks
- `GET /api/benchmarks` — Benchmark comparison against SIFT, AKAZE, RIFT2, SuperGlue, and LoFTR

### Deliverables & Exports
- `GET /api/exports/:jobId/dossier` — Official ISRO-SAC Registration Compliance Dossier (Markdown/JSON)
- `GET /api/exports/:jobId/csv` — Download Ground Control Points CSV table
- `GET /api/exports/:jobId/geotiff-meta` — PDS4/GeoTIFF geocoding metadata

---

## 🚀 Running the Server

From the root directory:

```bash
# Start server (serves API on /api/* and workstation UI on /)
npm start

# Or development mode with auto-reload
npm run dev:backend

# Re-seed database with default mission data
npm run db:seed
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
