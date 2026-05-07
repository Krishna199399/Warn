/**
 * 🔒 SECURITY & PERFORMANCE: Add database indexes
 * Run this script once to add indexes to existing collections
 * 
 * Usage: node scripts/add-database-indexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in environment variables');
  process.exit(1);
}

async function addIndexes() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Helper function to safely create index
    const safeCreateIndex = async (collection, keys, options = {}) => {
      try {
        await db.collection(collection).createIndex(keys, options);
      } catch (error) {
        if (error.code === 86) {
          // Index already exists with different options - skip
          console.log(`  ⚠️  Index ${JSON.stringify(keys)} already exists (skipped)`);
        } else {
          throw error;
        }
      }
    };

    // ─── Product Indexes ──────────────────────────────────────────────────────
    console.log('📦 Adding Product indexes...');
    await safeCreateIndex('products', { category: 1 });
    await safeCreateIndex('products', { status: 1 });
    await safeCreateIndex('products', { sku: 1 }, { unique: true });
    await safeCreateIndex('products', { name: 'text', description: 'text' }); // Text search
    console.log('✅ Product indexes added');

    // ─── User Indexes ─────────────────────────────────────────────────────────
    console.log('👤 Adding User indexes...');
    await safeCreateIndex('users', { email: 1 }, { unique: true });
    await safeCreateIndex('users', { phone: 1 });
    await safeCreateIndex('users', { role: 1 });
    await safeCreateIndex('users', { employeeCode: 1 }, { unique: true, sparse: true });
    await safeCreateIndex('users', { parentId: 1 });
    await safeCreateIndex('users', { registrationStatus: 1 });
    await safeCreateIndex('users', { status: 1 });
    console.log('✅ User indexes added');

    // ─── Order Indexes ────────────────────────────────────────────────────────
    console.log('📋 Adding Order indexes...');
    await safeCreateIndex('orders', { orderNumber: 1 }, { unique: true, sparse: true });
    await safeCreateIndex('orders', { buyerId: 1, createdAt: -1 });
    await safeCreateIndex('orders', { sellerId: 1, createdAt: -1 });
    await safeCreateIndex('orders', { productId: 1 });
    await safeCreateIndex('orders', { status: 1 });
    await safeCreateIndex('orders', { paymentStatus: 1 });
    await safeCreateIndex('orders', { 'hierarchySnapshot.advisorId': 1 });
    await safeCreateIndex('orders', { createdAt: -1 }); // For date range queries
    console.log('✅ Order indexes added');

    // ─── Inventory Indexes ────────────────────────────────────────────────────
    console.log('📦 Adding Inventory indexes...');
    await safeCreateIndex('inventories', { ownerId: 1, productId: 1 }, { unique: true });
    await safeCreateIndex('inventories', { productId: 1 });
    console.log('✅ Inventory indexes added');

    // ─── Commission Indexes ───────────────────────────────────────────────────
    console.log('💰 Adding Commission indexes...');
    await safeCreateIndex('commissions', { userId: 1, createdAt: -1 });
    await safeCreateIndex('commissions', { orderId: 1 });
    await safeCreateIndex('commissions', { type: 1 });
    await safeCreateIndex('commissions', { createdAt: -1 });
    console.log('✅ Commission indexes added');

    // ─── Category Indexes ─────────────────────────────────────────────────────
    console.log('🏷️  Adding Category indexes...');
    await safeCreateIndex('categories', { name: 1 }, { unique: true });
    await safeCreateIndex('categories', { slug: 1 }, { unique: true });
    console.log('✅ Category indexes added');

    // ─── Benefit Claim Indexes ────────────────────────────────────────────────
    console.log('🎁 Adding Benefit Claim indexes...');
    await safeCreateIndex('benefitclaims', { userId: 1, createdAt: -1 });
    await safeCreateIndex('benefitclaims', { status: 1 });
    await safeCreateIndex('benefitclaims', { benefitId: 1 });
    console.log('✅ Benefit Claim indexes added');

    // ─── Payout Indexes ───────────────────────────────────────────────────────
    console.log('💸 Adding Payout indexes...');
    await safeCreateIndex('payouts', { userId: 1, createdAt: -1 });
    await safeCreateIndex('payouts', { status: 1 });
    await safeCreateIndex('payouts', { scheduledDate: 1 });
    console.log('✅ Payout indexes added');

    // ─── Visit Indexes ────────────────────────────────────────────────────────
    console.log('🚶 Adding Visit indexes...');
    await safeCreateIndex('visits', { advisorId: 1, createdAt: -1 });
    await safeCreateIndex('visits', { farmerId: 1 });
    await safeCreateIndex('visits', { createdAt: -1 });
    console.log('✅ Visit indexes added');

    console.log('\n🎉 All indexes processed successfully!');
    console.log('\n📊 Index Summary:');
    
    const collections = ['products', 'users', 'orders', 'inventories', 'commissions', 
                        'categories', 'benefitclaims', 'payouts', 'visits'];
    
    for (const collectionName of collections) {
      const indexes = await db.collection(collectionName).indexes();
      console.log(`\n${collectionName}: ${indexes.length} indexes`);
      indexes.forEach(idx => {
        console.log(`  - ${JSON.stringify(idx.key)}`);
      });
    }

  } catch (error) {
    console.error('❌ Error adding indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

addIndexes();
