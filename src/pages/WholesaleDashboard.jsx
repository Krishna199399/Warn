import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../api/orders.api';
import { inventoryApi } from '../api/inventory.api';
import { useAuth, ROLE_LABELS } from '../contexts/AuthContext';
import { Card, AnimatedStat, SkeletonCards } from '../components/ui';
import {
  DollarSign, ShoppingCart, Clock, CheckCircle, Package, 
  AlertTriangle, TrendingUp, TrendingDown, ShoppingBag, Store
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatCurrency, calculateWholesaleKPIs, getOrderStatusBreakdown } from '../utils/helpers';
import OrderStatusOverview from '../components/dashboard/OrderStatusOverview';
import InventorySnapshot from '../components/dashboard/InventorySnapshot';
import RecentOrdersTable from '../components/dashboard/RecentOrdersTable';

export default function WholesaleDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    
    Promise.all([
      ordersApi.getWholesaleOrders({ signal: controller.signal }), // Sales (as seller)
      ordersApi.getMyPurchases({ signal: controller.signal }),      // Purchases (as buyer)
      inventoryApi.getMy({ signal: controller.signal }),
    ])
      .then(([salesRes, purchasesRes, inventoryRes]) => {
        const sales = salesRes.data.data || [];
        const purchases = purchasesRes.data.data || [];
        const allOrders = [...sales, ...purchases];
        
        setOrders(allOrders);
        setInventory(inventoryRes.data.data || {});
      })
      .catch((err) => {
        console.error('Dashboard data fetch error:', err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const welcome = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-24 rounded-2xl" />
        <SkeletonCards count={4} />
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="skeleton-card"><div className="skeleton h-48 rounded-lg" /></div>
          <div className="skeleton-card"><div className="skeleton h-48 rounded-lg" /></div>
        </div>
      </div>
    );
  }

  const kpis = calculateWholesaleKPIs(orders, inventory, user._id);
  const statusBreakdown = getOrderStatusBreakdown(orders);

  // Prepare chart data (last 6 months)
  const chartData = (() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      
      const monthOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        const orderKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        return orderKey === monthKey && o.status !== 'CANCELLED';
      });
      
      const purchases = monthOrders.filter(o => 
        o.buyerId?._id === user._id || o.buyerId === user._id
      ).reduce((sum, o) => sum + o.total, 0);
      
      const sales = monthOrders.filter(o => 
        o.sellerId?._id === user._id || o.sellerId === user._id
      ).reduce((sum, o) => sum + o.total, 0);
      
      months.push({
        month: monthLabel,
        purchases,
        sales,
      });
    }
    
    return months;
  })();

  const quickActions = [
    { label: 'View Products', icon: Package, path: '/app/products', color: 'bg-blue-500' },
    { label: 'View Inventory', icon: Store, path: '/app/inventory', color: 'bg-green-500' },
    { label: 'View Cart', icon: ShoppingBag, path: '/app/cart', color: 'bg-purple-500' },
    { label: 'Order Logs', icon: ShoppingCart, path: '/app/orders', color: 'bg-amber-500' },
  ];

  const statCards = [
    { 
      label: 'Total Purchases', 
      value: kpis.totalPurchaseValue, 
      format: 'currency', 
      icon: TrendingDown, 
      color: 'text-red-600', 
      bg: 'bg-red-50' 
    },
    { 
      label: 'Total Sales', 
      value: kpis.totalSalesValue, 
      format: 'currency', 
      icon: TrendingUp, 
      color: 'text-green-600', 
      bg: 'bg-green-50' 
    },
    { 
      label: 'Total Orders', 
      value: kpis.totalOrders, 
      format: 'number', 
      icon: ShoppingCart, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Pending Orders', 
      value: kpis.pendingOrders, 
      format: 'number', 
      icon: Clock, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50' 
    },
    { 
      label: 'Delivered Orders', 
      value: kpis.deliveredOrders, 
      format: 'number', 
      icon: CheckCircle, 
      color: 'text-green-600', 
      bg: 'bg-green-50' 
    },
    { 
      label: 'Stock Items', 
      value: kpis.totalStockItems, 
      format: 'number', 
      icon: Package, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50' 
    },
    { 
      label: 'Low Stock Alerts', 
      value: kpis.lowStockAlerts, 
      format: 'number', 
      icon: AlertTriangle, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50' 
    },
  ];

  return (
    <div className="space-y-5">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute right-12 bottom-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/3" />
        <p className="text-green-100 text-sm">{welcome},</p>
        <h1 className="text-xl font-bold mt-1">{user?.name} 👋</h1>
        <p className="text-green-100/80 text-sm mt-1">{ROLE_LABELS[user?.role]} · {user?.region}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map(action => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className={`w-9 h-9 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
              <action.icon size={16} className="text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700 truncate">{action.label}</span>
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Card key={s.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  <AnimatedStat value={s.value} format={s.format} />
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={18} className={s.color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Order Status + Analytics Chart */}
      <div className="grid lg:grid-cols-3 gap-4">
        <OrderStatusOverview statusBreakdown={statusBreakdown} />
        
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Orders Over Time</h3>
          {chartData.some(d => d.purchases > 0 || d.sales > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={v => formatCurrency(v)}
                  contentStyle={{ 
                    borderRadius: '0.75rem', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="purchases" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  name="Purchases"
                  dot={{ fill: '#ef4444', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  name="Sales"
                  dot={{ fill: '#22c55e', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-16">No order data available</p>
          )}
        </div>
      </div>

      {/* Recent Orders + Inventory Snapshot */}
      <div className="grid lg:grid-cols-2 gap-4">
        <RecentOrdersTable orders={orders} userId={user._id} />
        <InventorySnapshot inventory={inventory} />
      </div>
    </div>
  );
}
