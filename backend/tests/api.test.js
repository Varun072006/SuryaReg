import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { seedDatabase } from '../src/database/seed.js';
import { closeDatabase } from '../src/database/db.js';

// Initialize and seed database for testing
seedDatabase(true);

const app = createApp();
let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    // Start test server on random available port
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => {
    server.close(() => {
      closeDatabase();
      resolve();
    });
  });
});

test('GET /api/health should return HEALTHY status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'HEALTHY');
  assert.equal(data.database, 'CONNECTED');
});

test('GET /api/telemetry should return mission metadata and telemetry', async () => {
  const res = await fetch(`${baseUrl}/api/telemetry`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.mission_summary.total_datasets >= 1);
  assert.ok(json.data.system_telemetry.memory_mb.heap_used > 0);
  assert.equal(json.data.isro_compliant, true);
});

test('Security headers should be present on responses', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.ok(res.headers.get('content-security-policy'));
});

test('GET /api/datasets should return seeded datasets', async () => {
  const res = await fetch(`${baseUrl}/api/datasets`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.length >= 4);
});

test('GET /api/datasets/:id with nonexistent ID should return 404', async () => {
  const res = await fetch(`${baseUrl}/api/datasets/nonexistent-id`);
  assert.equal(res.status, 404);
  const json = await res.json();
  assert.equal(json.success, false);
  assert.equal(json.error.code, 'DATASET_NOT_FOUND');
});

test('GET /api/pairs should return image pairs with relations', async () => {
  const res = await fetch(`${baseUrl}/api/pairs`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.length >= 1);
  const first = json.data[0];
  assert.ok(first.sourceDataset);
  assert.ok(first.referenceDataset);
});

test('POST /api/pairs with invalid dataset reference should return 400', async () => {
  const res = await fetch(`${baseUrl}/api/pairs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'test-pair-invalid',
      name: 'Invalid Test Pair',
      sourceDatasetId: 'invalid-ds-1',
      referenceDatasetId: 'invalid-ds-2'
    })
  });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.success, false);
  assert.equal(json.error.code, 'SOURCE_DATASET_NOT_FOUND');
});

test('POST /api/jobs, execution, logs, tie-points, and export deliverables', async () => {
  // 1. Create a test job with fastExecution enabled
  const createRes = await fetch(`${baseUrl}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'JOB-TEST-UNIT-01',
      pairId: 'pair-ohrc-nac-demo',
      name: 'Automated Test Registration Job',
      autoStart: true,
      fastExecution: true,
      config: {
        matcher: 'LoFTR',
        referenceDem: 'SLDEM2015',
        projection: 'Polar Stereographic (South)'
      }
    })
  });

  assert.equal(createRes.status, 201);
  const created = await createRes.json();
  assert.equal(created.success, true);
  assert.equal(created.data.id, 'JOB-TEST-UNIT-01');

  // 2. Poll until completed (with timeout)
  let completed = false;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 100));
    const checkRes = await fetch(`${baseUrl}/api/jobs/JOB-TEST-UNIT-01`);
    const checkJson = await checkRes.json();
    if (checkJson.data.status === 'completed') {
      completed = true;
      assert.ok(checkJson.data.metrics.rmse < 0.40);
      assert.equal(checkJson.data.progress, 100);
      break;
    }
  }
  assert.ok(completed, 'Job should complete within reasonable timeframe');

  // 3. Verify logs
  const logsRes = await fetch(`${baseUrl}/api/jobs/JOB-TEST-UNIT-01/logs`);
  assert.equal(logsRes.status, 200);
  const logsJson = await logsRes.json();
  assert.ok(logsJson.count > 0);

  // 4. Verify tie-points
  const pointsRes = await fetch(`${baseUrl}/api/jobs/JOB-TEST-UNIT-01/tiepoints`);
  assert.equal(pointsRes.status, 200);
  const pointsJson = await pointsRes.json();
  assert.ok(pointsJson.count >= 30);

  // 5. Verify exports (Dossier, CSV, GeoTIFF)
  const dossierRes = await fetch(`${baseUrl}/api/exports/JOB-TEST-UNIT-01/dossier`);
  assert.equal(dossierRes.status, 200);
  const dossierJson = await dossierRes.json();
  assert.ok(dossierJson.data.content.includes('ISRO-SAC MISSION COMPLIANCE DOSSIER'));

  const csvRes = await fetch(`${baseUrl}/api/exports/JOB-TEST-UNIT-01/csv?download=false`);
  assert.equal(csvRes.status, 200);
  const csvJson = await csvRes.json();
  assert.ok(csvJson.data.content.includes('Source_X_px,Source_Y_px'));

  const geoTiffRes = await fetch(`${baseUrl}/api/exports/JOB-TEST-UNIT-01/geotiff-meta`);
  assert.equal(geoTiffRes.status, 200);
  const geoTiffJson = await geoTiffRes.json();
  assert.equal(geoTiffJson.data.pds_version, 'PDS4');
  assert.equal(geoTiffJson.data.registration_quality.sub_pixel_accuracy, true);

  // 6. Delete test job
  const deleteRes = await fetch(`${baseUrl}/api/jobs/JOB-TEST-UNIT-01`, { method: 'DELETE' });
  assert.equal(deleteRes.status, 200);

  // Verify it is gone
  const afterDelete = await fetch(`${baseUrl}/api/jobs/JOB-TEST-UNIT-01`);
  assert.equal(afterDelete.status, 404);
});

test('GET /api/benchmarks returns quantitative baselines', async () => {
  const res = await fetch(`${baseUrl}/api/benchmarks`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.length >= 5);
});

test('Unmatched API routes should return structured 404', async () => {
  const res = await fetch(`${baseUrl}/api/unknown-endpoint-xyz`);
  assert.equal(res.status, 404);
  const json = await res.json();
  assert.equal(json.success, false);
  assert.equal(json.error.code, 'NOT_FOUND');
});
