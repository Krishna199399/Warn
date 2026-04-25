const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

async function addIndexes() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    console.log('\n📊 Creating indexes for performance optimization...\n');

    // Users collection indexes
    await db.collection('users').createIndex({ parentId: 1 });
    console.log('✅ Created index: users.parentId');

    await db.collection('users').createIndex({ role: 1, status: 1 });
    console.log('✅ Created index: users.role + status');

    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log('✅ Created index: users.email (unique)');

    await db.collection('users').createIndex({ advisorCode: 1 }, { sparse: true });
    console.log('✅ Created index: users.advisorCode');

    // Orders collection indexes
    await db.collection('orders').createIndex({ advisorId: 1, status: 1 });
    console.log('✅ Created index: orders.advisorId + status');

    await db.collection('orders').createIndex({ sellerId: 1, status: 1 });
    console.log('✅ Created index: orders.sellerId + status');

    await db.collection('orders').createIndex({ buyerId: 1 });
    console.log('✅ Created index: orders.buyerId');

    await db.collection('orders').createIndex({ createdAt: -1 });
    console.log('✅ Created index: orders.createdAt (descending)');

    await db.collection('orders').createIndex({ date: -1 });
    console.log('✅ Created index: orders.date (descending)');

    // Commissions collection indexes
    await db.collection('commissions').createIndex({ userId: 1 });
    console.log('✅ Created index: commissions.userId');

    await db.collection('commissions').createIndex({ orderId: 1 });
    console.log('✅ Created index: commissions.orderId');

    // Inventory collection indexes
    await db.collection('inventories').createIndex({ userId: 1, productId: 1 });
    console.log('✅ Created index: inventories.userId + productId');

    console.log('\n✅ All indexes created successfully!');
    console.log('\n📈 Performance should be significantly improved for:');
    console.log('   - Dashboard loading');
    console.log('   - Hierarchy queries');
    console.log('   - Order filtering');
    console.log('   - Commission calculations');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

addIndexes();
