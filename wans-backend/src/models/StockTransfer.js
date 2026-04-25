const mongoose = require('mongoose');

const stockTransferSchema = new mongoose.Schema({
  fromUserId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:     { type: Number, required: true, min: 1 },
  transferType: { type: String, enum: ['COMPANY_TO_WHOLESALE', 'WHOLESALE_TO_MINISTOCK'], required: true },
  status:       { type: String, enum: ['PENDING', 'COMPLETED', 'REJECTED'], default: 'COMPLETED' },
  notes:        { type: String, default: '' },
  transferDate: { type: Date, default: Date.now },
}, { timestamps: true });

// Index for faster queries
stockTransferSchema.index({ fromUserId: 1, createdAt: -1 });
stockTransferSchema.index({ toUserId: 1, createdAt: -1 });

module.exports = mongoose.model('StockTransfer', stockTransferSchema);
