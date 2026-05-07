const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { verifyPaymentSchema } = require('../schemas/order.schema');
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handlePaymentWebhook
} = require('../controllers/payment.controller');

// Create Razorpay order
router.post('/razorpay/create-order', protect, createRazorpayOrder);

// Verify Razorpay payment
// 🔒 SECURITY: Validation applied to payment verification
router.post('/razorpay/verify', protect, validate(verifyPaymentSchema), verifyRazorpayPayment);

// Webhook for payment status (no auth needed - Razorpay will call this)
router.post('/razorpay/webhook', handlePaymentWebhook);

module.exports = router;
