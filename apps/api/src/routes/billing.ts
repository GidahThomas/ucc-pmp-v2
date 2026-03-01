import { Router } from 'express';

import { prisma } from '@ucc/db';
import { billFilterSchema, idParamSchema } from '@ucc/shared';

import { authRequired, requireRoles, validateParams, validateQuery } from '../middleware';

const router = Router();

router.use(authRequired);

router.get('/bills', validateQuery(billFilterSchema), async (request, response, next) => {
  try {
    const bills = await prisma.bill.findMany({
      where:
        request.query.filter === 'all'
          ? undefined
          : request.query.filter === 'paid'
            ? { billStatus: { listName: { equals: 'Paid', mode: 'insensitive' } } }
            : { billStatus: { listName: { in: ['Pending', 'Overdue'] } } },
      include: {
        billStatus: true,
        lease: {
          include: {
            tenant: true,
            property: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    response.json(
      bills.map((bill) => ({
        ...bill,
        amount: Number(bill.amount),
      })),
    );
  } catch (error) {
    next(error);
  }
});

router.delete('/bills/:id', requireRoles(['admin', 'manager']), validateParams(idParamSchema), async (request, response, next) => {
  try {
    await prisma.bill.delete({ where: { id: Number(request.params.id) } });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/payments', async (_request, response, next) => {
  try {
    const payments = await prisma.bill.findMany({
      include: {
        billStatus: true,
        lease: {
          include: {
            tenant: true,
            property: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    response.json(
      payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    );
  } catch (error) {
    next(error);
  }
});

export default router;
