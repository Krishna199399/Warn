import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, isEmployeeRole, isStockRole, ROLES } from './contexts/AuthContext';
import { HierarchyProvider } from './contexts/HierarchyContext';
import { CartProvider } from './contexts/CartContext';
import AppLayout from './components/layout/AppLayout';
import { Leaf } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';

// Public pages
import LandingPageVerdant from './pages/LandingPageVerdant';
import CategoriesPage     from './pages/CategoriesPage';
import AboutPage          from './pages/AboutPage';
import ContactPage        from './pages/ContactPage';
import PublicCartPage     from './pages/PublicCartPage';
import PublicProductDetailPage from './pages/PublicProductDetailPage';
import PublicProductsPage from './pages/PublicProductsPage';
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import RegistrationSelectionPage from './pages/RegistrationSelectionPage';
import EmployeeRegisterPage from './pages/EmployeeRegisterPage';
import ShadcnDashboardPage  from './pages/ShadcnDashboardPage';
import ProductsPage         from './pages/ProductsPage';
import ProductDetailPage    from './pages/ProductDetailPage';
import SettingsPage         from './pages/SettingsPage';
import ReportsPage          from './pages/ReportsPage';
import RevenueAnalyticsPage from './pages/RevenueAnalyticsPage';
import StockShopsPage       from './pages/StockShopsPage';

// Admin product management
import CreateProductPage       from './pages/admin/CreateProductPage';
import EditProductPage         from './pages/admin/EditProductPage';
import AdminVisitsPage         from './pages/admin/AdminVisitsPage';
import CategoriesManagementPage from './pages/admin/CategoriesManagementPage';

// Employee-only pages
import NetworkPage          from './pages/NetworkPage';
import CommissionPage       from './pages/CommissionPage';
import MySalaryPage         from './pages/MySalaryPage';
import MyRewardsPage        from './pages/MyRewardsPage';
import MyPayoutsPage        from './pages/MyPayoutsPage';
import BankDetailsPage      from './pages/BankDetailsPage';
import KYCPage              from './pages/KYCPage';
import AdminPayoutsPage     from './pages/admin/AdminPayoutsPage';
import AdminKYCPage         from './pages/admin/AdminKYCPage';
import AdminBatchDetailPage from './pages/admin/AdminBatchDetailPage';
import AdminAchievementsPage from './pages/admin/AdminAchievementsPage';
import AdminBenefitClaimsPage from './pages/admin/AdminBenefitClaimsPage';
import ShopApprovalsPage    from './pages/admin/ShopApprovalsPage';
import ZonalEmployeesPage   from './pages/ZonalEmployeesPage';
import AreaEmployeesPage    from './pages/AreaEmployeesPage';
import AreaPerformancePage  from './pages/AreaPerformancePage';
import DOEmployeesPage      from './pages/DOEmployeesPage';
import AdvisorsPage         from './pages/AdvisorsPage';
import TasksPage            from './pages/TasksPage';
import PerformancePage      from './pages/PerformancePage';
import MyFarmersPage        from './pages/MyFarmersPage';
import MySalesPage          from './pages/MySalesPage';
import MyVisitsPage         from './pages/MyVisitsPage';
import VisitDetailPage      from './pages/VisitDetailPage';
import UserApprovalsPage    from './pages/UserApprovalsPage';
import EmployeeDetailPage   from './pages/EmployeeDetailPage';
import WholesaleCommissionPage from './pages/WholesaleCommissionPage';
import MiniStockCommissionPage from './pages/MiniStockCommissionPage';

// Stock-only pages
import InventoryPage            from './pages/InventoryPage';
import OrdersPage               from './pages/OrdersPage';
import CartPage                 from './pages/CartPage';
import PaymentPage              from './pages/PaymentPage';
import CheckoutPage             from './pages/CheckoutPage';
import POSSalePage              from './pages/POSSalePage';
import POSPage                  from './pages/POSPage';
import PaymentProofPage         from './pages/PaymentProofPage';
import PendingPaymentsPage      from './pages/PendingPaymentsPage';

// Customer-only pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerOrderDetail from './pages/customer/CustomerOrderDetail';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerAddresses from './pages/customer/CustomerAddresses';
import CustomerCheckout from './pages/customer/CustomerCheckout';

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
  // Don't redirect customers - they stay on public site
  if (user && user.role === ROLES.CUSTOMER) return children;
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
const CustomerOnly = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === ROLES.CUSTOMER ? children : <Navigate to="/app/dashboard" replace />;
};
const RoleOnly = (allowedRoles) => {
  function RoleGuard({ children }) {
    const { user } = useAuth();
    console.log('RoleGuard check:', { 
      user: user?.name, 
      role: user?.role, 
      allowedRoles, 
      hasAccess: user && allowedRoles.includes(user.role) 
    });
    if (!user) return <Navigate to="/login" replace />;
    return allowedRoles.includes(user.role) ? children : <Navigate to="/app/dashboard" replace />;
  }

  return RoleGuard;
};

const StateHeadOnly  = RoleOnly([ROLES.ADMIN, ROLES.STATE_HEAD]);
const ZonalOnly      = RoleOnly([ROLES.ADMIN, ROLES.ZONAL_MANAGER]);
const AreaOnly       = RoleOnly([ROLES.ADMIN, ROLES.AREA_MANAGER]);
const DOOnly         = RoleOnly([ROLES.ADMIN, ROLES.DO_MANAGER]);
const AdvisorOnly    = RoleOnly([ROLES.ADMIN, ROLES.ADVISOR]);
const MiniStockOnly  = RoleOnly([ROLES.MINI_STOCK]);
const WholesaleOnly  = RoleOnly([ROLES.WHOLESALE]);
const AdminOnly      = RoleOnly([ROLES.ADMIN]);
const AdminOrStock   = RoleOnly([ROLES.ADMIN, ROLES.WHOLESALE, ROLES.MINI_STOCK]);
const EmployeeOrStock = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (isEmployeeRole(user.role) || isStockRole(user.role)) ? children : <Navigate to="/app/dashboard" replace />;
};

// ─── Authenticated shell — providers only mount when logged in ────────────────
const AuthenticatedShell = () => (
  <HierarchyProvider>
    <AppLayout />
  </HierarchyProvider>
);

// ─── Routes ───────────────────────────────────────────────────────────────────
function DashboardRouter() {
  const { user } = useAuth();
  
  // Redirect customers to their specific dashboard
  if (user?.role === ROLES.CUSTOMER) {
    return <Navigate to="/app/customer/dashboard" replace />;
  }
  
  // All other roles use the standard dashboard
  return <ShadcnDashboardPage />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<LandingPageVerdant />} />
      
      {/* Public pages - accessible with or without login for customers */}
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/products" element={<PublicProductsPage />} />
      <Route path="/products/:id" element={<PublicProductDetailPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/cart" element={<PublicCartPage />} />
      
      {/* Customer-only public pages (require login but stay on public site) */}
      <Route path="/checkout" element={<CustomerOnly><CustomerCheckout /></CustomerOnly>} />
      <Route path="/my-orders" element={<CustomerOnly><CustomerOrders /></CustomerOnly>} />
      <Route path="/my-orders/:id" element={<CustomerOnly><CustomerOrderDetail /></CustomerOnly>} />
      <Route path="/my-profile" element={<CustomerOnly><CustomerProfile /></CustomerOnly>} />
      <Route path="/my-addresses" element={<CustomerOnly><CustomerAddresses /></CustomerOnly>} />
      
      {/* Auth routes */}
      <Route path="/login"    element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register-select" element={<PublicOnly><RegistrationSelectionPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route path="/employee-register" element={<PublicOnly><EmployeeRegisterPage /></PublicOnly>} />

      {/* Authenticated routes — providers only mount here */}
      <Route path="/app" element={<RequireAuth><AuthenticatedShell /></RequireAuth>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />

        {/* Shared across all roles */}
        <Route path="dashboard"         element={<Navigate to="/app/dashboard-v2" replace />} />
        <Route path="dashboard-v2"      element={<DashboardRouter />} />
        <Route path="products"          element={<ProductsPage />} />
        <Route path="products/:id"      element={<ProductDetailPage />} />
        <Route path="products/create"   element={<AdminOnly><CreateProductPage /></AdminOnly>} />
        <Route path="products/:id/edit" element={<AdminOnly><EditProductPage /></AdminOnly>} />
        <Route path="categories"        element={<AdminOnly><CategoriesManagementPage /></AdminOnly>} />
        <Route path="settings"          element={<SettingsPage />} />
        <Route path="reports"           element={<EmployeeOnly><ReportsPage /></EmployeeOnly>} />
        <Route path="revenue-analytics" element={<EmployeeOnly><RevenueAnalyticsPage /></EmployeeOnly>} />

        {/* Customer routes */}
        <Route path="customer/dashboard" element={<CustomerOnly><Navigate to="/" replace /></CustomerOnly>} />
        <Route path="customer/orders" element={<CustomerOnly><Navigate to="/my-orders" replace /></CustomerOnly>} />
        <Route path="customer/orders/:id" element={<CustomerOnly><Navigate to="/my-orders/:id" replace /></CustomerOnly>} />
        <Route path="customer/profile" element={<CustomerOnly><Navigate to="/my-profile" replace /></CustomerOnly>} />
        <Route path="customer/addresses" element={<CustomerOnly><Navigate to="/my-addresses" replace /></CustomerOnly>} />

        {/* Employee — all roles */}
        <Route path="network"           element={<EmployeeOnly><NetworkPage /></EmployeeOnly>} />
        <Route path="employees/:id"     element={<EmployeeOnly><EmployeeDetailPage /></EmployeeOnly>} />
        <Route path="commission"        element={<EmployeeOnly><CommissionPage /></EmployeeOnly>} />
        <Route path="my-salary"         element={<EmployeeOnly><MySalaryPage /></EmployeeOnly>} />
        <Route path="my-rewards"        element={<EmployeeOnly><MyRewardsPage /></EmployeeOnly>} />
        <Route path="my-payouts"        element={<EmployeeOrStock><MyPayoutsPage /></EmployeeOrStock>} />
        <Route path="bank-details"      element={<EmployeeOnly><BankDetailsPage /></EmployeeOnly>} />
        <Route path="kyc"               element={<EmployeeOrStock><KYCPage /></EmployeeOrStock>} />

        {/* Admin — Payout Management */}
        <Route path="admin/payouts"       element={<AdminOnly><AdminPayoutsPage /></AdminOnly>} />
        <Route path="admin/kyc"           element={<AdminOnly><AdminKYCPage /></AdminOnly>} />
        <Route path="admin/payouts/:id"   element={<AdminOnly><AdminBatchDetailPage /></AdminOnly>} />
        <Route path="admin/visits"        element={<AdminOnly><AdminVisitsPage /></AdminOnly>} />
        <Route path="admin/achievements"  element={<AdminOnly><AdminAchievementsPage /></AdminOnly>} />
        <Route path="admin/benefit-claims" element={<AdminOnly><AdminBenefitClaimsPage /></AdminOnly>} />
        <Route path="admin/shop-approvals" element={<AdminOnly><ShopApprovalsPage /></AdminOnly>} />

        {/* Admin only */}
        <Route path="user-approvals"    element={<AdminOnly><UserApprovalsPage /></AdminOnly>} />
        <Route path="stock-shops"       element={<AdminOnly><StockShopsPage /></AdminOnly>} />

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
        <Route path="my-visits"         element={<AdvisorOnly><MyVisitsPage /></AdvisorOnly>} />
        <Route path="visits/:id"        element={<AdvisorOnly><VisitDetailPage /></AdvisorOnly>} />

        {/* Stock only */}
        <Route path="inventory"         element={<StockOnly><InventoryPage /></StockOnly>} />
        <Route path="orders"            element={<AdminOrStock><OrdersPage /></AdminOrStock>} />
        <Route path="cart"              element={<StockOnly><CartPage /></StockOnly>} />
        <Route path="payment"           element={<StockOnly><PaymentPage /></StockOnly>} />
        <Route path="checkout"          element={<StockOnly><CheckoutPage /></StockOnly>} />
        <Route path="pos-sale"          element={<MiniStockOnly><POSSalePage /></MiniStockOnly>} />
        <Route path="pos"               element={<MiniStockOnly><POSPage /></MiniStockOnly>} />

        {/* Manual Payment System */}
        <Route path="payment-proof"           element={<MiniStockOnly><PaymentProofPage /></MiniStockOnly>} />
        <Route path="pending-payments"        element={<WholesaleOnly><PendingPaymentsPage /></WholesaleOnly>} />
        
        {/* Wholesale & Mini Stock Commission */}
        <Route path="wholesale-commission" element={<WholesaleOnly><WholesaleCommissionPage /></WholesaleOnly>} />
        <Route path="ministock-commission" element={<MiniStockOnly><MiniStockCommissionPage /></MiniStockOnly>} />

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
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
