const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

async function verifyAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin by email
    const admin = await User.findOne({ email: 'admin@wans.com' });
    
    if (!admin) {
      console.log('❌ Admin user NOT found in database');
      console.log('   Creating admin now...');
      
      const newAdmin = await User.create({
        name: 'Admin',
        email: 'admin@wans.com',
        password: 'admin123', // Will be hashed by pre-save hook
        phone: '9999999999',
        role: 'ADMIN',
        status: 'APPROVED',
      });
      
      console.log('✅ Admin created successfully');
      console.log('   Email: admin@wans.com');
      console.log('   Password: admin123');
    } else {
      console.log('✅ Admin user found:');
      console.log(`   Name: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Status: ${admin.status}`);
      
      // Test password
      const testPassword = 'admin123';
      const isMatch = await bcrypt.compare(testPassword, admin.password);
      
      if (isMatch) {
        console.log(`   ✅ Password '${testPassword}' is correct`);
      } else {
        console.log(`   ❌ Password '${testPassword}' does NOT match`);
        console.log('   Resetting password to admin123...');
        admin.password = 'admin123'; // Will be hashed by pre-save hook
        await admin.save();
        console.log('   ✅ Password reset successfully');
      }
    }

    // Show all users count
    const totalCount = await User.countDocuments({});
    const roleCount = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Database Summary:');
    console.log('─────────────────────────────────────────');
    console.log(`Total users: ${totalCount}`);
    roleCount.forEach(r => {
      console.log(`${r._id.padEnd(20)} : ${r.count}`);
    });
    console.log('─────────────────────────────────────────');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

verifyAdmin();
