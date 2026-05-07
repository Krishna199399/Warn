const mongoose = require('mongoose');

const benefitClaimSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  salaryLevel: {
    type: String,
    enum: ['STAR', 'RUBY', 'PEARL'],
    required: true,
  },
  benefitName: {
    type: String,
    required: true,
  },
  benefitAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  rvEarnedAt: {
    type: Date,
    required: true,
  },
  claimStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'PAID', 'REJECTED'],
    default: 'PENDING',
  },
  claimedAt: {
    type: Date,
    default: Date.now,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  processedAt: {
    type: Date,
    default: null,
  },
  paymentDetails: {
    method: { type: String, default: null }, // 'BANK_TRANSFER', 'UPI', 'CASH', 'CHEQUE'
    referenceId: { type: String, default: null },
    paidAt: { type: Date, default: null },
    notes: { type: String, default: null },
  },
  adminNotes: {
    type: String,
    default: null,
  },
}, { timestamps: true });

// Index for quick lookups
benefitClaimSchema.index({ userId: 1, claimStatus: 1 });
benefitClaimSchema.index({ claimStatus: 1, createdAt: -1 });

module.exports = mongoose.model('BenefitClaim', benefitClaimSchema);
