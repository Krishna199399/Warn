const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  category:    { type: String, enum: ['Seeds','Fertilizer','Pesticide','Equipment','Supplement'], required: true },
  price:       { type: Number, required: true, min: 0 },
  stock:       { type: Number, default: 0, min: 0 },
  unit:        { type: String, default: 'unit' },
  sku:         { type: String, required: true, unique: true, trim: true },
  status:      { type: String, enum: ['Active','Low Stock','Out of Stock'], default: 'Active' },
  image:       { type: String, default: null },
  description: { type: String, default: '', trim: true },
  brand:       { type: String, default: '', trim: true },
  weight:      { type: String, default: '', trim: true },
  tags:        [{ type: String, trim: true }],
}, { timestamps: true });

// ── Async pre-save (Mongoose 7+ / Express 5 compatible) ───────────────────────
productSchema.pre('save', async function () {
  if (this.stock === 0)       this.status = 'Out of Stock';
  else if (this.stock <= 30)  this.status = 'Low Stock';
  else                        this.status = 'Active';
});

module.exports = mongoose.model('Product', productSchema);
