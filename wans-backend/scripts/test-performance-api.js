const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const { getPerformanceStats } = require('../src/services/hierarchy.service');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

async function testPerformanceAPI() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the first advisor
    const advisor = await User.findOne({ role: 'ADVISOR' }).sort({ createdAt: 1 });
    if (!advisor) {
      console.error('❌ No advisor found');
      process.exit(1);
    }

    console.log(`👤 Testing performance API for:`);
    console.log(`   Name: ${advisor.name}`);
    console.log(`   Email: ${advisor.email}`);
    console.log(`   Code: ${advisor.advisorCode}`);
    console.log(`   ID: ${advisor._id}\n`);

    // Call the same function the API uses
    console.log('📊 Calling getPerformanceStats()...\n');
    const stats = await getPerformanceStats(advisor._id);

    console.log('✅ Performance Stats:');
    console.log(JSON.stringify(stats, null, 2));

    console.log('\n📈 Key Metrics:');
    console.log(`   Total Sales: ₹${stats.totalSales?.toLocaleString() || 0}`);
    console.log(`   Team Size: ${stats.teamSize || 0}`);
    console.log(`   Monthly Performance: ${stats.monthlyPerformance?.length || 0} months`);

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testPerformanceAPI();
