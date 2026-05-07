/**
 * Migration Script: Add Tax Rate to Existing Products
 * 
 * This script:
 * 1. Sets default taxRate=18 for all existing products
 * 2. Calculates priceWithTax and actualPriceWithTax
 * 3. Updates all products in the database
 * 
 * Run: node wans-backend/scripts/migrate-product-tax.js
 */

require('dotenv').config({ path: './wans-backend/.env' });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function migrateProductTax() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products to migrate\n`);

    let updated = 0;
    let skipped = 0;

    for (const product of products) {
      // Skip if already has taxRate
      if (product.taxRate !== undefined && product.taxRate !== null) {
        console.log(`⏭️  Skipped: ${product.name} (already has taxRate: ${product.taxRate}%)`);
        skipped++;
        continue;
      }

      // Set default tax rate
      product.taxRate = 18;

      // Calculate tax-inclusive prices (will be auto-calculated by pre-save hook)
      // But we can also set them manually here for clarity
      product.priceWithTax = product.price * (1 + product.taxRate / 100);
      product.actualPriceWithTax = product.actualPrice * (1 + product.taxRate / 100);
      
      if (product.wholesalePrice) {
        product.wholesalePriceWithTax = product.wholesalePrice * (1 + product.taxRate / 100);
      }
      
      if (product.miniStockPrice) {
        product.miniStockPriceWithTax = product.miniStockPrice * (1 + product.taxRate / 100);
      }

      await product.save();
      
      console.log(`✅ Updated: ${product.name}`);
      console.log(`   Price: ₹${product.price} → ₹${product.priceWithTax.toFixed(2)} (incl. ${product.taxRate}% tax)`);
      console.log(`   Actual: ₹${product.actualPrice} → ₹${product.actualPriceWithTax.toFixed(2)} (incl. ${product.taxRate}% tax)\n`);
      
      updated++;
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updated} products`);
    console.log(`   ⏭️  Skipped: ${skipped} products (already had taxRate)`);
    console.log(`   📦 Total: ${products.length} products\n`);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateProductTax();
