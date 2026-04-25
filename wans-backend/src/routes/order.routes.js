const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');

// Role-specific list endpoints (must be before /:id)
router.get('/admin',        protect, ctrl.getAdminOrders);
router.get('/wholesale',    protect, ctrl.getWholesaleOrders);
router.get('/my-purchases', protect, ctrl.getWholesalePurchases);
router.get('/mini',         protect, ctrl.getMiniOrders);
router.get('/my',           protect, ctrl.getMyOrders);

// General CRUD
router.post('/',                    protect, ctrl.createOrder);
router.post('/pos-sale',            protect, ctrl.createPOSSale);
router.get('/',                     protect, ctrl.getOrders);
router.get('/:id',                  protect, ctrl.getOrder);
router.put('/:id/status',           protect, ctrl.updateOrderStatus);
router.put('/:id/verify-payment',   protect, ctrl.verifyPayment);
router.put('/:id/approve',          protect, ctrl.approveOrder);
router.put('/:id/reject',           protect, ctrl.rejectOrder);
router.put('/:id/ship',             protect, ctrl.shipOrder);
router.put('/:id/deliver',          protect, ctrl.confirmDelivery);

module.exports = router;
