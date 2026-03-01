import { z } from 'zod';

export const countrySchema = z.object({
  countryName: z.string().trim().min(1, 'Country name is required'),
});

export const regionSchema = z.object({
  name: z.string().trim().min(1, 'Region name is required'),
  countryId: z.number().int().positive(),
});

export const districtSchema = z.object({
  districtName: z.string().trim().min(1, 'District name is required'),
  regionId: z.number().int().positive(),
});

export const streetSchema = z.object({
  streetName: z.string().trim().min(1, 'Street name is required'),
  regionId: z.number().int().positive(),
  districtId: z.number().int().positive(),
});

export const locationSchema = z.object({
  countryId: z.number().int().positive(),
  regionId: z.number().int().positive(),
  districtId: z.number().int().positive(),
  streetId: z.number().int().positive(),
});

export const propertyLocationSchema = z.object({
  propertyId: z.number().int().positive().nullable().optional(),
  locationId: z.number().int().positive().nullable().optional(),
  statusId: z.number().int().positive().nullable().optional(),
});

export type CountryInput = z.infer<typeof countrySchema>;
export type RegionInput = z.infer<typeof regionSchema>;
export type DistrictInput = z.infer<typeof districtSchema>;
export type StreetInput = z.infer<typeof streetSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
export type PropertyLocationInput = z.infer<typeof propertyLocationSchema>;
