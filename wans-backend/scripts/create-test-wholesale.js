const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

async function createTestWholesale() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if test wholesale user already exists
    const existingUser = await User.findOne({ phone: '9999999999' });
    if (existingUser) {
      console.log('✅ Test Wholesale user already exists:', existingUser.name);
      console.log('   Phone:', existingUser.phone);
      console.log('   Status:', existingUser.status);
      console.log('   UPI ID:', existingUser.upiId || 'Not set');
      return;
    }

    // Create test wholesale user
    const testWholesale = await User.create({
      name: 'Test Wholesale Shop',
      email: '9999999999@wans.local',
      phone: '9999999999',
      password: 'password123',
      role: 'WHOLESALE',
      shopName: 'Test Wholesale Store',
      location: 'Test City',
      upiId: 'testwholesale@upi',
      status: 'APPROVED', // Pre-approved for testing
      avatar: 'TW',
      roleHistory: [{ role: 'WHOLESALE', from: new Date(), to: null }],
    });

    console.log('✅ Test Wholesale user created successfully!');
    console.log('   Name:', testWholesale.name);
    console.log('   Phone:', testWholesale.phone);
    console.log('   Password: password123');
    console.log('   Status:', testWholesale.status);
    console.log('   UPI ID:', testWholesale.upiId);
    console.log('\n🔑 Login credentials:');
    console.log('   Phone: 9999999999');
    console.log('   Password: password123');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createTestWholesale();