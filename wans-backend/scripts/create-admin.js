require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@wans.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('\n📧 Email: admin@wans.com');
      console.log('🔑 Password: admin123');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin user
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

    const admin = await User.create(adminData);
    
    console.log('✨ Admin user created successfully!');
    console.log('\n📧 Email: admin@wans.com');
    console.log('🔑 Password: admin123');
    console.log(`\n👤 User ID: ${admin._id}`);

    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
