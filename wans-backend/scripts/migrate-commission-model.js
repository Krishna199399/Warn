require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');

async function migrateCommissionModel() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Migrate Products: wholesaleMargin → wholesaleCommission
    // ─────────────────────────────────────────────────────────────────────────
    console.log('📦 Migrating Products...');
    const products = await Product.find({});
    let productCount = 0;
    
    for (const product of products) {
      let updated = false;
      
      // Copy old margin values to new commission fields
      if (product.wholesaleMargin !== undefined) {
        product.wholesaleCommission = product.wholesaleMargin || 0;
        updated = true;
      }
      if (product.miniStockMargin !== undefined) {
        product.miniStockCommission = product.miniStockMargin || 0;
        updated = true;
      }
      
      // Remove old fields (set to undefined to delete from document)
      if (product.wholesalePrice !== undefined) {
        product.wholesalePrice = undefined;
        updated = true;
      }
      if (product.miniStockPrice !== undefined) {
        product.miniStockPrice = undefined;
        updated = true;
      }
      if (product.wholesaleMargin !== undefined) {
        product.wholesaleMargin = undefined;
        updated = true;
      }
      if (product.miniStockMargin !== undefined) {
        product.miniStockMargin = undefined;
        updated = true;
      }
      
      if (updated) {
        await product.save();
        productCount++;
      }
    }
    console.log(`✅ Migrated ${productCount} products\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Migrate Orders: WHOLESALE_MARGIN → WHOLESALE_COMMISSION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('📋 Migrating Orders...');
    
    // Update WHOLESALE_MARGIN → WHOLESALE_COMMISSION
    const wholesaleResult = await Order.updateMany(
      { 'buyerCommission.type': 'WHOLESALE_MARGIN' },
      { $set: { 'buyerCommission.type': 'WHOLESALE_COMMISSION' } }
    );
    console.log(`✅ Updated ${wholesaleResult.modifiedCount} wholesale orders`);
    
    // Update MINISTOCK_MARGIN → MINISTOCK_COMMISSION
    const miniStockResult = await Order.updateMany(
      { 'buyerCommission.type': 'MINISTOCK_MARGIN' },
      { $set: { 'buyerCommission.type': 'MINISTOCK_COMMISSION' } }
    );
    console.log(`✅ Updated ${miniStockResult.modifiedCount} mini stock orders\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Summary
    // ─────────────────────────────────────────────────────────────────────────
    console.log('📊 Migration Summary:');
    console.log(`   Products migrated: ${productCount}`);
    console.log(`   Wholesale orders updated: ${wholesaleResult.modifiedCount}`);
    console.log(`   Mini Stock orders updated: ${miniStockResult.modifiedCount}`);
    console.log('\n✨ Migration completed successfully!');
    console.log('\n📝 Changes made:');
    console.log('   ✅ wholesaleMargin → wholesaleCommission');
    console.log('   ✅ miniStockMargin → miniStockCommission');
    console.log('   ✅ WHOLESALE_MARGIN → WHOLESALE_COMMISSION');
    console.log('   ✅ MINISTOCK_MARGIN → MINISTOCK_COMMISSION');
    console.log('   ✅ Removed: wholesalePrice, miniStockPrice fields');

    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

migrateCommissionModel();
