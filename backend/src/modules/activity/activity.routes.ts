import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { serialize } from '../../utils/serialize.js';

const createSchema = z.object({
  project_id: z.string().uuid().nullable().optional(),
  member_id: z.string().uuid().nullable().optional(),
  action_type: z.string().min(1),
  description: z.string().min(1),
});

const querySchema = z.object({
  project_id: z.string().uuid().optional(),
  member_id: z.string().uuid().optional(),
  created_from: z.string().optional(),
  created_to: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

export const activityRouter = Router();
activityRouter.use(requireAuth);

// List with member + project embedded (covers dashboard, project detail, admin activity).
activityRouter.get(
  '/',
  validate({ query: querySchema }),
  asyncHandler(async (req, res) => {
    const projectId = req.query.project_id as string | undefined;
    const memberId = req.query.member_id as string | undefined;
    const createdFrom = req.query.created_from as string | undefined;
    const createdTo = req.query.created_to as string | undefined;
    // Default to a bounded page when the caller doesn't ask for a specific
    // amount — without this, an unbounded `take` scans/returns the entire
    // (ever-growing) activity log on every request.
    const limit = req.query.limit ? Number(req.query.limit) : 500;
    const rows = await prisma.activityLog.findMany({
      where: {
        ...(projectId ? { project_id: projectId } : {}),
        ...(memberId ? { member_id: memberId } : {}),
        ...(createdFrom || createdTo
          ? {
              created_at: {
                ...(createdFrom ? { gte: new Date(createdFrom) } : {}),
                ...(createdTo ? { lte: new Date(createdTo) } : {}),
              },
            }
          : {}),
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        member: { select: { id: true, name: true, avatar_url: true, role: true } },
        project: { select: { id: true, name: true } },
      },
    });
    res.json(serialize(rows));
  }),
);

activityRouter.post(
  '/',
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    // Default member to the authenticated user when not supplied.
    const member_id = req.body.member_id ?? req.user!.sub;
    const row = await prisma.activityLog.create({
      data: { ...req.body, member_id },
    });
    res.status(201).json(serialize(row));
  }),
);
