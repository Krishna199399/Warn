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

    // For Admin: show breakdown by buyer type
    let salesData = {};
    
    if (role === 'ADMIN') {
      // Wholesale Sales (Company → Wholesale)
      const wholesaleSales = await Order.aggregate([
        { $match: { buyerType: 'WHOLESALE', sellerType: 'COMPANY', status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]);
      
      // Mini Stock Sales (Wholesale → Mini Stock)
      const miniStockSales = await Order.aggregate([
        { $match: { buyerType: 'MINI_STOCK', sellerType: 'WHOLESALE', status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]);
      
      // Retail Sales (Mini Stock → Customer)
      const retailSales = await Order.aggregate([
        { $match: { buyerType: 'CUSTOMER', sellerType: 'MINI_STOCK', status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]);
      
      salesData = {
        wholesaleSales: wholesaleSales[0]?.total || 0,
        wholesaleOrders: wholesaleSales[0]?.count || 0,
        miniStockSales: miniStockSales[0]?.total || 0,
        miniStockOrders: miniStockSales[0]?.count || 0,
        retailSales: retailSales[0]?.total || 0,
        retailOrders: retailSales[0]?.count || 0,
        totalSales: wholesaleSales[0]?.total || 0, // Only Company → Wholesale sales (company's actual revenue)
        totalOrders: (wholesaleSales[0]?.count || 0) + (miniStockSales[0]?.count || 0) + (retailSales[0]?.count || 0),
      };
    } else {
      // For other roles: simple total
      const salesAgg = await Order.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]);
      
      salesData = {
        totalSales: salesAgg[0]?.total || 0,
        totalOrders: salesAgg[0]?.count || 0,
      };
    }

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
        ...salesData,
        totalEarnings: totalEarnings,
        ordersToday:   todayOrders,
        activeNetwork: networkSize,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/analytics/revenue-trend  — supports day, week, month time ranges
const getRevenueTrend = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role   = req.user.role;
    const timeRange = req.query.timeRange || 'month'; // 'day', 'week', 'month'

    // For Wholesale/Mini Stock, use sellerId instead of advisorId
    let matchQuery;
    if (role === 'WHOLESALE' || role === 'MINI_STOCK') {
      matchQuery = { sellerId: userId, status: { $ne: 'CANCELLED' } };
    } else if (role === 'ADMIN') {
      // Admin sees only company revenue (Company → Wholesale sales)
      matchQuery = { 
        buyerType: 'WHOLESALE', 
        sellerType: 'COMPANY', 
        status: { $ne: 'CANCELLED' } 
      };
    } else {
      // Employee roles: see their subtree
      const subtreeIds     = await getSubtreeIds(userId);
      const allRelevantIds = [userId, ...subtreeIds];
      matchQuery = { advisorId: { $in: allRelevantIds }, status: { $ne: 'CANCELLED' } };
    }

    // Set cutoff date based on time range
    const cutoff = new Date();
    if (timeRange === 'day') {
      cutoff.setDate(cutoff.getDate() - 30); // last 30 days
    } else if (timeRange === 'week') {
      cutoff.setDate(cutoff.getDate() - 84); // last 12 weeks (84 days)
    } else {
      cutoff.setMonth(cutoff.getMonth() - 6); // last 6 months
    }

    // Build aggregation pipeline based on time range
    let groupStage;
    if (timeRange === 'day') {
      groupStage = {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        sales: { $sum: '$total' },
        orders: { $sum: 1 },
      };
    } else if (timeRange === 'week') {
      groupStage = {
        _id: {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        },
        sales: { $sum: '$total' },
        orders: { $sum: 1 },
      };
    } else {
      groupStage = {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        sales: { $sum: '$total' },
        orders: { $sum: 1 },
      };
    }

    let agg = await Order.aggregate([
      { $match: { ...matchQuery, createdAt: { $gte: cutoff } } },
      { $group: groupStage },
      { $sort: 
        timeRange === 'day' 
          ? { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
          : timeRange === 'week'
            ? { '_id.year': 1, '_id.week': 1 }
            : { '_id.year': 1, '_id.month': 1 }
      },
    ]);

    // Fallback: if no data in window, return all-time data
    if (agg.length === 0) {
      agg = await Order.aggregate([
        { $match: matchQuery },
        { $group: groupStage },
        { $sort: 
          timeRange === 'day' 
            ? { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            : timeRange === 'week'
              ? { '_id.year': 1, '_id.week': 1 }
              : { '_id.year': 1, '_id.month': 1 }
        },
      ]);
    }

    // Format the data based on time range
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let trend;
    
    if (timeRange === 'day') {
      // Create a map of existing data
      const dataMap = new Map();
      agg.forEach(m => {
        const key = `${m._id.year}-${m._id.month}-${m._id.day}`;
        dataMap.set(key, { sales: m.sales, orders: m.orders });
      });
      
      // Fill in all 30 days (including days with zero orders)
      trend = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const key = `${year}-${month}-${day}`;
        
        const data = dataMap.get(key) || { sales: 0, orders: 0 };
        trend.push({
          month: `${day} ${MONTHS[month - 1]}`,
          sales: data.sales,
          orders: data.orders,
        });
      }
    } else if (timeRange === 'week') {
      // Create a map of existing data
      const dataMap = new Map();
      agg.forEach(m => {
        const key = `${m._id.year}-${m._id.week}`;
        dataMap.set(key, { sales: m.sales, orders: m.orders });
      });
      
      // Fill in all 12 weeks (including weeks with zero orders)
      trend = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - (i * 7));
        const year = date.getFullYear();
        // Calculate week number (ISO week)
        const startOfYear = new Date(year, 0, 1);
        const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        const key = `${year}-${week}`;
        
        const data = dataMap.get(key) || { sales: 0, orders: 0 };
        trend.push({
          month: `Week ${week}, ${year}`,
          sales: data.sales,
          orders: data.orders,
        });
      }
    } else {
      // Create a map of existing data
      const dataMap = new Map();
      agg.forEach(m => {
        const key = `${m._id.year}-${m._id.month}`;
        dataMap.set(key, { sales: m.sales, orders: m.orders });
      });
      
      // Fill in all 6 months (including months with zero orders)
      trend = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(now.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${month}`;
        
        const data = dataMap.get(key) || { sales: 0, orders: 0 };
        trend.push({
          month: `${MONTHS[month - 1]} ${year}`,
          sales: data.sales,
          orders: data.orders,
        });
      }
    }

    console.log(`Revenue Trend (${timeRange}):`, trend.length, 'data points');
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
      { $project: { name: '$advisor.name', advisorCode: '$advisor.employeeCode', region: '$advisor.region', totalSales: 1, orders: 1 } },
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
