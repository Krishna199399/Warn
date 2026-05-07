/**
 * Manual Reward Progress Update Script
 * 
 * This script manually updates reward progress for all users who have RV commissions.
 * Run this after the fix to ensure all existing users have their rewards updated.
 * 
 * Usage: node scripts/update-rewards-manually.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Commission = require('../src/models/Commission');
const { checkAndUpdateRewards, checkAndUpgradeLevel } = require('../src/controllers/salary.controller');

async function updateAllRewards() {
  try {
    console.log('🔄 Starting manual reward update...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database\n');

    // Get all approved users (excluding ADMIN and CUSTOMER)
    const users = await User.find({
      status: 'APPROVED',
      role: { $in: ['ADVISOR', 'DO_MANAGER', 'AREA_MANAGER', 'ZONAL_MANAGER', 'STATE_HEAD', 'WHOLESALE', 'MINI_STOCK'] }
    }).lean();

    console.log(`📊 Found ${users.length} users to update\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Update each user
    for (const user of users) {
      try {
        console.log(`\n👤 Processing: ${user.name} (${user.role}) - ${user.email}`);

        // Calculate fresh SV total
        const svAgg = await Commission.aggregate([
          { $match: { userId: user._id, type: 'SV' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalSv = svAgg[0]?.total || 0;

        // Calculate fresh RV total
        const rvAgg = await Commission.aggregate([
          { $match: { userId: user._id, type: 'RV' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalRv = rvAgg[0]?.total || 0;

        console.log(`   SV: ${totalSv.toLocaleString()} pts`);
        console.log(`   RV: ${totalRv.toLocaleString()} pts`);

        // Skip if no commissions
        if (totalSv === 0 && totalRv === 0) {
          console.log(`   ⏭️  Skipped (no commissions)`);
          skippedCount++;
          continue;
        }

        // Update salary level
        await checkAndUpgradeLevel(user._id, user.role, totalSv);

        // Update reward progress
        await checkAndUpdateRewards(user._id, user.role, totalRv);

        console.log(`   ✅ Updated successfully`);
        updatedCount++;

      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Users:    ${users.length}`);
    console.log(`✅ Updated:     ${updatedCount}`);
    console.log(`⏭️  Skipped:     ${skippedCount}`);
    console.log(`❌ Errors:      ${errorCount}`);
    console.log('='.repeat(60));

    console.log('\n✅ Manual reward update completed!\n');

  } catch (err) {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from database');
    process.exit(0);
  }
}

// Run the update
updateAllRewards();
