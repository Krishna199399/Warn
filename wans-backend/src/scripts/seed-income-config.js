const mongoose = require('mongoose');
const IncomeConfig = require('../models/IncomeConfig');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const configs = [
  {
    role: 'ADVISOR',
    RP: 100,  // Advisor gets 100% of Retail Point
    IV: 0,    // Advisor doesn't get Incentive Value
    SV: 42,   // Advisor gets 42% of Salary Value
    RV: 42,   // Advisor gets 42% of Rewards Value
    description: 'Advisor commission structure'
  },
  {
    role: 'DO',
    RP: 0,    // DO doesn't get Retail Point
    IV: 42,   // DO gets 42% of Incentive Value
    SV: 23,   // DO gets 23% of Salary Value
    RV: 23,   // DO gets 23% of Rewards Value
    description: 'DO Manager commission structure'
  },
  {
    role: 'AM',
    RP: 0,    // Area Manager doesn't get Retail Point
    IV: 23,   // Area Manager gets 23% of Incentive Value
    SV: 15,   // Area Manager gets 15% of Salary Value
    RV: 15,   // Area Manager gets 15% of Rewards Value
    description: 'Area Manager commission structure'
  },
  {
    role: 'ZM',
    RP: 0,    // Zonal Manager doesn't get Retail Point
    IV: 15,   // Zonal Manager gets 15% of Incentive Value
    SV: 10,   // Zonal Manager gets 10% of Salary Value
    RV: 10,   // Zonal Manager gets 10% of Rewards Value
    description: 'Zonal Manager commission structure'
  },
  {
    role: 'SH',
    RP: 0,    // State Head doesn't get Retail Point
    IV: 10,   // State Head gets 10% of Incentive Value
    SV: 10,   // State Head gets 10% of Salary Value
    RV: 10,   // State Head gets 10% of Rewards Value
    description: 'State Head commission structure'
  }
];

async function seedIncomeConfig() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing configs
    await IncomeConfig.deleteMany({});
    console.log('🗑️  Cleared existing IncomeConfig records');

    // Insert new configs
    await IncomeConfig.insertMany(configs);
    console.log('✅ Seeded IncomeConfig collection with 5 roles');

    console.log('\n📊 Commission Structure:');
    console.log('Role     | RP  | IV  | SV  | RV');
    console.log('---------|-----|-----|-----|-----');
    configs.forEach(c => {
      console.log(`${c.role.padEnd(8)} | ${String(c.RP).padStart(3)}%| ${String(c.IV).padStart(3)}%| ${String(c.SV).padStart(3)}%| ${String(c.RV).padStart(3)}%`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding IncomeConfig:', error);
    process.exit(1);
  }
}

seedIncomeConfig();
