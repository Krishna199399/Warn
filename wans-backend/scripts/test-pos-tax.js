require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Inventory = require('../src/models/Inventory');
const Order = require('../src/models/Order');
const { createPOSSale } = require('../src/controllers/order.controller');

async function testPOSTax() {
  try {
    console.log('✅ Connected to MongoDB\n');

    // Clean up previous test data
    await Order.deleteMany({ source: 'POS' });
    
    // Find or create Mini Stock user
    let miniStock = await User.findOne({ role: 'MINI_STOCK', status: 'APPROVED' });
    if (!miniStock) {
      miniStock = await User.create({
        name: 'Test Mini Stock',
        email: 'ministock@test.com',
        password: 'password123',
        role: 'MINI_STOCK',
        status: 'APPROVED',
        taxConfig: {
          b2cTaxRate: 5,
          allowB2CTaxEdit: true
        }
      });
    } else {
      // Update tax config
      miniStock.taxConfig = {
        b2cTaxRate: 5,
        allowB2CTaxEdit: true
      };
      await miniStock.save();
    }

    // Find or create test product
    let product = await Product.findOne({ name: 'POS Tax Test Product' });
    if (!product) {
      product = await Product.create({
        name: 'POS Tax Test Product',
        sku: 'POS-TAX-001',
        price: 1000,
        actualPrice: 1000,
        category: 'Test',
        rp: 50,
        iv: 30,
        sv: 20,
        rv: 100
      });
    }

    // Ensure Mini Stock has inventory
    let inventory = await Inventory.findOne({ ownerId: miniStock._id });
    if (!inventory) {
      inventory = await Inventory.create({
        ownerId: miniStock._id,
        ownerRole: 'MINI_STOCK',
        items: [{
          productId: product._id,
          received: 100,
          dispatched: 0,
          current: 100,
          minLevel: 10,
          lastUpdated: new Date()
        }]
      });
    } else {
      // Update inventory
      const existingItemIndex = inventory.items.findIndex(item => 
        item.productId.toString() === product._id.toString()
      );
      if (existingItemIndex >= 0) {
        inventory.items[existingItemIndex].current = 100;
        inventory.items[existingItemIndex].received = 100;
        inventory.items[existingItemIndex].dispatched = 0;
      } else {
        inventory.items.push({
          productId: product._id,
          received: 100,
          dispatched: 0,
          current: 100,
          minLevel: 10,
          lastUpdated: new Date()
        });
      }
      await inventory.save();
    }

    console.log('📦 Test data setup complete');
    
    // Debug: Check inventory
    const debugInventory = await Inventory.findOne({ ownerId: miniStock._id }).populate('items.productId');
    console.log('🔍 Debug - Inventory items:', debugInventory?.items?.map(item => ({
      product: item.productId?.name,
      current: item.current,
      received: item.received,
      dispatched: item.dispatched
    })));
    console.log('');

    // Test 1: POS sale with default tax rate (should use Mini Stock's B2C rate: 5%)
    console.log('🧪 TEST 1: POS Sale with Default Tax Rate');
    console.log('Expected: 5% tax (Mini Stock\'s default B2C rate)');
    
    const req1 = {
      user: miniStock,
      body: {
        farmerName: 'Test Customer 1',
        farmerPhone: '9876543210',
        farmerLocation: 'Test Village',
        items: [{
          productId: product._id,
          quantity: 2
        }],
        paymentMethod: 'CASH',
        discount: 0
        // No taxRate provided - should use default
      }
    };

    const res1 = {
      json: (data) => {
        console.log(`   Subtotal: ₹${data.data.invoice.subtotal}`);
        console.log(`   Tax: ₹${data.data.orders[0].taxAmount} (${data.data.orders[0].taxRate}%)`);
        console.log(`   Total: ₹${data.data.orders[0].total}`);
        
        const expectedTax = (2000 * 5) / 100; // 2 items × ₹1000 × 5%
        const expectedTotal = 2000 + expectedTax;
        
        if (data.data.orders[0].taxRate === 5 && data.data.orders[0].taxAmount === expectedTax) {
          console.log('   ✅ Default tax rate applied correctly\n');
        } else {
          console.log('   ❌ Default tax rate incorrect\n');
        }
      }
    };

    await createPOSSale(req1, res1, (err) => {
      if (err) console.error('Error in test 1:', err.message);
    });

    // Test 2: POS sale with custom tax rate (10%)
    console.log('🧪 TEST 2: POS Sale with Custom Tax Rate');
    console.log('Expected: 10% tax (custom rate provided)');
    
    const req2 = {
      user: miniStock,
      body: {
        farmerName: 'Test Customer 2',
        farmerPhone: '9876543211',
        farmerLocation: 'Test Village',
        items: [{
          productId: product._id,
          quantity: 1
        }],
        paymentMethod: 'CASH',
        discount: 0,
        taxRate: 10 // Custom tax rate
      }
    };

    const res2 = {
      json: (data) => {
        console.log(`   Subtotal: ₹${data.data.invoice.subtotal}`);
        console.log(`   Tax: ₹${data.data.orders[0].taxAmount} (${data.data.orders[0].taxRate}%)`);
        console.log(`   Total: ₹${data.data.orders[0].total}`);
        
        const expectedTax = (1000 * 10) / 100; // 1 item × ₹1000 × 10%
        const expectedTotal = 1000 + expectedTax;
        
        if (data.data.orders[0].taxRate === 10 && data.data.orders[0].taxAmount === expectedTax) {
          console.log('   ✅ Custom tax rate applied correctly\n');
        } else {
          console.log('   ❌ Custom tax rate incorrect\n');
        }
      }
    };

    await createPOSSale(req2, res2, (err) => {
      if (err) console.error('Error in test 2:', err.message);
    });

    console.log('✅ All POS tax tests completed!');
    console.log('\n💡 Frontend Integration:');
    console.log('   1. POS page now has tax rate input field');
    console.log('   2. Tax rate is passed to backend in createPOSSale API call');
    console.log('   3. Backend uses custom tax rate if provided, otherwise uses default');
    console.log('   4. Tax configuration pages allow role-specific tax rate management');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n👋 Disconnected from MongoDB');
    mongoose.disconnect();
  }
}

// Connect to MongoDB and run tests
mongoose.connect(process.env.MONGO_URI)
  .then(() => testPOSTax())
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });