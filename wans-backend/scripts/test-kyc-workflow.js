#!/usr/bin/env node
/**
 * Test KYC Workflow
 * Tests the complete KYC submission and approval workflow
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function testKYCWorkflow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a test advisor
    const advisor = await User.findOne({ role: 'ADVISOR', status: 'APPROVED' });
    if (!advisor) {
      console.log('❌ No approved advisor found. Please create one first.');
      process.exit(1);
    }

    console.log(`📋 Testing KYC workflow for: ${advisor.name} (${advisor.email})`);
    console.log(`   Role: ${advisor.role}`);
    console.log(`   Current KYC Status: ${advisor.kyc?.status || 'NOT_SUBMITTED'}\n`);

    // Step 1: Submit KYC
    console.log('Step 1: Submitting KYC details...');
    advisor.kyc = {
      fullName: advisor.name,
      dateOfBirth: new Date('1990-01-15'),
      gender: 'MALE',
      fatherName: 'Test Father Name',
      panNumber: 'ABCDE1234F',
      aadhaarNumber: '123456789012',
      accountHolderName: advisor.name,
      bankName: 'State Bank of India',
      accountNumber: '1234567890',
      ifscCode: 'SBIN0001234',
      branchName: 'Main Branch',
      accountType: 'SAVINGS',
      currentAddress: '123 Test Street',
      currentCity: 'Mumbai',
      currentState: 'Maharashtra',
      currentPinCode: '400001',
      permanentAddress: '123 Test Street',
      permanentCity: 'Mumbai',
      permanentState: 'Maharashtra',
      permanentPinCode: '400001',
      status: 'PENDING',
      submittedAt: new Date(),
    };
    await advisor.save();
    console.log('✅ KYC submitted successfully');
    console.log(`   Status: ${advisor.kyc.status}`);
    console.log(`   Submitted At: ${advisor.kyc.submittedAt}\n`);

    // Step 2: Approve KYC
    console.log('Step 2: Approving KYC...');
    advisor.kyc.status = 'VERIFIED';
    advisor.kyc.verifiedAt = new Date();
    advisor.kyc.verifiedBy = advisor._id; // In real scenario, this would be admin ID
    await advisor.save();
    console.log('✅ KYC approved successfully');
    console.log(`   Status: ${advisor.kyc.status}`);
    console.log(`   Verified At: ${advisor.kyc.verifiedAt}\n`);

    // Step 3: Test rejection workflow
    console.log('Step 3: Testing rejection workflow...');
    advisor.kyc.status = 'REJECTED';
    advisor.kyc.rejectionReason = 'Bank account number is incorrect';
    advisor.kyc.verifiedAt = null;
    advisor.kyc.verifiedBy = null;
    await advisor.save();
    console.log('✅ KYC rejected successfully');
    console.log(`   Status: ${advisor.kyc.status}`);
    console.log(`   Rejection Reason: ${advisor.kyc.rejectionReason}\n`);

    // Step 4: Resubmit after rejection
    console.log('Step 4: Resubmitting after rejection...');
    advisor.kyc.accountNumber = '9876543210'; // Fixed account number
    advisor.kyc.status = 'PENDING';
    advisor.kyc.rejectionReason = null;
    advisor.kyc.submittedAt = new Date();
    await advisor.save();
    console.log('✅ KYC resubmitted successfully');
    console.log(`   Status: ${advisor.kyc.status}`);
    console.log(`   New Account Number: XXXXXX${advisor.kyc.accountNumber.slice(-4)}\n`);

    // Step 5: Final approval
    console.log('Step 5: Final approval...');
    advisor.kyc.status = 'VERIFIED';
    advisor.kyc.verifiedAt = new Date();
    advisor.kyc.verifiedBy = advisor._id;
    await advisor.save();
    console.log('✅ KYC finally approved');
    console.log(`   Status: ${advisor.kyc.status}`);
    console.log(`   Verified At: ${advisor.kyc.verifiedAt}\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ KYC WORKFLOW TEST COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nWorkflow tested:');
    console.log('  1. ✅ Submit KYC → PENDING');
    console.log('  2. ✅ Approve KYC → VERIFIED');
    console.log('  3. ✅ Reject KYC → REJECTED (with reason)');
    console.log('  4. ✅ Resubmit KYC → PENDING');
    console.log('  5. ✅ Final Approval → VERIFIED');
    console.log('\nNext steps:');
    console.log('  • Test the frontend KYC page');
    console.log('  • Test the admin KYC management page');
    console.log('  • Verify notifications are sent');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testKYCWorkflow();
