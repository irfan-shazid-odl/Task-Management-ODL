import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import * as service from './files.service.js';

// Files are held in memory then written to Postgres (bytea). No disk, no S3.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes },
});

export const filesRouter = Router();

// Upload a file (e.g. avatar). Returns the asset id + a servable url path.
filesRouter.post(
  '/',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('No file provided');
    const kind = typeof req.body.kind === 'string' ? req.body.kind : 'attachment';
    const asset = await service.storeFile({
      ownerId: req.user?.sub,
      kind,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      data: req.file.buffer,
    });
    res.status(201).json({ ...asset, url: `/api/files/${asset.id}` });
  }),
);

// Stream a stored file. optionalAuth so <img src> can load it without headers.
filesRouter.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const asset = await service.getFile(req.params.id);
    res.setHeader('Content-Type', asset.mime_type);
    res.setHeader('Content-Length', String(asset.size_bytes));
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(Buffer.from(asset.data));
  }),
);

filesRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await service.deleteFile(req.params.id));
  }),
);
