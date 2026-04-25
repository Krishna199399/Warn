const User = require('../models/User');

// Commission rates per role
const COMMISSION_RATES = {
  ADVISOR:       0.05,
  DO_MANAGER:    0.02,
  AREA_MANAGER:  0.01,
  ZONAL_MANAGER: 0.005,
  STATE_HEAD:    0.002,
};

const ROLE_TO_SNAPSHOT_KEY = {
  ADVISOR:       'advisorId',
  DO_MANAGER:    'doManagerId',
  AREA_MANAGER:  'areaManagerId',
  ZONAL_MANAGER: 'zonalManagerId',
  STATE_HEAD:    'stateHeadId',
};

const SNAPSHOT_KEY_TO_ROLE = Object.fromEntries(
  Object.entries(ROLE_TO_SNAPSHOT_KEY).map(([r, k]) => [k, r])
);

/**
 * buildHierarchySnapshot(advisorId)
 * Walks UP the live tree from an advisor and records who holds each role.
 * Returns: { advisorId, doManagerId, areaManagerId, zonalManagerId, stateHeadId }
 */
const buildHierarchySnapshot = async (advisorId) => {
  const snapshot = {
    advisorId:      null,
    doManagerId:    null,
    areaManagerId:  null,
    zonalManagerId: null,
    stateHeadId:    null,
  };

  let currentId = advisorId;
  while (currentId) {
    const node = await User.findById(currentId).select('role parentId').lean();
    if (!node) break;
    const key = ROLE_TO_SNAPSHOT_KEY[node.role];
    if (key) snapshot[key] = node._id;
    currentId = node.parentId || null;
  }

  return snapshot;
};

/**
 * calculateCommissions(order, snapshot)
 * Returns array of commission objects (not yet saved) for one order.
 */
const calculateCommissions = async (order, snapshot) => {
  const records = [];
  const KEYS = ['advisorId','doManagerId','areaManagerId','zonalManagerId','stateHeadId'];

  for (let i = 0; i < KEYS.length; i++) {
    const key    = KEYS[i];
    const userId = snapshot[key];
    if (!userId) continue;

    const role   = SNAPSHOT_KEY_TO_ROLE[key];
    const rate   = COMMISSION_RATES[role] || 0;
    const amount = Math.round(order.total * rate);
    if (amount <= 0) continue;

    const user = await User.findById(userId).select('name').lean();

    records.push({
      orderId:      order._id,
      userId,
      role,
      amount,
      level:        i === 0 ? 'Direct' : `L${i}`,
      type:         i === 0 ? 'Sales Commission' : 'Team Commission',
      snapshotUsed: true,
      date:         order.deliveredAt || order.createdAt || new Date(),
    });
  }
  return records;
};

/**
 * getSubtreeIds(userId)
 * Returns array of all user IDs in the subtree under userId.
 * Optimized version using $graphLookup for single query.
 */
const getSubtreeIds = async (userId) => {
  // Cast to ObjectId so aggregation pipeline matches correctly
  // (req.params.id arrives as a string; aggregate does NOT auto-cast)
  const mongoose = require('mongoose');
  let oid;
  try {
    oid = new mongoose.Types.ObjectId(userId);
  } catch (_) {
    return []; // invalid id
  }

  try {
    // Use MongoDB's $graphLookup for efficient tree traversal in a single query
    const result = await User.aggregate([
      { $match: { _id: oid } },
      {
        $graphLookup: {
          from: 'users',
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'parentId',
          as: 'descendants',
          maxDepth: 10,
        }
      },
      {
        $project: {
          descendants: {
            $map: {
              input: '$descendants',
              as: 'desc',
              in: '$$desc._id'
            }
          }
        }
      }
    ]);

    return result[0]?.descendants || [];
  } catch (error) {
    console.error('Error in getSubtreeIds:', error);
    // Fallback to old method if aggregation fails
    const ids   = [];
    const queue = [oid];

    while (queue.length) {
      const currentId = queue.shift();
      const children  = await User.find({ parentId: currentId }).select('_id').lean();
      for (const c of children) {
        ids.push(c._id);
        queue.push(c._id);
      }
    }
    return ids;
  }
};

/**
 * getPerformanceStats(userId)
 * Returns totalSales, teamSize, and recent monthlyPerformance for a user.
 * 
 * Business Logic:
 * - Advisors don't sell directly - they advise farmers to buy from Mini Stocks
 * - Advisor's sales = sales from Mini Stocks they manage (advisorId field)
 * - Manager's sales = all sales attributed to Advisors in their team (advisorId field)
 */
const getPerformanceStats = async (userId) => {
  const mongoose = require('mongoose');
  const Order    = require('../models/Order');
  const User     = require('../models/User');
  const Farmer   = require('../models/Farmer');

  // Cast to ObjectId — req.params.id arrives as a string from the router,
  // and Mongoose aggregate() does NOT auto-cast unlike find(). Without this,
  // { advisorId: { $in: [stringId] } } never matches ObjectId-typed fields.
  let oid;
  try {
    oid = new mongoose.Types.ObjectId(userId);
  } catch (_) {
    return { totalSales: 0, totalOrders: 0, teamSize: 0, monthlyPerformance: [] };
  }

  const subtreeIds = await getSubtreeIds(oid);
  const allIds     = [oid, ...subtreeIds]; // all are now proper ObjectIds

  // For ADVISOR: teamSize = number of registered farmers (not employee downline)
  // For Managers: teamSize = number of users in their subtree
  const requestingUser = await User.findById(oid).select('role').lean();
  let teamSize;
  if (requestingUser?.role === 'ADVISOR') {
    teamSize = await Farmer.countDocuments({ advisorId: oid });
  } else {
    teamSize = subtreeIds.length;
  }

  // Total sales = sum of orders where advisorId is in subtree
  const salesAgg = await Order.aggregate([
    { 
      $match: { 
        advisorId: { $in: allIds },
        status: { $ne: 'CANCELLED' }
      } 
    },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);
  const totalSales = salesAgg[0]?.total || 0;

  // Monthly performance (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyAgg = await Order.aggregate([
    { 
      $match: { 
        advisorId: { $in: allIds },
        status: { $ne: 'CANCELLED' },
        createdAt: { $gte: sixMonthsAgo } 
      } 
    },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, sales: { $sum: '$total' } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyPerformance = monthlyAgg.map(m => ({
    month: MONTHS[m._id.month - 1],
    sales: m.sales,
    target: Math.round(m.sales * 1.15),
  }));

  // Total orders count
  const ordersCountAgg = await Order.aggregate([
    { 
      $match: { 
        advisorId: { $in: allIds },
        status: { $ne: 'CANCELLED' }
      } 
    },
    { $count: 'total' },
  ]);
  const totalOrders = ordersCountAgg[0]?.total || 0;

  return { totalSales, totalOrders, teamSize, monthlyPerformance };
};

module.exports = {
  COMMISSION_RATES,
  buildHierarchySnapshot,
  calculateCommissions,
  getSubtreeIds,
  getPerformanceStats,
};
