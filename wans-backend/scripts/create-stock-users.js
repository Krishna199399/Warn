const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

async function createStockUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if users already exist
    const wholesaleExists = await User.findOne({ email: 'wholesale@wans.com' });
    const miniStockExists = await User.findOne({ email: 'ministock@wans.com' });

    // Create Wholesale user
    if (!wholesaleExists) {
      const wholesale = await User.create({
        name: 'Wholesale Store',
        email: 'wholesale@wans.com',
        password: 'wholesale123', // Will be hashed by pre-save hook
        phone: '9876543210',
        role: 'WHOLESALE',
        status: 'APPROVED',
        region: 'Karnataka',
        shopName: 'WANS Wholesale Hub',
      });
      console.log('✅ Created Wholesale user');
      console.log(`   Email: ${wholesale.email}`);
      console.log(`   Password: wholesale123`);
    } else {
      console.log('⚠️  Wholesale user already exists');
      console.log(`   Email: ${wholesaleExists.email}`);
      console.log(`   Password: wholesale123`);
    }

    // Create Mini Stock user
    if (!miniStockExists) {
      const miniStock = await User.create({
        name: 'Mini Stock Shop',
        email: 'ministock@wans.com',
        password: 'ministock123', // Will be hashed by pre-save hook
        phone: '9876543211',
        role: 'MINI_STOCK',
        status: 'APPROVED',
        region: 'Karnataka - Bangalore',
        shopName: 'WANS Mini Stock Store',
      });
      console.log('✅ Created Mini Stock user');
      console.log(`   Email: ${miniStock.email}`);
      console.log(`   Password: ministock123`);
    } else {
      console.log('⚠️  Mini Stock user already exists');
      console.log(`   Email: ${miniStockExists.email}`);
      console.log(`   Password: ministock123`);
    }

    console.log('\n📋 Summary of Stock Users:');
    console.log('─────────────────────────────────────────────────────');
    console.log('WHOLESALE:');
    console.log('  Email: wholesale@wans.com');
    console.log('  Password: wholesale123');
    console.log('\nMINI STOCK:');
    console.log('  Email: ministock@wans.com');
    console.log('  Password: ministock123');
    console.log('─────────────────────────────────────────────────────');

  } catch (err) {
    console.error('❌ Error creating stock users:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createStockUsers();
