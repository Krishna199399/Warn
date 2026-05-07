const express  = require('express');
const router   = express.Router();
const { protect }  = require('../middleware/auth.middleware');
const { uploadPaymentProofMiddleware } = require('../middleware/uploadPaymentProof');
const ctrl = require('../controllers/manualPayment.controller');

// ─── Mini Stock (Buyer) Routes ────────────────────────────────────────────────

// Get seller profile (UPI ID, name, phone) before paying
router.get('/seller-profile/:sellerId', protect, ctrl.getSellerProfile);

// Submit payment proof (UPI ref + optional screenshot, or cash note)
router.post('/submit', protect, uploadPaymentProofMiddleware, ctrl.submitPaymentProof);

// Get proof status for a specific order
router.get('/proof/:orderId', protect, ctrl.getProofByOrder);

// Payment history (role-aware: seller sees all their orders, buyer sees their submissions)
router.get('/history', protect, ctrl.getPaymentHistory);

// ─── Whole Stock (Seller) Routes ──────────────────────────────────────────────

// Pending payments dashboard list
router.get('/pending', protect, ctrl.getPendingPayments);

// Stats card counts
router.get('/stats', protect, ctrl.getPaymentStats);

// Approve or reject a payment proof
router.post('/verify', protect, ctrl.verifyPaymentProof);

module.exports = router;
