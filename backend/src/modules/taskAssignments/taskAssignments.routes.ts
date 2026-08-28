import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as service from './taskAssignments.service.js';

const listQuery = z.object({
  task_ids: z.string().optional(), // comma-separated uuids
  member_id: z.string().uuid().optional(),
});

const assignBody = z.object({
  task_id: z.string().uuid(),
  member_id: z.string().uuid(),
});

const statusBody = z.object({
  task_id: z.string().uuid(),
  member_id: z.string().uuid(),
  status: z.string().min(1),
});

const replaceBody = z.object({
  assignees: z.array(
    z.object({ member_id: z.string().uuid(), status: z.string().optional() }),
  ),
});

export const taskAssignmentsRouter = Router();
taskAssignmentsRouter.use(requireAuth);

taskAssignmentsRouter.get(
  '/',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const taskIdsRaw = req.query.task_ids as string | undefined;
    res.json(
      await service.list({
        taskIds: taskIdsRaw ? taskIdsRaw.split(',').filter(Boolean) : undefined,
        memberId: req.query.member_id as string | undefined,
      }),
    );
  }),
);

taskAssignmentsRouter.post(
  '/',
  validate({ body: assignBody }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.assign(req.body.task_id, req.body.member_id));
  }),
);

taskAssignmentsRouter.patch(
  '/status',
  validate({ body: statusBody }),
  asyncHandler(async (req, res) => {
    res.json(await service.updateStatus(req.body.task_id, req.body.member_id, req.body.status));
  }),
);

taskAssignmentsRouter.delete(
  '/',
  validate({ body: assignBody }),
  asyncHandler(async (req, res) => {
    res.json(await service.unassign(req.body.task_id, req.body.member_id));
  }),
);

// Atomic bulk replace of a task's assignees.
taskAssignmentsRouter.put(
  '/task/:taskId',
  validate({ params: z.object({ taskId: z.string().uuid() }), body: replaceBody }),
  asyncHandler(async (req, res) => {
    res.json(await service.replaceForTask(req.params.taskId, req.body.assignees));
  }),
);
