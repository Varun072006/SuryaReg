import exportService from '../services/exportService.js';
import { sanitizeFilename } from '../middleware/validator.js';
import { sendSuccess } from '../utils/response.js';

export const getDossier = (req, res, next) => {
  try {
    const { jobId } = req.params;
    const format = req.query.format || 'markdown';
    const dossier = exportService.generateIsroDossier(jobId);

    if (format === 'download') {
      const filename = sanitizeFilename(`${jobId}_ISRO_Compliance_Dossier.md`);
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(dossier);
    }

    return sendSuccess(res, {
      jobId,
      format: 'markdown',
      content: dossier
    });
  } catch (err) {
    next(err);
  }
};

export const getTiePointsCsv = (req, res, next) => {
  try {
    const { jobId } = req.params;
    const csv = exportService.generateTiePointsCsv(jobId);

    if (req.query.download !== 'false') {
      const filename = sanitizeFilename(`${jobId}_Ground_Control_Points.csv`);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csv);
    }

    return sendSuccess(res, {
      jobId,
      format: 'csv',
      content: csv
    });
  } catch (err) {
    next(err);
  }
};

export const getGeoTiffMeta = (req, res, next) => {
  try {
    const { jobId } = req.params;
    const meta = exportService.generateGeoTiffMetadata(jobId);

    if (req.query.download === 'true') {
      const filename = sanitizeFilename(`${jobId}_GeoTIFF_PDS4_Metadata.json`);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(JSON.stringify(meta, null, 2));
    }

    return sendSuccess(res, meta, { jobId });
  } catch (err) {
    next(err);
  }
};

export default {
  getDossier,
  getTiePointsCsv,
  getGeoTiffMeta
};
