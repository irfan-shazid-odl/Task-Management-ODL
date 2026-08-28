import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as service from './timeLogs.service.js';

const listQuery = z.object({
  task_ids: z.string().optional(),
  member_id: z.string().uuid().optional(),
  log_date_gte: z.string().optional(),
  log_date_lte: z.string().optional(),
  include: z.string().optional(), // 'task.project'
});

const createBody = z.object({
  task_id: z.string().uuid(),
  member_id: z.string().uuid().nullable().optional(),
  hours_logged: z.number(),
  billing_hours: z.number().optional(),
  log_date: z.string(),
});

const updateBody = z.object({
  log_date: z.string().optional(),
  hours_logged: z.number().optional(),
  billing_hours: z.number().optional(),
});

export const timeLogsRouter = Router();
timeLogsRouter.use(requireAuth);

timeLogsRouter.get(
  '/',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const taskIdsRaw = req.query.task_ids as string | undefined;
    const include = (req.query.include as string | undefined) ?? '';
    res.json(
      await service.list({
        taskIds: taskIdsRaw ? taskIdsRaw.split(',').filter(Boolean) : undefined,
        memberId: req.query.member_id as string | undefined,
        logDateGte: req.query.log_date_gte as string | undefined,
        logDateLte: req.query.log_date_lte as string | undefined,
        includeTaskProject: include.includes('task.project'),
      }),
    );
  }),
);

timeLogsRouter.get(
  '/latest',
  validate({ query: z.object({ task_id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    res.json(await service.latestForTask(req.query.task_id as string));
  }),
);

timeLogsRouter.post(
  '/',
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.create(req.body));
  }),
);

timeLogsRouter.patch(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }), body: updateBody }),
  asyncHandler(async (req, res) => {
    res.json(await service.update(req.params.id, req.body));
  }),
);
