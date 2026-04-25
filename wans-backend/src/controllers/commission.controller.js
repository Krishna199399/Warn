const Commission = require('../models/Commission');
const Order      = require('../models/Order');
const { getSubtreeIds } = require('../services/hierarchy.service');
const { getCommissionSummary } = require('../services/income.service');

// GET /api/commissions/my
const getMyCommissions = async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    const query = { userId: req.user._id };
    
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const commissions = await Commission.find(query)
      .sort({ date: -1 })
      .lean();
      
    res.json({ success: true, data: commissions });
  } catch (err) { next(err); }
};

// GET /api/commissions/summary
const getMySummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get summary by type (IV, SV, RF)
    const summary = await getCommissionSummary(req.user._id, { startDate, endDate });
    
    // Get current month summary
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonthSummary = await getCommissionSummary(req.user._id, {
      startDate: `${currentMonth}-01`,
      endDate: new Date()
    });
    
    // Get breakdown by level
    const levelBreakdown = await Commission.aggregate([
      { $match: { userId: req.user._id } },
      { $group: {
        _id: '$level',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Prevent caching - always fetch fresh data
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      data: {
        total:        summary.total,
        RETAIL_PRICE: summary.RETAIL_PRICE,
        IV:           summary.IV,
        SV:           summary.SV,
        RF:           summary.RF,
        count:        summary.count,
        thisMonth:    thisMonthSummary.total,
        levelBreakdown
      },
    });
  } catch (err) { next(err); }
};

// GET /api/commissions/order/:orderId
const getCommissionsByOrder = async (req, res, next) => {
  try {
    const commissions = await Commission.find({ orderId: req.params.orderId })
      .populate('userId', 'name role')
      .sort({ type: 1, level: 1 })
      .lean();
      
    // Group by type for better visualization
    const grouped = {
      RETAIL_PRICE: commissions.filter(c => c.type === 'RETAIL_PRICE'),
      IV: commissions.filter(c => c.type === 'IV'),
      SV: commissions.filter(c => c.type === 'SV'),
      RF: commissions.filter(c => c.type === 'RF')
    };
    
    res.json({ success: true, data: commissions, grouped });
  } catch (err) { next(err); }
};

// GET /api/commissions/subtree  — manager sees all commissions earned in downline
const getSubtreeCommissions = async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    const subtreeIds  = await getSubtreeIds(req.user._id);
    
    const query = { userId: { $in: [req.user._id, ...subtreeIds] } };
    
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const commissions = await Commission.find(query)
      .populate('userId', 'name role')
      .sort({ date: -1 })
      .lean();
      
    res.json({ success: true, data: commissions });
  } catch (err) { next(err); }
};

module.exports = { getMyCommissions, getMySummary, getCommissionsByOrder, getSubtreeCommissions };

