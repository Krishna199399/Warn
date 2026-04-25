const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');
const Inventory = require('../src/models/Inventory');
const Commission = require('../src/models/Commission');
const Notification = require('../src/models/Notification');
const Task = require('../src/models/Task');
const PromotionRequest = require('../src/models/PromotionRequest');
const Farmer = require('../src/models/Farmer');
const StockLog = require('../src/models/StockLog');
const StockTransfer = require('../src/models/StockTransfer');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

async function cleanDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Deleting all data...\n');

    // Delete all collections
    const usersDeleted = await User.deleteMany({});
    console.log(`   Users: ${usersDeleted.deletedCount} deleted`);

    const ordersDeleted = await Order.deleteMany({});
    console.log(`   Orders: ${ordersDeleted.deletedCount} deleted`);

    const productsDeleted = await Product.deleteMany({});
    console.log(`   Products: ${productsDeleted.deletedCount} deleted`);

    const inventoryDeleted = await Inventory.deleteMany({});
    console.log(`   Inventory: ${inventoryDeleted.deletedCount} deleted`);

    const commissionsDeleted = await Commission.deleteMany({});
    console.log(`   Commissions: ${commissionsDeleted.deletedCount} deleted`);

    const notificationsDeleted = await Notification.deleteMany({});
    console.log(`   Notifications: ${notificationsDeleted.deletedCount} deleted`);

    const tasksDeleted = await Task.deleteMany({});
    console.log(`   Tasks: ${tasksDeleted.deletedCount} deleted`);

    const promotionsDeleted = await PromotionRequest.deleteMany({});
    console.log(`   Promotion Requests: ${promotionsDeleted.deletedCount} deleted`);

    const farmersDeleted = await Farmer.deleteMany({});
    console.log(`   Farmers: ${farmersDeleted.deletedCount} deleted`);

    const stockLogsDeleted = await StockLog.deleteMany({});
    console.log(`   Stock Logs: ${stockLogsDeleted.deletedCount} deleted`);

    const stockTransfersDeleted = await StockTransfer.deleteMany({});
    console.log(`   Stock Transfers: ${stockTransfersDeleted.deletedCount} deleted`);

    console.log('\n✅ Database cleaned successfully!');
    console.log('\n⚠️  All data has been deleted. You can now run seeders to populate fresh data.');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

cleanDatabase();
