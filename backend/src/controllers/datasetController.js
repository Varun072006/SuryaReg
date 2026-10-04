import repository from '../database/repository.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getDatasets = (req, res, next) => {
  try {
    const datasets = repository.getAllDatasets();
    return sendSuccess(res, datasets, { count: datasets.length });
  } catch (err) {
    next(err);
  }
};

export const getDatasetById = (req, res, next) => {
  try {
    const dataset = repository.getDatasetById(req.params.id);
    if (!dataset) {
      return sendError(res, `Dataset '${req.params.id}' was not found.`, 404, 'DATASET_NOT_FOUND');
    }
    return sendSuccess(res, dataset);
  } catch (err) {
    next(err);
  }
};

export const createDataset = (req, res, next) => {
  try {
    const ds = req.body;
    if (!ds || !ds.id || !ds.name) {
      return sendError(res, 'Both id and name are required to register a dataset.', 400, 'VALIDATION_ERROR');
    }

    repository.insertDataset(ds);
    const created = repository.getDatasetById(ds.id);
    return sendSuccess(res, created, { message: `Dataset '${ds.id}' registered successfully.` }, 201);
  } catch (err) {
    next(err);
  }
};

export default {
  getDatasets,
  getDatasetById,
  createDataset
};
