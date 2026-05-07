const IncomeConfig = require('../models/IncomeConfig');
const Commission   = require('../models/Commission');
const Order        = require('../models/Order');
const mongoose     = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// Get active IncomeConfig records (keyed by role)
// ─────────────────────────────────────────────────────────────────────────────
async function getActiveIncomeConfigs() {
  const configs = await IncomeConfig.find({ isActive: true }).lean();
  if (!configs || configs.length === 0) {
    throw new Error('No active income configurations found. Please seed IncomeConfig collection.');
  }
  const map = {};
  configs.forEach(c => { map[c.role] = c; });
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Create pools from product snapshot × quantity sold
//
// product.rpPoints × qty → RP pool (Retail Point  — 100% to Advisor)
// product.ivPoints × qty → IV pool (Incentive Value)
// product.svPoints × qty → SV pool (Salary Value)
// product.rvPoints × qty → RV pool (Rewards Value)
// ─────────────────────────────────────────────────────────────────────────────
function createPools(productSnapshot, quantity) {
  const qty = Number(quantity) || 1;
  const round = (n) => Math.round(n * 100) / 100;
  return {
    RP: round((productSnapshot.rpPoints || 0) * qty),
    IV: round((productSnapshot.ivPoints || 0) * qty),
    SV: round((productSnapshot.svPoints || 0) * qty),
    RV: round((productSnapshot.rvPoints || 0) * qty),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Build hierarchy chain from snapshot
// Returns: [{ role, userId, level }, ...]
// ─────────────────────────────────────────────────────────────────────────────
function getHierarchyChain(hierarchySnapshot) {
  if (!hierarchySnapshot) return [];
  const chain = [];
  if (hierarchySnapshot.advisorId)      chain.push({ role: 'ADVISOR', userId: hierarchySnapshot.advisorId,      level: 'Direct' });
  if (hierarchySnapshot.doManagerId)    chain.push({ role: 'DO',      userId: hierarchySnapshot.doManagerId,    level: 'L1' });
  if (hierarchySnapshot.areaManagerId)  chain.push({ role: 'AM',      userId: hierarchySnapshot.areaManagerId,  level: 'L2' });
  if (hierarchySnapshot.zonalManagerId) chain.push({ role: 'ZM',      userId: hierarchySnapshot.zonalManagerId, level: 'L3' });
  if (hierarchySnapshot.stateHeadId)    chain.push({ role: 'SH',      userId: hierarchySnapshot.stateHeadId,    level: 'L4' });
  return chain;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build a single commission record object
// ─────────────────────────────────────────────────────────────────────────────
function buildCommission({ role, userId, level, poolType, poolAmount, percentage, orderId, saleTotal, incomeConfig, productSnapshot }) {
  return {
    orderId,
    userId,
    role,
    type:       poolType,
    amount:     Math.round((poolAmount * percentage) / 100 * 100) / 100,
    percentage,
    poolAmount: poolAmount,
    saleRV:     saleTotal,
    level,
    configSnapshot: {
      incomeConfig,
      productSnapshot,
    },
    snapshotUsed: true,
    date: new Date(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main: Distribute income for a completed sale order
//
// Distribution table (from config):
//   Role     | RP  | IV  | SV  | RV
//   ADVISOR  | 100%|  0% | 42% | 42%
//   DO       |  0% | 42% | 23% | 23%
//   AM       |  0% | 23% | 15% | 15%
//   ZM       |  0% | 15% | 10% | 10%
//   SH       |  0% | 10% | 10% | 10%
// ─────────────────────────────────────────────────────────────────────────────
async function distributeIncome(order, hierarchySnapshot) {
  // 🔒 SECURITY: Use database transaction for financial operations
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Guard: already distributed
    if (order.commissionDistributed) {
      console.log(`⚠️  Order ${order._id} already has commissions distributed`);
      await session.abortTransaction();
      session.endSession();
      return [];
    }

    // Guard: hierarchy must exist
    if (!hierarchySnapshot) {
      console.log(`⚠️  No hierarchy snapshot for order ${order._id}`);
      await session.abortTransaction();
      session.endSession();
      return [];
    }

    // Guard: productSnapshot must exist (orders created before this update won't have it)
    const snap = order.productSnapshot;
    console.log(`🔍 ProductSnapshot for order ${order._id}:`, JSON.stringify(snap, null, 2));
    if (!snap || (snap.rpPoints === 0 && snap.ivPoints === 0 && snap.svPoints === 0 && snap.rvPoints === 0)) {
      console.log(`⚠️  No productSnapshot on order ${order._id} — skipping commission`);
      console.log(`   rpPoints: ${snap?.rpPoints}, ivPoints: ${snap?.ivPoints}, svPoints: ${snap?.svPoints}, rvPoints: ${snap?.rvPoints}`);
      await session.abortTransaction();
      session.endSession();
      return [];
    }

    // 1. Load IncomeConfig
    const incomeConfigs = await getActiveIncomeConfigs();

    // 2. Create 4 pools from product snapshot × quantity
    const pools = createPools(snap, order.quantity);
    console.log(`💰 Pools for order ${order._id}:`, pools);

    // 3. Build hierarchy chain
    const chain = getHierarchyChain(hierarchySnapshot);
    console.log(`👥 Hierarchy chain for order ${order._id}:`, JSON.stringify(chain, null, 2));
    if (chain.length === 0) {
      console.log(`⚠️  Empty hierarchy chain for order ${order._id}`);
      await session.abortTransaction();
      session.endSession();
      return [];
    }

    // 4. Calculate commissions for each role in the chain
    const commissions = [];

    for (const { role, userId, level } of chain) {
      const config = incomeConfigs[role];
      if (!config) {
        console.log(`⚠️  No IncomeConfig found for role ${role}`);
        continue;
      }

      const commonArgs = {
        role, userId, level,
        orderId:        order._id,
        saleTotal:      order.total,
        incomeConfig:   config,
        productSnapshot: snap,
      };

      // RP pool — Retail Point (typically 100% to Advisor only)
      if (config.RP > 0 && pools.RP > 0) {
        commissions.push(buildCommission({ ...commonArgs, poolType: 'RP', poolAmount: pools.RP, percentage: config.RP }));
      }

      // IV pool — Incentive Value
      if (config.IV > 0 && pools.IV > 0) {
        commissions.push(buildCommission({ ...commonArgs, poolType: 'IV', poolAmount: pools.IV, percentage: config.IV }));
      }

      // SV pool — Salary Value
      if (config.SV > 0 && pools.SV > 0) {
        commissions.push(buildCommission({ ...commonArgs, poolType: 'SV', poolAmount: pools.SV, percentage: config.SV }));
      }

      // RV pool — Rewards Value
      if (config.RV > 0 && pools.RV > 0) {
        commissions.push(buildCommission({ ...commonArgs, poolType: 'RV', poolAmount: pools.RV, percentage: config.RV }));
      }
    }

    // 5. Save all commission records within transaction
    if (commissions.length > 0) {
      await Commission.insertMany(commissions, { session });
      console.log(`✅ Created ${commissions.length} commission records for order ${order._id}`);
    } else {
      console.log(`ℹ️  No commissions generated for order ${order._id} (all pools may be zero)`);
    }

    // 6. Update order with pool totals and mark distributed within transaction
    const totalDistributed = commissions.reduce((sum, c) => sum + c.amount, 0);

    await Order.findByIdAndUpdate(
      order._id, 
      {
        pools,
        commissionDistributed: true,
        'distributionSnapshot.totalDistributed': totalDistributed,
        'distributionSnapshot.distributedAt':    new Date(),
      },
      { session }
    );

    // 🔒 SECURITY: Commit transaction - all or nothing
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Order ${order._id} commission distribution complete`);
    console.log(`   RP=${pools.RP} pts  IV=${pools.IV} pts  SV=${pools.SV} pts  RV=${pools.RV} pts`);
    console.log(`   Total distributed: ${totalDistributed.toFixed(2)} points`);

    // 7. Auto-check salary level upgrades (SV) and sequential rewards (RV)
    // Note: This runs AFTER transaction commit (non-critical operations)
    try {
      const { checkAndUpgradeLevel, checkAndUpdateRewards } = require('../controllers/salary.controller');
      const User     = require('../models/User');
      const ObjectId = require('mongoose').Types.ObjectId;

      // Collect all unique earners from this distribution
      const allEarners = [...new Set(commissions.map(c => c.userId.toString()))];

      for (const uid of allEarners) {
        const oid    = new ObjectId(uid);
        const earner = await User.findById(uid).select('role').lean();
        if (!earner) continue;

        // SV total → salary level check
        const svAgg = await Commission.aggregate([
          { $match: { userId: oid, type: 'SV' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalSv = svAgg[0]?.total || 0;
        await checkAndUpgradeLevel(uid, earner.role, totalSv);

        // RV total → sequential reward check
        const rvAgg = await Commission.aggregate([
          { $match: { userId: oid, type: 'RV' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalRv = rvAgg[0]?.total || 0;
        await checkAndUpdateRewards(uid, earner.role, totalRv);
      }
    } catch (lvlErr) {
      console.error('⚠️  Level/reward check error (non-fatal):', lvlErr.message);
    }

    return commissions;

  } catch (error) {
    // 🔒 SECURITY: Rollback transaction on any error
    await session.abortTransaction();
    session.endSession();
    console.error(`❌ Error distributing income for order ${order._id}:`, error.message);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Get commission summary totals for a user
// ─────────────────────────────────────────────────────────────────────────────
async function getCommissionSummary(userId, filters = {}) {
  const query = { userId };

  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = new Date(filters.startDate);
    if (filters.endDate)   query.date.$lte = new Date(filters.endDate);
  }
  if (filters.type) query.type = filters.type;

  const commissions = await Commission.find(query).lean();

  const summary = { total: 0, RP: 0, IV: 0, SV: 0, RV: 0, count: commissions.length, commissions };

  commissions.forEach(c => {
    summary.total += c.amount;
    if (summary[c.type] !== undefined) summary[c.type] += c.amount;
  });

  return summary;
}

module.exports = {
  getActiveIncomeConfigs,
  createPools,
  getHierarchyChain,
  buildCommission,
  distributeIncome,
  getCommissionSummary,
};
