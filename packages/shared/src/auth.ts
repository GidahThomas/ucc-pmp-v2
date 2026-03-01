import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(8, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/[A-Z]/, 'New password must include an uppercase letter')
      .regex(/[a-z]/, 'New password must include a lowercase letter')
      .regex(/\d/, 'New password must include a number')
      .regex(/[^A-Za-z0-9]/, 'New password must include a special character'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const authUserSchema = z.object({
  id: z.number().int().positive(),
  uuid: z.string(),
  fullName: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'technician', 'accountant', 'tenant']),
  status: z.enum(['active', 'inactive', 'blocked']),
  privileges: z.array(z.string()),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
