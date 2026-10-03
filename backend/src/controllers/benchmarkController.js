import repository from '../database/repository.js';

export const getBenchmarks = (req, res) => {
  try {
    const benchmarks = repository.getAllBenchmarks();
    res.json({ success: true, count: benchmarks.length, data: benchmarks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export default {
  getBenchmarks
};
