# SuryaReg Backend Architecture & API Documentation

Mission backend and database service for **SuryaReg (SELENE-REG)**: *Multi-Modal, Sun-Angle and Scale-Invariant Lunar Image Correspondence & Registration Platform for Chandrayaan-2* (SIH Problem Statement 26166 / ISRO SAC).

---

## 🏗️ Architecture Overview

The backend is organized into clean, enterprise-grade decoupled layers adhering to clean code standards:

```
backend/
├── data/
│   └── suryareg.db            # Persistent SQLite Database (node:sqlite WAL mode)
├── src/
│   ├── config/
│   │   └── index.js           # Environment parser, paths, security origins, and rate limits
│   ├── database/
│   │   ├── schema.sql         # SQL DDL with indexes, foreign keys, and constraints
│   │   ├── db.js              # Database connection, PRAGMA optimizations & atomic transactions
│   │   ├── seedData.js        # Chandrayaan-2 & LRO mission data, pairs, benchmarks
│   │   ├── repository.js      # Type-safe, transaction-wrapped data access layer
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
│   ├── middleware/
│   │   ├── security.js        # Hardened HTTP security headers, CORS, and sliding-window rate limiter
│   │   ├── validator.js       # ID, body schema validation and filename CRLF sanitization
│   │   └── errorHandler.js    # Global centralized error handler and API 404 router
│   ├── routes/
│   │   └── apiRoutes.js       # Express router mapping /api/* endpoints
│   ├── utils/
│   │   ├── constants.js       # Mission constants, thresholds, and pipeline stages
│   │   ├── errors.js          # Custom application errors (AppError, NotFoundError, etc.)
│   │   ├── logger.js          # Structured, leveled mission logger
│   │   └── response.js        # Standardized API response formatters
│   └── app.js                 # Express application configuration, middleware wiring, and SPA serving
├── tests/
│   └── api.test.js            # Automated test suite using Node.js native test runner
├── package.json               # Backend package definition
├── README.md                  # This documentation
└── server.js                  # Main server entrypoint with graceful shutdown
```

---

## 🔒 Security Hardening

SuryaReg includes a defense-in-depth security layer designed for mission-critical aerospace workstations:

1. **Hardened HTTP Headers**: Implements `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, and a strict `Content-Security-Policy`.
2. **Sliding-Window Rate Limiting**: Built-in zero-dependency memory-leak-safe rate limiter protecting against brute-force and DoS attacks (configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`).
3. **Strict Parameter & Schema Validation**:
   - Route parameters (`:id`, `:jobId`) validated against `/^[A-Za-z0-9_-]{1,64}$/`.
   - Rejects directory traversal (`../`), SQL injection fragments, and control characters.
   - Filenames for file downloads sanitized against HTTP Response Splitting / CRLF injection (`\r\n`).
4. **Controlled CORS Whitelisting**: Environment-driven origin whitelisting supporting credentials and preflight caching.
5. **Safe Error Handling**: Prevents leakage of internal stack traces, filesystem paths, or raw SQL queries in production environments.
6. **Atomic Transactions**: SQLite multi-statement writes (e.g. tie-points insertion, job cleanup) wrapped in transactions ensuring ACID consistency.

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
- `GET /api/telemetry` — Live workstation metrics (active/completed jobs, average RMSE, DB status, memory)

### Datasets
- `GET /api/datasets` — List all mission datasets
- `GET /api/datasets/:id` — Get single dataset details
- `POST /api/datasets` — Ingest a new lunar raster dataset

### Benchmark Image Pairs
- `GET /api/pairs` — List benchmark pairs (Boguslawsky E, Shackleton, Mare Imbrium, Manzinus)
- `GET /api/pairs/:id` — Get single pair details
- `POST /api/pairs` — Register a new image pair

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
- `DELETE /api/jobs/:id` — Delete a job and associated artifacts
- `GET /api/jobs/:id/logs` — Get real-time execution logs for the 10 stages
- `GET /api/jobs/:id/tiepoints` — Get Ground Control Points with sub-pixel residual vectors

### Comparative Benchmarks
- `GET /api/benchmarks` — Benchmark comparison against SIFT, AKAZE, RIFT2, SuperGlue, and LoFTR

### Deliverables & Exports
- `GET /api/exports/:jobId/dossier` — Official ISRO-SAC Registration Compliance Dossier (Markdown/download)
- `GET /api/exports/:jobId/csv` — Download Ground Control Points CSV table
- `GET /api/exports/:jobId/geotiff-meta` — PDS4/GeoTIFF geocoding metadata

---

## 🚀 Running the Server & Tests

From the root directory:

```bash
# Start production server (serves API on /api/* and workstation UI on /)
npm start

# Development mode with auto-reload
npm run dev:backend

# Re-seed database with default mission data
npm run db:seed

# Run automated end-to-end API test suite (100% pass)
npm test

# Run code linter (0 errors, 0 warnings)
npm run lint
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
