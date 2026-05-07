const { z } = require('zod');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

// Product creation schema
const createProductSchema = z.object({
  body: z.object({
    name: z.string()
      .min(3, 'Product name must be at least 3 characters')
      .max(200, 'Product name cannot exceed 200 characters')
      .trim(),
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description cannot exceed 2000 characters')
      .optional(),
    category: objectIdSchema,
    sku: z.string()
      .min(3, 'SKU must be at least 3 characters')
      .max(50, 'SKU cannot exceed 50 characters')
      .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'),
    price: z.number()
      .positive('Price must be positive')
      .max(10000000, 'Price cannot exceed ₹10,000,000'),
    wholesalePrice: z.number()
      .positive('Wholesale price must be positive')
      .max(10000000, 'Wholesale price cannot exceed ₹10,000,000')
      .optional(),
    miniStockPrice: z.number()
      .positive('Mini stock price must be positive')
      .max(10000000, 'Mini stock price cannot exceed ₹10,000,000')
      .optional(),
    stock: z.number()
      .int('Stock must be an integer')
      .min(0, 'Stock cannot be negative')
      .max(1000000, 'Stock cannot exceed 1,000,000 units'),
    unit: z.string()
      .min(1, 'Unit is required')
      .max(20, 'Unit cannot exceed 20 characters'),
    // Point values for commission calculation
    rpPoints: z.number().min(0, 'RP points cannot be negative').optional(),
    ivPoints: z.number().min(0, 'IV points cannot be negative').optional(),
    svPoints: z.number().min(0, 'SV points cannot be negative').optional(),
    rvPoints: z.number().min(0, 'RV points cannot be negative').optional(),
  }),
});

// Product update schema
const updateProductSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().min(3).max(200).trim().optional(),
    description: z.string().min(10).max(2000).optional(),
    category: objectIdSchema.optional(),
    price: z.number().positive().max(10000000).optional(),
    wholesalePrice: z.number().positive().max(10000000).optional(),
    miniStockPrice: z.number().positive().max(10000000).optional(),
    stock: z.number().int().min(0).max(1000000).optional(),
    unit: z.string().min(1).max(20).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    rpPoints: z.number().min(0).optional(),
    ivPoints: z.number().min(0).optional(),
    svPoints: z.number().min(0).optional(),
    rvPoints: z.number().min(0).optional(),
  }),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
};
