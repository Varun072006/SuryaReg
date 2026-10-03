import repository from './repository.js';
import {
  SEED_DATASETS,
  SEED_PAIRS,
  SEED_BENCHMARKS,
  SEED_JOB_CONFIG,
  SEED_JOB_METRICS,
  SEED_JOB_LOGS,
  generateSeedTiePoints
} from './seedData.js';

export function seedDatabase(force = false) {
  console.log('[Seed] Verifying and seeding initial database records...');

  // 1. Seed Datasets
  const existingDatasets = repository.getAllDatasets();
  if (existingDatasets.length === 0 || force) {
    console.log(`[Seed] Seeding ${SEED_DATASETS.length} lunar datasets...`);
    for (const ds of SEED_DATASETS) {
      repository.insertDataset(ds);
    }
  }

  // 2. Seed Image Pairs
  const existingPairs = repository.getAllPairs();
  if (existingPairs.length === 0 || force) {
    console.log(`[Seed] Seeding ${SEED_PAIRS.length} benchmark pairs...`);
    for (const p of SEED_PAIRS) {
      repository.insertPair(p);
    }
  }

  // 3. Seed Benchmarks
  const existingBenchmarks = repository.getAllBenchmarks();
  if (existingBenchmarks.length === 0 || force) {
    console.log(`[Seed] Seeding ${SEED_BENCHMARKS.length} comparative benchmark baselines...`);
    for (const bm of SEED_BENCHMARKS) {
      repository.insertBenchmark(bm);
    }
  }

  // 4. Seed Primary Demo Job (JOB-26166-01)
  const existingJobs = repository.getAllJobs();
  if (existingJobs.length === 0 || force) {
    console.log('[Seed] Seeding default flagship registration job (JOB-26166-01)...');
    const primaryPair = SEED_PAIRS[0];

    const demoJob = {
      id: 'JOB-26166-01',
      name: `Reg-01: ${primaryPair.region} (CH2-OHRC → LRO-NAC)`,
      pair_id: primaryPair.id,
      status: 'completed',
      current_stage_key: 'warp_outputs',
      stage_step: 10,
      progress: 100,
      runtime_sec: 5.8,
      config: SEED_JOB_CONFIG,
      metrics: SEED_JOB_METRICS,
      failure_reason: null,
      is_simulated_failure: false,
      created_at: new Date(Date.now() - 3600000).toISOString().replace('T', ' ').slice(0, 19),
      completed_at: new Date(Date.now() - 3590000).toISOString().replace('T', ' ').slice(0, 19)
    };

    repository.insertJob(demoJob);

    // Seed Logs
    for (const log of SEED_JOB_LOGS) {
      repository.insertJobLog({
        ...log,
        job_id: demoJob.id
      });
    }

    // Seed Tie Points
    const tiePoints = generateSeedTiePoints(demoJob.id);
    repository.insertTiePoints(demoJob.id, tiePoints);

    console.log(`[Seed] Seeded ${tiePoints.length} Ground Control Points for ${demoJob.id}.`);
  }

  console.log('[Seed] Database initialization complete.');
}

// Allow direct CLI invocation: node backend/src/database/seed.js
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase(true);
}

export default seedDatabase;
