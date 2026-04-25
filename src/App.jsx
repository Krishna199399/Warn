import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth, isEmployeeRole, isStockRole, ROLES } from './contexts/AuthContext';
import { PromotionProvider } from './contexts/PromotionContext';
import { HierarchyProvider } from './contexts/HierarchyContext';
import { CartProvider } from './contexts/CartContext';
import AppLayout from './components/layout/AppLayout';
import { Leaf } from 'lucide-react';

// Public pages
import LandingPage  from './pages/LandingPage';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Shared pages
import DashboardPage        from './pages/DashboardPage';
import ProductsPage         from './pages/ProductsPage';
import SettingsPage         from './pages/SettingsPage';
import ReportsPage          from './pages/ReportsPage';
import RevenueAnalyticsPage from './pages/RevenueAnalyticsPage';

// Admin product management
import CreateProductPage    from './pages/admin/CreateProductPage';
import EditProductPage      from './pages/admin/EditProductPage';

// Employee-only pages
import NetworkPage          from './pages/NetworkPage';
import CommissionPage       from './pages/CommissionPage';
import ZonalEmployeesPage   from './pages/ZonalEmployeesPage';
import AreaEmployeesPage    from './pages/AreaEmployeesPage';
import AreaPerformancePage  from './pages/AreaPerformancePage';
import DOEmployeesPage      from './pages/DOEmployeesPage';
import AdvisorsPage         from './pages/AdvisorsPage';
import TasksPage            from './pages/TasksPage';
import PerformancePage      from './pages/PerformancePage';
import MyFarmersPage        from './pages/MyFarmersPage';
import MySalesPage          from './pages/MySalesPage';
import UserApprovalsPage    from './pages/UserApprovalsPage';

// Promotion pages
import MyPerformancePage     from './pages/MyPerformancePage';
import PromotionRequestsPage from './pages/PromotionRequestsPage';

// Stock-only pages
import InventoryPage      from './pages/InventoryPage';
import OrdersPage         from './pages/OrdersPage';
import CartPage           from './pages/CartPage';
import PaymentPage        from './pages/PaymentPage';
import CheckoutPage       from './pages/CheckoutPage';
import POSSalePage        from './pages/POSSalePage';
import POSPage            from './pages/POSPage';

// ─── Loading splash ───────────────────────────────────────────────────────────
const LoadingSplash = () => (
  <div className="min-h-screen bg-gradient-to-br from-green-950 to-slate-900 flex flex-col items-center justify-center gap-4">
    <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center">
      <Leaf size={28} className="text-white" />
    </div>
    <div className="w-6 h-6 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
  </div>
);

// ─── Route guards ─────────────────────────────────────────────────────────────
const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSplash />;
  return user ? children : <Navigate to="/login" replace />;
};
const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSplash />;
  return user ? <Navigate to="/app/dashboard" replace /> : children;
};
const EmployeeOnly = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return isEmployeeRole(user.role) ? children : <Navigate to="/app/dashboard" replace />;
};
const StockOnly = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return isStockRole(user.role) ? children : <Navigate to="/app/dashboard" replace />;
};
const RoleOnly = (allowedRoles) => ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return allowedRoles.includes(user.role) ? children : <Navigate to="/app/dashboard" replace />;
};

const StateHeadOnly  = RoleOnly([ROLES.ADMIN, ROLES.STATE_HEAD]);
const ZonalOnly      = RoleOnly([ROLES.ADMIN, ROLES.ZONAL_MANAGER]);
const AreaOnly       = RoleOnly([ROLES.ADMIN, ROLES.AREA_MANAGER]);
const DOOnly         = RoleOnly([ROLES.ADMIN, ROLES.DO_MANAGER]);
const AdvisorOnly    = RoleOnly([ROLES.ADMIN, ROLES.ADVISOR]);
const MiniStockOnly  = RoleOnly([ROLES.MINI_STOCK]);
const WholesaleOnly  = RoleOnly([ROLES.WHOLESALE]);
const AdminOnly      = RoleOnly([ROLES.ADMIN]);
// Admin can view all stock / order pages for oversight
const AdminOrStock   = RoleOnly([ROLES.ADMIN, ROLES.WHOLESALE, ROLES.MINI_STOCK]);

// ─── Authenticated shell — providers only mount when logged in ────────────────
// This is the KEY fix: HierarchyProvider and PromotionProvider are children of
// RequireAuth, so they only render (and fetch) after the user is authenticated.
const AuthenticatedShell = () => (
  <CartProvider>
    <HierarchyProvider>
      <PromotionProvider>
        <AppLayout />
      </PromotionProvider>
    </HierarchyProvider>
  </CartProvider>
);

// ─── Routes ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Public routes — redirect to /dashboard if already logged in */}
      <Route path="/login"    element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />

      {/* Authenticated routes — providers only mount here */}
      <Route path="/app" element={<RequireAuth><AuthenticatedShell /></RequireAuth>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />

        {/* Shared across all roles */}
        <Route path="dashboard"         element={<DashboardPage />} />
        <Route path="products"          element={<ProductsPage />} />
        <Route path="products/create"   element={<AdminOnly><CreateProductPage /></AdminOnly>} />
        <Route path="products/:id/edit" element={<AdminOnly><EditProductPage /></AdminOnly>} />
        <Route path="settings"          element={<SettingsPage />} />
        <Route path="reports"           element={<EmployeeOnly><ReportsPage /></EmployeeOnly>} />
        <Route path="revenue-analytics" element={<EmployeeOnly><RevenueAnalyticsPage /></EmployeeOnly>} />

        {/* Employee — all roles */}
        <Route path="network"           element={<EmployeeOnly><NetworkPage /></EmployeeOnly>} />
        <Route path="commission"        element={<EmployeeOnly><CommissionPage /></EmployeeOnly>} />

        {/* Admin only */}
        <Route path="user-approvals"    element={<AdminOnly><UserApprovalsPage /></AdminOnly>} />

        {/* State Head */}
        <Route path="zonal-employees"   element={<StateHeadOnly><ZonalEmployeesPage /></StateHeadOnly>} />

        {/* Zonal Manager */}
        <Route path="area-employees"    element={<ZonalOnly><AreaEmployeesPage /></ZonalOnly>} />
        <Route path="area-performance"  element={<ZonalOnly><AreaPerformancePage /></ZonalOnly>} />

        {/* Area Manager */}
        <Route path="do-employees"      element={<AreaOnly><DOEmployeesPage /></AreaOnly>} />

        {/* DO Manager */}
        <Route path="advisors"          element={<DOOnly><AdvisorsPage /></DOOnly>} />
        <Route path="performance"       element={<DOOnly><PerformancePage /></DOOnly>} />

        {/* Tasks — all employees */}
        <Route path="tasks"             element={<EmployeeOnly><TasksPage /></EmployeeOnly>} />

        {/* Advisor */}
        <Route path="my-farmers"        element={<AdvisorOnly><MyFarmersPage /></AdvisorOnly>} />
        <Route path="my-sales"          element={<AdvisorOnly><MySalesPage /></AdvisorOnly>} />

        {/* Promotion — all employee roles */}
        <Route path="my-performance"    element={<EmployeeOnly><MyPerformancePage /></EmployeeOnly>} />
        <Route path="promotions"        element={<EmployeeOnly><PromotionRequestsPage /></EmployeeOnly>} />

        {/* Stock only */}
        <Route path="inventory"         element={<StockOnly><InventoryPage /></StockOnly>} />
        <Route path="orders"            element={<AdminOrStock><OrdersPage /></AdminOrStock>} />
        <Route path="cart"              element={<StockOnly><CartPage /></StockOnly>} />
        <Route path="payment"           element={<StockOnly><PaymentPage /></StockOnly>} />
        <Route path="checkout"          element={<StockOnly><CheckoutPage /></StockOnly>} />
        <Route path="pos-sale"          element={<MiniStockOnly><POSSalePage /></MiniStockOnly>} />
        <Route path="pos"               element={<MiniStockOnly><POSPage /></MiniStockOnly>} />

        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Route>
      
      {/* Catch all - redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
