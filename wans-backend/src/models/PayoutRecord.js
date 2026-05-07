const mongoose = require('mongoose');

// Snapshot of bank details at the moment payout is created
const bankSnapshotSchema = new mongoose.Schema({
  accountHolderName: String,
  bankName:          String,
  accountNumber:     String,
  ifscCode:          String,
  branchName:        String,
  accountType:       String,
  upiId:             String,
  address:           String,
  city:              String,
  state:             String,
  pincode:           String,
}, { _id: false });

const payoutRecordSchema = new mongoose.Schema({
  batchId:  { type: mongoose.Schema.Types.ObjectId, ref: 'PayoutBatch', required: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',        required: true },
  role:     { type: String, required: true },

  type: {
    type:     String,
    enum:     ['RP', 'IV', 'SALARY', 'ADVISOR_SALARY', 'EMPLOYEE_SALARY', 'MINISTOCK_COMMISSION', 'WHOLESALE_COMMISSION'],
    required: true,
  },

  amount:      { type: Number, required: true, min: 0 },
  periodStart: { type: Date,   required: true },
  periodEnd:   { type: Date,   required: true },

  // Frozen bank details at time of batch creation
  bankSnapshot: { type: bankSnapshotSchema, default: null },
  hasBankDetails: { type: Boolean, default: false },

  status: {
    type:    String,
    enum:    ['PENDING', 'PAID', 'FAILED', 'ON_HOLD'],
    default: 'PENDING',
  },

  paidAt:    { type: Date,   default: null },
  paidBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  utrNumber: { type: String, default: '' },   // Bank transaction reference
  remarks:   { type: String, default: '' },
}, { timestamps: true });

payoutRecordSchema.index({ batchId: 1, userId: 1 });
payoutRecordSchema.index({ userId: 1, status: 1 });
payoutRecordSchema.index({ batchId: 1, status: 1 });

module.exports = mongoose.model('PayoutRecord', payoutRecordSchema);
