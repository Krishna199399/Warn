const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/commission.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/my',            protect, ctrl.getMyCommissions);
router.get('/summary',       protect, ctrl.getMySummary);
router.get('/subtree',       protect, ctrl.getSubtreeCommissions);
router.get('/order/:orderId',protect, ctrl.getCommissionsByOrder);

module.exports = router;
