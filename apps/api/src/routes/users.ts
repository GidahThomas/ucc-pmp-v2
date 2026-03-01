import { Router } from 'express';

import { prisma, type Prisma } from '@ucc/db';
import { createUserSchema, idParamSchema, updateUserSchema, userFilterSchema } from '@ucc/shared';
import { UserRole } from '@prisma/client';

import { hashPassword } from '../lib/auth';
import { AppError } from '../lib/errors';
import { nextPrefixedId } from '../lib/ids';
import { authRequired, requireRoles, validateBody, validateParams, validateQuery } from '../middleware';

const router = Router();

router.use(authRequired);

router.get('/', validateQuery(userFilterSchema), async (request, response, next) => {
  try {
    const filter = request.query.filter as UserRole | 'all' | undefined;
    const where: Prisma.UserWhereInput | undefined =
      request.auth!.role === 'manager'
        ? { role: 'tenant' as const }
        : !filter || filter === 'all'
          ? undefined
          : { role: filter };

    const users = await prisma.user.findMany({
      where,
      orderBy: { id: 'desc' },
    });

    response.json(users);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles(['admin', 'manager']), validateBody(createUserSchema), async (request, response, next) => {
  try {
    if (request.auth!.role === 'manager' && request.body.role !== 'tenant') {
      throw new AppError(403, 'Managers can only create tenant accounts');
    }

    const lastUser = await prisma.user.findFirst({ orderBy: { id: 'desc' } });
    const user = await prisma.user.create({
      data: {
        uuid: nextPrefixedId('User', lastUser?.uuid),
        fullName: request.body.fullName,
        email: request.body.email,
        passwordHash: await hashPassword(request.body.password),
        phone: request.body.phone || null,
        nationalId: request.body.nationalId || null,
        nationality: request.body.nationality || null,
        occupation: request.body.occupation || null,
        role: request.body.role,
        status: request.body.status,
        privileges: request.body.privileges,
        createdById: request.auth!.userId,
        updatedById: request.auth!.userId,
      },
    });

    response.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRoles(['admin', 'manager']), validateParams(idParamSchema), validateBody(updateUserSchema), async (request, response, next) => {
  try {
    const current = await prisma.user.findUnique({ where: { id: Number(request.params.id) } });
    if (!current) {
      throw new AppError(404, 'User not found');
    }

    if (request.auth!.role === 'manager' && (current.role !== 'tenant' || request.body.role !== 'tenant')) {
      throw new AppError(403, 'Managers can only manage tenant accounts');
    }

    const user = await prisma.user.update({
      where: { id: current.id },
      data: {
        fullName: request.body.fullName,
        email: request.body.email,
        phone: request.body.phone || null,
        nationalId: request.body.nationalId || null,
        nationality: request.body.nationality || null,
        occupation: request.body.occupation || null,
        role: request.body.role,
        status: request.body.status,
        privileges: request.body.privileges,
        passwordHash: request.body.password ? await hashPassword(request.body.password) : undefined,
        updatedById: request.auth!.userId,
      },
    });

    response.json(user);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRoles(['admin']), validateParams(idParamSchema), async (request, response, next) => {
  try {
    await prisma.user.delete({ where: { id: Number(request.params.id) } });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
