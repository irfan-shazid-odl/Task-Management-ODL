import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as service from './projects.service.js';

const listQuery = z.object({
  include: z.string().optional(), // 'lead,client'
  order_by: z.enum(['sort_order', 'name', 'created_at']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  count: z.coerce.boolean().optional(),
});

const projectData = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  project_lead_id: z.string().uuid().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  client_name: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  priority: z.string().nullable().optional(),
  project_type: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  brief: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
});

const reorderBody = z.object({
  updates: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int() })),
});

const hoursBody = z.object({
  hours_logged: z.number(),
  billing_hours: z.number(),
  log_date: z.string(),
});

const idParam = z.object({ id: z.string().uuid() });

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

projectsRouter.get(
  '/',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    // validate() replaces req.query with the zod-parsed result, so `count`
    // is already a real boolean here, not the string 'true'/'1'.
    const q = req.query as unknown as z.infer<typeof listQuery>;
    if (q.count === true) {
      res.json(await service.count());
      return;
    }
    const include = q.include ?? '';
    res.json(
      await service.list({
        includeLead: include.includes('lead'),
        includeClient: include.includes('client'),
        orderBy: q.order_by,
        order: q.order,
      }),
    );
  }),
);

projectsRouter.get(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    res.json(await service.getById(req.params.id));
  }),
);

projectsRouter.post(
  '/',
  validate({ body: projectData }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.create(req.body));
  }),
);

// Bulk reorder must be declared before '/:id' style routes that could shadow it.
projectsRouter.post(
  '/reorder',
  validate({ body: reorderBody }),
  asyncHandler(async (req, res) => {
    res.json(await service.reorder(req.body.updates));
  }),
);

projectsRouter.patch(
  '/:id',
  validate({ params: idParam, body: projectData.partial() }),
  asyncHandler(async (req, res) => {
    res.json(await service.update(req.params.id, req.body));
  }),
);

projectsRouter.put(
  '/:id/hours',
  validate({ params: idParam, body: hoursBody }),
  asyncHandler(async (req, res) => {
    res.json(await service.overrideHours(req.params.id, req.body));
  }),
);

projectsRouter.delete(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    res.json(await service.remove(req.params.id));
  }),
);
