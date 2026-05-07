const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const mongoose = require('mongoose');

// Lazy initialize Razorpay instance
let razorpay = null;

const getRazorpayInstance = () => {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId === 'rzp_test_YOUR_KEY_ID' || keySecret === 'YOUR_KEY_SECRET') {
      throw new Error('Razorpay credentials not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file');
    }

    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }
  return razorpay;
};

/**
 * @desc    Create Razorpay order
 * @route   POST /api/payments/razorpay/create-order
 * @access  Private (Customer)
 */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', orderId } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Get Razorpay instance
    const razorpayInstance = getRazorpayInstance();

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: orderId || `order_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        orderId: orderId || ''
      }
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to create payment order',
      error: error.message 
    });
  }
};

/**
 * @desc    Verify Razorpay payment signature
 * @route   POST /api/payments/razorpay/verify
 * @access  Private (Customer)
 */
exports.verifyRazorpayPayment = async (req, res) => {
  // 🔒 SECURITY: Use database transaction for payment verification
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    // 🔒 SECURITY: Verify order belongs to authenticated user
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // 🔒 SECURITY: Verify order belongs to the authenticated user
    if (order.buyerId.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Order does not belong to you'
      });
    }

    // 🔒 SECURITY: Check if payment already verified (idempotency)
    if (order.paymentStatus === 'PAID') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Payment already verified for this order'
      });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature'
      });
    }

    // 🔒 SECURITY: Fetch payment details from Razorpay to verify amount
    try {
      const razorpayInstance = getRazorpayInstance();
      const razorpayOrder = await razorpayInstance.orders.fetch(razorpay_order_id);
      const razorpayPayment = await razorpayInstance.payments.fetch(razorpay_payment_id);

      // 🔒 SECURITY: Verify payment amount matches order total
      const expectedAmount = Math.round(order.total * 100); // Convert to paise
      if (razorpayPayment.amount !== expectedAmount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Payment amount mismatch',
          expected: expectedAmount,
          received: razorpayPayment.amount
        });
      }

      // 🔒 SECURITY: Verify payment status is captured
      if (razorpayPayment.status !== 'captured') {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Payment not captured. Status: ${razorpayPayment.status}`
        });
      }
    } catch (razorpayError) {
      console.error('Razorpay API error:', razorpayError);
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment with Razorpay',
        error: razorpayError.message
      });
    }

    // Update order with payment details within transaction
    order.paymentStatus = 'PAID';
    order.paymentDetails = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paidAt: new Date()
    };
    await order.save({ session });

    // 🔒 SECURITY: Commit transaction - all or nothing
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id
    });
  } catch (error) {
    // 🔒 SECURITY: Rollback transaction on any error
    await session.abortTransaction();
    session.endSession();
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

/**
 * @desc    Handle Razorpay webhook
 * @route   POST /api/payments/razorpay/webhook
 * @access  Public (Razorpay webhook)
 */
exports.handlePaymentWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload.payment.entity;

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        console.log('Payment captured:', payload.id);
        // Update order status
        break;

      case 'payment.failed':
        console.log('Payment failed:', payload.id);
        // Handle failed payment
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};
