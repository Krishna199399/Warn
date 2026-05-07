const mongoose = require('mongoose');

const salaryPaymentSchema = new mongoose.Schema({
  level:  { type: String, enum: ['STAR', 'RUBY', 'PEARL'] },
  amount: { type: Number, default: 0 },
  paidAt: { type: Date, default: Date.now },
}, { _id: false });

const rewardUnlockSchema = new mongoose.Schema({
  level:       { type: String, enum: ['STAR', 'RUBY', 'PEARL'] },
  unlockedAt:  { type: Date, default: Date.now },
  benefits:    [{ name: String, rvAmount: Number }],
}, { _id: false });

const userSalaryStatusSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  role:     { type: String, required: true },  // mirrors User.role exactly

  // Lifetime cumulative SV earned from commissions
  totalSvEarned: { type: Number, default: 0 },

  // Current achieved level
  currentLevel: {
    type: String,
    enum: ['NONE', 'STAR', 'RUBY', 'PEARL'],
    default: 'NONE',
  },

  // SV baseline snapshots — totalSv at the moment each level was achieved
  // Used to compute the FRESH counter for the next level
  levelBaselines: {
    RUBY:  { type: Number, default: 0 },  // totalSv when STAR was completed
    PEARL: { type: Number, default: 0 },  // totalSv when RUBY was completed
  },

  // When each level was reached
  starAchievedAt:  { type: Date, default: null },
  rubyAchievedAt:  { type: Date, default: null },
  pearlAchievedAt: { type: Date, default: null },

  // Monthly salary payment log
  salaryHistory: [salaryPaymentSchema],

  // Rewards unlocked at each level
  rewardsUnlocked: [rewardUnlockSchema],

  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

userSalaryStatusSchema.index({ role: 1, currentLevel: 1 });

module.exports = mongoose.model('UserSalaryStatus', userSalaryStatusSchema);
