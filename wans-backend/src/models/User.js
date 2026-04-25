const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const ROLES = [
  'ADMIN', 'STATE_HEAD', 'ZONAL_MANAGER', 'AREA_MANAGER',
  'DO_MANAGER', 'ADVISOR', 'WHOLESALE', 'MINI_STOCK', 'CUSTOMER',
];

const roleHistorySchema = new mongoose.Schema({
  role: { type: String, enum: ROLES },
  from: { type: Date, default: Date.now },
  to:   { type: Date, default: null },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true },
  role:        { type: String, enum: ROLES, required: true },
  parentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  region:      { type: String, default: '' },
  state:       { type: String, default: '' },
  phone:       { type: String, default: '' },
  avatar:      { type: String, default: '' },         // 2-letter initials or image URL
  status:      { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'INACTIVE'], default: 'PENDING' },
  joinDate:    { type: Date, default: Date.now },

  // Advisor-specific
  advisorCode: { type: String, default: null },        // e.g. ADV00108 — preserved after promotion

  // Wholesale/Mini Stock specific
  shopName:    { type: String, default: null },        // Optional shop name

  // Customer specific
  location:    { type: String, default: null },        // Optional location for customers

  // Performance tracking
  totalSales:      { type: Number, default: 0 },
  teamSize:        { type: Number, default: 0 },
  promotionStatus: { type: String, enum: ['ELIGIBLE', 'NOT_ELIGIBLE', 'REQUESTED', 'APPROVED'], default: 'NOT_ELIGIBLE' },

  // Promotion tracking
  previousRole:  { type: String, default: null },
  promotedAt:    { type: Date, default: null },
  isPromoted:    { type: Boolean, default: false },
  roleHistory:   [roleHistorySchema],

  // Auth
  refreshToken:  { type: String, default: null },
}, { timestamps: true });

// Hash password before save (Mongoose 8 async hook — no next() needed)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt    = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Strip sensitive fields from JSON output
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
