const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  category:    { type: String, required: true },  // Remove enum to allow dynamic categories
  actualPrice: { type: Number, required: true, min: 0 },  // MRP Price (Maximum Retail Price - printed on package)
  mrp:         { type: Number, required: true, min: 0 },  // Sell Price (Actual selling price to customers)
  price:       { type: Number, default: 0, min: 0 },      // Base price (auto-filled from mrp, used for customer orders)
  rp:          { type: Number, default: 0, min: 0 },
  sv:          { type: Number, default: 0, min: 0 },
  rv:          { type: Number, default: 0, min: 0 },
  iv:          { type: Number, default: 0, min: 0 },
  
  // Tax Configuration
  taxRate:     { type: Number, default: 18, min: 0, max: 100 },  // Default tax rate for this product
  
  // Tax-Inclusive Prices (auto-calculated)
  priceWithTax:       { type: Number, default: 0, min: 0 },  // price + tax
  actualPriceWithTax: { type: Number, default: 0, min: 0 },  // actualPrice + tax
  
  // Wholesale & Mini-Stock Pricing
  wholesalePrice:   { type: Number, default: 0, min: 0 },
  miniStockPrice:   { type: Number, default: 0, min: 0 },
  wholesaleMargin:  { type: Number, default: 0, min: 0 },
  miniStockMargin:  { type: Number, default: 0, min: 0 },
  
  stock:       { type: Number, default: 0, min: 0 },
  unit:        { type: String, default: 'unit' },
  unitQuantity: { type: Number, default: null, min: 0 },
  sku:         { type: String, required: true, unique: true, trim: true },
  status:      { type: String, enum: ['Active','Low Stock','Out of Stock'], default: 'Active' },
  image:       { type: String, default: null },
  description: { type: String, default: '', trim: true },
  brand:       { type: String, default: '', trim: true },
  weight:      { type: String, default: '', trim: true },
  tags:        [{ type: String, trim: true }],
  
  // Product Information Sections (expandable)
  ingredients: { type: String, default: '', trim: true },
  howToUse:    { type: String, default: '', trim: true },
  benefits:    { type: String, default: '', trim: true },
  dosage:      { type: String, default: '', trim: true },
  disclaimer:  { type: String, default: '', trim: true },
  
  // Soft Delete
  isDeleted:   { type: Boolean, default: false },
  deletedAt:   { type: Date, default: null },
}, { timestamps: true });

// ── Async pre-save (Mongoose 7+ / Express 5 compatible) ───────────────────────
productSchema.pre('save', async function () {
  // Auto-fill Base Price from Selling Price (they are the same)
  if (this.mrp) {
    this.price = this.mrp;
  }
  
  // Auto-calculate tax-inclusive prices
  const taxMultiplier = 1 + (this.taxRate || 0) / 100;
  
  this.priceWithTax = Math.round(this.price * taxMultiplier * 100) / 100;
  this.actualPriceWithTax = Math.round(this.actualPrice * taxMultiplier * 100) / 100;
  
  // Auto-calculate margins (based on Selling Price, not MRP)
  if (this.mrp && this.wholesalePrice) {
    this.wholesaleMargin = this.mrp - this.wholesalePrice;
  }
  if (this.mrp && this.miniStockPrice) {
    this.miniStockMargin = this.mrp - this.miniStockPrice;
  }
  
  // Update stock status
  if (this.stock === 0)       this.status = 'Out of Stock';
  else if (this.stock <= 30)  this.status = 'Low Stock';
  else                        this.status = 'Active';
});

module.exports = mongoose.model('Product', productSchema);
