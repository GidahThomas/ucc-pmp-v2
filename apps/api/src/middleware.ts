import type { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

import { getBearerToken, verifyAccessToken } from './lib/auth';
import { asErrorPayload, AppError } from './lib/errors';

export function authRequired(request: Request, _response: Response, next: NextFunction) {
  try {
    const token = getBearerToken(request.headers.authorization);
    request.auth = verifyAccessToken(token);
    next();
  } catch (error) {
    const payload = asErrorPayload(error);
    next(new AppError(payload.statusCode, payload.body.error.message, payload.body.error.details));
  }
}

export function requireRoles(roles: string[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.auth || !roles.includes(request.auth.role)) {
      next(new AppError(403, 'You do not have permission to perform this action'));
      return;
    }

    next();
  };
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      next(new AppError(400, 'Validation failed', parsed.error.flatten()));
      return;
    }

    request.body = parsed.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const parsed = schema.safeParse(request.query);
    if (!parsed.success) {
      next(new AppError(400, 'Validation failed', parsed.error.flatten()));
      return;
    }

    request.query = parsed.data as Request['query'];
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const parsed = schema.safeParse(request.params);
    if (!parsed.success) {
      next(new AppError(400, 'Validation failed', parsed.error.flatten()));
      return;
    }

    request.params = parsed.data as Request['params'];
    next();
  };
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  const payload = asErrorPayload(error);
  response.status(payload.statusCode).json(payload.body);
}
