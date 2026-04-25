const mongoose = require('mongoose');

const STATUS = ['REQUESTED', 'PARENT_APPROVED', 'ADMIN_APPROVED', 'REJECTED'];

const promotionRequestSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userRole:        { type: String, required: true },
  nextRole:        { type: String, required: true },
  parentId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status:          { type: String, enum: STATUS, default: 'REQUESTED' },
  requestedAt:     { type: Date, default: Date.now },
  promotedAt:      { type: Date, default: null },
  parentNote:      { type: String, default: '' },
  adminNote:       { type: String, default: '' },
  rejectedBy:      { type: String, default: null },   // 'PARENT' | 'ADMIN'
  rejectionReason: { type: String, default: '' },

  // Snapshot of performance at time of request
  performanceSnapshot: {
    totalSales:       Number,
    teamSize:         Number,
    targetsAchieved:  Number,
  },
}, { timestamps: true });

// Only one active request per user at a time
promotionRequestSchema.index({ userId: 1 });

module.exports = mongoose.model('PromotionRequest', promotionRequestSchema);
