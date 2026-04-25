const express = require('express');
const router = express.Router();
const configController = require('../controllers/config.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/role.middleware');

// All routes require authentication
router.use(protect);

// Get active configurations (all authenticated users)
router.get('/pool', configController.getPoolConfig);
router.get('/income', configController.getIncomeConfigs);
router.get('/complete', configController.getCompleteConfig);

// Admin only routes
router.put('/pool', adminOnly, configController.updatePoolConfig);
router.put('/income/:role', adminOnly, configController.updateIncomeConfig);
router.get('/history', adminOnly, configController.getConfigHistory);

module.exports = router;
