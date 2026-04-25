const Farmer = require('../models/Farmer');
const Order  = require('../models/Order');

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

const getFarmer = async (req, res, next) => {
  try {
    const f = await Farmer.findById(req.params.id);
    if (!f) return res.status(404).json({ success: false, error: 'Farmer not found' });
    res.json({ success: true, data: f });
  } catch (err) { next(err); }
};

const createFarmer = async (req, res, next) => {
  try {
    const f = await Farmer.create({ ...req.body, advisorId: req.user._id });
    res.status(201).json({ success: true, data: f });
  } catch (err) { next(err); }
};

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

const getFarmerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ farmerId: req.params.id })
      .populate('productId', 'name category').sort({ date: -1 }).lean();
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};

module.exports = { getMyFarmers, getFarmer, createFarmer, updateFarmer, getFarmerOrders };
