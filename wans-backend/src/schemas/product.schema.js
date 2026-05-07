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
      .max(2000, 'Description cannot exceed 2000 characters')
      .optional()
      .or(z.literal('')),
    category: z.string()
      .min(2, 'Category must be at least 2 characters')
      .max(100, 'Category cannot exceed 100 characters')
      .trim(),
    sku: z.string()
      .min(3, 'SKU must be at least 3 characters')
      .max(50, 'SKU cannot exceed 50 characters')
      .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'),
    actualPrice: z.string().or(z.number()).transform(val => parseFloat(val)),
    mrp: z.string().or(z.number()).transform(val => parseFloat(val)),  // Sell Price (required)
    price: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),  // Auto-filled from mrp
    taxRate: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    rp: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    sv: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    rv: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    iv: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    wholesalePrice: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    miniStockPrice: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    unit: z.string()
      .min(1, 'Unit is required')
      .max(20, 'Unit cannot exceed 20 characters')
      .optional(),
    unitQuantity: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    brand: z.string().max(100).optional().or(z.literal('')),
    weight: z.string().max(50).optional().or(z.literal('')),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    ingredients: z.string().max(5000).optional().or(z.literal('')),
    howToUse: z.string().max(5000).optional().or(z.literal('')),
    benefits: z.string().max(5000).optional().or(z.literal('')),
    dosage: z.string().max(2000).optional().or(z.literal('')),
    disclaimer: z.string().max(2000).optional().or(z.literal('')),
  }),
});

// Product update schema
const updateProductSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().min(3).max(200).trim().optional(),
    description: z.string().max(2000).optional().or(z.literal('')),
    category: z.string().min(2).max(100).trim().optional(),
    actualPrice: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    mrp: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),  // Sell Price
    price: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),  // Auto-filled from mrp
    taxRate: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    rp: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    sv: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    rv: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    iv: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    wholesalePrice: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    miniStockPrice: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    unit: z.string().min(1).max(20).optional(),
    unitQuantity: z.string().or(z.number()).transform(val => parseFloat(val)).optional(),
    brand: z.string().max(100).optional().or(z.literal('')),
    weight: z.string().max(50).optional().or(z.literal('')),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    ingredients: z.string().max(5000).optional().or(z.literal('')),
    howToUse: z.string().max(5000).optional().or(z.literal('')),
    benefits: z.string().max(5000).optional().or(z.literal('')),
    dosage: z.string().max(2000).optional().or(z.literal('')),
    disclaimer: z.string().max(2000).optional().or(z.literal('')),
    clearImage: z.string().optional(),
  }),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
};
