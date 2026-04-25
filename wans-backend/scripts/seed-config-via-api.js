require('dotenv').config();
const mongoose = require('mongoose');
const PoolConfig = require('../src/models/PoolConfig');
const IncomeConfig = require('../src/models/IncomeConfig');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

// Default configuration based on your handwritten image
const DEFAULT_POOL_CONFIG = {
  IV_PERCENT: 30,
  SV_PERCENT: 30,
  RF_PERCENT: 20,
  description: 'Default pool configuration - 30% IV, 30% SV, 20% RF (20% company margin)',
  isActive: true,
  version: 1
};

const DEFAULT_INCOME_CONFIGS = [
  {
    role: 'ADVISOR',
    IV: 0,
    SV: 42,
    RF: 42,
    description: 'Advisor income distribution - generates 100% RV, participates in SV and RF only',
    isActive: true,
    version: 1
  },
  {
    role: 'DO',
    IV: 42,
    SV: 23,
    RF: 23,
    description: 'DO Manager income distribution',
    isActive: true,
    version: 1
  },
  {
    role: 'AM',
    IV: 23,
    SV: 15,
    RF: 15,
    description: 'Area Manager income distribution',
    isActive: true,
    version: 1
  },
  {
    role: 'ZM',
    IV: 15,
    SV: 10,
    RF: 10,
    description: 'Zonal Manager income distribution',
    isActive: true,
    version: 1
  },
  {
    role: 'SH',
    IV: 10,
    SV: 10,
    RF: 10,
    description: 'State Head income distribution',
    isActive: true,
    version: 1
  }
];

async function seedIncomeConfig() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing configs
    await PoolConfig.deleteMany({});
    await IncomeConfig.deleteMany({});
    console.log('🗑️  Cleared existing configurations');

    // Create pool config
    const poolConfig = await PoolConfig.create(DEFAULT_POOL_CONFIG);
    console.log('✅ Created pool configuration');
    console.log(`   IV: ${poolConfig.IV_PERCENT}%`);
    console.log(`   SV: ${poolConfig.SV_PERCENT}%`);
    console.log(`   RF: ${poolConfig.RF_PERCENT}%`);
    console.log(`   Company Margin: ${100 - (poolConfig.IV_PERCENT + poolConfig.SV_PERCENT + poolConfig.RF_PERCENT)}%`);

    // Create income configs
    const incomeConfigs = await IncomeConfig.insertMany(DEFAULT_INCOME_CONFIGS);
    console.log(`\n✅ Created ${incomeConfigs.length} income configurations:`);
    console.log('─────────────────────────────────────────────────────────');
    console.log('Role      | IV    | SV    | RF    | Total');
    console.log('─────────────────────────────────────────────────────────');
    
    incomeConfigs.forEach(config => {
      const total = config.IV + config.SV + config.RF;
      console.log(`${config.role.padEnd(9)} | ${String(config.IV).padStart(4)}% | ${String(config.SV).padStart(4)}% | ${String(config.RF).padStart(4)}% | ${String(total).padStart(4)}%`);
    });
    console.log('─────────────────────────────────────────────────────────');

    // Validation summary
    console.log('\n📊 Validation Summary:');
    console.log(`   Total pool allocation: ${poolConfig.IV_PERCENT + poolConfig.SV_PERCENT + poolConfig.RF_PERCENT}%`);
    console.log(`   Company margin: ${100 - (poolConfig.IV_PERCENT + poolConfig.SV_PERCENT + poolConfig.RF_PERCENT)}%`);
    
    // Calculate example distribution
    console.log('\n💰 Example Distribution (₹1000 sale):');
    const RV = 1000;
    const pools = {
      IV: (RV * poolConfig.IV_PERCENT) / 100,
      SV: (RV * poolConfig.SV_PERCENT) / 100,
      RF: (RV * poolConfig.RF_PERCENT) / 100
    };
    
    console.log(`   IV Pool: ₹${pools.IV}`);
    console.log(`   SV Pool: ₹${pools.SV}`);
    console.log(`   RF Pool: ₹${pools.RF}`);
    console.log(`   Company: ₹${RV - pools.IV - pools.SV - pools.RF}`);
    
    console.log('\n   Distribution per role:');
    incomeConfigs.forEach(config => {
      const iv = (pools.IV * config.IV) / 100;
      const sv = (pools.SV * config.SV) / 100;
      const rf = (pools.RF * config.RF) / 100;
      const directSale = config.role === 'ADVISOR' ? RV : 0;
      const total = directSale + iv + sv + rf;
      
      if (config.role === 'ADVISOR') {
        console.log(`   ${config.role}: ₹${total.toFixed(2)} (Direct: ₹${directSale.toFixed(2)}, SV: ₹${sv.toFixed(2)}, RF: ₹${rf.toFixed(2)})`);
      } else {
        console.log(`   ${config.role}: ₹${total.toFixed(2)} (IV: ₹${iv.toFixed(2)}, SV: ₹${sv.toFixed(2)}, RF: ₹${rf.toFixed(2)})`);
      }
    });

    console.log('\n🎉 Income distribution configuration seeded successfully!');

  } catch (err) {
    console.error('❌ Error seeding income config:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

seedIncomeConfig();
