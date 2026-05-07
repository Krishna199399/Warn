const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  orderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  role:     { type: String, required: true },   // role held AT TIME OF SALE

  // Pool type this commission came from:
  // RP = Retail Point  (Advisor gets 100%)
  // IV = Incentive Value
  // SV = Salary Value
  // RV = Rewards Value
  type:       { type: String, enum: ['RP', 'IV', 'SV', 'RV'], required: true },
  amount:     { type: Number, required: true },
  percentage: { type: Number, required: true },   // % of this pool applied
  poolAmount: { type: Number, required: true },   // total pool size (product.field × qty)
  saleRV:     { type: Number, required: true },   // order.total at time of sale (for reference)

  level: { type: String, required: true },        // 'Direct', 'L1', 'L2', 'L3', 'L4'

  // Audit snapshot
  configSnapshot: {
    incomeConfig: { type: Object, default: null },
    productSnapshot: { type: Object, default: null }
  },

  snapshotUsed: { type: Boolean, default: true },
  date:         { type: Date,    default: Date.now },
}, { timestamps: true });

commissionSchema.index({ userId: 1, date: -1 });
commissionSchema.index({ orderId: 1 });
commissionSchema.index({ type: 1 });
commissionSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Commission', commissionSchema);
