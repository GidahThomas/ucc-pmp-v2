import { z } from 'zod';

export const roleSchema = z.enum(['admin', 'manager', 'technician', 'accountant', 'tenant']);
export const statusSchema = z.enum(['active', 'inactive', 'blocked']);

export const userPrivileges = ['create', 'edit', 'delete', 'assign', 'view', 'manage'] as const;
export const privilegeSchema = z.enum(userPrivileges);

export const userBaseSchema = z.object({
  fullName: z.string().trim().min(3, 'Full name is required'),
  email: z.string().trim().email('A valid email is required'),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  nationalId: z.string().trim().max(100).optional().or(z.literal('')),
  nationality: z.string().trim().max(100).optional().or(z.literal('')),
  occupation: z.string().trim().max(100).optional().or(z.literal('')),
  role: roleSchema.default('tenant'),
  status: statusSchema.default('active'),
  privileges: z.array(privilegeSchema).default([]),
});

export const createUserSchema = userBaseSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateUserSchema = userBaseSchema.extend({
  password: z.string().min(8).optional().or(z.literal('')),
});

export const userFilterSchema = z.object({
  filter: z.enum(['all', 'admin', 'manager', 'tenant']).default('all'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
