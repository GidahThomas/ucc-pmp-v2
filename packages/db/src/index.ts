import { PrismaClient } from '@prisma/client';

declare global {
  var __uccPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__uccPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__uccPrisma__ = prisma;
}

export type { Prisma } from '@prisma/client';
