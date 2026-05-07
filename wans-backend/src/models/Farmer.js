const mongoose = require('mongoose');

const previousAdvisorSchema = new mongoose.Schema({
  advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  from:      { type: Date },
  to:        { type: Date },
  reason:    { type: String, enum: ['DEACTIVATED', 'ADMIN_REASSIGN', 'MANUAL'], default: 'MANUAL' },
}, { _id: false });

const farmerSchema = new mongoose.Schema({
  advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name:      { type: String, required: true },
  phone:     { type: String, default: '' },
  village:   { type: String, default: '' },
  acres:     { type: Number, default: 0 },
  crop:      { type: String, default: '' },
  status:    { type: String, enum: ['Active','Inactive'], default: 'Active' },

  // Auto-assignment tracking
  assignedAt:        { type: Date, default: null },
  assignmentSource:  { type: String, enum: ['POS_SALE', 'MANUAL', 'REASSIGNED'], default: null },
  previousAdvisors:  [previousAdvisorSchema],
}, { timestamps: true });

farmerSchema.index({ advisorId: 1 });
farmerSchema.index({ phone: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Farmer', farmerSchema);
