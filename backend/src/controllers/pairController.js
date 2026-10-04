import repository from '../database/repository.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getPairs = (req, res, next) => {
  try {
    const pairs = repository.getAllPairs();
    return sendSuccess(res, pairs, { count: pairs.length });
  } catch (err) {
    next(err);
  }
};

export const getPairById = (req, res, next) => {
  try {
    const pair = repository.getPairById(req.params.id);
    if (!pair) {
      return sendError(res, `Image pair '${req.params.id}' was not found.`, 404, 'PAIR_NOT_FOUND');
    }
    return sendSuccess(res, pair);
  } catch (err) {
    next(err);
  }
};

export const createPair = (req, res, next) => {
  try {
    const pair = req.body;
    const srcId = pair.sourceDatasetId || pair.source_dataset_id;
    const refId = pair.referenceDatasetId || pair.reference_dataset_id;

    if (!pair.id || !pair.name || !srcId || !refId) {
      return sendError(
        res,
        'id, name, sourceDatasetId, and referenceDatasetId are required.',
        400,
        'VALIDATION_ERROR'
      );
    }

    if (!repository.datasetExists(srcId)) {
      return sendError(res, `Source dataset '${srcId}' does not exist in archive.`, 400, 'SOURCE_DATASET_NOT_FOUND');
    }

    if (!repository.datasetExists(refId)) {
      return sendError(res, `Reference dataset '${refId}' does not exist in archive.`, 400, 'REF_DATASET_NOT_FOUND');
    }

    repository.insertPair(pair);
    const created = repository.getPairById(pair.id);
    return sendSuccess(res, created, { message: `Image pair '${pair.id}' created successfully.` }, 201);
  } catch (err) {
    next(err);
  }
};

export default {
  getPairs,
  getPairById,
  createPair
};
