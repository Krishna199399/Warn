// ─── WKR Role Configuration (Backend) ────────────────────────────────────────
// Single source of truth for role metadata.
// DB enum keys are intentionally preserved to avoid database migrations.

const ROLE_META = {
  ADVISOR: {
    key: 'ADVISOR',
    label: 'Promotion Representative',
    abbr: 'PR',
    displayOrder: 1,
  },
  DO_MANAGER: {
    key: 'DO_MANAGER',
    label: 'Development Officer',
    abbr: 'DO',
    displayOrder: 2,
  },
  AREA_MANAGER: {
    key: 'AREA_MANAGER',
    label: 'Regional Manager',
    abbr: 'RM',
    displayOrder: 3,
  },
  ZONAL_MANAGER: {
    key: 'ZONAL_MANAGER',
    label: 'Zonal Manager',
    abbr: 'ZM',
    displayOrder: 4,
  },
  STATE_HEAD: {
    key: 'STATE_HEAD',
    label: 'Executive Manager',
    abbr: 'EM',
    displayOrder: 5,
  },
  ADMIN:      { key: 'ADMIN',      label: 'Admin',      abbr: 'ADMIN', displayOrder: 0 },
  WHOLESALE:  { key: 'WHOLESALE',  label: 'Wholesale',  abbr: 'WS',    displayOrder: 6 },
  MINI_STOCK: { key: 'MINI_STOCK', label: 'Mini Stock', abbr: 'MS',    displayOrder: 7 },
  CUSTOMER:   { key: 'CUSTOMER',   label: 'Customer',   abbr: 'CUST',  displayOrder: 8 },
};

// Ordered hierarchy of employee roles (PR → DO → RM → ZM → EM)
const EMPLOYEE_HIERARCHY = [
  'ADVISOR',
  'DO_MANAGER',
  'AREA_MANAGER',
  'ZONAL_MANAGER',
  'STATE_HEAD',
];

const getRoleLabel = (roleKey) => ROLE_META[roleKey]?.label ?? roleKey;
const getRoleAbbr  = (roleKey) => ROLE_META[roleKey]?.abbr  ?? roleKey;

module.exports = { ROLE_META, EMPLOYEE_HIERARCHY, getRoleLabel, getRoleAbbr };
