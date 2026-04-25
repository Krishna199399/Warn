const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/dashboard',     protect, ctrl.getDashboard);
router.get('/revenue-trend', protect, ctrl.getRevenueTrend);
router.get('/top-advisors',  protect, ctrl.getTopAdvisors);
router.get('/regions',       protect, ctrl.getRegionBreakdown);

module.exports = router;
