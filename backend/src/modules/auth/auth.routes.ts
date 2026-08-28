import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './auth.controller.js';
import { loginSchema, changePasswordSchema, resetPasswordSchema } from './auth.validation.js';

export const authRouter = Router();

// Public
authRouter.post('/login', validate({ body: loginSchema }), asyncHandler(controller.login));
authRouter.post(
  '/reset-password',
  validate({ body: resetPasswordSchema }),
  asyncHandler(controller.resetPassword),
);

// Authenticated
authRouter.get('/me', requireAuth, asyncHandler(controller.me));
authRouter.post(
  '/change-password',
  requireAuth,
  validate({ body: changePasswordSchema }),
  asyncHandler(controller.changePassword),
);
