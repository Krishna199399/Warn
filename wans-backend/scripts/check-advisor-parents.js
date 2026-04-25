const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

async function checkAdvisorParents() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all advisors
    const advisors = await User.find({ role: 'ADVISOR' })
      .populate('parentId', 'name role advisorCode phone')
      .select('_id name email phone advisorCode parentId status')
      .sort({ createdAt: 1 })
      .lean();

    console.log(`📊 Found ${advisors.length} advisors\n`);

    for (const advisor of advisors) {
      console.log(`\n👤 Advisor: ${advisor.name}`);
      console.log(`   Email: ${advisor.email}`);
      console.log(`   Phone: ${advisor.phone}`);
      console.log(`   Code: ${advisor.advisorCode}`);
      console.log(`   Status: ${advisor.status}`);
      console.log(`   Parent ID (raw): ${advisor.parentId}`);
      
      if (advisor.parentId) {
        console.log(`   ✅ Parent: ${advisor.parentId.name}`);
        console.log(`   Parent Role: ${advisor.parentId.role}`);
        console.log(`   Parent Code: ${advisor.parentId.advisorCode || advisor.parentId.phone}`);
      } else {
        console.log(`   ⚠️  NO PARENT ASSIGNED`);
      }
      console.log('   ' + '─'.repeat(60));
    }

    // Check DO Managers available for assignment
    console.log('\n\n📋 Available DO Managers:\n');
    const doManagers = await User.find({ 
      role: 'DO_MANAGER',
      status: 'APPROVED'
    })
      .select('_id name advisorCode phone region')
      .lean();

    if (doManagers.length === 0) {
      console.log('⚠️  No approved DO Managers found!');
    } else {
      doManagers.forEach((dm, idx) => {
        console.log(`${idx + 1}. ${dm.name}`);
        console.log(`   Code: ${dm.advisorCode || 'N/A'}`);
        console.log(`   Phone: ${dm.phone}`);
        console.log(`   Region: ${dm.region || 'N/A'}`);
        console.log(`   ID: ${dm._id}`);
        console.log('');
      });
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkAdvisorParents();
