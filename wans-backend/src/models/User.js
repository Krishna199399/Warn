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
  status:      { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'INACTIVE', 'TERMINATED', 'SELF_DELETED'], default: 'PENDING' },
  joinDate:    { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: null },

  // Advisor-specific
  advisorCode: { type: String, default: null },        // e.g. ADV00108

  // Employee Registration & Approval System
  employeeCode: { type: String, unique: true, sparse: true, default: null }, // e.g. ADV-2025-0001
  registrationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: function() {
      // Auto-approve ADMIN, WHOLESALE, MINI_STOCK, CUSTOMER
      // Require approval for employee roles
      const employeeRoles = ['STATE_HEAD', 'ZONAL_MANAGER', 'AREA_MANAGER', 'DO_MANAGER', 'ADVISOR'];
      return employeeRoles.includes(this.role) ? 'pending' : 'approved';
    }
  },
  appliedRole: { type: String, enum: ROLES, default: null }, // Role requested during registration
  appliedAt: { type: Date, default: null },
  approvedAt: { type: Date, default: null },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rejectionReason: { type: String, default: null },
  rejectedAt: { type: Date, default: null },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Wholesale/Mini Stock specific
  shopName:    { type: String, default: null },        // Optional shop name
  upiId:       { type: String, default: null },        // UPI ID for manual payments
  shopAddress: {
    street:    { type: String, default: null },
    city:      { type: String, default: null },
    state:     { type: String, default: null },
    pinCode:   { type: String, default: null },
    landmark:  { type: String, default: null },
  },

  // Customer specific
  location:    { type: String, default: null },        // Optional location for customers

  // Performance tracking
  totalSales:      { type: Number, default: 0 },
  teamSize:        { type: Number, default: 0 },

  // Termination tracking
  terminationReason: { type: String, default: null },
  terminatedAt:      { type: Date, default: null },
  terminatedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Auth
  refreshToken:  { type: String, default: null },

  // KYC Details
  kyc: {
    // Personal Information
    fullName:       { type: String, default: null },
    dateOfBirth:    { type: Date, default: null },
    gender:         { type: String, enum: ['MALE', 'FEMALE', 'OTHER', null], default: null },
    fatherName:     { type: String, default: null },
    panNumber:      { type: String, default: null },
    
    // Aadhaar Details
    aadhaarNumber:  { type: String, default: null },
    
    // Bank Details
    accountHolderName:  { type: String, default: null },
    bankName:           { type: String, default: null },
    accountNumber:      { type: String, default: null },
    ifscCode:           { type: String, default: null },
    branchName:         { type: String, default: null },
    accountType:        { type: String, enum: ['SAVINGS', 'CURRENT', null], default: null },
    
    // Current Address
    currentAddress:  { type: String, default: null },
    currentCity:     { type: String, default: null },
    currentState:    { type: String, default: null },
    currentPinCode:  { type: String, default: null },
    
    // Permanent Address
    permanentAddress:  { type: String, default: null },
    permanentCity:     { type: String, default: null },
    permanentState:    { type: String, default: null },
    permanentPinCode:  { type: String, default: null },
    
    // KYC Status
    status:        { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED', null], default: 'PENDING' },
    submittedAt:   { type: Date, default: null },
    verifiedAt:    { type: Date, default: null },
    verifiedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, default: null },
  },
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
