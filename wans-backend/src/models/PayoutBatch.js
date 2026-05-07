const mongoose = require('mongoose');

const payoutBatchSchema = new mongoose.Schema({
  batchId: {
    type:     String,
    required: true,
    unique:   true,
    // e.g. "RP-MID-APR-2026", "RP-END-APR-2026", "SALARY-APR-2026"
  },
  type: {
    type:     String,
    enum:     ['RP_MID', 'RP_END', 'IV_MID', 'IV_END', 'SALARY', 'ADVISOR_SALARY', 'EMPLOYEE_SALARY', 'MINISTOCK_COMMISSION', 'WHOLESALE_COMMISSION'],
    required: true,
  },
  periodStart:   { type: Date, required: true },
  periodEnd:     { type: Date, required: true },
  scheduledDate: { type: Date, required: true },

  status: {
    type:    String,
    enum:    ['PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL'],
    default: 'PENDING',
  },

  totalAmount:    { type: Number, default: 0 },
  totalEmployees: { type: Number, default: 0 },
  paidCount:      { type: Number, default: 0 },
  failedCount:    { type: Number, default: 0 },

  // Who created (SYSTEM or admin userId)
  createdBy:   { type: String, default: 'SYSTEM' },
  processedAt: { type: Date,   default: null },
  notes:       { type: String, default: '' },
}, { timestamps: true });

payoutBatchSchema.index({ type: 1, status: 1 });
payoutBatchSchema.index({ scheduledDate: -1 });

module.exports = mongoose.model('PayoutBatch', payoutBatchSchema);
