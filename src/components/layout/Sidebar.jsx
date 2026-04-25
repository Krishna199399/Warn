import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth, ROLE_LABELS, isEmployeeRole, ROLES } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import {
  LayoutDashboard, Users, BarChart3, Settings,
  Package, Archive, ShoppingCart, Plus, Leaf, X, ChevronRight,
  Briefcase, Globe, MapPin, Building2, UserCheck, UserCog,
  Wheat, TrendingUp, ClipboardList, Activity, CheckSquare,
  BarChart2, Network, Award, List, Receipt, DollarSign
} from 'lucide-react';

// ─── Per-role nav configs ─────────────────────────────────────────────────────
const ROLE_NAV = {
  ADMIN: [
    { path: '/app/dashboard',        label: 'Dashboard',       icon: LayoutDashboard },
    {
      label: 'Products', icon: Package, group: true,
      children: [
        { path: '/app/products',        label: 'List',   icon: List },
        { path: '/app/products/create', label: 'Create', icon: Plus },
      ],
    },
    { path: '/app/user-approvals',   label: 'User Approvals',  icon: UserCheck },
    { path: '/app/network',          label: 'Users & Network', icon: Users },
    { path: '/app/commission',       label: 'Commissions',     icon: DollarSign },
    { path: '/app/orders',           label: 'Orders',          icon: ShoppingCart },
    { path: '/app/reports',          label: 'Reports',         icon: BarChart3 },
    { path: '/app/revenue-analytics',label: 'Revenue Analytics', icon: TrendingUp },
    { path: '/app/promotions',       label: 'Promotions',      icon: Award },
    { path: '/app/settings',         label: 'Settings',        icon: Settings },
  ],
  STATE_HEAD: [
    { path: '/app/dashboard',        label: 'Dashboard',        icon: LayoutDashboard },
    { path: '/app/zonal-employees',  label: 'Zonal Employees',  icon: Globe },
    { path: '/app/commission',       label: 'Commissions',      icon: DollarSign },
    { path: '/app/reports',          label: 'Reports',          icon: BarChart3 },
    { path: '/app/my-performance',   label: 'My Performance',   icon: TrendingUp },
    { path: '/app/settings',         label: 'Settings',         icon: Settings },
  ],
  ZONAL_MANAGER: [
    { path: '/app/dashboard',        label: 'Dashboard',        icon: LayoutDashboard },
    { path: '/app/area-employees',   label: 'Area Employees',   icon: MapPin },
    { path: '/app/area-performance', label: 'Area Performance', icon: Activity },
    { path: '/app/commission',       label: 'Commissions',      icon: DollarSign },
    { path: '/app/reports',          label: 'Reports',          icon: BarChart3 },
    { path: '/app/my-performance',   label: 'My Performance',   icon: TrendingUp },
    { path: '/app/settings',         label: 'Settings',         icon: Settings },
  ],
  AREA_MANAGER: [
    { path: '/app/dashboard',        label: 'Dashboard',        icon: LayoutDashboard },
    { path: '/app/do-employees',     label: 'DO Employees',     icon: UserCog },
    { path: '/app/commission',       label: 'Commissions',      icon: DollarSign },
    { path: '/app/reports',          label: 'Reports',          icon: BarChart3 },
    { path: '/app/my-performance',   label: 'My Performance',   icon: TrendingUp },
    { path: '/app/settings',         label: 'Settings',         icon: Settings },
  ],
  DO_MANAGER: [
    { path: '/app/dashboard',        label: 'Dashboard',        icon: LayoutDashboard },
    { path: '/app/advisors',         label: 'Advisors',         icon: UserCheck },
    { path: '/app/commission',       label: 'Commissions',      icon: DollarSign },
    { path: '/app/tasks',            label: 'Tasks',            icon: CheckSquare },
    { path: '/app/performance',      label: 'Performance',      icon: BarChart2 },
    { path: '/app/my-performance',   label: 'My Performance',   icon: TrendingUp },
    { path: '/app/settings',         label: 'Settings',         icon: Settings },
  ],
  ADVISOR: [
    { path: '/app/dashboard',        label: 'Dashboard',        icon: LayoutDashboard },
    { path: '/app/my-farmers',       label: 'My Farmers',       icon: Wheat },
    { path: '/app/my-sales',         label: 'My Sales',         icon: ShoppingCart },
    { path: '/app/commission',       label: 'Commissions',      icon: DollarSign },
    { path: '/app/tasks',            label: 'Tasks',            icon: CheckSquare },
    { path: '/app/reports',          label: 'Reports',          icon: BarChart3 },
    { path: '/app/my-performance',   label: 'My Performance',   icon: TrendingUp },
    { path: '/app/settings',         label: 'Settings',         icon: Settings },
  ],
  WHOLESALE: [
    { path: '/app/dashboard',        label: 'Dashboard',        icon: LayoutDashboard },
    { path: '/app/products',         label: 'Products',         icon: Package },
    { path: '/app/cart',             label: 'Cart',             icon: ShoppingCart, badge: true },
    { path: '/app/inventory',        label: 'Inventory',        icon: Archive },
    { path: '/app/orders',           label: 'Order Logs',       icon: ShoppingCart },
    { path: '/app/settings',         label: 'Settings',         icon: Settings },
  ],
  MINI_STOCK: [
    { path: '/app/dashboard',        label: 'Dashboard',        icon: LayoutDashboard },
    { path: '/app/pos-sale',         label: 'POS Sale',         icon: ShoppingCart, highlight: true },
    { path: '/app/pos',              label: 'Sales History',    icon: Receipt },
    { path: '/app/products',         label: 'Products',         icon: Package },
    { path: '/app/cart',             label: 'Cart',             icon: ShoppingCart, badge: true },
    { path: '/app/inventory',        label: 'Inventory',        icon: Archive },
    { path: '/app/orders',           label: 'Orders',           icon: ShoppingCart },
    { path: '/app/settings',         label: 'Settings',         icon: Settings },
  ],
};

function SystemBadge({ role }) {
  const isEmployee = isEmployeeRole(role);
  return (
    <div className={`mx-4 mb-3 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold
      ${isEmployee
        ? 'bg-blue-50 text-blue-700 border border-blue-100'
        : 'bg-amber-50 text-amber-700 border border-amber-100'
      }`}>
      <Briefcase size={11} />
      {isEmployee ? 'Employee System' : 'Stock System'}
    </div>
  );
}

function NavGroup({ item, onClose }) {
  const location = useLocation();
  const isChildActive = item.children?.some(c => location.pathname === c.path
    || location.pathname.startsWith(c.path + '/'));
  const [open, setOpen] = useState(isChildActive);

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={`sidebar-link w-full ${
          isChildActive ? 'text-green-700 bg-green-50/60 font-semibold' : ''
        }`}
      >
        <item.icon size={16} />
        <span>{item.label}</span>
        <ChevronRight
          size={13}
          className={`ml-auto text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-90' : ''
          }`}
        />
      </button>
      {open && (
        <div className="ml-4 mt-0.5 border-l border-slate-100 pl-3 space-y-0.5">
          {item.children.map(child => (
            <NavLink
              key={child.path}
              to={child.path}
              onClick={onClose}
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-green-50 text-green-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`
              }
            >
              <child.icon size={13} />
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function NavItem({ item, onClose }) {
  const location = useLocation();
  const { getCartCount } = useCart();
  const isActive = location.pathname === item.path;
  const cartCount = item.badge ? getCartCount() : 0;

  if (item.group) return <NavGroup item={item} onClose={onClose} />;

  if (item.highlight) {
    return (
      <NavLink to={item.path} onClick={onClose}
        className="flex items-center gap-2.5 mx-1 px-3 py-2.5 rounded-xl text-sm font-semibold
          bg-green-600 text-white shadow-sm hover:bg-green-700 transition-all my-1">
        <item.icon size={16} />{item.label}
        <span className="ml-auto text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full">⭐</span>
      </NavLink>
    );
  }

  return (
    <NavLink to={item.path} onClick={onClose}
      className={`sidebar-link ${isActive ? 'active' : ''}`}>
      <item.icon size={16} />
      <span>{item.label}</span>
      {item.badge && cartCount > 0 && (
        <span className="ml-auto bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
      {isActive && !item.badge && <ChevronRight size={13} className="ml-auto text-green-500" />}
    </NavLink>
  );
}

function SidebarContent({ onClose }) {
  const { user } = useAuth();
  const navItems = ROLE_NAV[user?.role] || [];

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
          <Leaf size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 text-base">WANS</div>
          <div className="text-xs text-slate-500 truncate">Warnamayii Agri Network</div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
          <X size={16} />
        </button>
      </div>

      {/* User pill */}
      <div className="mx-4 mt-4 p-3.5 bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-xl border border-green-200/60 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
            {user?.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
            <p className="text-xs text-green-700 font-medium">{ROLE_LABELS[user?.role]}</p>
            {user?.region && <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.region}</p>}
            {/* Show advisor code if still active as Advisor */}
            {user?.advisorCode && (
              <p className="text-[10px] font-mono text-blue-600 mt-0.5 font-semibold">Code: {user.advisorCode}</p>
            )}
            {/* Show archived code + promoted badge after promotion */}
            {user?.previousAdvisorCode && !user?.advisorCode && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full font-bold">⬆ PROMOTED</span>
                <span className="text-[9px] text-slate-400 font-mono line-through">{user.previousAdvisorCode}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4 mt-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">
          Navigation
        </p>
        {navItems.map(item => (
          <NavItem key={item.path + item.label} item={item} onClose={onClose} />
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center font-medium">WANS v1.0 · 2024</p>
      </div>
    </div>
  );
}

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-white/95 backdrop-blur-sm border-r border-slate-200/60 flex-shrink-0 fixed left-0 top-0 bottom-0 z-30 shadow-sm">
        <SidebarContent onClose={() => {}} />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl">
            <SidebarContent onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
