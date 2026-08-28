import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

// Role hierarchy mirrors the frontend: super-admin > Admin > Lead > Member.
export type Role = 'super-admin' | 'Admin' | 'Lead' | 'Member';

const RANK: Record<string, number> = {
  'super-admin': 3,
  Admin: 2,
  Lead: 1,
  Member: 0,
};

/** Require the caller's role to be at least `minRole`. Assumes requireAuth ran first. */
export function requireRole(minRole: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) return next(ApiError.unauthorized());
    if ((RANK[role] ?? -1) < RANK[minRole]) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}
