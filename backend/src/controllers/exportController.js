import exportService from '../services/exportService.js';

export const getDossier = (req, res) => {
  try {
    const { jobId } = req.params;
    const format = req.query.format || 'markdown';
    const dossier = exportService.generateIsroDossier(jobId);

    if (format === 'download') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${jobId}_ISRO_Compliance_Dossier.md"`);
      return res.send(dossier);
    }

    res.json({
      success: true,
      jobId,
      format: 'markdown',
      content: dossier
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getTiePointsCsv = (req, res) => {
  try {
    const { jobId } = req.params;
    const csv = exportService.generateTiePointsCsv(jobId);

    if (req.query.download !== 'false') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${jobId}_Ground_Control_Points.csv"`);
      return res.send(csv);
    }

    res.json({
      success: true,
      jobId,
      format: 'csv',
      content: csv
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getGeoTiffMeta = (req, res) => {
  try {
    const { jobId } = req.params;
    const meta = exportService.generateGeoTiffMetadata(jobId);

    if (req.query.download === 'true') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${jobId}_GeoTIFF_PDS4_Metadata.json"`);
      return res.send(JSON.stringify(meta, null, 2));
    }

    res.json({
      success: true,
      jobId,
      data: meta
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export default {
  getDossier,
  getTiePointsCsv,
  getGeoTiffMeta
};
