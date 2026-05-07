const mongoose = require('mongoose');

const incomeConfigSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['ADVISOR', 'DO', 'AM', 'ZM', 'SH'],
    required: true,
    unique: true
  },
  // ── Per-pool percentage this role earns ──────────────────────────────────────
  // RP = Retail Point pool  (product.rp × qty)  → Advisor gets 100%, others 0%
  RP: { type: Number, required: true, min: 0, max: 100, default: 0 },
  // IV = Incentive Value pool (product.iv × qty)
  IV: { type: Number, required: true, min: 0, max: 100, default: 0 },
  // SV = Salary Value pool   (product.sv × qty)
  SV: { type: Number, required: true, min: 0, max: 100, default: 0 },
  // RV = Rewards Value pool  (product.rv × qty)
  RV: { type: Number, required: true, min: 0, max: 100, default: 0 },

  isActive: { type: Boolean, default: true },
  version:  { type: Number,  default: 1 },
  description: { type: String, default: '' }
}, { timestamps: true });

incomeConfigSchema.index({ role: 1, isActive: 1 });
incomeConfigSchema.index({ version: -1 });

module.exports = mongoose.model('IncomeConfig', incomeConfigSchema);
