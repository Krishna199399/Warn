const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly, managerOnly, employeeOnly } = require('../middleware/role.middleware');

router.get('/',                    protect, managerOnly,  ctrl.getUsers);
router.post('/',                   protect, adminOnly,    ctrl.createUser);
router.get('/hierarchy',           protect, employeeOnly, ctrl.getHierarchyTree);
router.get('/pending',             protect, adminOnly,    ctrl.getPendingUsers);
router.get('/validate-advisor/:code', protect,            ctrl.validateAdvisorCode);
router.get('/:id',                 protect,               ctrl.getUser);
router.put('/:id',                 protect, adminOnly,    ctrl.updateUser);
router.delete('/:id',              protect, adminOnly,    ctrl.deleteUser);
router.put('/:id/approve',         protect, adminOnly,    ctrl.approveUser);
router.put('/:id/reject',          protect, adminOnly,    ctrl.rejectUser);
router.put('/:id/assign-parent',   protect, adminOnly,    ctrl.assignParent);
router.get('/:id/downline',        protect, employeeOnly, ctrl.getDownline);
router.get('/:id/performance',     protect, employeeOnly, ctrl.getUserPerformance);

module.exports = router;
