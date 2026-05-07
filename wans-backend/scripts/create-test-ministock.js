const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

async function createTestMiniStock() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if test mini stock user already exists
    const existingUser = await User.findOne({ phone: '8888888888' });
    if (existingUser) {
      console.log('✅ Test Mini Stock user already exists:', existingUser.name);
      console.log('   Phone:', existingUser.phone);
      console.log('   Status:', existingUser.status);
      return;
    }

    // Create test mini stock user (pending approval)
    const testMiniStock = await User.create({
      name: 'Test Mini Stock Shop',
      email: '8888888888@wans.local',
      phone: '8888888888',
      password: 'password123',
      role: 'MINI_STOCK',
      shopName: 'Test Mini Stock Store',
      location: 'Test Village',
      status: 'PENDING', // Pending approval to demonstrate approval system
      avatar: 'TM',
      roleHistory: [{ role: 'MINI_STOCK', from: new Date(), to: null }],
    });

    console.log('✅ Test Mini Stock user created successfully!');
    console.log('   Name:', testMiniStock.name);
    console.log('   Phone:', testMiniStock.phone);
    console.log('   Password: password123');
    console.log('   Status:', testMiniStock.status);
    console.log('\n🔑 Login credentials (after approval):');
    console.log('   Phone: 8888888888');
    console.log('   Password: password123');
    console.log('\n⚠️  This user is PENDING approval. Admin needs to approve via /app/admin/shop-approvals');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createTestMiniStock();