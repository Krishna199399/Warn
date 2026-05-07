const mongoose = require('mongoose');

const paymentProofSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  },

  // Who submitted this proof
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Who will verify (seller / Whole Stock)
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // Payment method
  method: {
    type: String,
    enum: ['UPI', 'CASH'],
    required: true,
  },

  // UPI-specific
  referenceId: { type: String, default: null }, // UPI transaction ID / UTR

  // Optional screenshot (stored as relative URL to /uploads/payment-proofs/)
  screenshotUrl: { type: String, default: null },

  // Cash-specific
  note: { type: String, default: null },

  // Verification
  status: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING',
  },

  // Rejection reason (filled by Whole Stock)
  rejectionReason: { type: String, default: null },

  verifiedAt: { type: Date, default: null },
}, { timestamps: true });

// Prevent duplicate submissions per order
paymentProofSchema.index({ orderId: 1 }, { unique: true });

// Faster queries for seller dashboard
paymentProofSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentProof', paymentProofSchema);
