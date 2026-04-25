const mongoose = require('mongoose');

const poolConfigSchema = new mongoose.Schema({
  IV_PERCENT: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 30
  },
  SV_PERCENT: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 30
  },
  RF_PERCENT: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 20
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
    default: 'Default pool configuration'
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
poolConfigSchema.index({ isActive: 1 });
poolConfigSchema.index({ version: -1 });
poolConfigSchema.index({ effectiveFrom: -1 });

// Validation: Ensure total doesn't exceed 100%
poolConfigSchema.pre('save', function() {
  const total = this.IV_PERCENT + this.SV_PERCENT + this.RF_PERCENT;
  if (total > 100) {
    throw new Error(`Total pool percentage (${total}%) cannot exceed 100%`);
  }
});

// Ensure only one active config at a time
poolConfigSchema.pre('save', async function() {
  if (this.isActive && this.isNew) {
    // Deactivate all other configs
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { isActive: false }
    );
  }
});

module.exports = mongoose.model('PoolConfig', poolConfigSchema);
