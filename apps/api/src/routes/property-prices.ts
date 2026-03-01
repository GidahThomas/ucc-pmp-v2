import { Router } from 'express';

import { prisma } from '@ucc/db';
import { idParamSchema, propertyPriceSchema } from '@ucc/shared';

import { nextPrefixedId } from '../lib/ids';
import { authRequired, requireRoles, validateBody, validateParams } from '../middleware';

const router = Router();

router.use(authRequired);

router.get('/', async (_request, response, next) => {
  try {
    const prices = await prisma.propertyPrice.findMany({
      include: {
        property: true,
        priceType: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    response.json(
      prices.map((price) => ({
        ...price,
        unitAmount: Number(price.unitAmount),
        minMonthlyRent: price.minMonthlyRent ? Number(price.minMonthlyRent) : null,
        maxMonthlyRent: price.maxMonthlyRent ? Number(price.maxMonthlyRent) : null,
      })),
    );
  } catch (error) {
    next(error);
  }
});

router.get('/property/:propertyId', async (request, response, next) => {
  try {
    const propertyId = Number(request.params.propertyId);
    const prices = await prisma.propertyPrice.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });

    response.json(
      prices.map((price) => ({
        id: price.id,
        unitAmount: Number(price.unitAmount),
        period: price.period,
      })),
    );
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles(['admin']), validateBody(propertyPriceSchema), async (request, response, next) => {
  try {
    const lastPrice = await prisma.propertyPrice.findFirst({ orderBy: { id: 'desc' } });
    const price = await prisma.propertyPrice.create({
      data: {
        uuid: nextPrefixedId('Price', lastPrice?.uuid),
        propertyId: request.body.propertyId,
        priceTypeId: request.body.priceTypeId,
        unitAmount: request.body.unitAmount,
        period: request.body.period,
        minMonthlyRent: request.body.minMonthlyRent ?? null,
        maxMonthlyRent: request.body.maxMonthlyRent ?? null,
        createdById: request.auth!.userId,
        updatedById: request.auth!.userId,
      },
    });

    response.status(201).json({
      ...price,
      unitAmount: Number(price.unitAmount),
      minMonthlyRent: price.minMonthlyRent ? Number(price.minMonthlyRent) : null,
      maxMonthlyRent: price.maxMonthlyRent ? Number(price.maxMonthlyRent) : null,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRoles(['admin']), validateParams(idParamSchema), validateBody(propertyPriceSchema), async (request, response, next) => {
  try {
    const price = await prisma.propertyPrice.update({
      where: { id: Number(request.params.id) },
      data: {
        propertyId: request.body.propertyId,
        priceTypeId: request.body.priceTypeId,
        unitAmount: request.body.unitAmount,
        period: request.body.period,
        minMonthlyRent: request.body.minMonthlyRent ?? null,
        maxMonthlyRent: request.body.maxMonthlyRent ?? null,
        updatedById: request.auth!.userId,
      },
    });

    response.json({
      ...price,
      unitAmount: Number(price.unitAmount),
      minMonthlyRent: price.minMonthlyRent ? Number(price.minMonthlyRent) : null,
      maxMonthlyRent: price.maxMonthlyRent ? Number(price.maxMonthlyRent) : null,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRoles(['admin']), validateParams(idParamSchema), async (request, response, next) => {
  try {
    await prisma.propertyPrice.delete({ where: { id: Number(request.params.id) } });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
