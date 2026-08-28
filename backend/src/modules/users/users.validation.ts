import { z } from 'zod';

export const ROLES = ['super-admin', 'Admin', 'Lead', 'Member'] as const;

export const createMemberSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(ROLES),
});

export const updateMemberSchema = z
  .object({
    name: z.string().min(1).optional(),
    role: z.enum(ROLES).optional(),
    phone: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
    is_first_login: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

export const pauseSchema = z.object({
  isPaused: z.boolean(),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});
