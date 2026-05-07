const { z } = require('zod');

// MongoDB ObjectId validation
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

// Order creation schema
const createOrderSchema = z.object({
  body: z.object({
    productId: objectIdSchema,
    quantity: z.number()
      .int('Quantity must be an integer')
      .positive('Quantity must be positive')
      .max(100000, 'Quantity cannot exceed 100,000 units'),
    buyerType: z.enum(['WHOLESALE', 'MINI_STOCK', 'CUSTOMER']),
    sellerType: z.enum(['COMPANY', 'WHOLESALE', 'MINI_STOCK']).optional(),
    sellerId: objectIdSchema.optional(),
    source: z.string().optional(),
    region: z.string().optional(),
    deliveryAddress: z.object({
      shopName: z.string().min(1, 'Shop name is required'),
      name: z.string().min(1, 'Contact person name is required'),
      phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
      street: z.string().min(1, 'Street address is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      pinCode: z.string().min(1, 'Pin code is required'),
      landmark: z.string().nullable().optional(),
    }).optional(),
    advisorCode: z.string()
      .regex(/^[A-Z]{3}-\d{4}-\d{4}$/, 'Invalid advisor code format (e.g., ADV-2026-0001)')
      .optional(),
    farmerId: objectIdSchema.optional(),
    paymentMethod: z.enum(['COD', 'ONLINE', 'UPI']).optional(),
  }),
});

// Order update schema
const updateOrderStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  }),
});

// Payment verification schema
const verifyPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1, 'Razorpay order ID is required'),
    razorpay_payment_id: z.string().min(1, 'Razorpay payment ID is required'),
    razorpay_signature: z.string().min(1, 'Razorpay signature is required'),
    orderId: objectIdSchema,
  }),
});

// POS Sale schema (Mini Stock → Customer)
const posOrderSchema = z.object({
  body: z.object({
    farmerName: z.string().min(1, 'Customer name is required'),
    farmerPhone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
    farmerLocation: z.string().min(1, 'Location is required'),
    advisorCode: z.string()
      .regex(/^[A-Z]{3}-\d{4}-\d{4}$/, 'Invalid advisor code format')
      .optional(),
    discount: z.number().min(0).max(100).optional(),
    paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'ONLINE']),
    items: z.array(
      z.object({
        productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
        quantity: z.number().int().positive().max(100000),
      })
    ).min(1, 'At least one item is required'),
  }),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  verifyPaymentSchema,
  posOrderSchema,
};
