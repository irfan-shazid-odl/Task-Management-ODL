import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  // currentPassword optional: the first-login prompt changes without it
  // (the user is already authenticated), the profile page supplies it.
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6),
});
