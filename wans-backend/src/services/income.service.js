const PoolConfig = require('../models/PoolConfig');
const IncomeConfig = require('../models/IncomeConfig');
const Commission = require('../models/Commission');
const Order = require('../models/Order');

/**
 * Get active pool and income configurations
 * @returns {Object} { poolConfig, incomeConfigs }
 */
async function getActiveConfig() {
  const poolConfig = await PoolConfig.findOne({ isActive: true }).lean();
  const incomeConfigs = await IncomeConfig.find({ isActive: true }).lean();
  
  if (!poolConfig) {
    throw new Error('No active pool configuration found');
  }
  
  if (!incomeConfigs || incomeConfigs.length === 0) {
    throw new Error('No active income configurations found');
  }
  
  // Convert array to object keyed by role for faster lookup
  const incomeConfigMap = {};
  incomeConfigs.forEach(config => {
    incomeConfigMap[config.role] = config;
  });
  
  return { poolConfig, incomeConfigs: incomeConfigMap };
}

/**
 * Create pools from RV (Retail Value)
 * @param {Number} RV - Retail Value (sale amount)
 * @param {Object} poolConfig - Pool configuration
 * @returns {Object} { IV, SV, RF }
 */
function createPools(RV, poolConfig) {
  return {
    IV: Math.round((RV * poolConfig.IV_PERCENT) / 100 * 100) / 100,  // Round to 2 decimals
    SV: Math.round((RV * poolConfig.SV_PERCENT) / 100 * 100) / 100,
    RF: Math.round((RV * poolConfig.RF_PERCENT) / 100 * 100) / 100
  };
}

/**
 * Get hierarchy chain from snapshot
 * @param {Object} hierarchySnapshot - Hierarchy snapshot from order
 * @returns {Array} Array of { role, userId, level }
 */
function getHierarchyChain(hierarchySnapshot) {
  if (!hierarchySnapshot) {
    return [];
  }
  
  const chain = [];
  
  // Build chain in order: Advisor → DO → AM → ZM → SH
  if (hierarchySnapshot.advisorId) {
    chain.push({ role: 'ADVISOR', userId: hierarchySnapshot.advisorId, level: 'Direct' });
  }
  if (hierarchySnapshot.doManagerId) {
    chain.push({ role: 'DO', userId: hierarchySnapshot.doManagerId, level: 'L1' });
  }
  if (hierarchySnapshot.areaManagerId) {
    chain.push({ role: 'AM', userId: hierarchySnapshot.areaManagerId, level: 'L2' });
  }
  if (hierarchySnapshot.zonalManagerId) {
    chain.push({ role: 'ZM', userId: hierarchySnapshot.zonalManagerId, level: 'L3' });
  }
  if (hierarchySnapshot.stateHeadId) {
    chain.push({ role: 'SH', userId: hierarchySnapshot.stateHeadId, level: 'L4' });
  }
  
  return chain;
}

/**
 * Calculate commission for a single role from a single pool
 * @param {Object} params - { role, userId, level, poolType, poolAmount, percentage, orderId, saleRV, config }
 * @returns {Object} Commission record
 */
function calculateCommission({ role, userId, level, poolType, poolAmount, percentage, orderId, saleRV, config }) {
  const amount = Math.round((poolAmount * percentage) / 100 * 100) / 100;  // Round to 2 decimals
  
  return {
    orderId,
    userId,
    role,
    type: poolType,
    amount,
    percentage,
    poolAmount,
    saleRV,
    level,
    configSnapshot: {
      incomeConfig: config.incomeConfig,
      poolConfig: config.poolConfig
    },
    snapshotUsed: true,
    date: new Date()
  };
}

/**
 * Distribute income for an order
 * @param {Object} order - Order document
 * @param {Object} hierarchySnapshot - Hierarchy snapshot
 * @returns {Array} Array of commission records
 */
async function distributeIncome(order, hierarchySnapshot) {
  try {
    // Validation: Check if already distributed
    if (order.commissionDistributed) {
      console.log(`⚠️  Order ${order._id} already has commissions distributed`);
      return [];
    }
    
    // Validation: Ensure hierarchy exists
    if (!hierarchySnapshot) {
      console.log(`⚠️  No hierarchy snapshot for order ${order._id}`);
      return [];
    }
    
    // 1. Get active configuration
    const { poolConfig, incomeConfigs } = await getActiveConfig();
    
    // 2. Create pools from RV
    const pools = createPools(order.total, poolConfig);
    
    // 3. Get hierarchy chain
    const hierarchyChain = getHierarchyChain(hierarchySnapshot);
    
    if (hierarchyChain.length === 0) {
      console.log(`⚠️  Empty hierarchy chain for order ${order._id}`);
      return [];
    }
    
    // 4. Calculate commissions for each role
    const commissions = [];
    
    for (const { role, userId, level } of hierarchyChain) {
      const config = incomeConfigs[role];
      
      if (!config) {
        console.log(`⚠️  No config found for role ${role}`);
        continue;
      }
      
      // SPECIAL: Advisor gets 100% RV as retail price commission
      if (role === 'ADVISOR') {
        commissions.push({
          orderId: order._id,
          userId,
          role,
          type: 'RETAIL_PRICE',
          amount: order.total,
          percentage: 100,
          poolAmount: order.total,
          saleRV: order.total,
          level,
          configSnapshot: {
            incomeConfig: config,
            poolConfig: poolConfig
          },
          snapshotUsed: true,
          date: new Date()
        });
      }
      
      // Calculate from IV pool
      if (config.IV > 0 && pools.IV > 0) {
        commissions.push(calculateCommission({
          role,
          userId,
          level,
          poolType: 'IV',
          poolAmount: pools.IV,
          percentage: config.IV,
          orderId: order._id,
          saleRV: order.total,
          config: {
            incomeConfig: config,
            poolConfig: poolConfig
          }
        }));
      }
      
      // Calculate from SV pool
      if (config.SV > 0 && pools.SV > 0) {
        commissions.push(calculateCommission({
          role,
          userId,
          level,
          poolType: 'SV',
          poolAmount: pools.SV,
          percentage: config.SV,
          orderId: order._id,
          saleRV: order.total,
          config: {
            incomeConfig: config,
            poolConfig: poolConfig
          }
        }));
      }
      
      // Calculate from RF pool
      if (config.RF > 0 && pools.RF > 0) {
        commissions.push(calculateCommission({
          role,
          userId,
          level,
          poolType: 'RF',
          poolAmount: pools.RF,
          percentage: config.RF,
          orderId: order._id,
          saleRV: order.total,
          config: {
            incomeConfig: config,
            poolConfig: poolConfig
          }
        }));
      }
    }
    
    // 5. Save commissions
    if (commissions.length > 0) {
      await Commission.insertMany(commissions);
      console.log(`✅ Created ${commissions.length} commission records for order ${order._id}`);
    }
    
    // 6. Update order with pool info and distribution status
    const totalDistributed = commissions.reduce((sum, c) => sum + c.amount, 0);
    
    await Order.findByIdAndUpdate(order._id, {
      pools,
      commissionDistributed: true,
      'distributionSnapshot.poolConfigVersion': poolConfig.version,
      'distributionSnapshot.totalDistributed': totalDistributed,
      'distributionSnapshot.distributedAt': new Date()
    });
    
    console.log(`✅ Updated order ${order._id} with pool info`);
    console.log(`💰 Total distributed: ₹${totalDistributed.toFixed(2)} from RV: ₹${order.total}`);
    
    return commissions;
    
  } catch (error) {
    console.error(`❌ Error distributing income for order ${order._id}:`, error.message);
    throw error;
  }
}

/**
 * Get commission summary for a user
 * @param {String} userId - User ID
 * @param {Object} filters - { startDate, endDate, type }
 * @returns {Object} Summary with totals by type
 */
async function getCommissionSummary(userId, filters = {}) {
  const query = { userId };
  
  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = new Date(filters.startDate);
    if (filters.endDate) query.date.$lte = new Date(filters.endDate);
  }
  
  if (filters.type) {
    query.type = filters.type;
  }
  
  const commissions = await Commission.find(query).lean();
  
  const summary = {
    total: 0,
    RETAIL_PRICE: 0,
    IV: 0,
    SV: 0,
    RF: 0,
    count: commissions.length,
    commissions
  };
  
  commissions.forEach(c => {
    summary.total += c.amount;
    if (c.type === 'RETAIL_PRICE') {
      summary.RETAIL_PRICE += c.amount;
    } else {
      summary[c.type] += c.amount;
    }
  });
  
  return summary;
}

module.exports = {
  getActiveConfig,
  createPools,
  getHierarchyChain,
  calculateCommission,
  distributeIncome,
  getCommissionSummary
};
