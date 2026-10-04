import repository from '../database/repository.js';
import { sendSuccess } from '../utils/response.js';

export const getBenchmarks = (req, res, next) => {
  try {
    const benchmarks = repository.getAllBenchmarks();
    return sendSuccess(res, benchmarks, { count: benchmarks.length });
  } catch (err) {
    next(err);
  }
};

export default {
  getBenchmarks
};
