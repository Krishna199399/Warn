const mongoose = require('mongoose');

const stockLogSchema = new mongoose.Schema({
  type:      { type: String, enum: ['PURCHASE', 'TRANSFER', 'SALE'], required: true },
  orderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null }, // Made optional
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:  { type: Number, required: true, min: 1 },
  from:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  to:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes:     { type: String, default: '' },
}, { timestamps: true });

// Index for faster queries
stockLogSchema.index({ orderId: 1 });
stockLogSchema.index({ productId: 1, createdAt: -1 });
stockLogSchema.index({ from: 1, createdAt: -1 });
stockLogSchema.index({ to: 1, createdAt: -1 });

module.exports = mongoose.model('StockLog', stockLogSchema);
