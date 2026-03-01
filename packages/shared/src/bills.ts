import { z } from 'zod';

export const billFilterSchema = z.object({
  filter: z.enum(['all', 'paid', 'unpaid']).default('all'),
});

export type BillFilter = z.infer<typeof billFilterSchema>;
