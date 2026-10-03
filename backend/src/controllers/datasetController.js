import repository from '../database/repository.js';

export const getDatasets = (req, res) => {
  try {
    const datasets = repository.getAllDatasets();
    res.json({ success: true, count: datasets.length, data: datasets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getDatasetById = (req, res) => {
  try {
    const dataset = repository.getDatasetById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, error: 'Dataset not found' });
    }
    res.json({ success: true, data: dataset });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createDataset = (req, res) => {
  try {
    const ds = req.body;
    if (!ds.id || !ds.name) {
      return res.status(400).json({ success: false, error: 'id and name are required' });
    }
    repository.insertDataset(ds);
    const created = repository.getDatasetById(ds.id);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export default {
  getDatasets,
  getDatasetById,
  createDataset
};
