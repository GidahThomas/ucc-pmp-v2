import { Router } from 'express';

import { prisma } from '@ucc/db';
import { idParamSchema, listSourceSchema } from '@ucc/shared';

import { AppError } from '../lib/errors';
import { nextPrefixedId } from '../lib/ids';
import { authRequired, requireRoles, validateBody, validateParams } from '../middleware';

const router = Router();

router.use(authRequired);

router.get('/', async (_request, response, next) => {
  try {
    const sources = await prisma.listSource.findMany({
      include: {
        parent: true,
      },
      orderBy: [{ parentId: 'asc' }, { id: 'asc' }],
    });

    response.json(sources);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles(['admin']), validateBody(listSourceSchema), async (request, response, next) => {
  try {
    const lastItem = await prisma.listSource.findFirst({ orderBy: { id: 'desc' } });
    const count = (await prisma.listSource.count()) + 100;

    const source = await prisma.listSource.create({
      data: {
        uuid: nextPrefixedId('List', lastItem?.uuid),
        listName: request.body.listName,
        category: request.body.category,
        description: request.body.description || null,
        parentId: request.body.parentId ?? null,
        code: `LIST${count}`,
        sortBy: String(count),
        createdById: request.auth!.userId,
        updatedById: request.auth!.userId,
      },
    });

    response.status(201).json(source);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRoles(['admin']), validateParams(idParamSchema), validateBody(listSourceSchema), async (request, response, next) => {
  try {
    const source = await prisma.listSource.update({
      where: { id: Number(request.params.id) },
      data: {
        listName: request.body.listName,
        category: request.body.category,
        description: request.body.description || null,
        parentId: request.body.parentId ?? null,
        updatedById: request.auth!.userId,
      },
    });

    response.json(source);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRoles(['admin']), validateParams(idParamSchema), async (request, response, next) => {
  try {
    const children = await prisma.listSource.count({ where: { parentId: Number(request.params.id) } });
    if (children > 0) {
      throw new AppError(400, 'Delete child configurations first');
    }

    await prisma.listSource.delete({ where: { id: Number(request.params.id) } });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
