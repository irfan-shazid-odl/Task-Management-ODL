import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// Single shared PrismaClient instance for the whole process (connection pooling).
// In dev with tsx watch, cache it on globalThis so hot-reloads don't leak clients.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProduction ? ['error'] : ['error', 'warn'],
  });

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}
