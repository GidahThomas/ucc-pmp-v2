import { z } from 'zod';

export const propertyPriceSchema = z.object({
  propertyId: z.number().int().positive(),
  priceTypeId: z.number().int().positive(),
  unitAmount: z.coerce.number().positive('Unit amount must be positive'),
  period: z.string().trim().min(1, 'Period is required'),
  minMonthlyRent: z.coerce.number().nonnegative().nullable().optional(),
  maxMonthlyRent: z.coerce.number().nonnegative().nullable().optional(),
});

export type PropertyPriceInput = z.infer<typeof propertyPriceSchema>;
