const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getMyStatus, getMyRewards,
  getAdminPlans, updateAdminPlan, getAdminUserStatuses, getAdminAchievements,
} = require('../controllers/salary.controller');

// Employee routes
router.get('/my-status',       protect, getMyStatus);
router.get('/my-rewards',      protect, getMyRewards);

// Admin routes
router.get('/admin/plans',        protect, getAdminPlans);
router.get('/admin/users',        protect, getAdminUserStatuses);
router.get('/admin/achievements', protect, getAdminAchievements);
router.put('/admin/plans/:id',    protect, updateAdminPlan);

module.exports = router;
