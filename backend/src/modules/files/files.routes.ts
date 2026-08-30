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
//
// A file's bytes are permanently tied to its id — storeFile() only ever
// inserts a new row (a re-uploaded avatar gets a new id; nothing calls
// fileAsset.update() on `data`), so the id itself is a valid, stable ETag with
// no hashing needed. That makes the response cacheable forever rather than
// the old 1-hour window, which matters once the same handful of avatars are
// being requested by every board card, task list, and sidebar across possibly
// hundreds of concurrent sessions.
//
// The ETag check runs before touching the database: if the client already has
// this id cached, the answer is unconditionally "yes, that's still it" with
// zero query and zero bytes sent — for repeat/expired-cache visits (the
// common case at any real concurrency) this skips a bytea round trip to a
// remote database entirely.
filesRouter.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const etag = `"${req.params.id}"`;
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', etag);
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }

    const asset = await service.getFile(req.params.id);
    res.setHeader('Content-Type', asset.mime_type);
    res.setHeader('Content-Length', String(asset.size_bytes));
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
