import { Router } from 'express';

import { prisma } from '@ucc/db';
import {
  countrySchema,
  districtSchema,
  idParamSchema,
  locationSchema,
  propertyLocationSchema,
  regionSchema,
  streetSchema,
} from '@ucc/shared';

import { nextPrefixedId } from '../lib/ids';
import { authRequired, requireRoles, validateBody, validateParams } from '../middleware';

const router = Router();

router.use(authRequired);

router.get('/countries', async (_request, response, next) => {
  try {
    response.json(await prisma.country.findMany({ orderBy: { countryName: 'asc' } }));
  } catch (error) {
    next(error);
  }
});

router.post('/countries', requireRoles(['admin']), validateBody(countrySchema), async (request, response, next) => {
  try {
    const lastItem = await prisma.country.findFirst({ orderBy: { id: 'desc' } });
    const record = await prisma.country.create({
      data: {
        uuid: nextPrefixedId('Cou', lastItem?.uuid),
        countryName: request.body.countryName,
        createdById: request.auth!.userId,
        updatedById: request.auth!.userId,
      },
    });

    response.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

router.put('/countries/:id', requireRoles(['admin']), validateParams(idParamSchema), validateBody(countrySchema), async (request, response, next) => {
  try {
    response.json(
      await prisma.country.update({
        where: { id: Number(request.params.id) },
        data: {
          countryName: request.body.countryName,
          updatedById: request.auth!.userId,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.delete('/countries/:id', requireRoles(['admin']), validateParams(idParamSchema), async (request, response, next) => {
  try {
    await prisma.country.delete({ where: { id: Number(request.params.id) } });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/regions', async (_request, response, next) => {
  try {
    response.json(
      await prisma.region.findMany({
        include: { country: true },
        orderBy: { name: 'asc' },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post('/regions', requireRoles(['admin']), validateBody(regionSchema), async (request, response, next) => {
  try {
    const lastItem = await prisma.region.findFirst({ orderBy: { id: 'desc' } });
    response.status(201).json(
      await prisma.region.create({
        data: {
          uuid: nextPrefixedId('Reg', lastItem?.uuid),
          name: request.body.name,
          countryId: request.body.countryId,
          createdById: request.auth!.userId,
          updatedById: request.auth!.userId,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.put('/regions/:id', requireRoles(['admin']), validateParams(idParamSchema), validateBody(regionSchema), async (request, response, next) => {
  try {
    response.json(
      await prisma.region.update({
        where: { id: Number(request.params.id) },
        data: {
          name: request.body.name,
          countryId: request.body.countryId,
          updatedById: request.auth!.userId,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.delete('/regions/:id', requireRoles(['admin']), validateParams(idParamSchema), async (request, response, next) => {
  try {
    await prisma.region.delete({ where: { id: Number(request.params.id) } });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/districts', async (_request, response, next) => {
  try {
    response.json(
      await prisma.district.findMany({
        include: { region: true },
        orderBy: { districtName: 'asc' },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post('/districts', requireRoles(['admin']), validateBody(districtSchema), async (request, response, next) => {
  try {
    const lastItem = await prisma.district.findFirst({ orderBy: { id: 'desc' } });
    response.status(201).json(
      await prisma.district.create({
        data: {
          uuid: nextPrefixedId('Dis', lastItem?.uuid),
          districtName: request.body.districtName,
          regionId: request.body.regionId,
          createdById: request.auth!.userId,
          updatedById: request.auth!.userId,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.put('/districts/:id', requireRoles(['admin']), validateParams(idParamSchema), validateBody(districtSchema), async (request, response, next) => {
  try {
    response.json(
      await prisma.district.update({
        where: { id: Number(request.params.id) },
        data: {
          districtName: request.body.districtName,
          regionId: request.body.regionId,
          updatedById: request.auth!.userId,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.delete('/districts/:id', requireRoles(['admin']), validateParams(idParamSchema), async (request, response, next) => {
  try {
    await prisma.district.delete({ where: { id: Number(request.params.id) } });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/streets', async (_request, response, next) => {
  try {
    response.json(
      await prisma.street.findMany({
        include: { region: true, district: true },
        orderBy: { streetName: 'asc' },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post('/streets', requireRoles(['admin']), validateBody(streetSchema), async (request, response, next) => {
  try {
    const lastItem = await prisma.street.findFirst({ orderBy: { id: 'desc' } });
    response.status(201).json(
      await prisma.street.create({
        data: {
          uuid: nextPrefixedId('Stre', lastItem?.uuid),
          streetName: request.body.streetName,
          regionId: request.body.regionId,
          districtId: request.body.districtId,
          createdById: request.auth!.userId,
          updatedById: request.auth!.userId,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.put('/streets/:id', requireRoles(['admin']), validateParams(idParamSchema), validateBody(streetSchema), async (request, response, next) => {
  try {
    response.json(
      await prisma.street.update({
        where: { id: Number(request.params.id) },
        data: {
          streetName: request.body.streetName,
          regionId: request.body.regionId,
          districtId: request.body.districtId,
          updatedById: request.auth!.userId,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.delete('/streets/:id', requireRoles(['admin']), validateParams(idParamSchema), async (request, response, next) => {
  try {
    await prisma.street.delete({ where: { id: Number(request.params.id) } });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/locations', async (_request, response, next) => {
  try {
    response.json(
      await prisma.location.findMany({
        include: { country: true, region: true, district: true, street: true },
        orderBy: { id: 'asc' },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post('/locations', requireRoles(['admin']), validateBody(locationSchema), async (request, response, next) => {
  try {
    const lastItem = await prisma.location.findFirst({ orderBy: { id: 'desc' } });
    response.status(201).json(
      await prisma.location.create({
        data: {
          uuid: nextPrefixedId('Loc', lastItem?.uuid),
          countryId: request.body.countryId,
          regionId: request.body.regionId,
          districtId: request.body.districtId,
          streetId: request.body.streetId,
          createdById: request.auth!.userId,
          updatedById: request.auth!.userId,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.put('/locations/:id', requireRoles(['admin']), validateParams(idParamSchema), validateBody(locationSchema), async (request, response, next) => {
  try {
    response.json(
      await prisma.location.update({
        where: { id: Number(request.params.id) },
        data: {
          countryId: request.body.countryId,
          regionId: request.body.regionId,
          districtId: request.body.districtId,
          streetId: request.body.streetId,
          updatedById: request.auth!.userId,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.delete('/locations/:id', requireRoles(['admin']), validateParams(idParamSchema), async (request, response, next) => {
  try {
    await prisma.location.delete({ where: { id: Number(request.params.id) } });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/property-locations', async (_request, response, next) => {
  try {
    response.json(
      await prisma.propertyLocation.findMany({
        include: { location: true, property: true, status: true },
        orderBy: { id: 'asc' },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post('/property-locations', requireRoles(['admin']), validateBody(propertyLocationSchema), async (request, response, next) => {
  try {
    response.status(201).json(
      await prisma.propertyLocation.create({
        data: {
          propertyId: request.body.propertyId ?? null,
          locationId: request.body.locationId ?? null,
          statusId: request.body.statusId ?? null,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.put('/property-locations/:id', requireRoles(['admin']), validateParams(idParamSchema), validateBody(propertyLocationSchema), async (request, response, next) => {
  try {
    response.json(
      await prisma.propertyLocation.update({
        where: { id: Number(request.params.id) },
        data: {
          propertyId: request.body.propertyId ?? null,
          locationId: request.body.locationId ?? null,
          statusId: request.body.statusId ?? null,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.delete('/property-locations/:id', requireRoles(['admin']), validateParams(idParamSchema), async (request, response, next) => {
  try {
    await prisma.propertyLocation.delete({ where: { id: Number(request.params.id) } });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
