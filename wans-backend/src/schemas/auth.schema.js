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

// Registration schema — matches what the public /register endpoint accepts
const registerSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    // email is NOT sent by the frontend — it's auto-generated server-side from phone
    email: z.string().email().optional(),
    phone: z.string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number too long')
      .optional(),
    password: z.string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password too long'),
    role: z.enum([
      'ADMIN', 'STATE_HEAD', 'ZONAL_MANAGER', 'AREA_MANAGER',
      'DO_MANAGER', 'ADVISOR', 'WHOLESALE', 'MINI_STOCK', 'CUSTOMER'
    ]).optional(),
    // WHOLESALE / MINI_STOCK fields
    shopName: z.string().max(200).optional(),
    // CUSTOMER field
    location: z.string().max(200).optional(),
    // ADVISOR referral
    referralCode: z.string().max(50).optional(),
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
