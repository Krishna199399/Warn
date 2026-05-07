const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize:              10,
      minPoolSize:              2,
      socketTimeoutMS:          45000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // Atlas always runs as a replica set — transactions are always available
    const isAtlas = conn.connection.host.includes('mongodb.net');
    if (isAtlas) {
      console.log('✅ MongoDB Atlas — transactions enabled');
      global.__REPLICA_SET_AVAILABLE__ = true;
    } else {
      // Local: detect replica set
      try {
        const admin = conn.connection.db.admin();
        const status = await admin.command({ replSetGetStatus: 1 });
        const primary = status.members?.some(m => m.stateStr === 'PRIMARY');
        global.__REPLICA_SET_AVAILABLE__ = primary;
        console.log(primary
          ? '✅ Local replica set active — transactions enabled'
          : '⚠️  Local standalone — transactions disabled'
        );
      } catch (_) {
        global.__REPLICA_SET_AVAILABLE__ = false;
        console.warn('⚠️  Local standalone MongoDB — transactions disabled');
      }
    }

    // One-time: fix old Farmer phone index (drop non-sparse, keep sparse)
    try {
      const farmersColl = conn.connection.db.collection('farmers');
      const indexes = await farmersColl.indexes();
      const oldPhoneIdx = indexes.find(i => i.key?.phone === 1 && !i.sparse);
      if (oldPhoneIdx) {
        await farmersColl.dropIndex(oldPhoneIdx.name);
        console.log('🔧 Dropped old non-sparse phone index on farmers');
      }
    } catch (_) { /* index already gone or doesn't exist */ }

    // Handle MongoDB connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
