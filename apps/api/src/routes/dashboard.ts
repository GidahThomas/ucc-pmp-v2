import { Router } from 'express';

import { prisma } from '@ucc/db';

import { authRequired } from '../middleware';

const router = Router();

router.get('/summary', authRequired, async (_request, response, next) => {
  try {
    const [totalProperties, propertyTypes, leases] = await Promise.all([
      prisma.property.count(),
      prisma.property.groupBy({
        by: ['propertyTypeId'],
        _count: { _all: true },
      }),
      prisma.lease.findMany({
        include: {
          tenant: true,
          property: true,
          propertyPrice: true,
        },
      }),
    ]);

    const usageBuckets = await prisma.listSource.findMany({
      where: {
        category: 'Usage Type',
        parentId: { not: null },
      },
    });

    const usageCounts = await Promise.all(
      usageBuckets.map(async (item) => ({
        label: item.listName,
        total: await prisma.property.count({ where: { usageTypeId: item.id } }),
      })),
    );

    const typeLabels = await prisma.listSource.findMany({
      where: { id: { in: propertyTypes.map((item) => item.propertyTypeId) } },
    });

    response.json({
      totalProperties,
      usageCounts,
      analytics: propertyTypes.map((item) => ({
        typeName: typeLabels.find((label) => label.id === item.propertyTypeId)?.listName ?? `Type ${item.propertyTypeId}`,
        total: item._count._all,
      })),
      translationReport: leases.map((lease) => ({
        leaseId: lease.id,
        tenantName: lease.tenant.fullName,
        propertyName: lease.property.propertyName,
        price: Number(lease.propertyPrice.unitAmount),
        startDate: lease.leaseStartDate,
        endDate: lease.leaseEndDate,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
