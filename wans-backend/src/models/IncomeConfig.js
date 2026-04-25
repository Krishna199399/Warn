const mongoose = require('mongoose');

const incomeConfigSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['ADVISOR', 'DO', 'AM', 'ZM', 'SH'],
    required: true,
    unique: true
  },
  IV: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  SV: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  RF: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
incomeConfigSchema.index({ role: 1, isActive: 1 });
incomeConfigSchema.index({ version: -1 });

// Validation: Ensure percentages are reasonable
incomeConfigSchema.pre('save', function() {
  const total = this.IV + this.SV + this.RF;
  if (total > 100) {
    throw new Error(`Total percentage (${total}%) cannot exceed 100% for role ${this.role}`);
  }
});

module.exports = mongoose.model('IncomeConfig', incomeConfigSchema);
