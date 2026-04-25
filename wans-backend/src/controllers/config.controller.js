const PoolConfig = require('../models/PoolConfig');
const IncomeConfig = require('../models/IncomeConfig');

/**
 * Get active pool configuration
 */
exports.getPoolConfig = async (req, res) => {
  try {
    const config = await PoolConfig.findOne({ isActive: true });
    
    if (!config) {
      return res.status(404).json({ message: 'No active pool configuration found' });
    }
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching pool config:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Update pool configuration (Admin only)
 */
exports.updatePoolConfig = async (req, res) => {
  try {
    const { IV_PERCENT, SV_PERCENT, RF_PERCENT, description } = req.body;
    
    // Validation
    const total = IV_PERCENT + SV_PERCENT + RF_PERCENT;
    if (total > 100) {
      return res.status(400).json({ 
        message: `Total pool percentage (${total}%) cannot exceed 100%` 
      });
    }
    
    // Deactivate current config
    await PoolConfig.updateMany({ isActive: true }, { isActive: false });
    
    // Get current version
    const latestConfig = await PoolConfig.findOne().sort({ version: -1 });
    const newVersion = latestConfig ? latestConfig.version + 1 : 1;
    
    // Create new config
    const newConfig = await PoolConfig.create({
      IV_PERCENT,
      SV_PERCENT,
      RF_PERCENT,
      description: description || `Pool config v${newVersion}`,
      version: newVersion,
      isActive: true,
      effectiveFrom: new Date()
    });
    
    res.json({
      message: 'Pool configuration updated successfully',
      config: newConfig
    });
  } catch (error) {
    console.error('Error updating pool config:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get all income configurations
 */
exports.getIncomeConfigs = async (req, res) => {
  try {
    const configs = await IncomeConfig.find({ isActive: true }).sort({ role: 1 });
    res.json(configs);
  } catch (error) {
    console.error('Error fetching income configs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Update income configuration for a role (Admin only)
 */
exports.updateIncomeConfig = async (req, res) => {
  try {
    const { role } = req.params;
    const { IV, SV, RF, description } = req.body;
    
    // Validation
    const total = IV + SV + RF;
    if (total > 100) {
      return res.status(400).json({ 
        message: `Total percentage (${total}%) cannot exceed 100% for role ${role}` 
      });
    }
    
    // Update or create config
    const config = await IncomeConfig.findOneAndUpdate(
      { role },
      { 
        IV, 
        SV, 
        RF, 
        description: description || `${role} income config`,
        isActive: true,
        $inc: { version: 1 }
      },
      { new: true, upsert: true }
    );
    
    res.json({
      message: `Income configuration for ${role} updated successfully`,
      config
    });
  } catch (error) {
    console.error('Error updating income config:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get configuration history
 */
exports.getConfigHistory = async (req, res) => {
  try {
    const poolHistory = await PoolConfig.find().sort({ createdAt: -1 }).limit(10);
    const incomeHistory = await IncomeConfig.find().sort({ updatedAt: -1 }).limit(20);
    
    res.json({
      poolHistory,
      incomeHistory
    });
  } catch (error) {
    console.error('Error fetching config history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get complete configuration (pool + income)
 */
exports.getCompleteConfig = async (req, res) => {
  try {
    const poolConfig = await PoolConfig.findOne({ isActive: true });
    const incomeConfigs = await IncomeConfig.find({ isActive: true }).sort({ role: 1 });
    
    if (!poolConfig) {
      return res.status(404).json({ message: 'No active pool configuration found' });
    }
    
    res.json({
      poolConfig,
      incomeConfigs,
      summary: {
        totalPoolPercent: poolConfig.IV_PERCENT + poolConfig.SV_PERCENT + poolConfig.RF_PERCENT,
        companyMargin: 100 - (poolConfig.IV_PERCENT + poolConfig.SV_PERCENT + poolConfig.RF_PERCENT),
        roles: incomeConfigs.length
      }
    });
  } catch (error) {
    console.error('Error fetching complete config:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
