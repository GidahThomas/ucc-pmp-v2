import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { env } from '../config';
import { AppError } from './errors';

type TokenPayload = {
  userId: number;
  role: string;
  privileges: string[];
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: TokenPayload, rememberMe = false) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: rememberMe ? '30d' : '12h',
  });
}

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
}

export function getBearerToken(header?: string) {
  if (!header) {
    throw new AppError(401, 'Missing Authorization header');
  }

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'Expected Bearer token');
  }

  return token;
}
