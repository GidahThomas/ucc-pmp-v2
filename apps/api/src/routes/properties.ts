import { Router } from 'express';
import multer from 'multer';

import { prisma, type Prisma } from '@ucc/db';
import { propertyFilterSchema, propertySchema } from '@ucc/shared';

import { AppError } from '../lib/errors';
import { nextPrefixedId } from '../lib/ids';
import { storeFile } from '../lib/storage';
import { authRequired, requireRoles, validateQuery } from '../middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authRequired);

function parsePropertyPayload(rawPayload: unknown) {
  const payload =
    typeof rawPayload === 'string'
      ? JSON.parse(rawPayload)
      : typeof rawPayload === 'object' && rawPayload
        ? rawPayload
        : {};

  const parsed = propertySchema.safeParse(payload);
  if (!parsed.success) {
    throw new AppError(400, 'Validation failed', parsed.error.flatten());
  }

  return parsed.data;
}

async function syncExtraData(propertyId: number, extraData: Array<{ propertyAttributeId: number; attributeAnswerId?: number | null; attributeAnswerText?: string | null }>, userId: number) {
  await prisma.propertyExtraData.deleteMany({ where: { propertyId } });

  for (const item of extraData) {
    const lastExtraData = await prisma.propertyExtraData.findFirst({ orderBy: { id: 'desc' } });
    await prisma.propertyExtraData.create({
      data: {
        uuid: nextPrefixedId('PED', lastExtraData?.uuid),
        propertyId,
        propertyAttributeId: item.propertyAttributeId,
        attributeAnswerId: item.attributeAnswerId ?? null,
        attributeAnswerText: item.attributeAnswerText ?? null,
        createdById: userId,
        updatedById: userId,
      },
    });
  }
}

router.get('/metadata', async (_request, response, next) => {
  try {
    const [listSources, streets] = await Promise.all([
      prisma.listSource.findMany({ orderBy: { id: 'asc' } }),
      prisma.street.findMany({ orderBy: { streetName: 'asc' } }),
    ]);

    const groupChildren = (category: string) => {
      const parent = listSources.find((item) => item.category === category && item.parentId === null);
      return listSources.filter((item) => item.parentId === parent?.id);
    };

    response.json({
      propertyTypes: groupChildren('Property Type'),
      ownershipTypes: groupChildren('Ownership'),
      propertyStatuses: groupChildren('Status'),
      usageTypes: groupChildren('Usage Type'),
      streets,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', validateQuery(propertyFilterSchema), async (request, response, next) => {
  try {
    const filters = request.query as {
      propertyName?: string;
      ownershipTypeId?: number;
      propertyStatusId?: number;
    };
    const where: Prisma.PropertyWhereInput = {
      propertyName: filters.propertyName ? { contains: filters.propertyName, mode: 'insensitive' } : undefined,
      ownershipTypeId: filters.ownershipTypeId,
      propertyStatusId: filters.propertyStatusId,
    };

    const properties = await prisma.property.findMany({
      where,
      include: {
        street: true,
        propertyStatus: true,
        propertyType: true,
        propertyOwnership: true,
        usageType: true,
        prices: true,
      },
      orderBy: { id: 'desc' },
    });

    response.json(
      properties.map((property) => ({
        ...property,
        prices: property.prices.map((price) => ({
          ...price,
          unitAmount: Number(price.unitAmount),
          minMonthlyRent: price.minMonthlyRent ? Number(price.minMonthlyRent) : null,
          maxMonthlyRent: price.maxMonthlyRent ? Number(price.maxMonthlyRent) : null,
        })),
      })),
    );
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (request, response, next) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: Number(request.params.id) },
      include: {
        street: true,
        propertyStatus: true,
        propertyType: true,
        propertyOwnership: true,
        usageType: true,
        prices: true,
        extraData: {
          include: {
            propertyAttribute: {
              include: {
                dataType: true,
              },
            },
            attributeAnswer: {
              include: {
                answer: true,
              },
            },
          },
        },
      },
    });

    if (!property) {
      throw new AppError(404, 'Property not found');
    }

    response.json({
      ...property,
      prices: property.prices.map((price) => ({
        ...price,
        unitAmount: Number(price.unitAmount),
        minMonthlyRent: price.minMonthlyRent ? Number(price.minMonthlyRent) : null,
        maxMonthlyRent: price.maxMonthlyRent ? Number(price.maxMonthlyRent) : null,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles(['admin', 'manager']), upload.single('document'), async (request, response, next) => {
  try {
    const payload = parsePropertyPayload(request.body.payload);
    const lastProperty = await prisma.property.findFirst({ orderBy: { id: 'desc' } });

    const documentUrl = request.file
      ? await storeFile({
          buffer: request.file.buffer,
          fileName: request.file.originalname,
          mimeType: request.file.mimetype,
          folder: 'properties',
        })
      : null;

    const property = await prisma.property.create({
      data: {
        uuid: nextPrefixedId('Prop', lastProperty?.uuid),
        propertyName: payload.propertyName,
        propertyTypeId: payload.propertyTypeId,
        propertyStatusId: payload.propertyStatusId,
        ownershipTypeId: payload.ownershipTypeId,
        usageTypeId: payload.usageTypeId,
        identifierCode: payload.identifierCode,
        streetId: payload.streetId ?? null,
        description: payload.description || null,
        documentUrl,
        createdById: request.auth!.userId,
        updatedById: request.auth!.userId,
      },
    });

    await syncExtraData(property.id, payload.extraData, request.auth!.userId);

    response.status(201).json(property);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRoles(['admin', 'manager']), upload.single('document'), async (request, response, next) => {
  try {
    const propertyId = Number(request.params.id);
    const existing = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!existing) {
      throw new AppError(404, 'Property not found');
    }

    const payload = parsePropertyPayload(request.body.payload);
    const documentUrl = request.file
      ? await storeFile({
          buffer: request.file.buffer,
          fileName: request.file.originalname,
          mimeType: request.file.mimetype,
          folder: 'properties',
        })
      : existing.documentUrl;

    const property = await prisma.property.update({
      where: { id: propertyId },
      data: {
        propertyName: payload.propertyName,
        propertyTypeId: payload.propertyTypeId,
        propertyStatusId: payload.propertyStatusId,
        ownershipTypeId: payload.ownershipTypeId,
        usageTypeId: payload.usageTypeId,
        identifierCode: payload.identifierCode,
        streetId: payload.streetId ?? null,
        description: payload.description || null,
        documentUrl,
        updatedById: request.auth!.userId,
      },
    });

    await syncExtraData(property.id, payload.extraData, request.auth!.userId);

    response.json(property);
  } catch (error) {
    next(error);
  }
});

export default router;
