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
  
  // Tax information
  taxRate:     { type: Number, default: 18 },           // Tax percentage applied
  taxAmount:   { type: Number, default: 0 },            // Calculated tax amount
  subtotal:    { type: Number, required: true },        // Amount before tax
  total:       { type: Number, required: true },        // Final amount (subtotal + tax)
  
  // Order status
  status:      { type: String, enum: ['PENDING', 'APPROVED', 'SHIPPED', 'DELIVERED', 'CANCELLED'], default: 'PENDING' },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
  
  // Payment details
  paymentMethod: { type: String, enum: ['COD', 'ONLINE', 'UPI'], default: 'COD' },
  paymentDetails: {
    razorpay_order_id: { type: String, default: null },
    razorpay_payment_id: { type: String, default: null },
    razorpay_signature: { type: String, default: null },
    paidAt: { type: Date, default: null }
  },
  
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
  
  // Delivery address (for all order types)
  deliveryAddress: {
    shopName:  { type: String, default: null },      // Shop name for Wholesale/Mini Stock
    name:      { type: String, default: null },      // Contact person name
    phone:     { type: String, default: null },      // Contact phone
    street:    { type: String, default: null },
    city:      { type: String, default: null },
    state:     { type: String, default: null },
    pinCode:   { type: String, default: null },
    landmark:  { type: String, default: null },
  },
  
  // Snapshot of who was in the chain at time of sale — NEVER changes after creation
  hierarchySnapshot: { type: hierarchySnapshotSchema, default: null },
  
  // Snapshot of product commission values at time of sale — NEVER changes after creation
  productSnapshot: {
    rpPoints: { type: Number, default: 0 },  // Retail Point value per unit
    ivPoints: { type: Number, default: 0 },  // Incentive Value per unit
    svPoints: { type: Number, default: 0 },  // Salary Value per unit
    rvPoints: { type: Number, default: 0 },  // Rewards Value per unit
    
    // NEW: Wholesale & Mini-Stock pricing snapshot
    mrp: { type: Number, default: 0 },
    wholesalePrice: { type: Number, default: 0 },
    miniStockPrice: { type: Number, default: 0 },
    wholesaleMargin: { type: Number, default: 0 },
    miniStockMargin: { type: Number, default: 0 },
  },

  // Pool amounts computed at delivery (field × quantity)
  pools: {
    RP: { type: Number, default: 0 },
    IV: { type: Number, default: 0 },
    SV: { type: Number, default: 0 },
    RV: { type: Number, default: 0 },
  },
  
  // NEW: Commission tracking for wholesale/mini-stock
  buyerCommission: {
    type: { type: String, enum: ['RP', 'WHOLESALE_MARGIN', 'MINISTOCK_MARGIN', 'NONE'], default: 'NONE' },
    amountPerUnit: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    recorded: { type: Boolean, default: false },
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
