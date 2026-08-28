import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as service from './vault.service.js';

const bodySchema = z.object({
  title: z.string().min(1),
  username: z.string().optional(),
  encrypted_password: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
  folder: z.string().optional(),
});

const idParam = z.object({ id: z.string().uuid() });

export const vaultRouter = Router();
vaultRouter.use(requireAuth);

vaultRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await service.listForMember(req.user!.sub));
  }),
);

vaultRouter.post(
  '/',
  validate({ body: bodySchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createForMember(req.user!.sub, req.body));
  }),
);

vaultRouter.patch(
  '/:id',
  validate({ params: idParam, body: bodySchema.partial() }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateForMember(req.params.id, req.user!.sub, req.body));
  }),
);

vaultRouter.delete(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    res.json(await service.deleteForMember(req.params.id, req.user!.sub));
  }),
);
