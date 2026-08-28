import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import * as controller from './stats.controller.js';

export const statsRouter = Router();

statsRouter.get('/dashboard', requireAuth, asyncHandler(controller.getDashboardStats));
statsRouter.get('/projects', requireAuth, asyncHandler(controller.getProjectsStats));
