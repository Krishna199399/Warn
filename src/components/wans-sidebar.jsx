import * as React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_LABELS, isEmployeeRole, ROLES } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuBadge,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard, Users, BarChart3, Settings, Package, Archive,
  ShoppingCart, Plus, Leaf, Globe, MapPin, UserCheck,
  UserCog, Wheat, TrendingUp, Activity, Award, List, Receipt,
  DollarSign, Banknote, Store, LogOut, ChevronsUpDown, Network,
  Calendar, FolderTree, Trophy, Shield, HandCoins,
} from 'lucide-react';

// ─── Per-role nav configs ─────────────────────────────────────────────────────
const ROLE_NAV = {
  ADMIN: [
    { group: 'Overview', items: [
      { path: '/app/dashboard-v2',      label: 'Dashboard',         icon: LayoutDashboard },
      { path: '/app/reports',           label: 'Reports',           icon: BarChart3 },
      { path: '/app/revenue-analytics', label: 'Revenue Analytics', icon: TrendingUp },
    ]},
    { group: 'Management', items: [
      { path: '/app/products',          label: 'Products',          icon: Package },
      { path: '/app/categories',        label: 'Categories',        icon: FolderTree },
      { path: '/app/user-approvals',    label: 'User Approvals',    icon: UserCheck },
      { path: '/app/admin/shop-approvals', label: 'Shop Approvals', icon: Store },
      { path: '/app/network',           label: 'Users & Network',   icon: Users },
      { path: '/app/stock-shops',       label: 'Stock Shops',       icon: Store },
      { path: '/app/orders',            label: 'Orders',            icon: ShoppingCart },
      { path: '/app/admin/visits',      label: 'Visit Management',  icon: Calendar },
    ]},
    { group: 'Finance', items: [
      { path: '/app/admin/payouts',       label: 'Payout Management', icon: Banknote },
      { path: '/app/admin/benefit-claims', label: 'Benefit Claims',   icon: HandCoins },
      { path: '/app/admin/kyc',           label: 'KYC Management',    icon: Shield },
      { path: '/app/admin/achievements',  label: 'Achievements',      icon: Trophy },
    ]},
    { group: 'Settings', items: [
      { path: '/app/settings',            label: 'Account Settings',  icon: Settings },
    ]},
  ],
  STATE_HEAD: [
    { group: 'Overview', items: [
      { path: '/app/dashboard-v2',    label: 'Dashboard',  icon: LayoutDashboard },
      { path: '/app/zonal-employees', label: 'ZM Team',    icon: Globe },
    ]},
    { group: 'Finance', items: [
      { path: '/app/commission',  label: 'Commissions', icon: DollarSign },
      { path: '/app/my-salary',   label: 'My Salary',   icon: TrendingUp },
      { path: '/app/my-rewards',  label: 'My Rewards',  icon: Award },
      { path: '/app/my-payouts',  label: 'My Payouts',  icon: Banknote },
    ]},
    { group: 'Reports', items: [
      { path: '/app/performance', label: 'Performance', icon: Activity },
    ]},
    { group: 'Account', items: [
      { path: '/app/kyc',      label: 'KYC Verification', icon: UserCheck },
      { path: '/app/settings', label: 'Settings',         icon: Settings },
    ]},
  ],
  ZONAL_MANAGER: [
    { group: 'Overview', items: [
      { path: '/app/dashboard-v2',   label: 'Dashboard',      icon: LayoutDashboard },
      { path: '/app/area-employees', label: 'Area Employees', icon: MapPin },
    ]},
    { group: 'Finance', items: [
      { path: '/app/commission',  label: 'Commissions', icon: DollarSign },
      { path: '/app/my-salary',   label: 'My Salary',   icon: TrendingUp },
      { path: '/app/my-rewards',  label: 'My Rewards',  icon: Award },
      { path: '/app/my-payouts',  label: 'My Payouts',  icon: Banknote },
    ]},
    { group: 'Account', items: [
      { path: '/app/kyc',      label: 'KYC Verification', icon: UserCheck },
      { path: '/app/settings', label: 'Settings',        icon: Settings },
    ]},
  ],
  AREA_MANAGER: [
    { group: 'Overview', items: [
      { path: '/app/dashboard-v2', label: 'Dashboard',  icon: LayoutDashboard },
      { path: '/app/do-employees', label: 'DO Team',    icon: UserCog },
    ]},
    { group: 'Finance', items: [
      { path: '/app/commission',  label: 'Commissions', icon: DollarSign },
      { path: '/app/my-salary',   label: 'My Salary',   icon: TrendingUp },
      { path: '/app/my-rewards',  label: 'My Rewards',  icon: Award },
      { path: '/app/my-payouts',  label: 'My Payouts',  icon: Banknote },
    ]},
    { group: 'Account', items: [
      { path: '/app/kyc',      label: 'KYC Verification', icon: UserCheck },
      { path: '/app/settings', label: 'Settings',         icon: Settings },
    ]},
  ],
  DO_MANAGER: [
    { group: 'Overview', items: [
      { path: '/app/dashboard-v2', label: 'Dashboard',  icon: LayoutDashboard },
      { path: '/app/advisors',     label: 'PR Team',    icon: UserCheck },
      { path: '/app/performance',  label: 'Performance', icon: Activity },
    ]},
    { group: 'Finance', items: [
      { path: '/app/commission',  label: 'Commissions', icon: DollarSign },
      { path: '/app/my-salary',   label: 'My Salary',   icon: TrendingUp },
      { path: '/app/my-rewards',  label: 'My Rewards',  icon: Award },
      { path: '/app/my-payouts',  label: 'My Payouts',  icon: Banknote },
    ]},
    { group: 'Account', items: [
      { path: '/app/kyc',      label: 'KYC Verification', icon: UserCheck },
      { path: '/app/settings', label: 'Settings',        icon: Settings },
    ]},
  ],
  ADVISOR: [
    { group: 'Overview', items: [
      { path: '/app/dashboard-v2', label: 'Dashboard',  icon: LayoutDashboard },
      { path: '/app/my-farmers',   label: 'My Customers', icon: Wheat },
      { path: '/app/my-sales',     label: 'My Sales',   icon: ShoppingCart },
      { path: '/app/my-visits',    label: 'My Visits',  icon: Calendar },
    ]},
    { group: 'Finance', items: [
      { path: '/app/commission',  label: 'Commissions', icon: DollarSign },
      { path: '/app/my-salary',   label: 'My Salary',   icon: TrendingUp },
      { path: '/app/my-rewards',  label: 'My Rewards',  icon: Award },
      { path: '/app/my-payouts',  label: 'My Payouts',  icon: Banknote },
    ]},
    { group: 'Account', items: [
      { path: '/app/kyc',      label: 'KYC Verification', icon: UserCheck },
      { path: '/app/settings', label: 'Settings',        icon: Settings },
    ]},
  ],
  WHOLESALE: [
    { group: 'Store', items: [
      { path: '/app/dashboard-v2', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/app/products',     label: 'Products',  icon: Package },
      { path: '/app/cart',         label: 'Cart',      icon: ShoppingCart, badge: true },
      { path: '/app/inventory',    label: 'Inventory', icon: Archive },
      { path: '/app/orders',       label: 'Orders',    icon: Receipt },
      { path: '/app/pending-payments', label: 'Pending Payments', icon: Banknote },
    ]},
    { group: 'Finance', items: [
      { path: '/app/wholesale-commission', label: 'My Margins', icon: DollarSign },
      { path: '/app/my-payouts',           label: 'My Payouts', icon: Banknote },
    ]},
    { group: 'Account', items: [
      { path: '/app/kyc',         label: 'KYC Verification', icon: UserCheck },
      { path: '/app/settings',    label: 'Settings',        icon: Settings },
    ]},
  ],
  MINI_STOCK: [
    { group: 'POS', items: [
      { path: '/app/dashboard-v2', label: 'Dashboard',     icon: LayoutDashboard },
      { path: '/app/pos-sale',     label: 'POS Sale',      icon: ShoppingCart, highlight: true },
      { path: '/app/pos',          label: 'Sales History', icon: Receipt },
    ]},
    { group: 'Store', items: [
      { path: '/app/products',  label: 'Products',       icon: Package },
      { path: '/app/cart',      label: 'Cart',           icon: ShoppingCart, badge: true },
      { path: '/app/inventory', label: 'Inventory',      icon: Archive },
      { path: '/app/orders',    label: 'Orders',         icon: Receipt },
    ]},
    { group: 'Finance', items: [
      { path: '/app/ministock-commission', label: 'My Margins', icon: DollarSign },
      { path: '/app/my-payouts',           label: 'My Payouts', icon: Banknote },
    ]},
    { group: 'Account', items: [
      { path: '/app/kyc',         label: 'KYC Verification', icon: UserCheck },
      { path: '/app/settings',    label: 'Settings',        icon: Settings },
    ]},
  ],
  CUSTOMER: [
    { group: 'Shopping', items: [
      { path: '/app/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/app/products',           label: 'Browse Products', icon: Package },
      { path: '/app/customer/orders',    label: 'My Orders', icon: ShoppingCart },
    ]},
    { group: 'Account', items: [
      { path: '/app/customer/profile',   label: 'My Profile', icon: UserCog },
      { path: '/app/customer/addresses', label: 'Addresses', icon: MapPin },
      { path: '/app/settings',           label: 'Settings', icon: Settings },
    ]},
  ],
};

// ─── Single nav item ──────────────────────────────────────────────────────────
function NavItem({ item }) {
  const { getCartCount } = useCart();
  const { setOpenMobile } = useSidebar();
  const cartCount = item.badge ? getCartCount() : 0;

  return (
    <SidebarMenuItem>
      <NavLink to={item.path} onClick={() => setOpenMobile(false)}>
        {({ isActive }) => (
          <SidebarMenuButton
            isActive={isActive}
            tooltip={item.label}
            className={item.highlight ? 'bg-primary! text-primary-foreground! hover:bg-primary/90! font-semibold' : ''}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.badge && cartCount > 0 && (
              <SidebarMenuBadge>{cartCount > 99 ? '99+' : cartCount}</SidebarMenuBadge>
            )}
          </SidebarMenuButton>
        )}
      </NavLink>
    </SidebarMenuItem>
  );
}

// ─── Main WANS Sidebar ────────────────────────────────────────────────────────
export function WANSSidebar({ ...props }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navGroups = ROLE_NAV[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <Sidebar collapsible="icon" {...props}>

      {/* ── Header / Logo ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavLink to="/app/dashboard-v2">
              <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent gap-3">
                <img 
                  src="/logo-sidebar.png" 
                  srcSet="/logo-sidebar@2x.png 2x, /logo-sidebar@3x.png 3x"
                  alt="WANS Logo" 
                  className="h-8 w-auto object-contain"
                />
              </SidebarMenuButton>
            </NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Nav Groups ── */}
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavItem key={item.path} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── Footer / User ── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                <div className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-sidebar-accent cursor-pointer">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {initials}
                  </div>
                  <div className="flex flex-col leading-none flex-1 min-w-0 text-left">
                    <span className="font-semibold text-sm truncate">{user?.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{ROLE_LABELS[user?.role]}</span>
                  </div>
                  <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.region || ROLE_LABELS[user?.role]}</p>
                  {user?.advisorCode && (
                    <p className="text-xs font-mono text-primary mt-0.5 font-semibold">Code: {user.advisorCode}</p>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                  <Settings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
