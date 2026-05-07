/**
 * Migration Script: Add Soft Delete Fields to Products
 * 
 * This script adds isDeleted and deletedAt fields to all existing products
 * that don't have these fields yet.
 * 
 * Run: node scripts/add-soft-delete-fields.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function addSoftDeleteFields() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Checking existing products...');
    
    // Find products without soft delete fields
    const productsWithoutFields = await Product.find({
      $or: [
        { isDeleted: { $exists: false } },
        { deletedAt: { $exists: false } }
      ]
    });

    console.log(`Found ${productsWithoutFields.length} products without soft delete fields\n`);

    if (productsWithoutFields.length === 0) {
      console.log('✅ All products already have soft delete fields');
      process.exit(0);
    }

    console.log('🔄 Adding soft delete fields...');

    // Update all products without the fields
    const result = await Product.updateMany(
      {
        $or: [
          { isDeleted: { $exists: false } },
          { deletedAt: { $exists: false } }
        ]
      },
      {
        $set: {
          isDeleted: false,
          deletedAt: null
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} products\n`);

    // Verify the update
    const verifyCount = await Product.countDocuments({
      isDeleted: { $exists: true },
      deletedAt: { $exists: true }
    });

    const totalCount = await Product.countDocuments();

    console.log('📊 Verification:');
    console.log(`   Total products: ${totalCount}`);
    console.log(`   Products with soft delete fields: ${verifyCount}`);
    
    if (verifyCount === totalCount) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Warning: Some products may not have been updated');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
addSoftDeleteFields();
