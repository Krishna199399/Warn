require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const SalaryPlan = require('../src/models/SalaryPlan');
const UserRewardProgress = require('../src/models/UserRewardProgress');

// ─────────────────────────────────────────────────────────────────────────────
// FIX STAR LEVEL BENEFITS
// This script updates existing UserRewardProgress documents to match the new
// SalaryPlan with 5 benefits per level instead of 3
// ─────────────────────────────────────────────────────────────────────────────

async function fixStarBenefits() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get the updated ADVISOR STAR plan with 5 benefits
    const advisorStarPlan = await SalaryPlan.findOne({ role: 'ADVISOR', level: 'STAR' }).lean();
    if (!advisorStarPlan) {
      console.error('❌ ADVISOR STAR plan not found. Run seed-salary-plans.js first!');
      process.exit(1);
    }

    console.log(`\n📋 ADVISOR STAR plan has ${advisorStarPlan.rewardBenefits.length} benefits:`);
    advisorStarPlan.rewardBenefits.forEach((b, i) => {
      console.log(`   ${i + 1}. ${b.name} - ₹${b.rvAmount.toLocaleString('en-IN')}`);
    });

    // Find all ADVISOR users with reward progress
    const allProgress = await UserRewardProgress.find({ role: 'ADVISOR' });
    console.log(`\n🔍 Found ${allProgress.length} ADVISOR users with reward progress`);

    let updatedCount = 0;

    for (const progress of allProgress) {
      const starLevel = progress.levelProgress.find(l => l.salaryLevel === 'STAR');
      
      if (!starLevel) {
        console.log(`   ⚠️  User ${progress.userId} has no STAR level progress - skipping`);
        continue;
      }

      const currentBenefitCount = starLevel.benefits.length;
      
      if (currentBenefitCount === 5) {
        console.log(`   ✅ User ${progress.userId} already has 5 STAR benefits - skipping`);
        continue;
      }

      console.log(`   🔧 User ${progress.userId} has ${currentBenefitCount} STAR benefits - updating to 5...`);

      // Get the current earned benefits
      const earnedBenefits = starLevel.benefits.filter(b => b.earned);
      console.log(`      Already earned: ${earnedBenefits.map(b => b.name).join(', ') || 'none'}`);

      // Rebuild the benefits array with all 5 benefits from the plan
      const newBenefits = advisorStarPlan.rewardBenefits.map(planBenefit => {
        // Check if this benefit was already earned (by name match)
        const existingBenefit = starLevel.benefits.find(b => b.name === planBenefit.name);
        
        if (existingBenefit && existingBenefit.earned) {
          // Keep the earned status and date
          return {
            name: planBenefit.name,
            rvTarget: planBenefit.rvAmount,
            earned: true,
            earnedAt: existingBenefit.earnedAt,
          };
        } else {
          // New benefit or not yet earned
          return {
            name: planBenefit.name,
            rvTarget: planBenefit.rvAmount,
            earned: false,
            earnedAt: null,
          };
        }
      });

      // Update the STAR level benefits
      starLevel.benefits = newBenefits;

      // Adjust currentBenefitIdx if needed
      const earnedCount = newBenefits.filter(b => b.earned).length;
      starLevel.currentBenefitIdx = earnedCount;

      // Save the updated progress
      await progress.save();
      updatedCount++;

      console.log(`      ✅ Updated! Now has ${newBenefits.length} benefits, ${earnedCount} earned`);
    }

    console.log(`\n✅ Migration complete! Updated ${updatedCount} users`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

fixStarBenefits();
