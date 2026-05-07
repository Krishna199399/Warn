const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createVisit,
  getMyVisits,
  getTodayVisits,
  getUpcomingVisits,
  getOverdueVisits,
  getVisit,
  completeVisit,
  rescheduleVisit,
  cancelVisit,
  getFarmerVisits,
  getAdminStats,
  getAdvisorPerformance,
  getAllVisitsAdmin
} = require('../controllers/visit.controller');

// All routes require authentication
router.use(protect);

// Visit management
router.post('/', createVisit);
router.get('/my', getMyVisits);
router.get('/today', getTodayVisits);
router.get('/upcoming', getUpcomingVisits);
router.get('/overdue', getOverdueVisits);
router.get('/farmer/:farmerId', getFarmerVisits);

// Admin routes
router.get('/admin/stats', getAdminStats);
router.get('/admin/advisors', getAdvisorPerformance);
router.get('/admin/all', getAllVisitsAdmin);

// Single visit operations
router.get('/:id', getVisit);
router.put('/:id/complete', completeVisit);
router.put('/:id/reschedule', rescheduleVisit);
router.delete('/:id', cancelVisit);

module.exports = router;
