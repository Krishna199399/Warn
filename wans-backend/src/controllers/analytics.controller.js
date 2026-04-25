const Order      = require('../models/Order');
const User       = require('../models/User');
const Commission = require('../models/Commission');
const { getSubtreeIds } = require('../services/hierarchy.service');

// GET /api/analytics/dashboard  — returns role-adapted stats
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role   = req.user.role;

    // For Wholesale/Mini Stock, use sellerId instead of advisorId
    let matchQuery;
    if (role === 'WHOLESALE' || role === 'MINI_STOCK') {
      matchQuery = { sellerId: userId, status: { $ne: 'CANCELLED' } };
    } else if (role === 'ADMIN') {
      // Admin sees all orders
      matchQuery = { status: { $ne: 'CANCELLED' } };
    } else {
      // Employee roles: see their subtree
      const subtreeIds    = await getSubtreeIds(userId);
      const allRelevantIds = [userId, ...subtreeIds];
      matchQuery = { advisorId: { $in: allRelevantIds }, status: { $ne: 'CANCELLED' } };
    }

    // Total sales (orders not cancelled)
    const salesAgg = await Order.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]);

    // Commission earned (only for employee roles)
    let totalEarnings = 0;
    if (role !== 'ADMIN' && role !== 'WHOLESALE' && role !== 'MINI_STOCK') {
      const commAgg = await Commission.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      totalEarnings = commAgg[0]?.total || 0;
    }

    // Network size (people in subtree) - only for employee roles
    let networkSize = 0;
    if (role === 'ADMIN') {
      // Admin sees all users except other admins
      networkSize = await User.countDocuments({ role: { $ne: 'ADMIN' } });
    } else if (role === 'ADVISOR') {
      // Advisors: show their registered farmer count
      const Farmer = require('../models/Farmer');
      networkSize = await Farmer.countDocuments({ advisorId: userId });
    } else if (role !== 'WHOLESALE' && role !== 'MINI_STOCK') {
      const subtreeIds = await getSubtreeIds(userId);
      networkSize = subtreeIds.length;
    }

    // Orders today
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayMatchQuery = { ...matchQuery, createdAt: { $gte: today } };
    const todayOrders = await Order.countDocuments(todayMatchQuery);

    res.json({
      success: true,
      data: {
        totalSales:    salesAgg[0]?.total    || 0,
        totalOrders:   salesAgg[0]?.count    || 0,
        totalEarnings: totalEarnings,
        ordersToday:   todayOrders,
        activeNetwork: networkSize,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/analytics/revenue-trend  — last 24 months (with all-time fallback)
const getRevenueTrend = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role   = req.user.role;

    // For Wholesale/Mini Stock, use sellerId instead of advisorId
    let matchQuery;
    if (role === 'WHOLESALE' || role === 'MINI_STOCK') {
      matchQuery = { sellerId: userId, status: { $ne: 'CANCELLED' } };
    } else if (role === 'ADMIN') {
      // Admin sees all orders
      matchQuery = { status: { $ne: 'CANCELLED' } };
    } else {
      // Employee roles: see their subtree
      const subtreeIds     = await getSubtreeIds(userId);
      const allRelevantIds = [userId, ...subtreeIds];
      matchQuery = { advisorId: { $in: allRelevantIds }, status: { $ne: 'CANCELLED' } };
    }

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 24);  // last 24 months

    let agg = await Order.aggregate([
      { $match: { ...matchQuery, createdAt: { $gte: cutoff } } },
      { $group: {
        _id:    { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        sales:  { $sum: '$total' },
        orders: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Fallback: if no data in window, return all-time data
    if (agg.length === 0) {
      agg = await Order.aggregate([
        { $match: matchQuery },
        { $group: {
          _id:    { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          sales:  { $sum: '$total' },
          orders: { $sum: 1 },
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);
    }

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const trend  = agg.map(m => ({
      month:  `${MONTHS[m._id.month - 1]} ${m._id.year}`,
      sales:  m.sales,
      orders: m.orders,
    }));

    res.json({ success: true, data: trend });
  } catch (err) { next(err); }
};

// GET /api/analytics/top-advisors
const getTopAdvisors = async (req, res, next) => {
  try {
    const agg = await Order.aggregate([
      { $match: { status: { $ne: 'CANCELLED' } } },
      { $group: { _id: '$advisorId', totalSales: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { totalSales: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'advisor' } },
      { $unwind: '$advisor' },
      { $project: { name: '$advisor.name', advisorCode: '$advisor.advisorCode', region: '$advisor.region', totalSales: 1, orders: 1 } },
    ]);
    res.json({ success: true, data: agg });
  } catch (err) { next(err); }
};

// GET /api/analytics/regions
const getRegionBreakdown = async (req, res, next) => {
  try {
    const agg = await Order.aggregate([
      { $match: { status: { $ne: 'CANCELLED' } } },
      { $group: { _id: '$region', sales: { $sum: '$total' } } },
      { $sort: { sales: -1 } },
    ]);
    const data = agg.map(r => ({ region: r._id, sales: r.sales }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { getDashboard, getRevenueTrend, getTopAdvisors, getRegionBreakdown };
