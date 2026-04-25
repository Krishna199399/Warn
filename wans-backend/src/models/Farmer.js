const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:      { type: String, required: true },
  phone:     { type: String, default: '' },
  village:   { type: String, default: '' },
  acres:     { type: Number, default: 0 },
  crop:      { type: String, default: '' },
  status:    { type: String, enum: ['Active','Inactive'], default: 'Active' },
}, { timestamps: true });

farmerSchema.index({ advisorId: 1 });

module.exports = mongoose.model('Farmer', farmerSchema);
