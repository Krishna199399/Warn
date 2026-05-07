require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const UserRewardProgress = require('../src/models/UserRewardProgress');
const SalaryPlan = require('../src/models/SalaryPlan');
const User = require('../src/models/User'); // Import User model for populate

/**
 * Fix existing UserRewardProgress records to match updated SalaryPlans
 * This script updates users who have old reward progress with only 3 benefits
 * to the new structure with 5 benefits per level
 */
async function fixRewardProgress() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all salary plans (should have 5 benefits each)
    const plans = await SalaryPlan.find({}).lean();
    console.log(`📊 Found ${plans.length} salary plans`);

    // Verify plans have 5 benefits
    const plansByRoleLevel = {};
    plans.forEach(plan => {
      const key = `${plan.role}_${plan.level}`;
      plansByRoleLevel[key] = plan;
      console.log(`   ${plan.role} ${plan.level}: ${plan.rewardBenefits.length} benefits`);
    });

    // Get all user reward progress records
    const progressRecords = await UserRewardProgress.find({}).populate('userId', 'name email role');
    console.log(`\n👥 Found ${progressRecords.length} user reward progress records`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;

    for (const progress of progressRecords) {
      let needsUpdate = false;
      const user = progress.userId;
      
      console.log(`\n🔍 Checking ${user.name} (${user.email}) - ${user.role}`);

      for (const levelProgress of progress.levelProgress) {
        const planKey = `${user.role}_${levelProgress.salaryLevel}`;
        const plan = plansByRoleLevel[planKey];

        if (!plan) {
          console.log(`   ⚠️ No plan found for ${planKey}`);
          continue;
        }

        const currentBenefitCount = levelProgress.benefits.length;
        const expectedBenefitCount = plan.rewardBenefits.length;

        console.log(`   ${levelProgress.salaryLevel}: ${currentBenefitCount} benefits (expected ${expectedBenefitCount})`);

        if (currentBenefitCount < expectedBenefitCount) {
          console.log(`   🔧 Fixing ${levelProgress.salaryLevel} level - adding missing benefits`);
          needsUpdate = true;

          // Get existing benefit names
          const existingBenefitNames = new Set(levelProgress.benefits.map(b => b.name));

          // Add missing benefits
          for (const planBenefit of plan.rewardBenefits) {
            if (!existingBenefitNames.has(planBenefit.name)) {
              console.log(`      ➕ Adding: ${planBenefit.name} (${planBenefit.rvAmount} RV)`);
              levelProgress.benefits.push({
                name: planBenefit.name,
                rvTarget: planBenefit.rvAmount,
                rvPointsTarget: planBenefit.rvAmount,
                earned: false,
                earnedAt: null,
              });
            }
          }

          console.log(`   ✅ ${levelProgress.salaryLevel} now has ${levelProgress.benefits.length} benefits`);
        } else if (currentBenefitCount === expectedBenefitCount) {
          console.log(`   ✅ ${levelProgress.salaryLevel} already has correct number of benefits`);
        }
      }

      if (needsUpdate) {
        await progress.save();
        fixedCount++;
        console.log(`   💾 Saved updated progress for ${user.name}`);
      } else {
        alreadyCorrectCount++;
        console.log(`   ✓ No changes needed for ${user.name}`);
      }
    }

    console.log('\n📈 SUMMARY:');
    console.log(`   Fixed: ${fixedCount} users`);
    console.log(`   Already correct: ${alreadyCorrectCount} users`);
    console.log(`   Total processed: ${progressRecords.length} users`);
    console.log('\n✅ Reward progress fix complete!');

    process.exit(0);
  } catch (err) {
    console.error('❌ Fix failed:', err);
    process.exit(1);
  }
}

fixRewardProgress();
