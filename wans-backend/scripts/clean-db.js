const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');
const Inventory = require('../src/models/Inventory');
const Commission = require('../src/models/Commission');
const Notification = require('../src/models/Notification');
const Task = require('../src/models/Task');
const Farmer = require('../src/models/Farmer');
const StockLog = require('../src/models/StockLog');
const StockTransfer = require('../src/models/StockTransfer');
const Category = require('../src/models/Category');
const BankDetails = require('../src/models/BankDetails');
const Visit = require('../src/models/Visit');
const PayoutBatch = require('../src/models/PayoutBatch');
const PayoutRecord = require('../src/models/PayoutRecord');
const SalaryPlan = require('../src/models/SalaryPlan');
const UserRewardProgress = require('../src/models/UserRewardProgress');
const UserSalaryStatus = require('../src/models/UserSalaryStatus');
const IncomeConfig = require('../src/models/IncomeConfig');
const PoolConfig = require('../src/models/PoolConfig');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

async function cleanDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Deleting all data (keeping Employee/User data)...\n');

    // Delete all collections EXCEPT Users
    const ordersDeleted = await Order.deleteMany({});
    console.log(`   Orders: ${ordersDeleted.deletedCount} deleted`);

    const productsDeleted = await Product.deleteMany({});
    console.log(`   Products: ${productsDeleted.deletedCount} deleted`);

    const categoriesDeleted = await Category.deleteMany({});
    console.log(`   Categories: ${categoriesDeleted.deletedCount} deleted`);

    const inventoryDeleted = await Inventory.deleteMany({});
    console.log(`   Inventory: ${inventoryDeleted.deletedCount} deleted`);

    const commissionsDeleted = await Commission.deleteMany({});
    console.log(`   Commissions: ${commissionsDeleted.deletedCount} deleted`);

    const notificationsDeleted = await Notification.deleteMany({});
    console.log(`   Notifications: ${notificationsDeleted.deletedCount} deleted`);

    const tasksDeleted = await Task.deleteMany({});
    console.log(`   Tasks: ${tasksDeleted.deletedCount} deleted`);

    const farmersDeleted = await Farmer.deleteMany({});
    console.log(`   Farmers: ${farmersDeleted.deletedCount} deleted`);

    const visitsDeleted = await Visit.deleteMany({});
    console.log(`   Visits: ${visitsDeleted.deletedCount} deleted`);

    const stockLogsDeleted = await StockLog.deleteMany({});
    console.log(`   Stock Logs: ${stockLogsDeleted.deletedCount} deleted`);

    const stockTransfersDeleted = await StockTransfer.deleteMany({});
    console.log(`   Stock Transfers: ${stockTransfersDeleted.deletedCount} deleted`);

    const bankDetailsDeleted = await BankDetails.deleteMany({});
    console.log(`   Bank Details: ${bankDetailsDeleted.deletedCount} deleted`);

    const payoutBatchesDeleted = await PayoutBatch.deleteMany({});
    console.log(`   Payout Batches: ${payoutBatchesDeleted.deletedCount} deleted`);

    const payoutRecordsDeleted = await PayoutRecord.deleteMany({});
    console.log(`   Payout Records: ${payoutRecordsDeleted.deletedCount} deleted`);

    const userRewardProgressDeleted = await UserRewardProgress.deleteMany({});
    console.log(`   User Reward Progress: ${userRewardProgressDeleted.deletedCount} deleted`);

    const userSalaryStatusDeleted = await UserSalaryStatus.deleteMany({});
    console.log(`   User Salary Status: ${userSalaryStatusDeleted.deletedCount} deleted`);

    // Note: Income Config, Pool Config, and Salary Plans are preserved for system functionality

    const userCount = await User.countDocuments({});
    const incomeConfigCount = await IncomeConfig.countDocuments({});
    const poolConfigCount = await PoolConfig.countDocuments({});
    const salaryPlanCount = await SalaryPlan.countDocuments({});

    console.log(`\n   ✓ Users/Employees: ${userCount} preserved`);
    console.log(`   ✓ Income Config: ${incomeConfigCount} preserved`);
    console.log(`   ✓ Pool Config: ${poolConfigCount} preserved`);
    console.log(`   ✓ Salary Plans: ${salaryPlanCount} preserved`);

    console.log('\n✅ Database cleaned successfully!');
    console.log('\n⚠️  All data has been deleted except:');
    console.log('   • Employee/User data');
    console.log('   • Income Config (commission structure)');
    console.log('   • Pool Config (pool percentages)');
    console.log('   • Salary Plans (salary levels and rewards)');
    console.log('\n   You can now run seeders to populate fresh transactional data.');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

cleanDatabase();
