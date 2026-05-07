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
    price: z.number()
      .positive('Price must be positive')
      .max(10000000, 'Price cannot exceed ₹10,000,000'),
    advisorCode: z.string()
      .regex(/^[A-Z]{3}-\d{4}-\d{4}$/, 'Invalid advisor code format (e.g., ADV-2026-0001)')
      .optional(),
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

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  verifyPaymentSchema,
};
