const mongoose = require('mongoose');
require('dotenv').config();

// Import models in correct order to avoid schema registration issues
const Product = require('../src/models/Product');
const User = require('../src/models/User');
const Order = require('../src/models/Order');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

async function checkAdvisorOrders() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all advisors
    const advisors = await User.find({ role: 'ADVISOR' })
      .select('_id name email advisorCode')
      .sort({ createdAt: 1 })
      .limit(5);

    console.log(`📊 Found ${advisors.length} advisors\n`);

    for (const advisor of advisors) {
      console.log(`\n👤 Advisor: ${advisor.name}`);
      console.log(`   Email: ${advisor.email}`);
      console.log(`   Code: ${advisor.advisorCode}`);
      console.log(`   ID: ${advisor._id}`);

      // Find orders with this advisorId
      const orders = await Order.find({ advisorId: advisor._id })
        .populate('productId', 'name price')
        .populate('sellerId', 'name role')
        .sort({ createdAt: -1 })
        .lean();

      console.log(`   Orders: ${orders.length}`);

      if (orders.length > 0) {
        const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
        console.log(`   Total Sales: ₹${totalSales.toLocaleString()}`);
        console.log(`\n   Recent Orders:`);
        orders.slice(0, 3).forEach((order, idx) => {
          console.log(`   ${idx + 1}. ${order.productId?.name || 'Unknown'} - ₹${order.total} (${order.status})`);
          console.log(`      Seller: ${order.sellerId?.name || 'Unknown'} (${order.sellerType})`);
          console.log(`      Date: ${order.createdAt.toLocaleDateString()}`);
        });
      } else {
        console.log(`   ⚠️  No orders found with advisorId`);
      }
      console.log('   ' + '─'.repeat(60));
    }

    // Check recent orders without advisorId
    console.log('\n\n📦 Recent Orders WITHOUT advisorId:');
    const ordersWithoutAdvisor = await Order.find({ 
      advisorId: null,
      sellerType: 'MINI_STOCK'
    })
      .populate('productId', 'name')
      .populate('sellerId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    if (ordersWithoutAdvisor.length > 0) {
      ordersWithoutAdvisor.forEach((order, idx) => {
        console.log(`${idx + 1}. ${order.productId?.name || 'Unknown'} - ₹${order.total}`);
        console.log(`   Seller: ${order.sellerId?.name || 'Unknown'}`);
        console.log(`   Customer: ${order.customerName || 'N/A'}`);
        console.log(`   Date: ${order.createdAt.toLocaleString()}`);
        console.log(`   ⚠️  advisorId: ${order.advisorId || 'NULL'}`);
        console.log('');
      });
    } else {
      console.log('✅ All Mini Stock orders have advisorId set');
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkAdvisorOrders();
