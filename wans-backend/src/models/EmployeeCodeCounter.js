const mongoose = require('mongoose');

/**
 * EmployeeCodeCounter Model
 * Tracks the last generated employee code number for each role per year
 * Used to generate unique sequential employee codes like ADV-2025-0001
 */
const employeeCodeCounterSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['STATE_HEAD', 'ZONAL_MANAGER', 'AREA_MANAGER', 'DO_MANAGER', 'ADVISOR'],
  },
  year: {
    type: Number,
    required: true,
  },
  lastNumber: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Compound unique index to ensure one counter per role per year
employeeCodeCounterSchema.index({ role: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeCodeCounter', employeeCodeCounterSchema);
