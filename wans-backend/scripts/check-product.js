require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function checkProduct() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const product = await Product.findOne({ sku: 'SEED001' }).lean();
    
    if (!product) {
      console.log('❌ Product SEED001 not found');
      process.exit(1);
    }
    
    console.log('\n📦 Product SEED001:');
    console.log('Name:', product.name);
    console.log('Price:', product.price);
    console.log('\n💰 Commission Values:');
    console.log('RP:', product.rp);
    console.log('IV:', product.iv);
    console.log('SV:', product.sv);
    console.log('RV:', product.rv);
    console.log('\n📊 Full Product Data:');
    console.log(JSON.stringify(product, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkProduct();
