import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { serialize } from '../../utils/serialize.js';

const DOC_TYPES = ['Brief', 'Spec', 'Design', 'Contract', 'Link', 'Other'] as const;

const bodySchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1),
  url: z.string().min(1),
  doc_type: z.enum(DOC_TYPES),
});

const querySchema = z.object({
  project_id: z.string().uuid().optional(),
  ids: z.string().optional(), // comma-separated uuids for batch resolution
});
const idParam = z.object({ id: z.string().uuid() });

export const documentsRouter = Router();
documentsRouter.use(requireAuth);

documentsRouter.get(
  '/',
  validate({ query: querySchema }),
  asyncHandler(async (req, res) => {
    const projectId = req.query.project_id as string | undefined;
    const idsRaw = req.query.ids as string | undefined;
    const ids = idsRaw ? idsRaw.split(',').filter(Boolean) : undefined;
    const rows = await prisma.projectDocument.findMany({
      where: {
        ...(projectId ? { project_id: projectId } : {}),
        ...(ids ? { id: { in: ids } } : {}),
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(serialize(rows));
  }),
);

documentsRouter.post(
  '/',
  validate({ body: bodySchema }),
  asyncHandler(async (req, res) => {
    const row = await prisma.projectDocument.create({ data: req.body });
    res.status(201).json(serialize(row));
  }),
);

documentsRouter.patch(
  '/:id',
  validate({ params: idParam, body: bodySchema.partial() }),
  asyncHandler(async (req, res) => {
    const row = await prisma.projectDocument.update({ where: { id: req.params.id }, data: req.body });
    res.json(serialize(row));
  }),
);

documentsRouter.delete(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await prisma.projectDocument.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);
