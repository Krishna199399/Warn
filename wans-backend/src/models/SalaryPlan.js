const mongoose = require('mongoose');

const benefitSchema = new mongoose.Schema({
  name:     { type: String, required: true },   // "Car Fund", "SIP", "Kiran Fund" etc.
  rvAmount: { type: Number, required: true, min: 0 }, // RV value in rupees
}, { _id: false });

const salaryPlanSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['ADVISOR', 'DO_MANAGER', 'AREA_MANAGER', 'ZONAL_MANAGER', 'STATE_HEAD'],
    required: true,
  },
  level: {
    type: String,
    enum: ['STAR', 'RUBY', 'PEARL'],
    required: true,
  },
  // SV to accumulate (lifetime total) to unlock this level
  svTarget: { type: Number, required: true, min: 0 },

  // Monthly salary amount once this level is active (admin fills later)
  monthlySalaryAmount: { type: Number, default: 0, min: 0 },

  // Company reward benefits unlocked at this level
  rewardBenefits: [benefitSchema],

  isActive: { type: Boolean, default: true },
  description: { type: String, default: '' },
}, { timestamps: true });

// Unique per role+level
salaryPlanSchema.index({ role: 1, level: 1 }, { unique: true });

module.exports = mongoose.model('SalaryPlan', salaryPlanSchema);
