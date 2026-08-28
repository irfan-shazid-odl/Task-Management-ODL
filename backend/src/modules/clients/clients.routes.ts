import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { serialize } from '../../utils/serialize.js';

const bodySchema = z.object({
  name: z.string().min(1),
  contact_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  status: z.enum(['Active', 'Inactive', 'Lead']).optional(),
  contacted_by: z.string().nullable().optional(),
});

const idParam = z.object({ id: z.string().uuid() });

export const clientsRouter = Router();
clientsRouter.use(requireAuth);

clientsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.client.findMany({ orderBy: { created_at: 'desc' } });
    res.json(serialize(rows));
  }),
);

clientsRouter.post(
  '/',
  validate({ body: bodySchema }),
  asyncHandler(async (req, res) => {
    const row = await prisma.client.create({ data: req.body });
    res.status(201).json(serialize(row));
  }),
);

clientsRouter.patch(
  '/:id',
  validate({ params: idParam, body: bodySchema.partial() }),
  asyncHandler(async (req, res) => {
    const row = await prisma.client.update({ where: { id: req.params.id }, data: req.body });
    res.json(serialize(row));
  }),
);

clientsRouter.delete(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await prisma.client.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);
