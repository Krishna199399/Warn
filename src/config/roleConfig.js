// ─── WKR Role Configuration ───────────────────────────────────────────────────
// Single source of truth for role metadata across the entire frontend.
// DB enum keys are intentionally preserved (ADVISOR, AREA_MANAGER, STATE_HEAD)
// to avoid any database migrations. Only display labels and colors are updated.

export const ROLE_META = {
  ADVISOR: {
    key: 'ADVISOR',
    label: 'Promotion Representative',
    abbr: 'PR',
    displayOrder: 1,
    color: 'bg-green-50 text-green-700',
    borderColor: 'border-green-300',
    badgeColor: 'bg-green-100 text-green-800',
    icon: '📢',
  },
  DO_MANAGER: {
    key: 'DO_MANAGER',
    label: 'Development Officer',
    abbr: 'DO',
    displayOrder: 2,
    color: 'bg-teal-50 text-teal-700',
    borderColor: 'border-teal-300',
    badgeColor: 'bg-teal-100 text-teal-800',
    icon: '🌱',
  },
  AREA_MANAGER: {
    key: 'AREA_MANAGER',
    label: 'Regional Manager',
    abbr: 'RM',
    displayOrder: 3,
    color: 'bg-cyan-50 text-cyan-700',
    borderColor: 'border-cyan-300',
    badgeColor: 'bg-cyan-100 text-cyan-800',
    icon: '🗺️',
  },
  ZONAL_MANAGER: {
    key: 'ZONAL_MANAGER',
    label: 'Zonal Manager',
    abbr: 'ZM',
    displayOrder: 4,
    color: 'bg-indigo-50 text-indigo-700',
    borderColor: 'border-indigo-300',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    icon: '🏛️',
  },
  STATE_HEAD: {
    key: 'STATE_HEAD',
    label: 'Executive Manager',
    abbr: 'EM',
    displayOrder: 5,
    color: 'bg-blue-50 text-blue-700',
    borderColor: 'border-blue-300',
    badgeColor: 'bg-blue-100 text-blue-800',
    icon: '👑',
  },
  ADMIN: {
    key: 'ADMIN',
    label: 'Admin',
    abbr: 'ADMIN',
    displayOrder: 0,
    color: 'bg-purple-50 text-purple-700',
    borderColor: 'border-purple-300',
    badgeColor: 'bg-purple-100 text-purple-800',
    icon: '⚙️',
  },
  WHOLESALE: {
    key: 'WHOLESALE',
    label: 'Wholesale',
    abbr: 'WS',
    displayOrder: 6,
    color: 'bg-amber-50 text-amber-700',
    borderColor: 'border-amber-300',
    badgeColor: 'bg-amber-100 text-amber-800',
    icon: '🏪',
  },
  MINI_STOCK: {
    key: 'MINI_STOCK',
    label: 'Mini Stock',
    abbr: 'MS',
    displayOrder: 7,
    color: 'bg-orange-50 text-orange-700',
    borderColor: 'border-orange-300',
    badgeColor: 'bg-orange-100 text-orange-800',
    icon: '🛒',
  },
  CUSTOMER: {
    key: 'CUSTOMER',
    label: 'Customer',
    abbr: 'CUST',
    displayOrder: 8,
    color: 'bg-slate-100 text-slate-600',
    borderColor: 'border-slate-300',
    badgeColor: 'bg-slate-100 text-slate-700',
    icon: '👤',
  },
};

// Ordered hierarchy of employee roles (PR → DO → RM → ZM → EM)
export const EMPLOYEE_HIERARCHY = [
  'ADVISOR',
  'DO_MANAGER',
  'AREA_MANAGER',
  'ZONAL_MANAGER',
  'STATE_HEAD',
];

// Helper: get label for a role key
export const getRoleLabel = (roleKey) =>
  ROLE_META[roleKey]?.label ?? roleKey;

// Helper: get abbreviation for a role key
export const getRoleAbbr = (roleKey) =>
  ROLE_META[roleKey]?.abbr ?? roleKey;

// Helper: get color classes for a role key
export const getRoleColorClass = (roleKey) =>
  ROLE_META[roleKey]?.color ?? 'bg-slate-100 text-slate-600';
