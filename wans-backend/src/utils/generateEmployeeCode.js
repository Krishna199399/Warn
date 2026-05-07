const EmployeeCodeCounter = require('../models/EmployeeCodeCounter');

/**
 * Role prefix mapping for employee codes
 */
const ROLE_PREFIXES = {
  STATE_HEAD: 'STH',
  ZONAL_MANAGER: 'ZNM',
  AREA_MANAGER: 'ARM',
  DO_MANAGER: 'DOM',
  ADVISOR: 'ADV',
};

/**
 * Generate unique employee code for a given role
 * Format: PREFIX-YEAR-NUMBER
 * Example: ADV-2025-0001, DOM-2025-0042
 * 
 * @param {String} role - Employee role (STATE_HEAD, ZONAL_MANAGER, etc.)
 * @returns {Promise<String>} Generated employee code
 */
async function generateEmployeeCode(role) {
  const prefix = ROLE_PREFIXES[role];
  
  if (!prefix) {
    throw new Error(`Invalid role for employee code generation: ${role}`);
  }

  const currentYear = new Date().getFullYear();

  // Use findOneAndUpdate with upsert to atomically increment the counter
  // This prevents race conditions when multiple approvals happen simultaneously
  const counter = await EmployeeCodeCounter.findOneAndUpdate(
    { role, year: currentYear },
    { $inc: { lastNumber: 1 } },
    { 
      new: true, // Return updated document
      upsert: true, // Create if doesn't exist
      setDefaultsOnInsert: true 
    }
  );

  // Format number with leading zeros (4 digits)
  const number = String(counter.lastNumber).padStart(4, '0');

  // Return formatted code: PREFIX-YEAR-NUMBER
  return `${prefix}-${currentYear}-${number}`;
}

/**
 * Get the next employee code without incrementing (for preview)
 * 
 * @param {String} role - Employee role
 * @returns {Promise<String>} Next employee code that will be generated
 */
async function previewNextEmployeeCode(role) {
  const prefix = ROLE_PREFIXES[role];
  
  if (!prefix) {
    throw new Error(`Invalid role for employee code generation: ${role}`);
  }

  const currentYear = new Date().getFullYear();

  const counter = await EmployeeCodeCounter.findOne({ role, year: currentYear });
  const nextNumber = counter ? counter.lastNumber + 1 : 1;
  const number = String(nextNumber).padStart(4, '0');

  return `${prefix}-${currentYear}-${number}`;
}

/**
 * Validate employee code format
 * 
 * @param {String} code - Employee code to validate
 * @returns {Boolean} True if valid format
 */
function isValidEmployeeCode(code) {
  // Format: PREFIX-YEAR-NUMBER (e.g., ADV-2025-0001)
  const pattern = /^(STH|ZNM|ARM|DOM|ADV)-\d{4}-\d{4}$/;
  return pattern.test(code);
}

/**
 * Parse employee code to extract role, year, and number
 * 
 * @param {String} code - Employee code
 * @returns {Object} { prefix, year, number, role }
 */
function parseEmployeeCode(code) {
  if (!isValidEmployeeCode(code)) {
    throw new Error('Invalid employee code format');
  }

  const [prefix, year, number] = code.split('-');
  
  // Reverse lookup role from prefix
  const role = Object.keys(ROLE_PREFIXES).find(key => ROLE_PREFIXES[key] === prefix);

  return {
    prefix,
    year: parseInt(year),
    number: parseInt(number),
    role,
  };
}

module.exports = {
  generateEmployeeCode,
  previewNextEmployeeCode,
  isValidEmployeeCode,
  parseEmployeeCode,
  ROLE_PREFIXES,
};
