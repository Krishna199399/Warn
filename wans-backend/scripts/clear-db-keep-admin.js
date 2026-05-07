require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Import all models
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');
const Inventory = require('../src/models/Inventory');
const Commission = require('../src/models/Commission');
const Visit = require('../src/models/Visit');
const Task = require('../src/models/Task');
const Farmer = require('../src/models/Farmer');
const Notification = require('../src/models/Notification');
const BankDetails = require('../src/models/BankDetails');
const BenefitClaim = require('../src/models/BenefitClaim');
const PaymentProof = require('../src/models/PaymentProof');
const PayoutBatch = require('../src/models/PayoutBatch');
const PayoutRecord = require('../src/models/PayoutRecord');
const StockLog = require('../src/models/StockLog');
const StockTransfer = require('../src/models/StockTransfer');
const UserRewardProgress = require('../src/models/UserRewardProgress');
const UserSalaryStatus = require('../src/models/UserSalaryStatus');
const EmployeeCodeCounter = require('../src/models/EmployeeCodeCounter');

// Configuration models to KEEP (seed files)
const IncomeConfig = require('../src/models/IncomeConfig');
const PoolConfig = require('../src/models/PoolConfig');
const SalaryPlan = require('../src/models/SalaryPlan');

async function clearDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get admin user before clearing
    const admin = await User.findOne({ email: 'admin@wans.com' });
    if (!admin) {
      console.log('⚠️  Admin user not found. Creating admin user...');
      const adminData = {
        name: 'Admin User',
        email: 'admin@wans.com',
        password: 'admin123',
        role: 'ADMIN',
        region: 'All India',
        state: 'All',
        avatar: 'AU',
        phone: '9876543210',
        status: 'APPROVED',
        roleHistory: [
          {
            role: 'ADMIN',
            from: new Date(),
            to: null
          }
        ]
      };
      await User.create(adminData);
      console.log('✅ Admin user created\n');
    }

    console.log('🗑️  Starting database cleanup...\n');

    // Clear all users except admin
    const deletedUsers = await User.deleteMany({ email: { $ne: 'admin@wans.com' } });
    console.log(`✅ Deleted ${deletedUsers.deletedCount} users (kept admin)`);

    // Clear all transactional data
    const deletedProducts = await Product.deleteMany({});
    console.log(`✅ Deleted ${deletedProducts.deletedCount} products`);

    const deletedCategories = await Category.deleteMany({});
    console.log(`✅ Deleted ${deletedCategories.deletedCount} categories`);

    const deletedOrders = await Order.deleteMany({});
    console.log(`✅ Deleted ${deletedOrders.deletedCount} orders`);

    const deletedInventory = await Inventory.deleteMany({});
    console.log(`✅ Deleted ${deletedInventory.deletedCount} inventory records`);

    const deletedCommissions = await Commission.deleteMany({});
    console.log(`✅ Deleted ${deletedCommissions.deletedCount} commissions`);

    const deletedVisits = await Visit.deleteMany({});
    console.log(`✅ Deleted ${deletedVisits.deletedCount} visits`);

    const deletedTasks = await Task.deleteMany({});
    console.log(`✅ Deleted ${deletedTasks.deletedCount} tasks`);

    const deletedFarmers = await Farmer.deleteMany({});
    console.log(`✅ Deleted ${deletedFarmers.deletedCount} farmers`);

    const deletedNotifications = await Notification.deleteMany({});
    console.log(`✅ Deleted ${deletedNotifications.deletedCount} notifications`);

    const deletedBankDetails = await BankDetails.deleteMany({});
    console.log(`✅ Deleted ${deletedBankDetails.deletedCount} bank details`);

    const deletedBenefitClaims = await BenefitClaim.deleteMany({});
    console.log(`✅ Deleted ${deletedBenefitClaims.deletedCount} benefit claims`);

    const deletedPaymentProofs = await PaymentProof.deleteMany({});
    console.log(`✅ Deleted ${deletedPaymentProofs.deletedCount} payment proofs`);

    const deletedPayoutBatches = await PayoutBatch.deleteMany({});
    console.log(`✅ Deleted ${deletedPayoutBatches.deletedCount} payout batches`);

    const deletedPayoutRecords = await PayoutRecord.deleteMany({});
    console.log(`✅ Deleted ${deletedPayoutRecords.deletedCount} payout records`);

    const deletedStockLogs = await StockLog.deleteMany({});
    console.log(`✅ Deleted ${deletedStockLogs.deletedCount} stock logs`);

    const deletedStockTransfers = await StockTransfer.deleteMany({});
    console.log(`✅ Deleted ${deletedStockTransfers.deletedCount} stock transfers`);

    const deletedRewardProgress = await UserRewardProgress.deleteMany({});
    console.log(`✅ Deleted ${deletedRewardProgress.deletedCount} reward progress records`);

    const deletedSalaryStatus = await UserSalaryStatus.deleteMany({});
    console.log(`✅ Deleted ${deletedSalaryStatus.deletedCount} salary status records`);

    const deletedEmployeeCodes = await EmployeeCodeCounter.deleteMany({});
    console.log(`✅ Deleted ${deletedEmployeeCodes.deletedCount} employee code counters`);

    // Count configuration records (NOT deleted)
    const incomeConfigCount = await IncomeConfig.countDocuments();
    const poolConfigCount = await PoolConfig.countDocuments();
    const salaryPlanCount = await SalaryPlan.countDocuments();

    console.log('\n📋 Configuration files preserved:');
    console.log(`   ✅ Income Configs: ${incomeConfigCount}`);
    console.log(`   ✅ Pool Configs: ${poolConfigCount}`);
    console.log(`   ✅ Salary Plans: ${salaryPlanCount}`);

    console.log('\n✨ Database cleanup completed successfully!');
    console.log('\n👤 Admin credentials:');
    console.log('   📧 Email: admin@wans.com');
    console.log('   🔑 Password: admin123');

    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
