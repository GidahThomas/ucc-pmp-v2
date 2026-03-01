import { Router } from 'express';
import multer from 'multer';

import { prisma } from '@ucc/db';
import { idParamSchema, leaseSchema, renewLeaseSchema, type LeaseInput, type RenewLeaseInput } from '@ucc/shared';

import { AppError } from '../lib/errors';
import { nextPrefixedId } from '../lib/ids';
import { storeFile } from '../lib/storage';
import { authRequired, requireRoles, validateParams } from '../middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authRequired);

function parseLeasePayload(rawPayload: unknown, renew = false) {
  const payload =
    typeof rawPayload === 'string'
      ? JSON.parse(rawPayload)
      : typeof rawPayload === 'object' && rawPayload
        ? rawPayload
        : {};

  const parsed = (renew ? renewLeaseSchema : leaseSchema).safeParse(payload);
  if (!parsed.success) {
    throw new AppError(400, 'Validation failed', parsed.error.flatten());
  }

  return parsed.data;
}

function parseCreateLeasePayload(rawPayload: unknown) {
  return parseLeasePayload(rawPayload, false) as LeaseInput;
}

function parseRenewLeasePayload(rawPayload: unknown) {
  return parseLeasePayload(rawPayload, true) as RenewLeaseInput;
}

function getDurationMonths(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months += end.getMonth() - start.getMonth();
  if (end.getDate() >= start.getDate()) {
    months += 1;
  }
  return Math.max(months, 1);
}

async function createLeaseBill(leaseId: number, statusId: number, amount: number, dueDate: string, userId: number) {
  const lastBill = await prisma.bill.findFirst({ orderBy: { id: 'desc' } });
  await prisma.bill.create({
    data: {
      uuid: nextPrefixedId('Bill', lastBill?.uuid),
      leaseId,
      amount,
      dueDate: new Date(dueDate),
      billStatusId: statusId,
      createdById: userId,
      updatedById: userId,
    },
  });
}

router.get('/', async (request, response, next) => {
  try {
    const where = request.auth!.role === 'tenant' ? { tenantId: request.auth!.userId } : undefined;
    const leases = await prisma.lease.findMany({
      where,
      include: {
        tenant: true,
        property: true,
        propertyPrice: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    response.json(
      leases.map((lease) => ({
        ...lease,
        propertyPrice: {
          ...lease.propertyPrice,
          unitAmount: Number(lease.propertyPrice.unitAmount),
          minMonthlyRent: lease.propertyPrice.minMonthlyRent ? Number(lease.propertyPrice.minMonthlyRent) : null,
          maxMonthlyRent: lease.propertyPrice.maxMonthlyRent ? Number(lease.propertyPrice.maxMonthlyRent) : null,
        },
      })),
    );
  } catch (error) {
    next(error);
  }
});

router.get('/tenant/:id', validateParams(idParamSchema), async (request, response, next) => {
  try {
    const leases = await prisma.lease.findMany({
      where: { tenantId: Number(request.params.id) },
      include: {
        tenant: true,
        property: true,
        propertyPrice: true,
        status: true,
      },
      orderBy: { leaseStartDate: 'desc' },
    });

    response.json(
      leases.map((lease) => ({
        ...lease,
        propertyPrice: {
          ...lease.propertyPrice,
          unitAmount: Number(lease.propertyPrice.unitAmount),
        },
      })),
    );
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRoles(['admin', 'manager']), upload.single('document'), async (request, response, next) => {
  try {
    const payload = parseCreateLeasePayload(request.body.payload);
    const overlap = await prisma.lease.findFirst({
      where: {
        propertyId: payload.propertyId,
        status: { listName: { equals: 'Active', mode: 'insensitive' } },
        leaseEndDate: { gte: new Date(payload.leaseStartDate) },
      },
    });

    if (overlap) {
      throw new AppError(400, 'This property is already leased until its current lease expires');
    }

    const price = await prisma.propertyPrice.findUnique({ where: { id: payload.propertyPriceId } });
    const pendingBillStatus = await prisma.listSource.findFirst({
      where: {
        category: 'Bill Status',
        listName: { equals: 'Pending', mode: 'insensitive' },
        parentId: { not: null },
      },
    });

    if (!price || !pendingBillStatus) {
      throw new AppError(400, 'Pricing or bill status configuration is incomplete');
    }

    const lastLease = await prisma.lease.findFirst({ orderBy: { id: 'desc' } });
    const documentUrl = request.file
      ? await storeFile({
          buffer: request.file.buffer,
          fileName: request.file.originalname,
          mimeType: request.file.mimetype,
          folder: 'leases',
        })
      : null;

    const lease = await prisma.lease.create({
      data: {
        uuid: nextPrefixedId('Lease', lastLease?.uuid),
        leaseNumber: `LEASE-${String((lastLease?.id ?? 0) + 1).padStart(4, '0')}`,
        propertyId: payload.propertyId,
        tenantId: payload.tenantId,
        propertyPriceId: payload.propertyPriceId,
        statusId: payload.statusId,
        leaseStartDate: new Date(payload.leaseStartDate),
        leaseEndDate: new Date(payload.leaseEndDate),
        durationMonths: getDurationMonths(payload.leaseStartDate, payload.leaseEndDate),
        leaseDocUrl: documentUrl,
        createdById: request.auth!.userId,
        updatedById: request.auth!.userId,
      },
    });

    await createLeaseBill(
      lease.id,
      pendingBillStatus.id,
      Number(price.unitAmount) * lease.durationMonths,
      payload.leaseStartDate,
      request.auth!.userId,
    );

    response.status(201).json(lease);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/renew', requireRoles(['admin', 'manager']), validateParams(idParamSchema), upload.single('document'), async (request, response, next) => {
  try {
    const payload = parseRenewLeasePayload(request.body.payload);
    const existingLease = await prisma.lease.findUnique({ where: { id: Number(request.params.id) } });
    if (!existingLease) {
      throw new AppError(404, 'Lease not found');
    }

    const price = await prisma.propertyPrice.findUnique({ where: { id: payload.propertyPriceId } });
    const pendingBillStatus = await prisma.listSource.findFirst({
      where: {
        category: 'Bill Status',
        listName: { equals: 'Pending', mode: 'insensitive' },
        parentId: { not: null },
      },
    });

    if (!price || !pendingBillStatus) {
      throw new AppError(400, 'Pricing or bill status configuration is incomplete');
    }

    const lastLease = await prisma.lease.findFirst({ orderBy: { id: 'desc' } });
    const documentUrl = request.file
      ? await storeFile({
          buffer: request.file.buffer,
          fileName: request.file.originalname,
          mimeType: request.file.mimetype,
          folder: 'leases',
        })
      : existingLease.leaseDocUrl;

    const lease = await prisma.lease.create({
      data: {
        uuid: nextPrefixedId('Lease', lastLease?.uuid),
        leaseNumber: `LEASE-${String((lastLease?.id ?? 0) + 1).padStart(4, '0')}`,
        propertyId: existingLease.propertyId,
        tenantId: existingLease.tenantId,
        propertyPriceId: payload.propertyPriceId,
        statusId: payload.statusId,
        leaseStartDate: new Date(payload.leaseStartDate),
        leaseEndDate: new Date(payload.leaseEndDate),
        durationMonths: getDurationMonths(payload.leaseStartDate, payload.leaseEndDate),
        leaseDocUrl: documentUrl,
        createdById: request.auth!.userId,
        updatedById: request.auth!.userId,
      },
    });

    await createLeaseBill(
      lease.id,
      pendingBillStatus.id,
      Number(price.unitAmount) * lease.durationMonths,
      payload.leaseStartDate,
      request.auth!.userId,
    );

    response.status(201).json(lease);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/terminate', requireRoles(['admin', 'manager']), validateParams(idParamSchema), async (request, response, next) => {
  try {
    const lease = await prisma.lease.findUnique({ where: { id: Number(request.params.id) } });
    if (!lease) {
      throw new AppError(404, 'Lease not found');
    }

    const terminated = await prisma.listSource.findFirst({
      where: {
        category: 'Lease Status',
        listName: { equals: 'Terminated', mode: 'insensitive' },
        parentId: { not: null },
      },
    });

    if (!terminated) {
      throw new AppError(400, 'Terminated status is not configured');
    }

    response.json(
      await prisma.lease.update({
        where: { id: lease.id },
        data: {
          statusId: terminated.id,
          updatedById: request.auth!.userId,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRoles(['admin', 'manager']), validateParams(idParamSchema), async (request, response, next) => {
  try {
    await prisma.lease.delete({ where: { id: Number(request.params.id) } });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
