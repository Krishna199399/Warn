const mongoose = require('mongoose');

const bankDetailsSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    unique:   true,
  },
  accountHolderName: { type: String, required: true, trim: true },
  bankName:          { type: String, required: true, trim: true },
  accountNumber:     { type: String, required: true, trim: true },
  ifscCode:          { type: String, required: true, trim: true, uppercase: true },
  branchName:        { type: String, default: '',   trim: true },
  accountType:       { type: String, enum: ['SAVINGS', 'CURRENT'], default: 'SAVINGS' },
  upiId:             { type: String, default: '',   trim: true },

  // Address for payslip
  address:  { type: String, default: '', trim: true },
  city:     { type: String, default: '', trim: true },
  state:    { type: String, default: '', trim: true },
  pincode:  { type: String, default: '', trim: true },

  // Admin verification
  isVerified:  { type: Boolean, default: false },
  verifiedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verifiedAt:  { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('BankDetails', bankDetailsSchema);
