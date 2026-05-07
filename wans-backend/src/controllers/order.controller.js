const Order      = require('../models/Order');
const Commission = require('../models/Commission');
const User       = require('../models/User');
const Inventory  = require('../models/Inventory');
const Product    = require('../models/Product');
const StockLog   = require('../models/StockLog');
const Farmer     = require('../models/Farmer');
const Visit      = require('../models/Visit');
const mongoose   = require('mongoose');
const { buildHierarchySnapshot, calculateCommissions, getSubtreeIds } = require('../services/hierarchy.service');
const { notifyNewOrder, notifyCommission } = require('../services/notification.service');
const { checkAndUpdateRewards, checkAndUpgradeLevel } = require('./salary.controller');

// POST /api/orders  — create order (NO stock update until delivery)
const createOrder = async (req, res, next) => {
  try {
    const { buyerType, productId, quantity, advisorCode, farmerId, region, deliveryAddress } = req.body;

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

    // Determine price based on buyer type
    let price;
    if (buyerType === 'WHOLESALE') {
      price = Number(product.wholesalePrice) || 0;
      if (price <= 0) {
        return res.status(400).json({ success: false, error: 'Product has no wholesale price set' });
      }
    } else if (buyerType === 'MINI_STOCK') {
      price = Number(product.miniStockPrice) || 0;
      if (price <= 0) {
        return res.status(400).json({ success: false, error: 'Product has no mini-stock price set' });
      }
    } else {
      // Customer orders use MRP
      price = Number(product.price) || 0;
      if (price <= 0) {
        return res.status(400).json({ success: false, error: 'Product has no valid price' });
      }
    }

    const qty   = Number(quantity);
    const subtotal = price * qty;

    // Use product's tax rate (not user's tax config)
    const taxRate = Number(product.taxRate) || 18;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    // Freeze commission pool values at time of order
    const productSnapshot = {
      rpPoints: Number(product.rp) || 0,
      ivPoints: Number(product.iv) || 0,
      svPoints: Number(product.sv) || 0,
      rvPoints: Number(product.rv) || 0,
      mrp: Number(product.mrp) || 0,
      wholesalePrice: Number(product.wholesalePrice) || 0,
      miniStockPrice: Number(product.miniStockPrice) || 0,
      wholesaleMargin: Number(product.wholesaleMargin) || 0,
      miniStockMargin: Number(product.miniStockMargin) || 0,
    };

    // Calculate buyer commission based on role
    let buyerCommission = {
      type: 'NONE',
      amountPerUnit: 0,
      totalAmount: 0,
      recorded: false,
    };

    if (buyerType === 'WHOLESALE' && productSnapshot.wholesaleMargin > 0) {
      buyerCommission = {
        type: 'WHOLESALE_MARGIN',
        amountPerUnit: productSnapshot.wholesaleMargin,
        totalAmount: productSnapshot.wholesaleMargin * qty,
        recorded: false,
      };
    } else if (buyerType === 'MINI_STOCK' && productSnapshot.miniStockMargin > 0) {
      buyerCommission = {
        type: 'MINISTOCK_MARGIN',
        amountPerUnit: productSnapshot.miniStockMargin,
        totalAmount: productSnapshot.miniStockMargin * qty,
        recorded: false,
      };
    }

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
      
      // If sellerId is provided, use that specific wholesale seller
      if (req.body.sellerId) {
        const wholesale = await User.findOne({ 
          _id: req.body.sellerId, 
          role: 'WHOLESALE', 
          status: 'APPROVED' 
        }).lean();
        
        if (!wholesale) {
          return res.status(404).json({ 
            success: false, 
            error: 'Selected Wholesale seller not found or not approved' 
          });
        }
        
        sellerId = wholesale._id;
      } else {
        // Fallback: find any approved wholesale seller (for backward compatibility)
        const wholesale = await User.findOne({ role: 'WHOLESALE', status: 'APPROVED' }).lean();
        if (!wholesale) {
          return res.status(404).json({ success: false, error: 'No approved Wholesale found. Please contact your manager.' });
        }
        sellerId = wholesale._id;
      }
      
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
        employeeCode: advisorCode.toUpperCase(),
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
      subtotal,
      taxRate,
      taxAmount,
      total,
      advisorId,
      farmerId:  farmerId || null,
      region:    region   || '',
      deliveryAddress: deliveryAddress || null,
      hierarchySnapshot,
      productSnapshot,
      buyerCommission,
      status:        'PENDING',
      paymentStatus: initialPaymentStatus,
      source:        'WEBSITE',
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('productId', 'name category price')
      .populate('sellerId',  'name role')
      .populate('advisorId', 'name employeeCode')
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

    // Return ALL orders for Mini Stock: both as buyer (purchases) and as seller (POS sales)
    const orders = await Order.find({
      $or: [
        { buyerId: req.user._id },   // Orders where they are buyer (purchases from Wholesale)
        { sellerId: req.user._id }   // Orders where they are seller (POS sales to customers)
      ]
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
    
    // Add date filtering support
    if (req.query.startDate) {
      filter.createdAt = { ...filter.createdAt, $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      filter.createdAt = { ...filter.createdAt, $lte: new Date(req.query.endDate) };
    }
    
    // Add limit support
    const limit = req.query.limit ? parseInt(req.query.limit) : 0;
    
    const orders = await Order.find(filter)
      .populate('advisorId', 'name employeeCode')
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};

// GET /api/orders/:id
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('advisorId', 'name employeeCode')
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
          
          // Update reward progress for users who received RV commissions
          // This runs asynchronously to avoid blocking the transaction
          setImmediate(async () => {
            // Track unique users who received RV commissions
            const rvUsers = new Set();
            
            for (const comm of saved) {
              try {
                // Notify commission
                const recipient = await User.findById(comm.userId);
                if (recipient) await notifyCommission(comm, recipient);
                
                // Track RV commission recipients
                if (comm.type === 'RV') {
                  rvUsers.add(comm.userId.toString());
                }
              } catch (err) {
                console.error('Error in commission notification:', err);
              }
            }
            
            // Update reward progress for each user who received RV
            for (const userIdStr of rvUsers) {
              try {
                const userId = mongoose.Types.ObjectId(userIdStr);
                const user = await User.findById(userId);
                if (!user) continue;
                
                // Calculate fresh RV total for this user
                const rvAgg = await Commission.aggregate([
                  { $match: { userId, type: 'RV' } },
                  { $group: { _id: null, total: { $sum: '$amount' } } },
                ]);
                const totalRv = rvAgg[0]?.total || 0;
                
                // Update reward progress
                await checkAndUpdateRewards(userId, user.role, totalRv);
                console.log(`✅ Updated reward progress for ${user.name} (${user.role}): RV=${totalRv}`);
              } catch (err) {
                console.error(`Error updating rewards for user ${userIdStr}:`, err);
              }
            }
          });
        }
        await User.findByIdAndUpdate(
          order.advisorId,
          { $inc: { totalSales: order.total } },
          sessionOpts
        );
      }

      // 5. Record buyer commission (Wholesale/Mini Stock margin)
      if (order.buyerCommission && order.buyerCommission.type !== 'NONE' && !order.buyerCommission.recorded) {
        const commType = order.buyerCommission.type === 'WHOLESALE_MARGIN' ? 'RP' : 
                         order.buyerCommission.type === 'MINISTOCK_MARGIN' ? 'RP' : 'RP';
        
        await Commission.create([{
          userId: order.buyerId,
          orderId: order._id,
          role: order.buyerType,
          type: commType,
          amount: order.buyerCommission.totalAmount,
          percentage: 100,
          poolAmount: order.buyerCommission.totalAmount,
          saleRV: order.total,
          level: 'Direct',
          configSnapshot: {
            productSnapshot: order.productSnapshot,
            incomeConfig: null,
          },
          snapshotUsed: true,
        }], sessionOpts);
        
        order.buyerCommission.recorded = true;
      }

      // 5. Mark order delivered
      order.status      = 'DELIVERED';
      order.deliveredAt = new Date();
      await order.save(sessionOpts);

      // 6. Auto-create visit for advisor follow-up (if advisor exists)
      if (order.advisorId && order.farmerId) {
        const visitDate = new Date();
        visitDate.setDate(visitDate.getDate() + 12); // Schedule visit 12 days after delivery

        await Visit.create([{
          farmerId: order.farmerId,
          advisorId: order.advisorId,
          orderId: order._id,
          productId: order.productId,
          scheduledDate: visitDate,
          status: 'PENDING',
          notes: 'Auto-scheduled follow-up visit after product delivery'
        }], sessionOpts);
      }
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
      .populate('advisorId', 'name employeeCode');

    res.json({
      success: true,
      data:    populated,
      message: 'Delivery confirmed. Stock updated and commissions distributed.',
    });

  } catch (err) { next(err); }
};

// POST /api/orders/pos-sale — Create POS sale (Mini Stock → Customer)
// Smart advisor resolution:
//   1. Look up farmer by phone
//   2. If farmer has active advisor → reuse (ignore advisorCode input)
//   3. If farmer has inactive advisor → auto-reassign to DO Manager
//   4. If farmer has no advisor → use provided advisorCode
//   5. If no farmer record → create one with provided advisorCode
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

    // ── SMART ADVISOR RESOLUTION ──────────────────────────────────────────────
    let resolvedAdvisorId = null;
    let resolvedHierarchy = null;
    let farmer = await Farmer.findOne({ phone: farmerPhone });
    let advisorSource = 'none'; // tracks how advisor was resolved for logging

    if (farmer && farmer.advisorId) {
      // Farmer already has an advisor — check if still active
      const existingAdvisor = await User.findById(farmer.advisorId).lean();

      if (existingAdvisor && existingAdvisor.status === 'APPROVED') {
        // ✅ Reuse existing advisor (ignore any advisorCode from input)
        resolvedAdvisorId = farmer.advisorId;
        resolvedHierarchy = await buildHierarchySnapshot(resolvedAdvisorId);
        advisorSource = 'existing';
        console.log(`✅ Farmer ${farmerPhone} → existing advisor ${existingAdvisor.employeeCode}`);
      } else {
        // Advisor is deactivated → try to reassign to DO Manager
        console.log(`⚠️  Farmer ${farmerPhone}'s advisor is inactive, attempting reassignment`);
        let reassigned = false;

        if (existingAdvisor?.parentId) {
          const doManager = await User.findById(existingAdvisor.parentId).lean();
          if (doManager && doManager.status === 'APPROVED') {
            // Log previous advisor in audit trail
            farmer.previousAdvisors.push({
              advisorId: farmer.advisorId,
              from: farmer.assignedAt,
              to: new Date(),
              reason: 'DEACTIVATED',
            });
            farmer.advisorId = doManager._id;
            farmer.assignedAt = new Date();
            farmer.assignmentSource = 'REASSIGNED';
            await farmer.save();

            resolvedAdvisorId = doManager._id;
            resolvedHierarchy = await buildHierarchySnapshot(resolvedAdvisorId);
            advisorSource = 'reassigned_do';
            reassigned = true;
            console.log(`🔄 Farmer ${farmerPhone} reassigned to DO Manager ${doManager.name}`);
          }
        }

        // If DO Manager also unavailable, try the fresh advisorCode from input
        if (!reassigned && advisorCode) {
          const freshAdvisor = await User.findOne({
            employeeCode: advisorCode.toUpperCase(),
            status: 'APPROVED'
          }).lean();
          if (freshAdvisor) {
            farmer.previousAdvisors.push({
              advisorId: farmer.advisorId,
              from: farmer.assignedAt,
              to: new Date(),
              reason: 'DEACTIVATED',
            });
            farmer.advisorId = freshAdvisor._id;
            farmer.assignedAt = new Date();
            farmer.assignmentSource = 'POS_SALE';
            await farmer.save();

            resolvedAdvisorId = freshAdvisor._id;
            resolvedHierarchy = await buildHierarchySnapshot(resolvedAdvisorId);
            advisorSource = 'fresh_code';
            console.log(`🆕 Farmer ${farmerPhone} assigned to new advisor ${freshAdvisor.employeeCode}`);
          }
        }
      }
    } else if (advisorCode) {
      // No farmer record or farmer has no advisor — validate new code
      const advisor = await User.findOne({
        employeeCode: advisorCode.toUpperCase(),
        status: 'APPROVED'
      }).lean();

      if (!advisor) {
        return res.status(404).json({ success: false, error: 'Invalid advisor code or advisor not approved' });
      }

      resolvedAdvisorId = advisor._id;
      resolvedHierarchy = await buildHierarchySnapshot(resolvedAdvisorId);
      advisorSource = 'new_assignment';

      // Create or update Farmer record
      if (!farmer) {
        farmer = await Farmer.create({
          name: farmerName,
          phone: farmerPhone,
          village: farmerLocation || '',
          advisorId: resolvedAdvisorId,
          assignedAt: new Date(),
          assignmentSource: 'POS_SALE',
        });
        console.log(`🆕 New farmer ${farmerPhone} created & assigned to ${advisorCode}`);
      } else {
        // Farmer exists but had no advisor
        farmer.advisorId = resolvedAdvisorId;
        farmer.assignedAt = new Date();
        farmer.assignmentSource = 'POS_SALE';
        farmer.name = farmerName; // update name
        if (farmerLocation) farmer.village = farmerLocation;
        await farmer.save();
        console.log(`📝 Farmer ${farmerPhone} assigned to ${advisorCode}`);
      }
    } else {
      // No advisor code, no existing farmer — create farmer record without advisor
      if (!farmer) {
        farmer = await Farmer.create({
          name: farmerName,
          phone: farmerPhone,
          village: farmerLocation || '',
        });
        console.log(`🆕 New farmer ${farmerPhone} created (no advisor)`);
      } else {
        // Update name/location if changed
        let changed = false;
        if (farmerName && farmer.name !== farmerName) { farmer.name = farmerName; changed = true; }
        if (farmerLocation && farmer.village !== farmerLocation) { farmer.village = farmerLocation; changed = true; }
        if (changed) await farmer.save();
      }
      console.log(`⚠️  No advisor code for farmer ${farmerPhone}`);
    }

    console.log(`📊 Advisor resolution: ${advisorSource} → ${resolvedAdvisorId || 'NONE'}`);

    // ── INVENTORY & ORDER CREATION ────────────────────────────────────────────
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
        console.log(`🔍 Fetched product: ${product.name} (${product.sku})`);
        console.log(`   DB values: rp=${product.rp}, iv=${product.iv}, sv=${product.sv}, rv=${product.rv}`);

        // Check stock availability
        const stockItem = inventory.items.find(i => i.productId.toString() === productId);
        if (!stockItem || stockItem.current < quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${stockItem?.current || 0}, Required: ${quantity}`);
        }

        const price = Number(product.price);
        const itemSubtotal = price * quantity;
        
        // Use product's tax rate
        const productTaxRate = Number(product.taxRate) || 18;
        const itemTaxAmount = (itemSubtotal * productTaxRate) / 100;
        const itemTotal = itemSubtotal + itemTaxAmount;
        totalAmount += itemTotal;

        // Freeze commission pool values at time of sale
        // Updated: 2026-05-05 - Fixed field names for commission calculation
        const productSnapshot = {
          rpPoints: Number(product.rp) || 0,
          ivPoints: Number(product.iv) || 0,
          svPoints: Number(product.sv) || 0,
          rvPoints: Number(product.rv) || 0,
        };
        console.log(`📸 Creating productSnapshot:`, JSON.stringify(productSnapshot, null, 2));

        // Create order
        const order = await Order.create([{
          buyerId: req.user._id,
          buyerType: 'CUSTOMER',
          sellerId: req.user._id,
          sellerType: 'MINI_STOCK',
          productId,
          quantity,
          price,
          subtotal: itemSubtotal,
          taxRate: productTaxRate,
          taxAmount: itemTaxAmount,
          total: itemTotal,
          advisorId: resolvedAdvisorId,
          farmerId: farmer?._id || null,
          hierarchySnapshot: resolvedHierarchy,
          productSnapshot,
          status: 'DELIVERED',
          paymentStatus: 'PAID',
          source: 'POS',
          region: farmerLocation || req.user.region,
          customerName: farmerName,
          customerPhone: farmerPhone,
          customerLocation: farmerLocation,
        }], { session });

        console.log(`📦 Order created: ${order[0]._id} | ${product.name} | ₹${itemTotal}`);

        // Deduct stock
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
          to: req.user._id,
          notes: `POS Sale to ${farmerName} (${farmerPhone})`,
        }], { session });

        createdOrders.push(order[0]);

        // Auto-create visit for advisor follow-up (POS sales are immediately delivered)
        if (resolvedAdvisorId && farmer?._id) {
          const visitDate = new Date();
          visitDate.setDate(visitDate.getDate() + 12); // Schedule visit 12 days after sale

          await Visit.create([{
            farmerId: farmer._id,
            advisorId: resolvedAdvisorId,
            orderId: order[0]._id,
            productId,
            scheduledDate: visitDate,
            status: 'PENDING',
            notes: 'Auto-scheduled follow-up visit after POS sale'
          }], { session });

          console.log(`📅 Visit scheduled for ${visitDate.toDateString()}`);
        }
      }

      // Apply discount
      const discountAmount = (totalAmount * discount) / 100;
      const finalAmount = totalAmount - discountAmount;

      // Calculate and distribute commissions if advisor exists
      if (resolvedAdvisorId && resolvedHierarchy) {
        const { distributeIncome } = require('../services/income.service');
        
        for (const order of createdOrders) {
          try {
            await distributeIncome(order, resolvedHierarchy);
          } catch (commError) {
            console.error(`Failed to distribute income for order ${order._id}:`, commError.message);
          }
        }
        
        // Update reward progress for users who received RV commissions
        // This runs asynchronously after transaction commits
        setImmediate(async () => {
          try {
            // Get all RV commissions for these orders
            const orderIds = createdOrders.map(o => o._id);
            const rvCommissions = await Commission.find({
              orderId: { $in: orderIds },
              type: 'RV'
            }).lean();
            
            // Track unique users who received RV
            const rvUsers = new Set();
            rvCommissions.forEach(comm => {
              rvUsers.add(comm.userId.toString());
            });
            
            // Update reward progress for each user
            for (const userIdStr of rvUsers) {
              try {
                const userId = new mongoose.Types.ObjectId(userIdStr);
                const user = await User.findById(userId);
                if (!user) continue;
                
                // Calculate fresh RV total for this user
                const rvAgg = await Commission.aggregate([
                  { $match: { userId, type: 'RV' } },
                  { $group: { _id: null, total: { $sum: '$amount' } } },
                ]);
                const totalRv = rvAgg[0]?.total || 0;
                
                // Update reward progress
                await checkAndUpdateRewards(userId, user.role, totalRv);
                console.log(`✅ POS: Updated reward progress for ${user.name} (${user.role}): RV=${totalRv}`);
              } catch (err) {
                console.error(`Error updating rewards for user ${userIdStr}:`, err);
              }
            }
          } catch (err) {
            console.error('Error in POS reward update:', err);
          }
        });
      }

      await session.commitTransaction();

      // Build the resolved advisor code for the invoice
      let resolvedAdvisorCode = advisorCode || '';
      if (resolvedAdvisorId && !advisorCode) {
        const adv = await User.findById(resolvedAdvisorId).select('advisorCode').lean();
        resolvedAdvisorCode = adv?.advisorCode || '';
      }

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
          advisorSource,  // tells frontend how advisor was resolved
          invoice: {
            invoiceNumber: `INV-${Date.now()}`,
            date: new Date(),
            farmerName,
            farmerPhone,
            farmerLocation,
            advisorCode: resolvedAdvisorCode,
            items: populatedOrders.map(o => ({
              productName: o.productId.name,
              sku: o.productId.sku,
              quantity: o.quantity,
              price: o.price,
              total: o.total,
            })),
            subtotal: totalAmount,
            discount: discountAmount,
            tax: 0,
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

// POST /api/orders/customer — Create customer order from public website
const createCustomerOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, subtotal, tax, totalAmount } = req.body;

    // Validate customer role
    if (req.user.role !== 'CUSTOMER') {
      return res.status(403).json({ success: false, error: 'Only customers can place orders' });
    }

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one item is required' });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ success: false, error: 'Complete shipping address is required' });
    }

    // Find a wholesale or mini stock to fulfill the order (for now, find any approved wholesale)
    const seller = await User.findOne({ 
      role: { $in: ['WHOLESALE', 'MINI_STOCK'] }, 
      status: 'APPROVED' 
    }).lean();

    if (!seller) {
      return res.status(404).json({ 
        success: false, 
        error: 'No seller available. Please contact support.' 
      });
    }

    // Create orders for each item
    const createdOrders = [];
    
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          error: `Product not found: ${item.product}` 
        });
      }

      const price = Number(item.price || product.price);
      const quantity = Number(item.quantity);
      const total = price * quantity;

      // Create order
      const order = await Order.create({
        buyerId: req.user._id,
        buyerType: 'CUSTOMER',
        sellerId: seller._id,
        sellerType: seller.role,
        productId: item.product,
        quantity,
        price,
        total,
        status: 'PENDING',
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
        paymentMethod: paymentMethod || 'COD',
        source: 'WEBSITE',
        customerName: shippingAddress.name,
        customerPhone: shippingAddress.phone,
        customerLocation: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.pincode}`,
      });

      createdOrders.push(order);
    }

    // Populate the orders
    const populatedOrders = await Order.find({ 
      _id: { $in: createdOrders.map(o => o._id) } 
    })
      .populate('productId', 'name category price image')
      .populate('sellerId', 'name role');

    res.status(201).json({
      success: true,
      data: populatedOrders,
      message: 'Orders placed successfully'
    });

  } catch (err) { 
    console.error('Customer order creation error:', err);
    next(err); 
  }
};


module.exports = { 
  createOrder,
  createCustomerOrder,
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


