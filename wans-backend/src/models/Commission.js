const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  orderId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  role:         { type: String, required: true },   // role held AT TIME OF SALE (from snapshot)
  
  // NEW: Pool-based distribution
  type:         { type: String, enum: ['RETAIL_PRICE', 'IV', 'SV', 'RF'], required: true },  // Pool type or retail price
  amount:       { type: Number, required: true },
  percentage:   { type: Number, required: true },  // Percentage of pool
  poolAmount:   { type: Number, required: true },  // Total pool size
  saleRV:       { type: Number, required: true },  // Original sale amount
  
  level:        { type: String, required: true },   // 'Direct', 'L1', 'L2', 'L3', 'L4'
  
  // Configuration snapshot (for audit trail)
  configSnapshot: {
    incomeConfig: { type: Object, default: null },
    poolConfig: { type: Object, default: null }
  },
  
  snapshotUsed: { type: Boolean, default: true },
  date:         { type: Date, default: Date.now },
}, { timestamps: true });

// Compound index for fast per-user lookups
commissionSchema.index({ userId: 1, date: -1 });
commissionSchema.index({ orderId: 1 });
commissionSchema.index({ type: 1 });
commissionSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Commission', commissionSchema);
