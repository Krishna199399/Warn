const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { authorizeOrderAccess } = require('../middleware/authorization.middleware');
const { createOrderSchema, updateOrderStatusSchema, verifyPaymentSchema, posOrderSchema } = require('../schemas/order.schema');

// Role-specific list endpoints (must be before /:id)
router.get('/admin',        protect, ctrl.getAdminOrders);
router.get('/wholesale',    protect, ctrl.getWholesaleOrders);
router.get('/my-purchases', protect, ctrl.getWholesalePurchases);
router.get('/mini',         protect, ctrl.getMiniOrders);
router.get('/my',           protect, ctrl.getMyOrders);

// General CRUD
// 🔒 SECURITY: Validation + Authorization applied
router.post('/',                    protect, validate(createOrderSchema), ctrl.createOrder);
router.post('/customer',            protect, validate(createOrderSchema), ctrl.createCustomerOrder); // New: Customer orders from website
router.post('/pos-sale',            protect, validate(posOrderSchema), ctrl.createPOSSale);
router.get('/',                     protect, ctrl.getOrders);
router.get('/:id',                  protect, authorizeOrderAccess, ctrl.getOrder);
router.put('/:id/status',           protect, authorizeOrderAccess, validate(updateOrderStatusSchema), ctrl.updateOrderStatus);
router.put('/:id/verify-payment',   protect, authorizeOrderAccess, ctrl.verifyPayment);
router.put('/:id/approve',          protect, authorizeOrderAccess, ctrl.approveOrder);
router.put('/:id/reject',           protect, authorizeOrderAccess, ctrl.rejectOrder);
router.put('/:id/ship',             protect, authorizeOrderAccess, ctrl.shipOrder);
router.put('/:id/deliver',          protect, authorizeOrderAccess, ctrl.confirmDelivery);

module.exports = router;
