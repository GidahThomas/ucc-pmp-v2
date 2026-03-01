import { z } from 'zod';

import { dateStringSchema } from './common';

const leaseBaseSchema = z.object({
  propertyId: z.number().int().positive(),
  tenantId: z.number().int().positive(),
  propertyPriceId: z.number().int().positive(),
  statusId: z.number().int().positive(),
  leaseStartDate: dateStringSchema,
  leaseEndDate: dateStringSchema,
});

export const leaseSchema = leaseBaseSchema.refine((value) => value.leaseEndDate >= value.leaseStartDate, {
  path: ['leaseEndDate'],
  message: 'Lease end date must be on or after the start date',
});

export const renewLeaseSchema = leaseBaseSchema
  .omit({ propertyId: true, tenantId: true })
  .refine((value) => value.leaseEndDate >= value.leaseStartDate, {
    path: ['leaseEndDate'],
    message: 'Lease end date must be on or after the start date',
  });

export type LeaseInput = z.infer<typeof leaseSchema>;
export type RenewLeaseInput = z.infer<typeof renewLeaseSchema>;
