import { z } from 'zod';

export const propertyExtraDataSchema = z.object({
  propertyAttributeId: z.number().int().positive(),
  attributeAnswerId: z.number().int().positive().nullable().optional(),
  attributeAnswerText: z.string().trim().nullable().optional(),
});

export const propertySchema = z.object({
  propertyName: z.string().trim().min(1, 'Property name is required'),
  propertyTypeId: z.number().int().positive(),
  propertyStatusId: z.number().int().positive(),
  ownershipTypeId: z.number().int().positive(),
  usageTypeId: z.number().int().positive(),
  identifierCode: z.string().trim().min(1, 'Identifier code is required'),
  streetId: z.number().int().positive().nullable().optional(),
  description: z.string().trim().optional().or(z.literal('')),
  extraData: z.array(propertyExtraDataSchema).default([]),
});

export const propertyFilterSchema = z.object({
  propertyName: z.string().trim().optional(),
  ownershipTypeId: z.coerce.number().int().positive().optional(),
  propertyStatusId: z.coerce.number().int().positive().optional(),
});

export type PropertyInput = z.infer<typeof propertySchema>;
export type PropertyExtraDataInput = z.infer<typeof propertyExtraDataSchema>;
