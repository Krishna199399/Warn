const Farmer = require('../models/Farmer');
const Order  = require('../models/Order');
const User   = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/farmers/my — all farmers linked to current advisor
// ─────────────────────────────────────────────────────────────────────────────
const getMyFarmers = async (req, res, next) => {
  try {
    // 1. Get registered farmers
    const registeredFarmers = await Farmer.find({ advisorId: req.user._id }).sort({ name: 1 }).lean();
    
    // 2. Get all non-cancelled orders associated with this advisor
    const orders = await Order.find({ 
      advisorId: req.user._id,
      status: { $ne: 'CANCELLED' }
    })
      .select('farmerId customerName customerPhone customerLocation total createdAt')
      .sort({ createdAt: -1 })
      .lean();
    
    const farmerMap = new Map();
    
    // Add registered farmers to map
    registeredFarmers.forEach(f => {
      farmerMap.set(f._id.toString(), { 
        ...f, 
        source: 'registered',
        totalOrders: 0,
        spent: 0,
        lastOrder: null
      });
    });
    
    // Process orders to capture unregistered POS customers
    orders.forEach(order => {
      const isRegistered = order.farmerId != null;
      let key;
      if (isRegistered) {
        key = order.farmerId.toString();
      } else {
        if (order.customerPhone) key = `phone_${order.customerPhone}`;
        else if (order.customerName) key = `name_${order.customerName}`;
        else return; // skip if no identifiable info
      }
      
      if (!farmerMap.has(key)) {
        // Create pseudo-farmer from POS sale
        farmerMap.set(key, {
          _id: key, // Use generated key as _id for React keys
          advisorId: req.user._id,
          name: order.customerName || 'Unknown Customer',
          phone: order.customerPhone || '',
          village: order.customerLocation || '',
          acres: 0,
          crop: '',
          status: 'Active',
          source: 'order',
          totalOrders: 0,
          spent: 0,
          lastOrder: null
        });
      }
      
      // If it's a POS pseudo-farmer, update stats directly from this query
      // (For registered farmers, we'll do a comprehensive query next)
      if (!isRegistered) {
        const f = farmerMap.get(key);
        f.totalOrders += 1;
        f.spent += order.total;
        
        const orderDate = order.createdAt?.toISOString().split('T')[0];
        if (orderDate && (!f.lastOrder || orderDate > f.lastOrder)) {
          f.lastOrder = orderDate;
        }
      }
    });
    
    // 3. For registered farmers, fetch ALL their orders (not just those with this advisor)
    // This maintains the original logic but without the N+1 query problem
    if (registeredFarmers.length > 0) {
      const regFarmerIds = registeredFarmers.map(f => f._id);
      const allRegOrders = await Order.find({
        farmerId: { $in: regFarmerIds },
        status: { $ne: 'CANCELLED' }
      }).select('farmerId total createdAt').lean();
      
      allRegOrders.forEach(order => {
        const fm = farmerMap.get(order.farmerId.toString());
        if (fm) {
          fm.totalOrders += 1;
          fm.spent += order.total;
          const orderDate = order.createdAt?.toISOString().split('T')[0];
          if (orderDate && (!fm.lastOrder || orderDate > fm.lastOrder)) {
            fm.lastOrder = orderDate;
          }
        }
      });
    }

    const allFarmers = Array.from(farmerMap.values());
    allFarmers.sort((a, b) => b.spent - a.spent); // Sort by highest spent
    
    res.json({ success: true, data: allFarmers });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/farmers/lookup/:phone — Lookup farmer by phone (used by POS)
// ─────────────────────────────────────────────────────────────────────────────
const lookupByPhone = async (req, res, next) => {
  try {
    const phone = req.params.phone?.trim();
    if (!phone || phone.length < 10) {
      return res.json({ success: true, data: null });
    }

    const farmer = await Farmer.findOne({ phone })
      .populate('advisorId', 'name employeeCode status role')
      .lean();

    if (!farmer) {
      return res.json({ success: true, data: null }); // new customer
    }

    // Check if assigned advisor is still active
    let advisorActive = false;
    if (farmer.advisorId) {
      advisorActive = farmer.advisorId.status === 'APPROVED';
    }

    res.json({
      success: true,
      data: {
        ...farmer,
        advisorActive,
      },
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/farmers/:id
// ─────────────────────────────────────────────────────────────────────────────
const getFarmer = async (req, res, next) => {
  try {
    const f = await Farmer.findById(req.params.id);
    if (!f) return res.status(404).json({ success: false, error: 'Farmer not found' });
    res.json({ success: true, data: f });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/farmers — Create farmer (manual registration by advisor)
// ─────────────────────────────────────────────────────────────────────────────
const createFarmer = async (req, res, next) => {
  try {
    // Check if phone already exists
    const existing = await Farmer.findOne({ phone: req.body.phone });
    if (existing) {
      return res.status(400).json({ success: false, error: 'A farmer with this phone number already exists' });
    }

    const f = await Farmer.create({
      ...req.body,
      advisorId: req.user._id,
      assignedAt: new Date(),
      assignmentSource: 'MANUAL',
    });
    res.status(201).json({ success: true, data: f });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/farmers/:id
// ─────────────────────────────────────────────────────────────────────────────
const updateFarmer = async (req, res, next) => {
  try {
    const f = await Farmer.findOneAndUpdate(
      { _id: req.params.id, advisorId: req.user._id },
      req.body, { new: true }
    );
    if (!f) return res.status(404).json({ success: false, error: 'Farmer not found' });
    res.json({ success: true, data: f });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/farmers/:id/orders
// ─────────────────────────────────────────────────────────────────────────────
const getFarmerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ farmerId: req.params.id })
      .populate('productId', 'name category').sort({ date: -1 }).lean();
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/farmers/:id/reassign — Admin reassigns farmer to a different advisor
// ─────────────────────────────────────────────────────────────────────────────
const reassignAdvisor = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const { newAdvisorId } = req.body;
    if (!newAdvisorId) {
      return res.status(400).json({ success: false, error: 'newAdvisorId is required' });
    }

    const farmer = await Farmer.findById(req.params.id);
    if (!farmer) return res.status(404).json({ success: false, error: 'Farmer not found' });

    const newAdvisor = await User.findById(newAdvisorId);
    if (!newAdvisor || newAdvisor.status !== 'APPROVED') {
      return res.status(400).json({ success: false, error: 'Invalid or inactive advisor' });
    }

    // Log previous assignment in audit trail
    if (farmer.advisorId) {
      farmer.previousAdvisors.push({
        advisorId: farmer.advisorId,
        from: farmer.assignedAt,
        to: new Date(),
        reason: 'ADMIN_REASSIGN',
      });
    }

    farmer.advisorId = newAdvisorId;
    farmer.assignedAt = new Date();
    farmer.assignmentSource = 'REASSIGNED';
    await farmer.save();

    const populated = await Farmer.findById(farmer._id)
      .populate('advisorId', 'name employeeCode role')
      .lean();

    res.json({ success: true, data: populated, message: 'Farmer reassigned successfully' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// Bulk reassign all farmers from a deactivated advisor to their DO Manager
// (Called internally when an advisor is deactivated)
// ─────────────────────────────────────────────────────────────────────────────
async function reassignFarmersFromAdvisor(advisorId) {
  try {
    const advisor = await User.findById(advisorId).lean();
    if (!advisor) return 0;

    // Find the advisor's DO Manager (parentId)
    let newAdvisorId = null;
    if (advisor.parentId) {
      const doManager = await User.findById(advisor.parentId).lean();
      if (doManager && doManager.status === 'APPROVED') {
        newAdvisorId = doManager._id;
      }
    }

    const farmers = await Farmer.find({ advisorId });
    if (farmers.length === 0) return 0;

    for (const farmer of farmers) {
      farmer.previousAdvisors.push({
        advisorId: farmer.advisorId,
        from: farmer.assignedAt,
        to: new Date(),
        reason: 'DEACTIVATED',
      });
      farmer.advisorId = newAdvisorId;
      farmer.assignedAt = newAdvisorId ? new Date() : null;
      farmer.assignmentSource = newAdvisorId ? 'REASSIGNED' : null;
      await farmer.save();
    }

    console.log(`🔄 Reassigned ${farmers.length} farmers from ${advisorId} → ${newAdvisorId || 'UNASSIGNED'}`);
    return farmers.length;
  } catch (err) {
    console.error('❌ reassignFarmersFromAdvisor:', err.message);
    return 0;
  }
}

module.exports = {
  getMyFarmers, getFarmer, createFarmer, updateFarmer, getFarmerOrders,
  lookupByPhone, reassignAdvisor, reassignFarmersFromAdvisor,
};
