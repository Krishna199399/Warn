/**
 * allowRoles(...roles) — middleware factory
 * Usage: router.get('/path', protect, allowRoles('ADMIN','STATE_HEAD'), controller)
 */
const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      error:   `Access denied. Required roles: ${roles.join(', ')}`,
    });
  }
  next();
};

const EMPLOYEE_ROLES = ['ADMIN','STATE_HEAD','ZONAL_MANAGER','AREA_MANAGER','DO_MANAGER','ADVISOR'];
const MANAGER_ROLES  = ['ADMIN','STATE_HEAD','ZONAL_MANAGER','AREA_MANAGER','DO_MANAGER'];

const employeeOnly = allowRoles(...EMPLOYEE_ROLES);
const managerOnly  = allowRoles(...MANAGER_ROLES);
const adminOnly    = allowRoles('ADMIN');

module.exports = { allowRoles, employeeOnly, managerOnly, adminOnly };
