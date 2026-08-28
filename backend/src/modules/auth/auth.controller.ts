import type { Request, Response } from 'express';
import * as service from './auth.service.js';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  res.json(await service.login(email, password));
}

export async function me(req: Request, res: Response) {
  res.json(await service.me(req.user!.sub));
}

export async function changePassword(req: Request, res: Response) {
  const { newPassword, currentPassword } = req.body;
  res.json(await service.changePassword(req.user!.sub, newPassword, currentPassword));
}

export async function resetPassword(req: Request, res: Response) {
  const { email, newPassword } = req.body;
  res.json(await service.resetPasswordByEmail(email, newPassword));
}
