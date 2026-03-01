import { Router } from 'express';

import { prisma } from '@ucc/db';
import { propertyAttributeSchema } from '@ucc/shared';

import { nextPrefixedId } from '../lib/ids';
import { authRequired, requireRoles, validateBody } from '../middleware';

const router = Router();

router.use(authRequired);

router.get('/', async (request, response, next) => {
  try {
    const propertyTypeId = request.query.propertyTypeId ? Number(request.query.propertyTypeId) : undefined;
    const attributes = await prisma.propertyAttribute.findMany({
      where: propertyTypeId ? { propertyTypeId } : undefined,
      include: {
        dataType: true,
        propertyType: true,
      },
      orderBy: { id: 'asc' },
    });

    const result = await Promise.all(
      attributes.map(async (attribute) => {
        const optionsParent = await prisma.listSource.findFirst({
          where: {
            OR: [
              { category: { equals: attribute.attributeName, mode: 'insensitive' } },
              { listName: { equals: attribute.attributeName, mode: 'insensitive' } },
            ],
            parentId: null,
          },
        });

        const options = optionsParent
          ? await prisma.listSource.findMany({
              where: { parentId: optionsParent.id },
              orderBy: { id: 'asc' },
            })
          : [];

        return {
          id: attribute.id,
          uuid: attribute.uuid,
          attributeName: attribute.attributeName,
          attributeDatatype: attribute.dataType.listName.toLowerCase(),
          propertyTypeName: attribute.propertyType?.listName ?? null,
          options,
        };
      }),
    );

    response.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles(['admin']), validateBody(propertyAttributeSchema), async (request, response, next) => {
  try {
    const lastAttribute = await prisma.propertyAttribute.findFirst({ orderBy: { id: 'desc' } });

    const attribute = await prisma.propertyAttribute.create({
      data: {
        uuid: nextPrefixedId('Attr', lastAttribute?.uuid),
        propertyTypeId: request.body.propertyTypeId ?? null,
        attributeName: request.body.attributeName,
        attributeDataTypeId: request.body.attributeDataTypeId,
        createdById: request.auth!.userId,
        updatedById: request.auth!.userId,
      },
    });

    response.status(201).json(attribute);
  } catch (error) {
    next(error);
  }
});

export default router;
