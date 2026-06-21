const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Farmer = require('../src/models/Farmer');
const Order = require('../src/models/Order');
const Commission = require('../src/models/Commission');
const Task = require('../src/models/Task');

const { buildHierarchySnapshot } = require('../src/services/hierarchy.service');
const { distributeIncome } = require('../src/services/income.service');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find krishna
    const krishna = await User.findOne({ email: 'krishna@gmail.com' });
    if (!krishna) {
      console.error('❌ User krishna@gmail.com not found. Please log in first or register krishna.');
      process.exit(1);
    }
    console.log(`👤 Found State Head krishna: ${krishna._id}`);

    // Find Admin User for sellerId
    const admin = await User.findOne({ role: 'ADMIN' });
    if (!admin) {
      console.error('❌ Admin user not found. Seeding requires an admin seller.');
      process.exit(1);
    }
    console.log(`👤 Found Admin User: ${admin._id}`);

    // Clear any existing children of krishna to avoid duplicating
    const existingDownlineIds = await User.find({ parentId: krishna._id }).select('_id');
    if (existingDownlineIds.length > 0) {
      const ids = existingDownlineIds.map(u => u._id);
      console.log(`🗑️ Clearing old downline data under krishna...`);
      // Find all subtrees recursively and delete
      const queue = [...ids];
      const allDownlineIds = [...ids];
      while (queue.length > 0) {
        const currId = queue.shift();
        const children = await User.find({ parentId: currId }).select('_id');
        for (const child of children) {
          allDownlineIds.push(child._id);
          queue.push(child._id);
        }
      }
      await User.deleteMany({ _id: { $in: allDownlineIds } });
      await Farmer.deleteMany({ advisorId: { $in: allDownlineIds } });
      await Order.deleteMany({ advisorId: { $in: allDownlineIds } });
      await Commission.deleteMany({ userId: { $in: [krishna._id, ...allDownlineIds] } });
      console.log(`🗑️ Cleared ${allDownlineIds.length} users and their orders/commissions.`);
    }

    // Make sure we have products with correct points
    await Product.deleteMany({});
    console.log('🗑️ Cleared products collection');
    let products = await Product.insertMany([
      { name: 'Premium Wheat Seeds', category: 'Seeds', price: 850, mrp: 850, actualPrice: 900, stock: 450, unit: 'kg', sku: 'SED001', rp: 10, sv: 10, rv: 5, iv: 5 },
      { name: 'Hybrid Cotton Seeds', category: 'Seeds', price: 1100, mrp: 1100, actualPrice: 1200, stock: 120, unit: 'packet', sku: 'SED005', rp: 12, sv: 12, rv: 6, iv: 6 },
      { name: 'NPK Fertilizer 15-15-15', category: 'Fertilizer', price: 1200, mrp: 1200, actualPrice: 1300, stock: 320, unit: 'bag (50kg)', sku: 'FER002', rp: 15, sv: 15, rv: 7, iv: 7 },
      { name: 'Bio Pesticide Spray', category: 'Pesticide', price: 450, mrp: 450, actualPrice: 500, stock: 180, unit: 'litre', sku: 'PES003', rp: 5, sv: 5, rv: 2, iv: 2 },
      { name: 'Drip Irrigation Kit', category: 'Equipment', price: 8500, mrp: 8500, actualPrice: 9000, stock: 45, unit: 'set', sku: 'EQP004', rp: 100, sv: 100, rv: 50, iv: 50 }
    ]);
    console.log(`📦 Seeded ${products.length} products.`);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // Create hierarchy
    // We want 3 ZMs under Krishna: High (6L), Medium (3.5L), Low (1.2L)
    const zmSpecs = [
      { name: 'Zonal Manager High', suffix: 'high', region: 'BGM - North', targetSales: 600000 },
      { name: 'Zonal Manager Medium', suffix: 'medium', region: 'BGM - East', targetSales: 350000 },
      { name: 'Zonal Manager Low', suffix: 'low', region: 'BGM - West', targetSales: 120000 }
    ];

    for (const zmSpec of zmSpecs) {
      // Create ZM
      const zm = await User.create({
        name: zmSpec.name,
        email: `zm_${zmSpec.suffix}@wans.com`,
        password: passwordHash,
        phone: `911223344${zmSpec.suffix === 'high' ? '1' : zmSpec.suffix === 'medium' ? '2' : '3'}`,
        role: 'ZONAL_MANAGER',
        status: 'APPROVED',
        region: zmSpec.region,
        state: 'karnataka',
        parentId: krishna._id,
        registrationStatus: 'approved',
        employeeCode: `ZMN-${Date.now()}-${zmSpec.suffix.toUpperCase()}`,
        roleHistory: [{ role: 'ZONAL_MANAGER', from: new Date(), to: null }]
      });

      // Create AM
      const am = await User.create({
        name: `Area Manager for ${zmSpec.name}`,
        email: `am_${zmSpec.suffix}@wans.com`,
        password: passwordHash,
        phone: `911223355${zmSpec.suffix === 'high' ? '1' : zmSpec.suffix === 'medium' ? '2' : '3'}`,
        role: 'AREA_MANAGER',
        status: 'APPROVED',
        region: zmSpec.region,
        state: 'karnataka',
        parentId: zm._id,
        registrationStatus: 'approved',
        employeeCode: `AMN-${Date.now()}-${zmSpec.suffix.toUpperCase()}`,
        roleHistory: [{ role: 'AREA_MANAGER', from: new Date(), to: null }]
      });

      // Create DO
      const dom = await User.create({
        name: `DO Manager for ${zmSpec.name}`,
        email: `do_${zmSpec.suffix}@wans.com`,
        password: passwordHash,
        phone: `911223366${zmSpec.suffix === 'high' ? '1' : zmSpec.suffix === 'medium' ? '2' : '3'}`,
        role: 'DO_MANAGER',
        status: 'APPROVED',
        region: zmSpec.region,
        state: 'karnataka',
        parentId: am._id,
        registrationStatus: 'approved',
        employeeCode: `DOM-${Date.now()}-${zmSpec.suffix.toUpperCase()}`,
        roleHistory: [{ role: 'DO_MANAGER', from: new Date(), to: null }]
      });

      // Create Advisor
      const adv = await User.create({
        name: `Advisor for ${zmSpec.name}`,
        email: `adv_${zmSpec.suffix}@wans.com`,
        password: passwordHash,
        phone: `911223377${zmSpec.suffix === 'high' ? '1' : zmSpec.suffix === 'medium' ? '2' : '3'}`,
        role: 'ADVISOR',
        status: 'APPROVED',
        region: zmSpec.region,
        state: 'karnataka',
        parentId: dom._id,
        registrationStatus: 'approved',
        employeeCode: `ADV-${Date.now()}-${zmSpec.suffix.toUpperCase()}`,
        advisorCode: `ADV_${zmSpec.suffix.toUpperCase()}`,
        roleHistory: [{ role: 'ADVISOR', from: new Date(), to: null }]
      });

      // Create Farmer
      const farmer = await Farmer.create({
        advisorId: adv._id,
        name: `Farmer of ${zmSpec.name}`,
        phone: `989811223${zmSpec.suffix === 'high' ? '1' : zmSpec.suffix === 'medium' ? '2' : '3'}`,
        village: 'Demo Village',
        acres: 10,
        crop: 'Wheat'
      });

      // Split target sales into 2 orders
      const order1Val = Math.round(zmSpec.targetSales / 2);
      const order2Val = zmSpec.targetSales - order1Val;

      const orderSpecs = [order1Val, order2Val];
      for (const amount of orderSpecs) {
        // Choose product (Drip Irrigation Kit EQP004 has high value, or NPK Fertilizer)
        const product = products[4]; // Drip Irrigation Kit
        const orderQty = Math.ceil(amount / product.price);
        const orderTotal = orderQty * product.price;

        const taxRate = 18;
        const subtotal = Math.round(orderTotal / (1 + taxRate / 100));
        const taxAmount = orderTotal - subtotal;

        const snapshot = await buildHierarchySnapshot(adv._id);
        const order = await Order.create({
          buyerId: adv._id, // Set buyer to Advisor (User)
          buyerType: 'CUSTOMER',
          sellerId: admin._id, // Set seller to Admin (User)
          sellerType: 'COMPANY',
          productId: product._id,
          quantity: orderQty,
          price: product.price,
          taxRate,
          taxAmount,
          subtotal,
          total: orderTotal,
          status: 'SHIPPED', // Set to SHIPPED so confirmDelivery logic can process it properly
          paymentStatus: 'PAID',
          region: zmSpec.region,
          advisorId: adv._id,
          farmerId: farmer._id,
          customerName: farmer.name,
          customerPhone: farmer.phone,
          customerLocation: 'Demo Village',
          hierarchySnapshot: snapshot,
          productSnapshot: {
            rpPoints: product.rp || 0,
            ivPoints: product.iv || 0,
            svPoints: product.sv || 0,
            rvPoints: product.rv || 0,
            mrp: product.mrp || product.price,
            wholesalePrice: product.price * 0.9,
            miniStockPrice: product.price * 0.95
          },
          pools: {
            RP: (product.rp || 0) * orderQty,
            IV: (product.iv || 0) * orderQty,
            SV: (product.sv || 0) * orderQty,
            RV: (product.rv || 0) * orderQty
          },
          createdAt: new Date(),
          deliveredAt: new Date()
        });

        // Use distributeIncome to correctly calculate and save commissions + update order and levels
        await distributeIncome(order, snapshot);
        console.log(`   Order created and commissions distributed for ${zmSpec.name}: total ₹${orderTotal}`);
      }

      // Create demo task
      await Task.create({
        assignedTo: adv._id,
        title: `Regular inspection of ${farmer.name}'s farm`,
        due: new Date(Date.now() + 86400000 * 3),
        priority: 'High',
        type: 'Field Visit'
      });
    }

    console.log('✅ Seeding hierarchy and orders under krishna completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

run();
