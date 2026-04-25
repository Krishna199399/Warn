const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/farmer.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/my',        protect, ctrl.getMyFarmers);
router.get('/:id',       protect, ctrl.getFarmer);
router.post('/',         protect, ctrl.createFarmer);
router.put('/:id',       protect, ctrl.updateFarmer);
router.get('/:id/orders',protect, ctrl.getFarmerOrders);

module.exports = router;
