import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './users.controller.js';
import {
  createMemberSchema,
  updateMemberSchema,
  pauseSchema,
  idParamSchema,
} from './users.validation.js';

export const usersRouter = Router();

// All user routes require authentication.
usersRouter.use(requireAuth);

usersRouter.get('/', asyncHandler(controller.list));
usersRouter.get('/:id', validate({ params: idParamSchema }), asyncHandler(controller.getOne));

// Leads may invite Members (role-assignment limits enforced in the controller);
// Admin+ may invite anyone up to their own rank.
usersRouter.post(
  '/',
  requireRole('Lead'),
  validate({ body: createMemberSchema }),
  asyncHandler(controller.create),
);

// Self-service profile edits allowed; role edits / editing others gated in controller.
usersRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateMemberSchema }),
  asyncHandler(controller.update),
);

usersRouter.delete(
  '/:id',
  requireRole('Admin'),
  validate({ params: idParamSchema }),
  asyncHandler(controller.remove),
);

usersRouter.post(
  '/:id/pause',
  requireRole('Admin'),
  validate({ params: idParamSchema, body: pauseSchema }),
  asyncHandler(controller.pause),
);
