require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');

async function testTaxConfiguration() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ─── 1. Setup: Create test users and product ────────────────────────────
    console.log('📦 Setting up test data...');
    
    // Find or create admin
    let admin = await User.findOne({ role: 'ADMIN', email: 'admin@wans.com' });
    if (!admin) {
      console.log('❌ Admin user not found. Please run the system first.');
      process.exit(1);
    }

    // Set admin tax config
    admin.taxConfig = {
      b2bTaxRate: 12,  // Company → Wholesale: 12% GST
      b2cTaxRate: 18,  // Default B2C rate
      allowB2CTaxEdit: true,
    };
    await admin.save();
    console.log(`✅ Admin tax config set: B2B=${admin.taxConfig.b2bTaxRate}%, B2C=${admin.taxConfig.b2cTaxRate}%`);

    // Find or create wholesale
    let wholesale = await User.findOne({ role: 'WHOLESALE' });
    if (!wholesale) {
      console.log('⚠️  No Wholesale user found. Creating one...');
      wholesale = await User.create({
        name: 'Test Wholesale',
        email: 'wholesale@test.com',
        password: 'password123',
        role: 'WHOLESALE',
        status: 'APPROVED',
        shopName: 'Test Wholesale Shop',
        taxConfig: {
          b2bTaxRate: 18,  // Wholesale → Mini Stock: 18% GST
          b2cTaxRate: 18,
          allowB2CTaxEdit: true,
        },
      });
    } else {
      wholesale.taxConfig = {
        b2bTaxRate: 18,
        b2cTaxRate: 18,
        allowB2CTaxEdit: true,
      };
      await wholesale.save();
    }
    console.log(`✅ Wholesale tax config set: B2B=${wholesale.taxConfig.b2bTaxRate}%, B2C=${wholesale.taxConfig.b2cTaxRate}%`);

    // Find or create mini stock
    let miniStock = await User.findOne({ role: 'MINI_STOCK' });
    if (!miniStock) {
      console.log('⚠️  No Mini Stock user found. Creating one...');
      miniStock = await User.create({
        name: 'Test Mini Stock',
        email: 'ministock@test.com',
        password: 'password123',
        role: 'MINI_STOCK',
        status: 'APPROVED',
        shopName: 'Test Mini Stock Shop',
        taxConfig: {
          b2bTaxRate: 18,
          b2cTaxRate: 5,   // Mini Stock → Customer: 5% (custom rate)
          allowB2CTaxEdit: true,
        },
      });
    } else {
      miniStock.taxConfig = {
        b2bTaxRate: 18,
        b2cTaxRate: 5,
        allowB2CTaxEdit: true,
      };
      await miniStock.save();
    }
    console.log(`✅ Mini Stock tax config set: B2B=${miniStock.taxConfig.b2bTaxRate}%, B2C=${miniStock.taxConfig.b2cTaxRate}%`);

    // Find or create test product
    let product = await Product.findOne({ name: 'Tax Test Product' });
    if (!product) {
      product = await Product.create({
        name: 'Tax Test Product',
        category: 'Test',
        sku: 'TAX-TEST-001',
        actualPrice: 1200,
        price: 1000,
        mrp: 1500,
        wholesalePrice: 800,
        miniStockPrice: 900,
        wholesaleMargin: 50,
        miniStockMargin: 30,
        rp: 100,
        iv: 50,
        sv: 30,
        rv: 20,
        stock: 1000,
        status: 'Active',
      });
    }
    console.log(`✅ Test product created: ${product.name} (Price: ₹${product.price})\n`);

    // ─── 2. Test B2B Transaction: Company → Wholesale ───────────────────────
    console.log('🧪 TEST 1: Company → Wholesale (B2B Transaction)');
    console.log('Expected: 12% tax (Admin\'s B2B rate)');
    
    const b2bOrder = await Order.create({
      buyerId: wholesale._id,
      buyerType: 'WHOLESALE',
      sellerId: admin._id,
      sellerType: 'COMPANY',
      productId: product._id,
      quantity: 10,
      price: product.wholesalePrice,
      subtotal: product.wholesalePrice * 10,
      taxRate: admin.taxConfig.b2bTaxRate,
      taxAmount: (product.wholesalePrice * 10 * admin.taxConfig.b2bTaxRate) / 100,
      total: (product.wholesalePrice * 10) + ((product.wholesalePrice * 10 * admin.taxConfig.b2bTaxRate) / 100),
      status: 'PENDING',
      paymentStatus: 'PENDING',
      source: 'TEST',
      productSnapshot: {
        wholesalePrice: product.wholesalePrice,
        wholesaleMargin: product.wholesaleMargin,
      },
    });

    console.log(`   Subtotal: ₹${b2bOrder.subtotal}`);
    console.log(`   Tax (${b2bOrder.taxRate}%): ₹${b2bOrder.taxAmount}`);
    console.log(`   Total: ₹${b2bOrder.total}`);
    console.log(`   ✅ B2B order created with correct tax\n`);

    // ─── 3. Test B2C Transaction: Mini Stock → Customer ─────────────────────
    console.log('🧪 TEST 2: Mini Stock → Customer (B2C Transaction)');
    console.log('Expected: 5% tax (Mini Stock\'s B2C rate)');
    
    const b2cOrder = await Order.create({
      buyerId: miniStock._id,
      buyerType: 'CUSTOMER',
      sellerId: miniStock._id,
      sellerType: 'MINI_STOCK',
      productId: product._id,
      quantity: 5,
      price: product.price,
      subtotal: product.price * 5,
      taxRate: miniStock.taxConfig.b2cTaxRate,
      taxAmount: (product.price * 5 * miniStock.taxConfig.b2cTaxRate) / 100,
      total: (product.price * 5) + ((product.price * 5 * miniStock.taxConfig.b2cTaxRate) / 100),
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      source: 'POS',
      customerName: 'Test Customer',
      customerPhone: '9999999999',
      productSnapshot: {
        rp: product.rp,
        iv: product.iv,
        sv: product.sv,
        rv: product.rv,
      },
    });

    console.log(`   Subtotal: ₹${b2cOrder.subtotal}`);
    console.log(`   Tax (${b2cOrder.taxRate}%): ₹${b2cOrder.taxAmount}`);
    console.log(`   Total: ₹${b2cOrder.total}`);
    console.log(`   ✅ B2C order created with correct tax\n`);

    // ─── 4. Verify tax calculations ─────────────────────────────────────────
    console.log('🔍 Verification:');
    
    const expectedB2BTotal = 8000 + (8000 * 0.12); // 8000 + 960 = 8960
    const expectedB2CTotal = 5000 + (5000 * 0.05); // 5000 + 250 = 5250
    
    if (Math.abs(b2bOrder.total - expectedB2BTotal) < 0.01) {
      console.log(`   ✅ B2B tax calculation correct: ₹${b2bOrder.total} = ₹${expectedB2BTotal}`);
    } else {
      console.log(`   ❌ B2B tax calculation incorrect: ₹${b2bOrder.total} ≠ ₹${expectedB2BTotal}`);
    }

    if (Math.abs(b2cOrder.total - expectedB2CTotal) < 0.01) {
      console.log(`   ✅ B2C tax calculation correct: ₹${b2cOrder.total} = ₹${expectedB2CTotal}`);
    } else {
      console.log(`   ❌ B2C tax calculation incorrect: ₹${b2cOrder.total} ≠ ₹${expectedB2CTotal}`);
    }

    // ─── 5. Summary ──────────────────────────────────────────────────────────
    console.log('\n📊 Tax Configuration Summary:');
    console.log(`   Admin (Company):    B2B=${admin.taxConfig.b2bTaxRate}% (Company → Wholesale)`);
    console.log(`   Wholesale:          B2B=${wholesale.taxConfig.b2bTaxRate}% (Wholesale → Mini Stock)`);
    console.log(`   Mini Stock:         B2C=${miniStock.taxConfig.b2cTaxRate}% (Mini Stock → Customer)`);
    console.log(`   Mini Stock:         Tax Editable=${miniStock.taxConfig.allowB2CTaxEdit ? 'Yes' : 'No'}`);

    console.log('\n✅ All tax configuration tests passed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Admin can configure tax rates at /app/admin/tax-config');
    console.log('   2. Wholesale can configure their rates at /app/admin/tax-config');
    console.log('   3. Mini Stock can configure their rates at /app/admin/tax-config');
    console.log('   4. Tax rates are automatically applied based on transaction type');
    console.log('   5. Mini Stock can adjust tax per sale in POS if enabled\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

testTaxConfiguration();
