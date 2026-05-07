/**
 * Fix Employee Codes Script
 * 
 * This script finds all approved employees who don't have employee codes
 * and generates codes for them.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { generateEmployeeCode } = require('../src/utils/generateEmployeeCode');

const EMPLOYEE_ROLES = ['STATE_HEAD', 'ZONAL_MANAGER', 'AREA_MANAGER', 'DO_MANAGER', 'ADVISOR'];

async function fixEmployeeCodes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all approved employees without employee codes
    const employeesWithoutCodes = await User.find({
      role: { $in: EMPLOYEE_ROLES },
      $or: [
        { status: 'APPROVED' },
        { registrationStatus: 'approved' }
      ],
      $or: [
        { employeeCode: null },
        { employeeCode: { $exists: false } },
        { employeeCode: '' }
      ]
    });

    console.log(`\n📋 Found ${employeesWithoutCodes.length} employees without codes:\n`);

    if (employeesWithoutCodes.length === 0) {
      console.log('✅ All employees already have codes!');
      process.exit(0);
    }

    // Display employees
    employeesWithoutCodes.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.name} (${emp.role}) - ID: ${emp._id}`);
    });

    console.log('\n🔧 Generating employee codes...\n');

    // Generate codes for each employee
    let successCount = 0;
    let errorCount = 0;

    for (const employee of employeesWithoutCodes) {
      try {
        // Generate employee code
        const employeeCode = await generateEmployeeCode(employee.role);
        
        // Update employee
        employee.employeeCode = employeeCode;
        employee.status = 'APPROVED';
        employee.registrationStatus = 'approved';
        await employee.save();

        console.log(`✅ ${employee.name}: ${employeeCode}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed for ${employee.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully generated codes: ${successCount}`);
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount}`);
    }
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Script error:', error);
    process.exit(1);
  }
}

// Run the script
fixEmployeeCodes();
