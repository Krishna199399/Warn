#!/usr/bin/env node
/**
 * Fix employeeCode duplicate key error
 * 
 * Problem: Multiple users have employeeCode: null, causing duplicate key errors
 * Solution: Remove null employeeCode values and rebuild the sparse index
 * 
 * Usage: node scripts/fix-employeeCode-duplicates.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function fixEmployeeCodeDuplicates() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Find all users with null employeeCode
    console.log('📊 Finding users with null employeeCode...');
    const usersWithNull = await User.find({ employeeCode: null });
    console.log(`Found ${usersWithNull.length} users with employeeCode: null\n`);

    // Step 2: Remove employeeCode field from these users
    console.log('🔧 Removing null employeeCode values...');
    const result = await User.updateMany(
      { employeeCode: null },
      { $unset: { employeeCode: "" } }
    );
    console.log(`✅ Updated ${result.modifiedCount} users\n`);

    // Step 3: Drop and recreate the index
    console.log('🗑️  Dropping old employeeCode index...');
    try {
      await User.collection.dropIndex('employeeCode_1');
      console.log('✅ Old index dropped\n');
    } catch (err) {
      if (err.code === 27) {
        console.log('ℹ️  Index does not exist, skipping drop\n');
      } else {
        throw err;
      }
    }

    console.log('🔨 Creating new sparse unique index...');
    await User.collection.createIndex(
      { employeeCode: 1 },
      { unique: true, sparse: true }
    );
    console.log('✅ New sparse index created\n');

    // Step 4: Verify the fix
    console.log('🔍 Verifying fix...');
    const remainingNulls = await User.countDocuments({ employeeCode: null });
    console.log(`Remaining users with null employeeCode: ${remainingNulls}`);

    const totalUsers = await User.countDocuments();
    const usersWithCode = await User.countDocuments({ employeeCode: { $exists: true, $ne: null } });
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with employeeCode: ${usersWithCode}`);
    console.log(`Users without employeeCode: ${totalUsers - usersWithCode}\n`);

    // Step 5: Show sample users
    console.log('📋 Sample users by role:');
    const roles = ['ADMIN', 'STATE_HEAD', 'ZONAL_MANAGER', 'AREA_MANAGER', 'DO_MANAGER', 'ADVISOR', 'WHOLESALE', 'MINI_STOCK', 'CUSTOMER'];
    for (const role of roles) {
      const count = await User.countDocuments({ role });
      const withCode = await User.countDocuments({ role, employeeCode: { $exists: true, $ne: null } });
      if (count > 0) {
        console.log(`  ${role}: ${count} total, ${withCode} with employeeCode`);
      }
    }

    console.log('\n✅ Fix completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your backend server: pm2 restart project-backend');
    console.log('2. Test user registration for CUSTOMER, WHOLESALE, MINI_STOCK');
    console.log('3. Test employee registration for ADVISOR, DO_MANAGER, etc.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the fix
fixEmployeeCodeDuplicates();
