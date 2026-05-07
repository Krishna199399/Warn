/**
 * Update Mini Stock Prices for All Products
 * 
 * This script sets miniStockPrice for products that don't have it configured.
 * 
 * Formula:
 * - miniStockPrice = 85% of actualPrice (or between wholesalePrice and actualPrice)
 * - This gives Mini Stock a 15% margin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wans';

async function updateMiniStockPrices() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      // Skip if miniStockPrice is already set
      if (product.miniStockPrice > 0) {
        console.log(`⏭️  Skipped: ${product.name} (already has miniStockPrice: ₹${product.miniStockPrice})`);
        skippedCount++;
        continue;
      }

      // Calculate miniStockPrice
      // Strategy: Set it to 85% of actualPrice
      // This gives Mini Stock a 15% margin
      const calculatedPrice = Math.round(product.actualPrice * 0.85);

      // Ensure it's between wholesalePrice and actualPrice
      let miniStockPrice = calculatedPrice;
      
      if (product.wholesalePrice > 0) {
        // Make sure miniStockPrice is higher than wholesalePrice
        if (miniStockPrice <= product.wholesalePrice) {
          // Set it to midpoint between wholesale and actual
          miniStockPrice = Math.round((product.wholesalePrice + product.actualPrice) / 2);
        }
      }

      // Update the product
      product.miniStockPrice = miniStockPrice;
      await product.save(); // This will trigger pre-save hook to calculate miniStockMargin

      console.log(`✅ Updated: ${product.name}`);
      console.log(`   Actual Price: ₹${product.actualPrice}`);
      console.log(`   Wholesale Price: ₹${product.wholesalePrice}`);
      console.log(`   Mini Stock Price: ₹${product.miniStockPrice} (NEW)`);
      console.log(`   Mini Stock Margin: ₹${product.miniStockMargin}\n`);

      updatedCount++;
    }

    console.log('\n📊 Summary:');
    console.log(`   Total Products: ${products.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
updateMiniStockPrices();
