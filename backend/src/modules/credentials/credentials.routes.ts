import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { serialize } from '../../utils/serialize.js';

// username/password are NOT NULL columns, but the UI may submit null/empty.
// Coerce null/undefined to '' so optional inputs still persist.
const bodySchema = z.object({
  project_id: z.string().uuid(),
  label: z.string().min(1),
  username: z.string().nullable().optional().transform((v) => v ?? ''),
  password: z.string().nullable().optional().transform((v) => v ?? ''),
  url: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const querySchema = z.object({ project_id: z.string().uuid().optional() });
const idParam = z.object({ id: z.string().uuid() });

export const credentialsRouter = Router();
credentialsRouter.use(requireAuth);

credentialsRouter.get(
  '/',
  validate({ query: querySchema }),
  asyncHandler(async (req, res) => {
    const projectId = req.query.project_id as string | undefined;
    const rows = await prisma.projectCredential.findMany({
      where: projectId ? { project_id: projectId } : undefined,
      orderBy: { created_at: 'asc' },
    });
    res.json(serialize(rows));
  }),
);

credentialsRouter.post(
  '/',
  validate({ body: bodySchema }),
  asyncHandler(async (req, res) => {
    const row = await prisma.projectCredential.create({ data: req.body });
    res.status(201).json(serialize(row));
  }),
);

credentialsRouter.patch(
  '/:id',
  validate({ params: idParam, body: bodySchema.partial() }),
  asyncHandler(async (req, res) => {
    const row = await prisma.projectCredential.update({ where: { id: req.params.id }, data: req.body });
    res.json(serialize(row));
  }),
);

credentialsRouter.delete(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await prisma.projectCredential.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);
