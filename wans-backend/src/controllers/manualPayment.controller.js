const path        = require('path');
const fs          = require('fs');
const Order       = require('../models/Order');
const PaymentProof = require('../models/PaymentProof');
const User        = require('../models/User');
const { createNotification } = require('./notification.controller');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Ensure the payment-proofs upload directory exists
 */
const UPLOAD_DIR = path.join(__dirname, '../../uploads/payment-proofs');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ─── GET /api/manual-payments/seller-profile ─────────────────────────────────
/**
 * @desc  Get Whole Stock seller profile for payment display (UPI ID, name, phone)
 * @route GET /api/manual-payments/seller-profile/:sellerId
 * @access Private (Mini Stock)
 */
exports.getSellerProfile = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await User.findById(sellerId)
      .select('name phone upiId shopName')
      .lean();

    if (!seller) {
      return res.status(404).json({ success: false, error: 'Seller not found' });
    }

    res.json({ success: true, data: seller });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /api/manual-payments/submit ────────────────────────────────────────
/**
 * @desc  Mini Stock submits payment proof (UPI ref or cash note)
 * @route POST /api/manual-payments/submit
 * @access Private (Mini Stock only)
 *
 * Body (multipart/form-data):
 *   orderId     – required
 *   method      – "UPI" | "CASH"
 *   referenceId – required for UPI
 *   note        – required for CASH
 *   screenshot  – optional file upload
 */
exports.submitPaymentProof = async (req, res) => {
  try {
    const { orderId, method, referenceId, note } = req.body;
    const submittedBy = req.user._id;

    // ── Validate required fields ──
    if (!orderId || !method) {
      return res.status(400).json({ success: false, error: 'orderId and method are required' });
    }
    if (!['UPI', 'CASH'].includes(method)) {
      return res.status(400).json({ success: false, error: 'method must be UPI or CASH' });
    }
    if (method === 'UPI' && !referenceId?.trim()) {
      return res.status(400).json({ success: false, error: 'referenceId is required for UPI payments' });
    }
    if (method === 'CASH' && !note?.trim()) {
      return res.status(400).json({ success: false, error: 'note is required for cash payments' });
    }

    // ── Fetch and validate order ──
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Only the buyer can submit proof
    if (order.buyerId.toString() !== submittedBy.toString()) {
      return res.status(403).json({ success: false, error: 'Only the order buyer can submit payment proof' });
    }

    // Cannot resubmit if already verified or pending
    const existing = await PaymentProof.findOne({ orderId });
    if (existing) {
      if (existing.status === 'VERIFIED') {
        return res.status(400).json({ success: false, error: 'Payment for this order is already verified' });
      }
      if (existing.status === 'PENDING') {
        return res.status(400).json({ success: false, error: 'Payment proof already submitted — waiting for seller verification' });
      }
      // If REJECTED → allow resubmission (delete old proof)
      await PaymentProof.deleteOne({ _id: existing._id });
    }

    // ── Handle screenshot upload ──
    let screenshotUrl = null;
    if (req.file) {
      screenshotUrl = `/uploads/payment-proofs/${req.file.filename}`;
    }

    // ── Create PaymentProof ──
    const proof = await PaymentProof.create({
      orderId,
      submittedBy,
      method,
      referenceId: method === 'UPI' ? referenceId.trim() : null,
      note:        method === 'CASH' ? note.trim() : null,
      screenshotUrl,
      status: 'PENDING',
    });

    // ── Update order payment status & method ──
    order.paymentStatus = 'PENDING';
    order.paymentMethod = method;
    await order.save();

    // ── Notify seller (Whole Stock) ──
    try {
      const buyer = await User.findById(submittedBy).select('name').lean();
      await createNotification(order.sellerId, {
        type: 'ORDER',
        title: 'New Payment Proof Submitted',
        message: `${buyer?.name || 'A buyer'} submitted ${method} payment proof for order ${order.orderNumber}. Please verify.`,
        data: { orderId: order._id, proofId: proof._id },
      });
    } catch (_) { /* non-blocking */ }

    res.status(201).json({
      success: true,
      message: 'Payment proof submitted successfully. Waiting for seller verification.',
      data: proof,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /api/manual-payments/pending ────────────────────────────────────────
/**
 * @desc  Whole Stock dashboard — list all pending payment proofs for their orders
 * @route GET /api/manual-payments/pending
 * @access Private (Wholesale only)
 */
exports.getPendingPayments = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Get all orders where this user is the seller
    const orders = await Order.find({ sellerId }).select('_id').lean();
    const orderIds = orders.map(o => o._id);

    const proofs = await PaymentProof.find({
      orderId: { $in: orderIds },
      status: 'PENDING',
    })
      .populate('orderId', 'orderNumber total paymentMethod buyerId createdAt')
      .populate('submittedBy', 'name phone shopName')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: proofs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /api/manual-payments/history ────────────────────────────────────────
/**
 * @desc  Get full payment proof history (for both buyer and seller)
 * @route GET /api/manual-payments/history
 * @access Private
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const role   = req.user.role;

    let proofs;

    if (role === 'WHOLESALE') {
      // Seller side — all proofs for their orders
      const orders = await Order.find({ sellerId: userId }).select('_id').lean();
      const orderIds = orders.map(o => o._id);
      proofs = await PaymentProof.find({ orderId: { $in: orderIds } })
        .populate('orderId', 'orderNumber total paymentMethod buyerId createdAt')
        .populate('submittedBy', 'name phone shopName')
        .populate('verifiedBy', 'name')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      // Buyer side — all proofs they submitted
      proofs = await PaymentProof.find({ submittedBy: userId })
        .populate('orderId', 'orderNumber total paymentMethod sellerId createdAt')
        .populate('verifiedBy', 'name')
        .sort({ createdAt: -1 })
        .lean();
    }

    res.json({ success: true, data: proofs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /api/manual-payments/proof/:orderId ────────────────────────────────
/**
 * @desc  Get proof for a specific order
 * @route GET /api/manual-payments/proof/:orderId
 * @access Private
 */
exports.getProofByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const proof = await PaymentProof.findOne({ orderId })
      .populate('submittedBy', 'name phone shopName')
      .populate('verifiedBy', 'name')
      .lean();

    if (!proof) {
      return res.status(404).json({ success: false, error: 'No payment proof found for this order' });
    }

    res.json({ success: true, data: proof });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /api/manual-payments/verify ────────────────────────────────────────
/**
 * @desc  Whole Stock verifies (approve/reject) a payment proof
 * @route POST /api/manual-payments/verify
 * @access Private (Wholesale only)
 *
 * Body: { proofId, action: "APPROVE" | "REJECT", rejectionReason? }
 */
exports.verifyPaymentProof = async (req, res) => {
  try {
    const { proofId, action, rejectionReason } = req.body;
    const verifierId = req.user._id;

    if (!proofId || !action) {
      return res.status(400).json({ success: false, error: 'proofId and action are required' });
    }
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, error: 'action must be APPROVE or REJECT' });
    }
    if (action === 'REJECT' && !rejectionReason?.trim()) {
      return res.status(400).json({ success: false, error: 'rejectionReason is required when rejecting' });
    }

    // ── Fetch proof ──
    const proof = await PaymentProof.findById(proofId).populate('orderId');
    if (!proof) {
      return res.status(404).json({ success: false, error: 'Payment proof not found' });
    }
    if (proof.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: `Proof is already ${proof.status}` });
    }

    // ── Ensure only the seller can verify ──
    const order = proof.orderId;
    if (order.sellerId.toString() !== verifierId.toString()) {
      return res.status(403).json({ success: false, error: 'Only the seller can verify payment' });
    }

    // ── Apply action ──
    if (action === 'APPROVE') {
      proof.status       = 'VERIFIED';
      proof.verifiedBy   = verifierId;
      proof.verifiedAt   = new Date();

      order.paymentStatus = 'PAID';
      order.paymentDetails = {
        ...order.paymentDetails,
        paidAt: new Date(),
      };
    } else {
      proof.status         = 'REJECTED';
      proof.verifiedBy     = verifierId;
      proof.verifiedAt     = new Date();
      proof.rejectionReason = rejectionReason.trim();

      order.paymentStatus  = 'FAILED';
    }

    await proof.save();
    await order.save();

    // ── Notify buyer ──
    try {
      const seller = await User.findById(verifierId).select('name').lean();
      const msgApprove = `Your payment for order ${order.orderNumber} has been verified! Delivery will be arranged soon.`;
      const msgReject  = `Your payment proof for order ${order.orderNumber} was rejected. Reason: ${rejectionReason}`;
      await createNotification(order.buyerId, {
        type: 'ORDER',
        title: action === 'APPROVE' ? 'Payment Verified ✅' : 'Payment Rejected ❌',
        message: action === 'APPROVE' ? msgApprove : msgReject,
        data: { orderId: order._id, proofId: proof._id },
      });
    } catch (_) { /* non-blocking */ }

    res.json({
      success: true,
      message: action === 'APPROVE' ? 'Payment approved. Order marked as PAID.' : 'Payment rejected.',
      data: { proof, orderPaymentStatus: order.paymentStatus },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /api/manual-payments/stats ──────────────────────────────────────────
/**
 * @desc  Seller stats — count of pending/verified/rejected proofs
 * @route GET /api/manual-payments/stats
 * @access Private (Wholesale)
 */
exports.getPaymentStats = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const orders   = await Order.find({ sellerId }).select('_id').lean();
    const orderIds = orders.map(o => o._id);

    const [pending, verified, rejected] = await Promise.all([
      PaymentProof.countDocuments({ orderId: { $in: orderIds }, status: 'PENDING' }),
      PaymentProof.countDocuments({ orderId: { $in: orderIds }, status: 'VERIFIED' }),
      PaymentProof.countDocuments({ orderId: { $in: orderIds }, status: 'REJECTED' }),
    ]);

    res.json({ success: true, data: { pending, verified, rejected, total: pending + verified + rejected } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
