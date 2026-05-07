const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('../src/models/Order');
const Commission = require('../src/models/Commission');
const Visit = require('../src/models/Visit');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

async function clearOrders() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Clearing orders and related data...\n');

    // Delete orders
    const ordersDeleted = await Order.deleteMany({});
    console.log(`   Orders: ${ordersDeleted.deletedCount} deleted`);

    // Delete commissions (since they're tied to orders)
    const commissionsDeleted = await Commission.deleteMany({});
    console.log(`   Commissions: ${commissionsDeleted.deletedCount} deleted`);

    // Delete visits (since they're tied to orders)
    const visitsDeleted = await Visit.deleteMany({});
    console.log(`   Visits: ${visitsDeleted.deletedCount} deleted`);

    console.log('\n✅ Orders and related data cleared successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Total records deleted: ${ordersDeleted.deletedCount + commissionsDeleted.deletedCount + visitsDeleted.deletedCount}`);

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

clearOrders();
