const mongoose = require('mongoose');

const benefitProgressSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  rvTarget:        { type: Number, required: true },   // RV needed to earn this benefit
  rvPointsTarget:  { type: Number },                   // Alias for backward compatibility
  earned:          { type: Boolean, default: false },
  earnedAt:        { type: Date,    default: null },
}, { _id: false });

const levelProgressSchema = new mongoose.Schema({
  salaryLevel:       { type: String, enum: ['STAR', 'RUBY', 'PEARL'], required: true },
  isActive:          { type: Boolean, default: false }, // true after salary level achieved
  activatedAt:       { type: Date, default: null },
  currentBenefitIdx: { type: Number, default: 0 },     // index of benefit currently counting
  rvBaseline:        { type: Number, default: 0 },     // totalRv when current benefit started
  rvPointsBaseline:  { type: Number, default: 0 },     // Alias for backward compatibility
  benefits:          [benefitProgressSchema],
}, { _id: false });

const userRewardProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
    required: true,
    unique: true,
  },
  role:          { type: String, required: true },
  levelProgress: [levelProgressSchema],
  lastUpdated:   { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('UserRewardProgress', userRewardProgressSchema);
