const mongoose = require('mongoose');
const PoolConfig = require('../models/PoolConfig');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function seedPoolConfig() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing configs
    await PoolConfig.deleteMany({});
    console.log('🗑️  Cleared existing PoolConfig records');

    // Create default pool configuration
    const config = await PoolConfig.create({
      IV_PERCENT: 30,  // Incentive Value Pool: 30%
      SV_PERCENT: 30,  // Salary Value Pool: 30%
      RF_PERCENT: 20,  // Rewards Fund Pool: 20%
      isActive: true,
      version: 1,
      description: 'Default pool configuration - IV:30%, SV:30%, RF:20%',
      effectiveFrom: new Date()
    });

    console.log('✅ Seeded PoolConfig collection');
    console.log('\n📊 Pool Configuration:');
    console.log(`   IV (Incentive Value): ${config.IV_PERCENT}%`);
    console.log(`   SV (Salary Value):    ${config.SV_PERCENT}%`);
    console.log(`   RF (Rewards Fund):    ${config.RF_PERCENT}%`);
    console.log(`   Total Allocated:      ${config.IV_PERCENT + config.SV_PERCENT + config.RF_PERCENT}%`);
    console.log(`   Remaining:            ${100 - (config.IV_PERCENT + config.SV_PERCENT + config.RF_PERCENT)}%`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding PoolConfig:', error);
    process.exit(1);
  }
}

seedPoolConfig();
