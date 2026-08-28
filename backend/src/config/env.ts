import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 4000),

  databaseUrl: required('DATABASE_URL', 'postgresql://localhost:5432/opscenter?schema=public'),

  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  jwtSecret: required('JWT_SECRET', 'dev-insecure-secret-change-me'),
  // Sessions stay signed in until the user explicitly logs out; the token
  // itself just needs to outlive that — 60 days is the effective session length.
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '60d',

  superAdminEmail: process.env.SUPER_ADMIN_EMAIL ?? 'system@sys.com',
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD ?? '12345678',

  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024),
} as const;

// The system admin account is protected from deletion/pause/modification,
// mirroring the original application behavior.
export const SYSTEM_ADMIN_EMAIL = env.superAdminEmail;
