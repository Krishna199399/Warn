const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/inventory.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/my',                  protect, ctrl.getMyInventory);
router.post('/add-stock',          protect, ctrl.addStockFromCompany);
router.post('/transfer',           protect, ctrl.transferToMiniStock);
router.get('/transfers',           protect, ctrl.getTransferHistory);
router.get('/ministock-users',     protect, ctrl.getMiniStockUsers);

module.exports = router;
