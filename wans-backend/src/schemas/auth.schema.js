const { z } = require('zod');

// Login schema
const loginSchema = z.object({
  body: z.object({
    identifier: z.string()
      .min(3, 'Email, phone, or employee code is required')
      .max(100, 'Identifier too long'),
    password: z.string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password too long'),
  }),
});

// Registration schema
const registerSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    email: z.string()
      .email('Invalid email format')
      .toLowerCase(),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    role: z.enum([
      'ADMIN', 'STATE_HEAD', 'ZONAL_MANAGER', 'AREA_MANAGER',
      'DO_MANAGER', 'ADVISOR', 'WHOLESALE', 'MINI_STOCK', 'CUSTOMER'
    ]),
    phone: z.string()
      .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
      .optional(),
    region: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    parentId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent ID format')
      .optional(),
  }),
});

// Password change schema
const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(8, 'New password must be at least 8 characters')
      .max(100, 'Password too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
});

module.exports = {
  loginSchema,
  registerSchema,
  changePasswordSchema,
};
