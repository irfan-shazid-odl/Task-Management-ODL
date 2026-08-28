import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import * as service from './users.service.js';

export async function list(_req: Request, res: Response) {
  res.json(await service.listMembers());
}

export async function getOne(req: Request, res: Response) {
  res.json(await service.getMember(req.params.id));
}

// Which roles each rank may assign to a new account — mirrors the frontend's
// getAvailableRoles (features/users/constants.tsx). Enforced here too since the
// route only gates the minimum rank to reach this handler at all.
const ASSIGNABLE_ROLES: Record<string, string[]> = {
  'super-admin': ['super-admin', 'Admin', 'Lead', 'Member'],
  Admin: ['Lead', 'Member'],
  Lead: ['Member'],
};

export async function create(req: Request, res: Response) {
  const actor = req.user!;
  const requestedRole = req.body.role as string;

  const allowed = ASSIGNABLE_ROLES[actor.role] ?? [];
  if (!allowed.includes(requestedRole)) {
    throw ApiError.forbidden('You do not have permission to assign that role.');
  }

  // A member invited by a Lead is "under" that Lead — scopes their board/reports.
  const managed_by_id = actor.role === 'Lead' ? actor.sub : null;

  const user = await service.createMember({ ...req.body, managed_by_id });
  res.status(201).json({ user });
}

export async function update(req: Request, res: Response) {
  const actor = req.user!;
  const targetId = req.params.id;
  const isSelf = actor.sub === targetId;
  const isAdmin = actor.role === 'Admin' || actor.role === 'super-admin';

  // Only admins may edit other users or change roles.
  if (!isSelf && !isAdmin) throw ApiError.forbidden();
  if (req.body.role !== undefined && !isAdmin) {
    throw ApiError.forbidden('Only administrators can change roles');
  }

  const user = await service.updateMember(targetId, req.body);
  res.json({ user });
}

export async function remove(req: Request, res: Response) {
  res.json(await service.deleteMember(req.params.id));
}

export async function pause(req: Request, res: Response) {
  const user = await service.setPaused(req.params.id, req.body.isPaused);
  res.json({ user });
}
