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
    
    // Get today's summary (type-specific)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
    
    const todaySummary = await getCommissionSummary(req.user._id, {
      startDate: today,
      endDate: tomorrow
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
        RP:           summary.RP,
        IV:           summary.IV,
        SV:           summary.SV,
        RV:           summary.RV,
        count:        summary.count,
        thisMonth:    thisMonthSummary.total,
        thisMonthRP:  thisMonthSummary.RP,
        thisMonthIV:  thisMonthSummary.IV,
        thisMonthSV:  thisMonthSummary.SV,
        thisMonthRV:  thisMonthSummary.RV,
        today:        todaySummary.total,
        todayRP:      todaySummary.RP,
        todayIV:      todaySummary.IV,
        todaySV:      todaySummary.SV,
        todayRV:      todaySummary.RV,
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
      RP: commissions.filter(c => c.type === 'RP'),
      IV: commissions.filter(c => c.type === 'IV'),
      SV: commissions.filter(c => c.type === 'SV'),
      RV: commissions.filter(c => c.type === 'RV'),
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

// GET /api/commissions - Admin/Manager view all commissions with filters
const getAllCommissions = async (req, res, next) => {
  try {
    const { userId, type, status, startDate, endDate, limit = 50 } = req.query;
    
    const query = {};
    
    if (userId) query.userId = userId;
    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const commissions = await Commission.find(query)
      .populate('userId', 'name role email')
      .populate('orderId', 'orderNumber total status')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .lean();
      
    res.json({ success: true, data: commissions });
  } catch (err) { next(err); }
};

module.exports = { 
  getMyCommissions, 
  getMySummary, 
  getCommissionsByOrder, 
  getSubtreeCommissions,
  getAllCommissions 
};

