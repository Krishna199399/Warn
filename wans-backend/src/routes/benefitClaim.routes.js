const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createClaim,
  getMyClaims,
  getAllClaims,
  approveClaim,
  markAsPaid,
  rejectClaim,
} = require('../controllers/benefitClaim.controller');

// Employee routes
router.post('/create', protect, createClaim);
router.get('/my-claims', protect, getMyClaims);

// Admin routes
router.get('/admin/all', protect, getAllClaims);
router.put('/admin/:id/approve', protect, approveClaim);
router.put('/admin/:id/mark-paid', protect, markAsPaid);
router.put('/admin/:id/reject', protect, rejectClaim);

module.exports = router;
