require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Commission = require('../src/models/Commission');
const UserRewardProgress = require('../src/models/UserRewardProgress');
const SalaryPlan = require('../src/models/SalaryPlan');

async function fixMohanRewards() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find Mohan Verma (Advisor)
    const user = await User.findOne({ name: /mohan.*verma/i, role: 'ADVISOR' });
    if (!user) {
      console.log('❌ Mohan Verma not found');
      process.exit(1);
    }

    console.log(`\n👤 Found user: ${user.name} (${user.email})`);
    console.log(`   Role: ${user.role}`);

    // Calculate total RV
    const rvAgg = await Commission.aggregate([
      { $match: { userId: user._id, type: 'RV' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRv = rvAgg[0]?.total || 0;
    console.log(`\n💰 Total RV Earned: ${totalRv.toLocaleString()} pts`);

    // Get STAR level plan
    const starPlan = await SalaryPlan.findOne({ role: 'ADVISOR', level: 'STAR' });
    if (!starPlan) {
      console.log('❌ STAR plan not found');
      process.exit(1);
    }

    console.log(`\n⭐ STAR Level Benefits:`);
    starPlan.rewardBenefits.forEach((b, i) => {
      console.log(`   ${i + 1}. ${b.name} - ${b.rvAmount.toLocaleString()} RV`);
    });

    // Get or create reward progress
    let progress = await UserRewardProgress.findOne({ userId: user._id });
    if (!progress) {
      console.log('\n📝 Creating new reward progress...');
      progress = new UserRewardProgress({
        userId: user._id,
        role: user.role,
        levelProgress: [],
      });
    }

    // Find or create STAR level progress
    let starProgress = progress.levelProgress.find(l => l.salaryLevel === 'STAR');
    if (!starProgress) {
      console.log('\n🎯 Creating STAR level progress...');
      progress.levelProgress.push({
        salaryLevel: 'STAR',
        isActive: true,
        activatedAt: new Date(),
        currentBenefitIdx: 0,
        rvBaseline: 0,
        rvPointsBaseline: 0,
        benefits: starPlan.rewardBenefits.map(b => ({
          name: b.name,
          rvTarget: b.rvAmount,
          rvPointsTarget: b.rvAmount,
          earned: false,
          earnedAt: null,
        })),
      });
      starProgress = progress.levelProgress[progress.levelProgress.length - 1];
    }

    console.log(`\n📊 Current Progress:`);
    console.log(`   Current Benefit Index: ${starProgress.currentBenefitIdx}`);
    console.log(`   RV Baseline: ${starProgress.rvBaseline || starProgress.rvPointsBaseline || 0}`);
    console.log(`   Benefits:`);
    starProgress.benefits.forEach((b, i) => {
      console.log(`   ${i + 1}. ${b.name} - ${b.earned ? '✅ Earned' : '❌ Not Earned'} (Target: ${b.rvTarget || b.rvPointsTarget})`);
    });

    // Recalculate benefits
    console.log(`\n🔄 Recalculating benefits...`);
    let currentBaseline = 0;
    let benefitsEarned = 0;

    for (let i = 0; i < starProgress.benefits.length; i++) {
      const benefit = starProgress.benefits[i];
      const rvForBenefit = totalRv - currentBaseline;
      const target = benefit.rvTarget || benefit.rvPointsTarget;

      console.log(`\n   Benefit ${i + 1}: ${benefit.name}`);
      console.log(`      Target: ${target.toLocaleString()} RV`);
      console.log(`      RV Available: ${rvForBenefit.toLocaleString()} RV`);
      console.log(`      Current Baseline: ${currentBaseline.toLocaleString()} RV`);

      if (rvForBenefit >= target) {
        // Benefit should be earned
        if (!benefit.earned) {
          console.log(`      ✅ Marking as EARNED`);
          benefit.earned = true;
          benefit.earnedAt = new Date();
        } else {
          console.log(`      ✅ Already earned`);
        }
        currentBaseline += target; // Move baseline forward
        benefitsEarned++;
      } else {
        // This is the active benefit
        console.log(`      🎯 ACTIVE - ${(target - rvForBenefit).toLocaleString()} RV remaining`);
        break;
      }
    }

    // Update progress
    starProgress.currentBenefitIdx = benefitsEarned;
    starProgress.rvBaseline = currentBaseline;
    starProgress.rvPointsBaseline = currentBaseline;
    progress.lastUpdated = new Date();

    await progress.save();

    console.log(`\n✅ Updated Progress:`);
    console.log(`   Benefits Earned: ${benefitsEarned}/${starProgress.benefits.length}`);
    console.log(`   Current Benefit Index: ${starProgress.currentBenefitIdx}`);
    console.log(`   New RV Baseline: ${starProgress.rvBaseline}`);

    console.log('\n✅ Fix complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

fixMohanRewards();
