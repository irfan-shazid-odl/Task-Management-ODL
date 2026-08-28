import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { serialize } from '../../utils/serialize.js';

const bodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  amount: z.number().nonnegative().optional(),
  status: z.string().optional(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
  is_free_trial: z.boolean().optional(),
  trial_expiration_date: z.string().nullable().optional(),
  subscribed_by: z.string().nullable().optional(),
});

const idParam = z.object({ id: z.string().uuid() });

export const subscriptionsRouter = Router();
subscriptionsRouter.use(requireAuth);

subscriptionsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.subscription.findMany({ orderBy: { created_at: 'desc' } });
    res.json(serialize(rows));
  }),
);

subscriptionsRouter.post(
  '/',
  validate({ body: bodySchema }),
  asyncHandler(async (req, res) => {
    const row = await prisma.subscription.create({ data: req.body });
    res.status(201).json(serialize(row));
  }),
);

subscriptionsRouter.patch(
  '/:id',
  validate({ params: idParam, body: bodySchema.partial() }),
  asyncHandler(async (req, res) => {
    const row = await prisma.subscription.update({ where: { id: req.params.id }, data: req.body });
    res.json(serialize(row));
  }),
);

subscriptionsRouter.delete(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await prisma.subscription.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);
