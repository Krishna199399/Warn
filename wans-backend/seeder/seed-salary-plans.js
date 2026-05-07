require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const SalaryPlan = require('../src/models/SalaryPlan');

// ─── Salary Plan Seed Data ───────────────────────────────────────────────────
// 3-level incremental system: Star → Ruby → Pearl
// Each level has fresh SV counter starting from 0
// ─────────────────────────────────────────────────────────────────────────────

const SALARY_PLANS = [
  // ── ADVISOR ─────────────────────────────────────────────────────────────────
  {
    role: 'ADVISOR',
    level: 'STAR',
    svTarget: 750000,        // 7.5L SV Points
    monthlySalaryAmount: 25000,  // 25,000 rupees/month
    rewardBenefits: [
      { name: 'Car Fund', rvAmount: 100000 },
      { name: 'SIP Investment', rvAmount: 150000 },
      { name: 'Kiran Fund', rvAmount: 200000 },
      { name: 'Bike Fund', rvAmount: 80000 },
      { name: 'Gold Fund', rvAmount: 120000 },
    ],
    description: '⭐ STAR Level - Entry level for advisors. Achieve 7.5L SV Points to unlock.',
  },
  {
    role: 'ADVISOR',
    level: 'RUBY',
    svTarget: 850000,        // 8.5L SV Points (fresh counter after Star)
    monthlySalaryAmount: 30000,  // 30,000 rupees/month
    rewardBenefits: [
      { name: 'Home Renovation', rvAmount: 250000 },
      { name: 'Education Fund', rvAmount: 300000 },
      { name: 'Health Insurance', rvAmount: 150000 },
      { name: 'Plot Fund', rvAmount: 350000 },
      { name: 'Hospital Fund', rvAmount: 200000 },
    ],
    description: '💎 RUBY Level - Mid-tier level. Unlocks after achieving STAR. Fresh 8.5L SV Points target.',
  },
  {
    role: 'ADVISOR',
    level: 'PEARL',
    svTarget: 1000000,       // 10L SV Points (fresh counter after Ruby)
    monthlySalaryAmount: 35000,  // 35,000 rupees/month
    rewardBenefits: [
      { name: 'International Trip', rvAmount: 400000 },
      { name: 'Retirement Fund', rvAmount: 500000 },
      { name: 'Business Expansion', rvAmount: 600000 },
      { name: 'Land Purchase Reserve', rvAmount: 700000 },
      { name: 'Home Buying Fund', rvAmount: 800000 },
    ],
    description: '🏆 PEARL Level - Top tier level. Unlocks after achieving RUBY. Fresh 10L SV Points target.',
  },

  // ── DO_MANAGER ──────────────────────────────────────────────────────────────
  {
    role: 'DO_MANAGER',
    level: 'STAR',
    svTarget: 1500000,       // 15L SV Points
    monthlySalaryAmount: 35000,  // 35,000 rupees/month
    rewardBenefits: [
      { name: 'Car Fund', rvAmount: 150000 },
      { name: 'SIP Investment', rvAmount: 200000 },
      { name: 'Kiran Fund', rvAmount: 250000 },
      { name: 'Bike Fund', rvAmount: 100000 },
      { name: 'Gold Fund', rvAmount: 150000 },
    ],
    description: '⭐ STAR Level - Entry level for DO Managers.',
  },
  {
    role: 'DO_MANAGER',
    level: 'RUBY',
    svTarget: 1750000,       // 17.5L SV Points
    monthlySalaryAmount: 40000,  // 40,000 rupees/month
    rewardBenefits: [
      { name: 'Home Renovation', rvAmount: 350000 },
      { name: 'Education Fund', rvAmount: 400000 },
      { name: 'Health Insurance', rvAmount: 200000 },
      { name: 'Plot Fund', rvAmount: 450000 },
      { name: 'Hospital Fund', rvAmount: 250000 },
    ],
    description: '💎 RUBY Level - Mid-tier for DO Managers.',
  },
  {
    role: 'DO_MANAGER',
    level: 'PEARL',
    svTarget: 2000000,       // 20L SV Points
    monthlySalaryAmount: 50000,  // 50,000 rupees/month
    rewardBenefits: [
      { name: 'International Trip', rvAmount: 500000 },
      { name: 'Retirement Fund', rvAmount: 600000 },
      { name: 'Business Expansion', rvAmount: 700000 },
      { name: 'Land Purchase Reserve', rvAmount: 800000 },
      { name: 'Home Buying Fund', rvAmount: 900000 },
    ],
    description: '🏆 PEARL Level - Top tier for DO Managers.',
  },

  // ── AREA_MANAGER ────────────────────────────────────────────────────────────
  {
    role: 'AREA_MANAGER',
    level: 'STAR',
    svTarget: 3000000,       // 30L SV Points
    monthlySalaryAmount: 50000,  // 50,000 rupees/month
    rewardBenefits: [
      { name: 'Car Fund', rvAmount: 200000 },
      { name: 'SIP Investment', rvAmount: 300000 },
      { name: 'Kiran Fund', rvAmount: 400000 },
      { name: 'Bike Fund', rvAmount: 150000 },
      { name: 'Gold Fund', rvAmount: 200000 },
    ],
    description: '⭐ STAR Level - Entry level for Area Managers.',
  },
  {
    role: 'AREA_MANAGER',
    level: 'RUBY',
    svTarget: 3500000,       // 35L SV Points
    monthlySalaryAmount: 60000,  // 60,000 rupees/month
    rewardBenefits: [
      { name: 'Home Renovation', rvAmount: 500000 },
      { name: 'Education Fund', rvAmount: 600000 },
      { name: 'Health Insurance', rvAmount: 300000 },
      { name: 'Plot Fund', rvAmount: 700000 },
      { name: 'Hospital Fund', rvAmount: 400000 },
    ],
    description: '💎 RUBY Level - Mid-tier for Area Managers.',
  },
  {
    role: 'AREA_MANAGER',
    level: 'PEARL',
    svTarget: 4000000,       // 40L SV Points
    monthlySalaryAmount: 70000, // 70,000 rupees/month
    rewardBenefits: [
      { name: 'International Trip', rvAmount: 700000 },
      { name: 'Retirement Fund', rvAmount: 800000 },
      { name: 'Business Expansion', rvAmount: 1000000 },
      { name: 'Land Purchase Reserve', rvAmount: 1200000 },
      { name: 'Home Buying Fund', rvAmount: 1500000 },
    ],
    description: '🏆 PEARL Level - Top tier for Area Managers.',
  },

  // ── ZONAL_MANAGER ───────────────────────────────────────────────────────────
  {
    role: 'ZONAL_MANAGER',
    level: 'STAR',
    svTarget: 6000000,       // 60L SV Points
    monthlySalaryAmount: 75000, // 75,000 rupees/month
    rewardBenefits: [
      { name: 'Car Fund', rvAmount: 300000 },
      { name: 'SIP Investment', rvAmount: 500000 },
      { name: 'Kiran Fund', rvAmount: 700000 },
      { name: 'Bike Fund', rvAmount: 250000 },
      { name: 'Gold Fund', rvAmount: 350000 },
    ],
    description: '⭐ STAR Level - Entry level for Zonal Managers.',
  },
  {
    role: 'ZONAL_MANAGER',
    level: 'RUBY',
    svTarget: 7000000,       // 70L SV Points
    monthlySalaryAmount: 85000, // 85,000 rupees/month
    rewardBenefits: [
      { name: 'Home Renovation', rvAmount: 800000 },
      { name: 'Education Fund', rvAmount: 1000000 },
      { name: 'Health Insurance', rvAmount: 500000 },
      { name: 'Plot Fund', rvAmount: 1200000 },
      { name: 'Hospital Fund', rvAmount: 700000 },
    ],
    description: '💎 RUBY Level - Mid-tier for Zonal Managers.',
  },
  {
    role: 'ZONAL_MANAGER',
    level: 'PEARL',
    svTarget: 8000000,       // 80L SV Points
    monthlySalaryAmount: 105000, // 105,000 rupees/month
    rewardBenefits: [
      { name: 'International Trip', rvAmount: 1200000 },
      { name: 'Retirement Fund', rvAmount: 1500000 },
      { name: 'Business Expansion', rvAmount: 2000000 },
      { name: 'Land Purchase Reserve', rvAmount: 2500000 },
      { name: 'Home Buying Fund', rvAmount: 3000000 },
    ],
    description: '🏆 PEARL Level - Top tier for Zonal Managers.',
  },

  // ── STATE_HEAD ──────────────────────────────────────────────────────────────
  {
    role: 'STATE_HEAD',
    level: 'STAR',
    svTarget: 12000000,      // 1.2Cr SV Points
    monthlySalaryAmount: 100000, // 100,000 rupees/month
    rewardBenefits: [
      { name: 'Car Fund', rvAmount: 500000 },
      { name: 'SIP Investment', rvAmount: 800000 },
      { name: 'Kiran Fund', rvAmount: 1000000 },
      { name: 'Bike Fund', rvAmount: 400000 },
      { name: 'Gold Fund', rvAmount: 600000 },
    ],
    description: '⭐ STAR Level - Entry level for State Heads.',
  },
  {
    role: 'STATE_HEAD',
    level: 'RUBY',
    svTarget: 14000000,      // 1.4Cr SV Points
    monthlySalaryAmount: 115000, // 115,000 rupees/month
    rewardBenefits: [
      { name: 'Home Renovation', rvAmount: 1200000 },
      { name: 'Education Fund', rvAmount: 1500000 },
      { name: 'Health Insurance', rvAmount: 800000 },
      { name: 'Plot Fund', rvAmount: 1800000 },
      { name: 'Hospital Fund', rvAmount: 1000000 },
    ],
    description: '💎 RUBY Level - Mid-tier for State Heads.',
  },
  {
    role: 'STATE_HEAD',
    level: 'PEARL',
    svTarget: 16000000,      // 1.6Cr SV Points
    monthlySalaryAmount: 125000, // 125,000 rupees/month
    rewardBenefits: [
      { name: 'International Trip', rvAmount: 2000000 },
      { name: 'Retirement Fund', rvAmount: 2500000 },
      { name: 'Business Expansion', rvAmount: 3000000 },
      { name: 'Land Purchase Reserve', rvAmount: 3500000 },
      { name: 'Home Buying Fund', rvAmount: 4000000 },
    ],
    description: '🏆 PEARL Level - Top tier for State Heads.',
  },
];

async function seedSalaryPlans() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing salary plans - force delete all
    const deleteResult = await SalaryPlan.deleteMany({});
    console.log(`🗑  Cleared ${deleteResult.deletedCount} existing salary plans`);

    // Insert new salary plans
    const plans = await SalaryPlan.insertMany(SALARY_PLANS);
    console.log(`📊 Created ${plans.length} salary plans`);
    
    // Verify ADVISOR STAR level has 5 benefits
    const advisorStar = plans.find(p => p.role === 'ADVISOR' && p.level === 'STAR');
    console.log(`\n🔍 ADVISOR STAR verification:`);
    console.log(`   Benefits count: ${advisorStar.rewardBenefits.length}`);
    console.log(`   Benefits: ${advisorStar.rewardBenefits.map(b => b.name).join(', ')}`);

    console.log('\n🎯 SALARY PLAN SUMMARY:');
    console.log('\n⭐ STAR → 💎 RUBY → 🏆 PEARL (3-level incremental system)');
    console.log('Each level has fresh SV counter starting from 0\n');

    const roles = ['ADVISOR', 'DO_MANAGER', 'AREA_MANAGER', 'ZONAL_MANAGER', 'STATE_HEAD'];
    for (const role of roles) {
      const rolePlans = plans.filter(p => p.role === role);
      console.log(`\n${role}:`);
      rolePlans.forEach(p => {
        console.log(`  ${p.level.padEnd(6)} → ${(p.svTarget / 100000).toFixed(1)}L SV Points → ${(p.monthlySalaryAmount / 1000).toFixed(0)}k points/month → ${p.rewardBenefits.length} benefits`);
      });
    }

    console.log('\n✅ Salary plan seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedSalaryPlans();
