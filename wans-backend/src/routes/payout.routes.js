const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getMyBankDetails, upsertMyBankDetails, verifyBankDetails,
  getBatches, getBatchDetail, generateBatch,
  payOne, payAll, exportBatch,
  getMyPayouts, getPayoutSummary,
} = require('../controllers/payout.controller');

// ── Employee routes ───────────────────────────────────────────────────────────
router.get ('/my-payouts',          protect, getMyPayouts);
router.get ('/bank-details',        protect, getMyBankDetails);
router.post('/bank-details',        protect, upsertMyBankDetails);

// ── Admin routes ─────────────────────────────────────────────────────────────
router.get ('/summary',             protect, getPayoutSummary);
router.get ('/batches',             protect, getBatches);
router.get ('/batches/:id',         protect, getBatchDetail);
router.post('/batches/generate',    protect, generateBatch);
router.get ('/batches/:batchId/export',   protect, exportBatch);
router.post('/batches/:batchId/pay-one',  protect, payOne);
router.post('/batches/:batchId/pay-all',  protect, payAll);
router.put ('/admin/bank/:userId/verify', protect, verifyBankDetails);

module.exports = router;
