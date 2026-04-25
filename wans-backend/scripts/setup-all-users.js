const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

async function setupAllUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check and create Admin
    let admin = await User.findOne({ email: 'admin@wans.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Admin',
        email: 'admin@wans.com',
        password: await bcrypt.hash('admin123', 10),
        phone: '9999999999',
        role: 'ADMIN',
        status: 'APPROVED',
      });
      console.log('✅ Created Admin user');
    } else {
      console.log('⚠️  Admin already exists');
    }

    // Check and create Wholesale
    let wholesale = await User.findOne({ email: 'wholesale@wans.com' });
    if (!wholesale) {
      wholesale = await User.create({
        name: 'Wholesale Store',
        email: 'wholesale@wans.com',
        password: await bcrypt.hash('wholesale123', 10),
        phone: '9876543210',
        role: 'WHOLESALE',
        status: 'APPROVED',
        region: 'Karnataka',
        shopName: 'WANS Wholesale Hub',
      });
      console.log('✅ Created Wholesale user');
    } else {
      console.log('⚠️  Wholesale already exists');
    }

    // Check and create Mini Stock
    let miniStock = await User.findOne({ email: 'ministock@wans.com' });
    if (!miniStock) {
      miniStock = await User.create({
        name: 'Mini Stock Shop',
        email: 'ministock@wans.com',
        password: await bcrypt.hash('ministock123', 10),
        phone: '9876543211',
        role: 'MINI_STOCK',
        status: 'APPROVED',
        region: 'Karnataka - Bangalore',
        shopName: 'WANS Mini Stock Store',
      });
      console.log('✅ Created Mini Stock user');
    } else {
      console.log('⚠️  Mini Stock already exists');
    }

    console.log('\n🔑 Login Credentials:');
    console.log('─────────────────────────────────────────────────────');
    console.log('ADMIN:');
    console.log('  Email: admin@wans.com');
    console.log('  Password: admin123');
    console.log('\nWHOLESALE:');
    console.log('  Email: wholesale@wans.com');
    console.log('  Password: wholesale123');
    console.log('\nMINI STOCK:');
    console.log('  Email: ministock@wans.com');
    console.log('  Password: ministock123');
    console.log('─────────────────────────────────────────────────────');

    // Show total count
    const totalCount = await User.countDocuments({});
    console.log(`\n📊 Total users in database: ${totalCount}`);

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

setupAllUsers();
