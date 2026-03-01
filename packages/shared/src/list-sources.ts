import { z } from 'zod';

export const listSourceSchema = z.object({
  listName: z.string().trim().min(1, 'List name is required'),
  category: z.string().trim().min(1, 'Category is required'),
  description: z.string().trim().optional().or(z.literal('')),
  parentId: z.number().int().positive().nullable().optional(),
});

export const propertyAttributeSchema = z.object({
  propertyTypeId: z.number().int().positive().nullable().optional(),
  attributeName: z.string().trim().min(1, 'Attribute name is required'),
  attributeDataTypeId: z.number().int().positive(),
});

export type ListSourceInput = z.infer<typeof listSourceSchema>;
export type PropertyAttributeInput = z.infer<typeof propertyAttributeSchema>;
