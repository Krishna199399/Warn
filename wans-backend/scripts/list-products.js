require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function listProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const products = await Product.find({}).select('name sku rp iv sv rv').lean();
    
    console.log(`\n📦 Found ${products.length} products:\n`);
    
    products.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} (${p.sku})`);
      console.log(`   RP: ${p.rp}, IV: ${p.iv}, SV: ${p.sv}, RV: ${p.rv}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listProducts();
