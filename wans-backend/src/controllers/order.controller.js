const Order      = require('../models/Order');
const Commission = require('../models/Commission');
const User       = require('../models/User');
const Inventory  = require('../models/Inventory');
const Product    = require('../models/Product');
const StockLog   = require('../models/StockLog');
const mongoose   = require('mongoose');
const { buildHierarchySnapshot, calculateCommissions, getSubtreeIds } = require('../services/hierarchy.service');
const { notifyNewOrder, notifyCommission } = require('../services/notification.service');

// POST /api/orders  — create order (NO stock update until delivery)
const createOrder = async (req, res, next) => {
  try {
    const { buyerType, productId, quantity, advisorCode, farmerId, region } = req.body;

    // Validate required fields
    if (!buyerType || !productId || !quantity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Buyer type, product, and quantity are required' 
      });
    }

    // Validate product exists
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const price = Number(product.price) || 0;
    if (price <= 0) {
      return res.status(400).json({ success: false, error: 'Product has no valid price' });
    }

    const qty   = Number(quantity);
    const total = price * qty;

    // Determine seller based on buyer type
    let sellerId, sellerType, advisorId = null, hierarchySnapshot = null;

    if (buyerType === 'WHOLESALE') {
      // Wholesale buying from Company (Admin)
      if (req.user.role !== 'WHOLESALE') {
        return res.status(403).json({ success: false, error: 'Only Wholesale can place orders to Company' });
      }
      
      // Find admin user (Company)
      const admin = await User.findOne({ role: 'ADMIN', status: 'APPROVED' }).lean();
      if (!admin) {
        return res.status(500).json({ success: false, error: 'No approved Company admin found. Please contact support.' });
      }
      
      sellerId   = admin._id;
      sellerType = 'COMPANY';
      
    } else if (buyerType === 'MINI_STOCK') {
      // Mini Stock buying from Wholesale
      if (req.user.role !== 'MINI_STOCK') {
        return res.status(403).json({ success: false, error: 'Only Mini Stock can place orders to Wholesale' });
      }
      
      const wholesale = await User.findOne({ role: 'WHOLESALE', status: 'APPROVED' }).lean();
      if (!wholesale) {
        return res.status(404).json({ success: false, error: 'No approved Wholesale found. Please contact your manager.' });
      }
      
      sellerId   = wholesale._id;
      sellerType = 'WHOLESALE';
      
    } else if (buyerType === 'CUSTOMER') {
      // Customer buying from Mini Stock (sales order)
      if (req.user.role !== 'MINI_STOCK') {
        return res.status(403).json({ success: false, error: 'Only Mini Stock can create sales orders' });
      }
      
      if (!advisorCode) {
        return res.status(400).json({ success: false, error: 'Advisor code is required for sales orders' });
      }
      
      // Validate advisor code
      const advisor = await User.findOne({ 
        advisorCode: advisorCode.toUpperCase(),
        status: 'APPROVED'
      }).lean();
      
      if (!advisor) {
        return res.status(404).json({ success: false, error: 'Invalid advisor code or advisor not approved' });
      }
      
      advisorId  = advisor._id;
      sellerId   = req.user._id;
      sellerType = 'MINI_STOCK';
      
      // Build hierarchy snapshot for commission calculation
      hierarchySnapshot = await buildHierarchySnapshot(advisorId);
    } else {
      return res.status(400).json({ success: false, error: `Invalid buyer type: ${buyerType}` });
    }

    // Create order (status = PENDING, no stock update yet)
    // For customer orders (cash sales), mark payment as PAID by default
    const initialPaymentStatus = buyerType === 'CUSTOMER' ? 'PAID' : 'PENDING';
    
    const order = await Order.create({
      buyerId:   req.user._id,
      buyerType,
      sellerId,
      sellerType,
      productId,
      quantity:  qty,
      price,
      total,
      advisorId,
      farmerId:  farmerId || null,
      region:    region   || '',
      hierarchySnapshot,
      status:        'PENDING',
      paymentStatus: initialPaymentStatus,
      source:        'WEBSITE',
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('productId', 'name category price')
      .populate('sellerId',  'name role')
      .populate('advisorId', 'name advisorCode')
      .populate('farmerId',  'name village');

    res.status(201).json({ 
      success: true, 
      data:    populatedOrder,
      message: 'Order created successfully. Awaiting approval.'
    });
  } catch (err) { next(err); }
};


// GET /api/orders/my  — orders by current advisor
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ advisorId: req.user._id })
      .populate('productId', 'name category')
      .populate('farmerId', 'name village')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};

// GET /api/orders/admin — Admin orders (Company → Wholesale)
const getAdminOrders = async (req, res, next) => {
  try {
    // Only Admin can access
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
    }

    // Filter: buyerType = WHOLESALE, sellerType = COMPANY
    const orders = await Order.find({
      buyerType: 'WHOLESALE',
      sellerType: 'COMPANY'
    })
      .populate('buyerId', 'name email role')
      .populate('sellerId', 'name role')
      .populate('productId', 'name category price')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};

// GET /api/orders/wholesale — Incoming orders for Wholesale/Mini Stock (sales they made)
const getWholesaleOrders = async (req, res, next) => {
  try {
    if (!['WHOLESALE', 'MINI_STOCK', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    // Orders where this user is the SELLER
    let filter;
    if (req.user.role === 'ADMIN') {
      filter = { sellerType: { $in: ['WHOLESALE', 'MINI_STOCK'] } }; // Admin sees all
    } else if (req.user.role === 'WHOLESALE') {
      filter = { sellerId: req.user._id, sellerType: 'WHOLESALE' };
    } else if (req.user.role === 'MINI_STOCK') {
      filter = { sellerId: req.user._id, sellerType: 'MINI_STOCK' };
    }

    const orders = await Order.find(filter)
      .populate('buyerId',  'name email role')
      .populate('sellerId', 'name role')
      .populate('productId','name category price')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};

// GET /api/orders/my-purchases — Wholesale/Mini Stock purchases (orders they placed as buyer)
const getWholesalePurchases = async (req, res, next) => {
  try {
    if (!['WHOLESALE', 'MINI_STOCK'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    // Orders where this user is the BUYER
    const filter = {
      buyerId: req.user._id,
      buyerType: req.user.role, // WHOLESALE or MINI_STOCK
    };

    const orders = await Order.find(filter)
      .populate('buyerId',  'name email role')
      .populate('sellerId', 'name role')
      .populate('productId','name category price image')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};

// GET /api/orders/mini — Mini Stock orders (their purchase orders)
const getMiniOrders = async (req, res, next) => {
  try {
    // Only Mini Stock can access
    if (req.user.role !== 'MINI_STOCK') {
      return res.status(403).json({ success: false, error: 'Access denied. Mini Stock only.' });
    }

    // Filter: buyerId = current user (orders they placed)
    const orders = await Order.find({
      buyerId: req.user._id
    })
      .populate('buyerId', 'name email role')
      .populate('sellerId', 'name role')
      .populate('productId', 'name category price')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};

// GET /api/orders  — admin: all orders; manager: subtree orders
const getOrders = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role !== 'ADMIN') {
      const subtreeIds = await getSubtreeIds(req.user._id);
      filter = { advisorId: { $in: subtreeIds } };
    }
    const orders = await Order.find(filter)
      .populate('advisorId', 'name advisorCode')
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};

// GET /api/orders/:id
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('advisorId', 'name advisorCode')
      .populate('productId', 'name category price')
      .populate('farmerId', 'name village')
      .populate('hierarchySnapshot.advisorId', 'name')
      .populate('hierarchySnapshot.doManagerId', 'name')
      .populate('hierarchySnapshot.areaManagerId', 'name')
      .populate('hierarchySnapshot.zonalManagerId', 'name')
      .populate('hierarchySnapshot.stateHeadId', 'name');
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// PUT /api/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// PUT /api/orders/:id/verify-payment — Admin marks payment as received/verified
const verifyPayment = async (req, res, next) => {
  try {
    // Admin or Wholesale (for their incoming orders) can verify payments
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const isAdmin = req.user.role === 'ADMIN';
    const isWholesaleSeller = req.user.role === 'WHOLESALE' && order.sellerId.toString() === req.user._id.toString();
    
    if (!isAdmin && !isWholesaleSeller) {
      return res.status(403).json({ success: false, error: 'Only Admin or the seller can verify payments' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ success: false, error: 'Payment already verified' });
    }
    if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
      return res.status(400).json({ success: false, error: 'Cannot verify payment for this order status' });
    }

    order.paymentStatus = 'PAID';
    await order.save();

    res.json({ success: true, data: order, message: 'Payment verified successfully' });
  } catch (err) { next(err); }
};


// PUT /api/orders/:id/approve — Seller approves order
const approveOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // Company orders: any Admin can approve
    // Wholesale orders: only the specific Wholesale seller
    const isCompanySeller = order.sellerType === 'COMPANY' && req.user.role === 'ADMIN';
    const isDirectSeller  = order.sellerId.toString() === req.user._id.toString();
    if (!isCompanySeller && !isDirectSeller) {
      return res.status(403).json({ success: false, error: 'You are not the seller of this order' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Order is not pending' });
    }
    
    // For customer orders (Mini Stock selling to customers), payment verification is not required
    // as these are typically cash sales or already paid
    const isCustomerOrder = order.buyerType === 'CUSTOMER';
    if (!isCustomerOrder && order.paymentStatus !== 'PAID') {
      return res.status(400).json({ success: false, error: 'Payment must be verified before approval' });
    }

    // Non-admin sellers: check inventory
    if (!isCompanySeller) {
      const inventory = await Inventory.findOne({ ownerId: req.user._id });
      if (!inventory) return res.status(400).json({ success: false, error: 'Seller inventory not found' });
      const idx = inventory.items.findIndex(i => i.productId.toString() === order.productId.toString());
      if (idx < 0 || inventory.items[idx].current < order.quantity) {
        return res.status(400).json({ success: false, error: 'Insufficient stock to fulfill order' });
      }
    }

    order.status     = 'APPROVED';
    order.approvedAt = new Date();
    await order.save();

    const populated = await Order.findById(order._id)
      .populate('productId', 'name category price')
      .populate('sellerId',  'name role')
      .populate('buyerId',   'name role');

    res.json({ success: true, data: populated, message: 'Order approved successfully' });
  } catch (err) { next(err); }
};


// PUT /api/orders/:id/reject — Seller rejects a pending order
const rejectOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const isCompanySeller = order.sellerType === 'COMPANY' && req.user.role === 'ADMIN';
    const isDirectSeller  = order.sellerId.toString() === req.user._id.toString();
    if (!isCompanySeller && !isDirectSeller) {
      return res.status(403).json({ success: false, error: 'You are not the seller of this order' });
    }
    if (order.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Only pending orders can be rejected' });
    }

    order.status = 'CANCELLED';
    await order.save();

    res.json({ success: true, data: order, message: 'Order rejected successfully' });
  } catch (err) { next(err); }
};


// PUT /api/orders/:id/ship — Seller marks order as shipped
const shipOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // Company orders: any Admin can ship
    // Wholesale orders: only the specific Wholesale seller
    const isCompanySeller = order.sellerType === 'COMPANY' && req.user.role === 'ADMIN';
    const isDirectSeller  = order.sellerId.toString() === req.user._id.toString();
    if (!isCompanySeller && !isDirectSeller) {
      return res.status(403).json({ success: false, error: 'You are not the seller of this order' });
    }

    if (order.status !== 'APPROVED') {
      return res.status(400).json({ success: false, error: 'Order must be approved before shipping' });
    }

    order.status    = 'SHIPPED';
    order.shippedAt = new Date();
    await order.save();

    const populated = await Order.findById(order._id)
      .populate('productId', 'name category price')
      .populate('sellerId',  'name role')
      .populate('buyerId',   'name role');

    res.json({ success: true, data: populated, message: 'Order marked as shipped' });
  } catch (err) { next(err); }
};

// PUT /api/orders/:id/deliver — Buyer confirms delivery
// Production-level: uses transactions when replica set is available,
// falls back to sequential operations on standalone MongoDB (dev mode).
const confirmDelivery = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // ── Guards ────────────────────────────────────────────────────────────────
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Only the buyer can confirm delivery' });
    }
    if (order.status !== 'SHIPPED') {
      return res.status(400).json({ success: false, error: 'Order must be shipped before delivery confirmation' });
    }

    // ── Core delivery logic (shared between transactional & fallback paths) ──
    const processDelivery = async (sessionOpts = {}) => {

      // 1. Deduct from seller inventory (skip for COMPANY — they are the origin)
      if (order.sellerType !== 'COMPANY') {
        const sellerInventory = await Inventory.findOne({ ownerId: order.sellerId });
        if (!sellerInventory) throw new Error('Seller inventory not found');
        const idx = sellerInventory.items.findIndex(
          i => i.productId.toString() === order.productId.toString()
        );
        if (idx < 0 || sellerInventory.items[idx].current < order.quantity) {
          throw new Error('Insufficient stock in seller inventory');
        }
        sellerInventory.items[idx].dispatched  += order.quantity;
        sellerInventory.items[idx].current     -= order.quantity;
        sellerInventory.items[idx].lastUpdated  = new Date();
        await sellerInventory.save(sessionOpts);
      }

      // 2. Add to buyer inventory (create if first time)
      let buyerInventory = await Inventory.findOne({ ownerId: order.buyerId });
      if (!buyerInventory) {
        buyerInventory = new Inventory({
          ownerId:   order.buyerId,
          ownerRole: order.buyerType,
          items:     [],
        });
      }
      const bIdx = buyerInventory.items.findIndex(
        i => i.productId.toString() === order.productId.toString()
      );
      if (bIdx >= 0) {
        buyerInventory.items[bIdx].received    += order.quantity;
        buyerInventory.items[bIdx].current     += order.quantity;
        buyerInventory.items[bIdx].lastUpdated  = new Date();
      } else {
        buyerInventory.items.push({
          productId:   order.productId,
          received:    order.quantity,
          dispatched:  0,
          current:     order.quantity,
          minLevel:    10,
          lastUpdated: new Date(),
        });
      }
      await buyerInventory.save(sessionOpts);

      // 3. Stock log
      const logType = order.sellerType === 'COMPANY'  ? 'PURCHASE' :
                      order.buyerType  === 'CUSTOMER' ? 'SALE'     : 'TRANSFER';
      await StockLog.create([{
        type:      logType,
        orderId:   order._id,
        productId: order.productId,
        quantity:  order.quantity,
        from:      order.sellerId,
        to:        order.buyerId,
        notes:     `${order.sellerType} → ${order.buyerType}`,
      }], sessionOpts);

      // 4. Commissions (advisor sales only)
      if (order.advisorId && order.hierarchySnapshot) {
        const commissionData = await calculateCommissions(order, order.hierarchySnapshot);
        if (commissionData.length > 0) {
          const saved = await Commission.insertMany(commissionData, sessionOpts);
          // Notify asynchronously — don't block the response
          setImmediate(async () => {
            for (const comm of saved) {
              try {
                const recipient = await User.findById(comm.userId);
                if (recipient) await notifyCommission(comm, recipient);
              } catch (_) {}
            }
          });
        }
        await User.findByIdAndUpdate(
          order.advisorId,
          { $inc: { totalSales: order.total } },
          sessionOpts
        );
      }

      // 5. Mark order delivered
      order.status      = 'DELIVERED';
      order.deliveredAt = new Date();
      await order.save(sessionOpts);
    };

    // ── Transactional path (Replica Set) ─────────────────────────────────────
    if (global.__REPLICA_SET_AVAILABLE__) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction({
          readConcern:  { level: 'snapshot' },
          writeConcern: { w: 'majority' },
        });
        await processDelivery({ session });
        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }

    // ── Sequential fallback (Standalone dev MongoDB) ──────────────────────────
    } else {
      await processDelivery();
    }

    // ── Response ──────────────────────────────────────────────────────────────
    const populated = await Order.findById(order._id)
      .populate('productId', 'name category price')
      .populate('sellerId',  'name role')
      .populate('buyerId',   'name role')
      .populate('advisorId', 'name advisorCode');

    res.json({
      success: true,
      data:    populated,
      message: 'Delivery confirmed. Stock updated and commissions distributed.',
    });

  } catch (err) { next(err); }
};

// POST /api/orders/pos-sale — Create POS sale (Mini Stock → Customer)
const createPOSSale = async (req, res, next) => {
  try {
    const { farmerName, farmerPhone, farmerLocation, advisorCode, items, paymentMethod, discount = 0 } = req.body;

    // Validate Mini Stock role
    if (req.user.role !== 'MINI_STOCK') {
      return res.status(403).json({ success: false, error: 'Only Mini Stock can create POS sales' });
    }

    // Validate required fields
    if (!farmerName || !farmerPhone || !items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Farmer name, phone, and at least one item are required' 
      });
    }

    // Validate advisor code if provided
    let advisorId = null;
    let hierarchySnapshot = null;
    
    if (advisorCode) {
      console.log(`🔍 Looking up advisor code: ${advisorCode}`);
      const advisor = await User.findOne({ 
        advisorCode: advisorCode.toUpperCase(),
        status: 'APPROVED'
      }).lean();
      
      if (!advisor) {
        console.log(`❌ Advisor not found for code: ${advisorCode}`);
        return res.status(404).json({ success: false, error: 'Invalid advisor code or advisor not approved' });
      }
      
      advisorId = advisor._id;
      hierarchySnapshot = await buildHierarchySnapshot(advisorId);
      console.log(`✅ Advisor found: ${advisor.name} (${advisor._id})`);
      console.log(`📊 Hierarchy snapshot built for advisor`);
    } else {
      console.log(`⚠️  No advisor code provided in POS sale`);
    }

    // Get Mini Stock inventory
    const inventory = await Inventory.findOne({ ownerId: req.user._id });
    if (!inventory) {
      return res.status(404).json({ success: false, error: 'Inventory not found' });
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const createdOrders = [];
      let totalAmount = 0;

      // Process each item
      for (const item of items) {
        const { productId, quantity } = item;

        // Validate product
        const product = await Product.findById(productId).session(session);
        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }

        // Check stock availability
        const stockItem = inventory.items.find(i => i.productId.toString() === productId);
        if (!stockItem || stockItem.current < quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${stockItem?.current || 0}, Required: ${quantity}`);
        }

        const price = Number(product.price);
        const itemTotal = price * quantity;
        totalAmount += itemTotal;

        // Create order (buyerId = sellerId for customer sales since customer is not a user)
        const order = await Order.create([{
          buyerId: req.user._id, // Use Mini Stock as buyer for customer sales
          buyerType: 'CUSTOMER',
          sellerId: req.user._id,
          sellerType: 'MINI_STOCK',
          productId,
          quantity,
          price,
          total: itemTotal,
          advisorId,
          hierarchySnapshot,
          status: 'DELIVERED', // POS sales are instant (uppercase)
          paymentStatus: 'PAID',
          source: 'POS',
          region: farmerLocation || req.user.region,
          customerName: farmerName,
          customerPhone: farmerPhone,
          customerLocation: farmerLocation,
        }], { session });

        console.log(`📦 Order created: ${order[0]._id}`);
        console.log(`   Product: ${product.name}`);
        console.log(`   Total: ₹${itemTotal}`);
        console.log(`   advisorId: ${advisorId || 'NULL'}`);
        console.log(`   Customer: ${farmerName}`);


        // Deduct stock immediately (use 'current' field)
        await Inventory.updateOne(
          { ownerId: req.user._id, 'items.productId': productId },
          { 
            $inc: { 
              'items.$.current': -quantity,
              'items.$.dispatched': quantity
            } 
          },
          { session }
        );

        // Log stock change
        await StockLog.create([{
          type: 'SALE',
          orderId: order[0]._id,
          productId,
          quantity,
          from: req.user._id,
          to: req.user._id, // Mini Stock is both from and to for customer sales
          notes: `POS Sale to ${farmerName} (${farmerPhone})`,
        }], { session });

        createdOrders.push(order[0]);
      }

      // Apply discount
      const discountAmount = (totalAmount * discount) / 100;
      const finalAmount = totalAmount - discountAmount;

      // Calculate and distribute commissions if advisor exists
      if (advisorId && hierarchySnapshot) {
        const { distributeIncome } = require('../services/income.service');
        
        // Distribute income for each order
        for (const order of createdOrders) {
          try {
            await distributeIncome(order, hierarchySnapshot);
          } catch (commError) {
            console.error(`Failed to distribute income for order ${order._id}:`, commError.message);
            // Don't fail the transaction if commission distribution fails
          }
        }
      }

      await session.commitTransaction();

      // Populate orders for response
      const populatedOrders = await Order.find({ 
        _id: { $in: createdOrders.map(o => o._id) } 
      })
        .populate('productId', 'name category price sku image')
        .populate('advisorId', 'name advisorCode')
        .lean();

      res.json({
        success: true,
        data: {
          orders: populatedOrders,
          invoice: {
            invoiceNumber: `INV-${Date.now()}`,
            date: new Date(),
            farmerName,
            farmerPhone,
            farmerLocation,
            advisorCode,
            items: populatedOrders.map(o => ({
              productName: o.productId.name,
              sku: o.productId.sku,
              quantity: o.quantity,
              price: o.price,
              total: o.total,
            })),
            subtotal: totalAmount,
            discount: discountAmount,
            tax: 0, // Add tax calculation if needed
            totalAmount: finalAmount,
            paymentMethod: paymentMethod || 'CASH',
            seller: {
              name: req.user.name,
              role: req.user.role,
              region: req.user.region,
            }
          }
        },
        message: 'Sale completed successfully',
      });

    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

  } catch (err) { next(err); }
};


module.exports = { 
  createOrder, 
  getMyOrders,
  getAdminOrders,
  getWholesaleOrders,
  getWholesalePurchases,
  getMiniOrders,
  getOrders, 
  getOrder, 
  updateOrderStatus,
  verifyPayment,
  approveOrder,
  rejectOrder,
  shipOrder,
  confirmDelivery,
  createPOSSale,
};



