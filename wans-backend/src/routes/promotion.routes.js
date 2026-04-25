const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/promotion.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/request',            protect, ctrl.requestPromotion);
router.get('/my',                  protect, ctrl.getMyRequest);
router.get('/pending',             protect, ctrl.getPendingForManager);
router.get('/pending/admin',       protect, ctrl.getPendingAdmin);
router.get('/all',                 protect, ctrl.getAllRequests);
router.post('/:id/approve-parent', protect, ctrl.approveByParent);
router.post('/:id/reject-parent',  protect, ctrl.rejectByParent);
router.post('/:id/approve-admin',  protect, ctrl.approveByAdmin);
router.post('/:id/reject-admin',   protect, ctrl.rejectByAdmin);

module.exports = router;
