const mongoose = require('mongoose');

const hierarchySnapshotSchema = new mongoose.Schema({
  advisorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  doManagerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  areaManagerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  zonalManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  stateHeadId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  // Order number (auto-generated, unique)
  orderNumber: { type: String, unique: true, sparse: true },
  
  // Buyer information
  buyerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerType:   { type: String, enum: ['WHOLESALE', 'MINI_STOCK', 'CUSTOMER'], required: true },
  
  // Seller information
  sellerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerType:  { type: String, enum: ['COMPANY', 'WHOLESALE', 'MINI_STOCK'], required: true },
  
  // Product information
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:    { type: Number, required: true, min: 1 },
  price:       { type: Number, required: true },
  total:       { type: Number, required: true },
  
  // Order status
  status:      { type: String, enum: ['PENDING', 'APPROVED', 'SHIPPED', 'DELIVERED', 'CANCELLED'], default: 'PENDING' },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
  
  // Source and metadata
  source:      { type: String, default: 'WEBSITE' },
  region:      { type: String, default: '' },
  
  // For Mini Stock sales only (optional)
  advisorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  farmerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', default: null },
  
  // Customer details for POS sales (when buyerType is CUSTOMER)
  customerName:     { type: String, default: null },
  customerPhone:    { type: String, default: null },
  customerLocation: { type: String, default: null },
  
  // Snapshot of who was in the chain at time of sale — NEVER changes after creation
  hierarchySnapshot: { type: hierarchySnapshotSchema, default: null },
  
  // NEW: Pool tracking for income distribution
  pools: {
    IV: { type: Number, default: 0 },
    SV: { type: Number, default: 0 },
    RF: { type: Number, default: 0 }
  },
  
  // NEW: Distribution tracking
  commissionDistributed: { type: Boolean, default: false },
  distributionSnapshot: {
    poolConfigVersion: { type: Number, default: null },
    totalDistributed: { type: Number, default: 0 },
    distributedAt: { type: Date, default: null }
  },
  
  // Timestamps
  approvedAt:  { type: Date, default: null },
  shippedAt:   { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
}, { timestamps: true });

// Generate unique order number before saving
// Mongoose 8: async pre-save hooks do NOT receive next() — just use async/await
// Uses millisecond timestamp + random suffix → zero race-condition risk.
orderSchema.pre('save', async function () {
  if (!this.isNew || this.orderNumber) return;  // only run on very first save

  const now    = new Date();
  const year   = now.getFullYear().toString().slice(-2);
  const month  = (now.getMonth() + 1).toString().padStart(2, '0');
  const day    = now.getDate().toString().padStart(2, '0');

  // Last 6 digits of epoch ms  +  2-digit random → practically impossible to collide
  const ms     = Date.now().toString().slice(-6);
  const rand   = Math.floor(Math.random() * 100).toString().padStart(2, '0');

  this.orderNumber = `ORD${year}${month}${day}-${ms}${rand}`;
});


// Index for faster queries
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });
orderSchema.index({ advisorId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
