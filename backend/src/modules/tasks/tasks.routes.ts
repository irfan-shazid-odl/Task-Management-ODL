import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as service from './tasks.service.js';

const csv = (v?: string) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined);

// Fixed option set for the task-level Category field (distinct from a
// project's own category). Kept in sync with the frontend's copy in lib/types.ts.
export const TASK_CATEGORIES = ['Automation', 'Website', 'Landing page', 'Workflow', 'Meta', 'Vibe coding', 'Research', 'Documentation', 'AI Agent', 'Other'] as const;

const listQuery = z.object({
  project_id: z.string().uuid().optional(),
  ids: z.string().optional(),
  status: z.string().optional(),
  log_date: z.string().optional(),
  log_date_lt: z.string().optional(),
  log_date_lte: z.string().optional(),
  log_date_gte: z.string().optional(),
  created_from: z.string().optional(),
  created_to: z.string().optional(),
  board_date: z.string().optional(),
  carry_over: z.coerce.boolean().optional(),
  order_by: z.enum(['created_at', 'deadline', 'id']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  include: z.string().optional(),
  count: z.coerce.boolean().optional(),
});

const taskData = z.object({
  project_id: z.string().uuid().nullable().optional(),
  description: z.string().min(1),
  status: z.string().optional(),
  priority: z.string().optional(),
  deadline: z.string().nullable().optional(),
  reference_doc_id: z.string().uuid().nullable().optional(),
  category: z.enum(TASK_CATEGORIES).nullable().optional(),
  // Manually entered hours — same shape as time_logs.hours_logged/billing_hours.
  estimated_time: z.number().nonnegative().nullable().optional(),
  log_date: z.string().optional(),
});

const createBody = z.object({
  task: taskData,
  assigneeIds: z.array(z.string().uuid()).optional(),
  anchor: z
    .object({ member_id: z.string().uuid().nullable(), log_date: z.string() })
    .nullable()
    .optional(),
});

const idParam = z.object({ id: z.string().uuid() });

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

tasksRouter.get(
  '/',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    // validate() replaces req.query with the zod-parsed result, so booleans
    // (carry_over, count) and numbers (limit, offset) are already their
    // real types here, not strings — type it accordingly rather than
    // casting to Record<string, string> and re-coercing.
    const q = req.query as unknown as z.infer<typeof listQuery>;
    const include = q.include ?? '';
    res.json(
      await service.list({
        projectId: q.project_id,
        ids: csv(q.ids),
        status: csv(q.status),
        logDate: q.log_date,
        logDateLt: q.log_date_lt,
        logDateLte: q.log_date_lte,
        logDateGte: q.log_date_gte,
        createdFrom: q.created_from,
        createdTo: q.created_to,
        boardDate: q.board_date,
        carryOver: q.carry_over === true,
        orderBy: q.order_by,
        order: q.order,
        limit: q.limit,
        offset: q.offset,
        includeProject: include.includes('project'),
        includeReferenceDoc: include.includes('reference_doc'),
        withCount: q.count === true,
      }),
    );
  }),
);

tasksRouter.post(
  '/',
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createTask(req.body));
  }),
);

tasksRouter.patch(
  '/:id',
  validate({ params: idParam, body: taskData.partial() }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateTask(req.params.id, req.body));
  }),
);

tasksRouter.delete(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    res.json(await service.deleteTask(req.params.id));
  }),
);
