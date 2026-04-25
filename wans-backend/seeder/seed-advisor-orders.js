const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Farmer = require('../src/models/Farmer');
const Order = require('../src/models/Order');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

async function seedAdvisorOrders() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find the first advisor (or specific one)
    const advisor = await User.findOne({ role: 'ADVISOR' }).sort({ createdAt: 1 });
    if (!advisor) {
      console.error('❌ No advisor found. Run seed-hierarchy.js first.');
      process.exit(1);
    }
    console.log(`📍 Using Advisor: ${advisor.name} (${advisor.email})`);
    console.log(`   Advisor Code: ${advisor.advisorCode}`);

    // Find or create Mini Stock user
    let miniStock = await User.findOne({ role: 'MINI_STOCK' });
    if (!miniStock) {
      const bcrypt = require('bcryptjs');
      miniStock = await User.create({
        name: 'Mini Stock 1',
        email: 'ministock1@wans.com',
        password: await bcrypt.hash('mini123', 10),
        phone: '9876543210',
        role: 'MINI_STOCK',
        status: 'APPROVED',
        region: advisor.region,
      });
      console.log(`✅ Created Mini Stock: ${miniStock.name}`);
    } else {
      console.log(`📍 Using existing Mini Stock: ${miniStock.name}`);
    }

    // Find or create products
    let products = await Product.find({ status: 'Active' }).limit(5);
    if (products.length === 0) {
      console.log('📦 Creating sample products...');
      products = await Product.insertMany([
        { name: 'Wheat Seeds Premium', category: 'Seeds', price: 500, stock: 1000, sku: 'SEED-001', unit: 'kg' },
        { name: 'NPK Fertilizer', category: 'Fertilizer', price: 800, stock: 500, sku: 'FERT-001', unit: 'kg' },
        { name: 'Organic Pesticide', category: 'Pesticide', price: 350, stock: 300, sku: 'PEST-001', unit: 'liter' },
        { name: 'Drip Irrigation Kit', category: 'Equipment', price: 2500, stock: 50, sku: 'EQUIP-001', unit: 'set' },
        { name: 'Cattle Feed Supplement', category: 'Supplement', price: 450, stock: 200, sku: 'SUPP-001', unit: 'kg' },
      ]);
      console.log(`✅ Created ${products.length} products`);
    }

    // Create farmers linked to advisor
    console.log('👨‍🌾 Creating farmers...');
    const farmers = await Farmer.insertMany([
      { advisorId: advisor._id, name: 'Ramesh Kumar', phone: '9876501001', village: 'Village A', acres: 5, crop: 'Wheat' },
      { advisorId: advisor._id, name: 'Suresh Patil', phone: '9876501002', village: 'Village B', acres: 3, crop: 'Rice' },
      { advisorId: advisor._id, name: 'Mahesh Singh', phone: '9876501003', village: 'Village C', acres: 7, crop: 'Cotton' },
    ]);
    console.log(`✅ Created ${farmers.length} farmers`);

    // Create orders with advisorId
    console.log('📦 Creating orders...');
    const orders = [];
    const orderData = [
      { product: products[0], quantity: 10, farmer: farmers[0] },
      { product: products[1], quantity: 15, farmer: farmers[0] },
      { product: products[2], quantity: 8, farmer: farmers[1] },
      { product: products[3], quantity: 2, farmer: farmers[1] },
      { product: products[4], quantity: 20, farmer: farmers[2] },
      { product: products[0], quantity: 12, farmer: farmers[2] },
      { product: products[1], quantity: 10, farmer: farmers[0] },
      { product: products[2], quantity: 5, farmer: farmers[1] },
    ];

    for (const data of orderData) {
      const total = data.product.price * data.quantity;
      const order = await Order.create({
        sellerId: miniStock._id,
        sellerType: 'MINI_STOCK',
        buyerId: miniStock._id, // Mini Stock buying for customer
        buyerType: 'CUSTOMER',
        productId: data.product._id,
        quantity: data.quantity,
        price: data.product.price,
        total: total,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        advisorId: advisor._id, // CRITICAL - links order to advisor
        farmerId: data.farmer._id,
        customerName: data.farmer.name,
        customerPhone: data.farmer.phone,
        customerLocation: data.farmer.village,
        source: 'POS',
        deliveredAt: new Date(),
      });
      orders.push(order);
    }

    console.log(`✅ Created ${orders.length} orders`);

    // Calculate totals
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    console.log('\n📊 Summary:');
    console.log(`   Advisor: ${advisor.name}`);
    console.log(`   Advisor Code: ${advisor.advisorCode}`);
    console.log(`   Mini Stock: ${miniStock.name}`);
    console.log(`   Farmers: ${farmers.length}`);
    console.log(`   Orders: ${orders.length}`);
    console.log(`   Total Sales: ₹${totalSales.toLocaleString()}`);

    console.log('\n🔑 Login with:');
    console.log(`   Email: ${advisor.email}`);
    console.log(`   Password: advisor123`);

  } catch (err) {
    console.error('❌ Error seeding advisor orders:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

seedAdvisorOrders();
