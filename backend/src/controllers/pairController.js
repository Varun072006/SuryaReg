import repository from '../database/repository.js';

export const getPairs = (req, res) => {
  try {
    const pairs = repository.getAllPairs();
    res.json({ success: true, count: pairs.length, data: pairs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getPairById = (req, res) => {
  try {
    const pair = repository.getPairById(req.params.id);
    if (!pair) {
      return res.status(404).json({ success: false, error: 'Pair not found' });
    }
    res.json({ success: true, data: pair });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createPair = (req, res) => {
  try {
    const pair = req.body;
    if (!pair.id || !pair.name || !pair.sourceDatasetId || !pair.referenceDatasetId) {
      return res.status(400).json({
        success: false,
        error: 'id, name, sourceDatasetId, and referenceDatasetId are required'
      });
    }
    repository.insertPair(pair);
    const created = repository.getPairById(pair.id);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export default {
  getPairs,
  getPairById,
  createPair
};
