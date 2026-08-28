import type { Request, Response } from 'express';
import { z } from 'zod';
import * as statsService from './stats.service.js';

export async function getDashboardStats(req: Request, res: Response) {
  const querySchema = z.object({
    memberId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  });
  const q = querySchema.parse(req.query);

  const stats = await statsService.getDashboardStats(q.memberId, q.startDate, q.endDate);
  res.json(stats);
}

export async function getProjectsStats(req: Request, res: Response) {
  const stats = await statsService.getProjectsStats();
  res.json(stats);
}
