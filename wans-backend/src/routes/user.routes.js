const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly, managerOnly, employeeOnly, employeeOrStockOnly } = require('../middleware/role.middleware');

router.get('/',                    protect, managerOnly,  ctrl.getUsers);
router.post('/',                   protect, adminOnly,    ctrl.createUser);
router.get('/hierarchy',           protect, employeeOnly, ctrl.getHierarchyTree);
router.get('/pending',             protect, adminOnly,    ctrl.getPendingUsers);
router.get('/wholesale-sellers',   protect,               ctrl.getWholesaleSellers);
router.get('/validate-advisor/:code', protect,            ctrl.validateAdvisorCode);

// Employee Registration Management
router.get('/employee-registrations/pending',     protect, adminOnly, ctrl.getPendingEmployeeRegistrations);
router.get('/employee-registrations/stats',       protect, adminOnly, ctrl.getEmployeeRegistrationStats);
router.post('/employee-registrations/bulk-import', protect, adminOnly, ctrl.bulkImportEmployees);
router.post('/:id/employee-registrations/approve', protect, adminOnly, ctrl.approveEmployeeRegistration);
router.post('/:id/employee-registrations/reject',  protect, adminOnly, ctrl.rejectEmployeeRegistration);

router.get('/:id',                 protect,               ctrl.getUser);
router.put('/:id',                 protect, adminOnly,    ctrl.updateUser);
router.delete('/:id',              protect, adminOnly,    ctrl.deleteUser);
router.put('/:id/approve',         protect, adminOnly,    ctrl.approveUser);
router.put('/:id/reject',          protect, adminOnly,    ctrl.rejectUser);
router.put('/:id/terminate',       protect, adminOnly,    ctrl.terminateUser);
router.put('/:id/assign-parent',   protect, adminOnly,    ctrl.assignParent);
router.get('/:id/downline',        protect, employeeOnly, ctrl.getDownline);
router.get('/:id/performance',     protect, employeeOnly, ctrl.getUserPerformance);
router.get('/:id/activity',        protect,               ctrl.getUserActivity);
router.get('/:id/kyc',             protect, adminOnly,    ctrl.getKYC);
router.post('/kyc',                protect, employeeOrStockOnly, ctrl.updateKYC);
router.get('/kyc',                 protect, employeeOrStockOnly, ctrl.getKYC);
router.put('/:id/kyc/approve',     protect, adminOnly,    ctrl.approveKYC);
router.put('/:id/kyc/reject',      protect, adminOnly,    ctrl.rejectKYC);

module.exports = router;
