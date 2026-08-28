import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Route not found' });
}

// Central error translator: turns thrown errors into consistent JSON.
// The response shape `{ error: string }` matches what the frontend expects.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  let status = 500;
  let message = 'Internal Server Error';

  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        status = 409;
        message = 'A record with that value already exists';
        break;
      case 'P2025':
        status = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        status = 400;
        message = 'Related record constraint failed';
        break;
      default:
        status = 400;
        message = 'Database request error';
    }
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (status >= 500) {
    // Log server-side failures for diagnosis.
    console.error('[error]', err);
  }

  res.status(status).json({
    error: message,
    ...(env.isProduction ? {} : { stack: err instanceof Error ? err.stack : undefined }),
  });
}
