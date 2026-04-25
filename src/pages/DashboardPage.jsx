import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../api/analytics.api';
import { commissionsApi } from '../api/commissions.api';
import { ordersApi } from '../api/orders.api';
import { useAuth, ROLE_LABELS, isEmployeeRole } from '../contexts/AuthContext';
import { Card, AnimatedStat, SkeletonCards } from '../components/ui';
import {
  TrendingUp, Users, ShoppingCart, DollarSign,
  Package, BarChart2, ChevronRight, Plus, ClipboardList,
  UserCheck, GitBranch, Award, Download, Wheat, MapPin,
  FileText, Target, Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '../utils/helpers';
import { exportCSV } from '../utils/exportCSV';
import WholesaleDashboard from './WholesaleDashboard';

const STATUS_COLOR = {
  DELIVERED:  'bg-green-50 text-green-700',
  APPROVED:   'bg-blue-50 text-blue-700',
  SHIPPED:    'bg-indigo-50 text-indigo-700',
  PENDING:    'bg-amber-50 text-amber-700',
  CANCELLED:  'bg-red-50 text-red-700',
};

// ─── Role-specific quick actions ──────────────────────────────────────────────
const QUICK_ACTIONS = {
  ADMIN: [
    { label: 'View Network',   icon: Users,        path: '/network',    color: 'bg-blue-500' },
    { label: 'Hierarchy',      icon: GitBranch,     path: '/hierarchy',  color: 'bg-purple-500' },
    { label: 'Reports',        icon: BarChart2,     path: '/reports',    color: 'bg-green-500' },
    { label: 'Promotions',     icon: Award,         path: '/promotions', color: 'bg-amber-500' },
  ],
  STATE_HEAD: [
    { label: 'Zonal Teams',    icon: Users,         path: '/zonal-employees', color: 'bg-blue-500' },
    { label: 'Reports',        icon: BarChart2,     path: '/reports',         color: 'bg-green-500' },
    { label: 'Promotions',     icon: Award,         path: '/promotions',      color: 'bg-amber-500' },
    { label: 'Hierarchy',      icon: GitBranch,     path: '/hierarchy',       color: 'bg-purple-500' },
  ],
  ZONAL_MANAGER: [
    { label: 'Area Teams',     icon: MapPin,        path: '/area-employees',   color: 'bg-indigo-500' },
    { label: 'Performance',    icon: Activity,      path: '/area-performance', color: 'bg-green-500' },
    { label: 'Reports',        icon: BarChart2,     path: '/reports',          color: 'bg-blue-500' },
    { label: 'My Performance', icon: TrendingUp,    path: '/my-performance',   color: 'bg-amber-500' },
  ],
  AREA_MANAGER: [
    { label: 'DO Teams',       icon: Users,         path: '/do-employees',   color: 'bg-indigo-500' },
    { label: 'Reports',        icon: BarChart2,     path: '/reports',        color: 'bg-green-500' },
    { label: 'Promotions',     icon: Award,         path: '/promotions',     color: 'bg-amber-500' },
    { label: 'My Performance', icon: TrendingUp,    path: '/my-performance', color: 'bg-purple-500' },
  ],
  DO_MANAGER: [
    { label: 'Advisors',       icon: UserCheck,     path: '/advisors',       color: 'bg-green-500' },
    { label: 'Assign Task',    icon: ClipboardList, path: '/tasks',          color: 'bg-blue-500' },
    { label: 'Performance',    icon: BarChart2,     path: '/performance',    color: 'bg-amber-500' },
    { label: 'Promotions',     icon: Award,         path: '/promotions',     color: 'bg-purple-500' },
  ],
  ADVISOR: [
    { label: 'New Order',      icon: Plus,          path: '/my-sales',       color: 'bg-green-500' },
    { label: 'My Farmers',     icon: Wheat,         path: '/my-farmers',     color: 'bg-amber-500' },
    { label: 'My Tasks',       icon: ClipboardList, path: '/tasks',          color: 'bg-blue-500' },
    { label: 'My Performance', icon: TrendingUp,    path: '/my-performance', color: 'bg-purple-500' },
  ],
  WHOLESALE: [],
  MINI_STOCK: [],
};

// ─── Activity Timeline ────────────────────────────────────────────────────────
function ActivityTimeline({ orders }) {
  if (!orders?.length) return null;
  const items = orders.slice(0, 6).map(o => ({
    icon: ShoppingCart,
    text: `${o.productId?.name || 'Order'} — ${o.farmerId?.name || o.customerName || 'Customer'}`,
    amount: formatCurrency(o.total),
    time: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
    status: o.status,
    color: o.status === 'DELIVERED' ? 'bg-green-500' : o.status === 'APPROVED' || o.status === 'SHIPPED' ? 'bg-blue-500' : 'bg-amber-500',
  }));

  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 py-2.5">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full ${item.color} flex items-center justify-center flex-shrink-0`}>
              <item.icon size={12} className="text-white" />
            </div>
            {i < items.length - 1 && <div className="w-px h-full bg-slate-100 mt-1" />}
          </div>
          <div className="flex-1 min-w-0 pb-2">
            <p className="text-sm text-slate-800 truncate">{item.text}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-semibold text-green-700">{item.amount}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[item.status] || ''}`}>{item.status}</span>
              <span className="text-[10px] text-slate-400">{item.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Route Wholesale and Mini Stock users to their specialized dashboard
  if (user?.role === 'WHOLESALE' || user?.role === 'MINI_STOCK') {
    return <WholesaleDashboard />;
  }
  
  const [stats,   setStats]   = useState(null);
  const [trend,   setTrend]   = useState([]);
  const [summary, setSummary] = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const promises = [
      analyticsApi.getDashboard({ signal: controller.signal }),
      analyticsApi.getRevenueTrend({ signal: controller.signal }),
      ordersApi.getMy({ signal: controller.signal }).catch(() => ordersApi.getAll({ signal: controller.signal })),
    ];
    
    // Only fetch commission summary for employee roles
    if (isEmployeeRole(user?.role)) {
      promises.push(commissionsApi.getSummary({ signal: controller.signal }));
    }
    
    Promise.all(promises).then((results) => {
      setStats(results[0].data.data);
      setTrend(results[1].data.data || []);
      setOrders((results[2].data.data || []).slice(0, 8));
      if (results[3]) {
        setSummary(results[3].data.data);
      }
    }).catch(() => {})
    .finally(() => setLoading(false));

    return () => controller.abort();
  }, [user]);

  const welcome = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  const quickActions = QUICK_ACTIONS[user?.role] || [];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-24 rounded-2xl" />
        <SkeletonCards count={4} />
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="skeleton-card"><div className="skeleton h-4 w-32 mb-4" /><div className="skeleton h-48 rounded-lg" /></div>
          <div className="skeleton-card"><div className="skeleton h-4 w-32 mb-4" /><div className="skeleton h-48 rounded-lg" /></div>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Sales',    value: stats?.totalSales || 0,    format: 'currency', icon: DollarSign,   color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Total Orders',   value: stats?.totalOrders || 0,   format: 'number',   icon: ShoppingCart, color: 'text-blue-600',   bg: 'bg-blue-50' },
    ...(user?.role !== 'WHOLESALE' && user?.role !== 'MINI_STOCK' ? [
      { label: 'Network Size',   value: stats?.activeNetwork || 0, format: 'number',   icon: Users,        color: 'text-purple-600', bg: 'bg-purple-50' },
    ] : []),
    ...(isEmployeeRole(user?.role) ? [
      { label: 'Commission',     value: summary?.total || 0,       format: 'currency', icon: TrendingUp,   color: 'text-amber-600',  bg: 'bg-amber-50' },
    ] : []),
  ];

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute right-12 bottom-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/3" />
        <p className="text-green-100 text-sm">{welcome},</p>
        <h1 className="text-xl font-bold mt-1">{user?.name} 👋</h1>
        <p className="text-green-100/80 text-sm mt-1">{ROLE_LABELS[user?.role]} · {user?.region}</p>
        {user?.advisorCode && user?.role !== 'WHOLESALE' && user?.role !== 'MINI_STOCK' && (
          <p className="text-xs text-green-200 mt-1 font-mono">Code: {user.advisorCode}</p>
        )}
        {user?.isPromoted && user?.previousRole && (
          <p className="text-xs mt-2 bg-white/20 px-3 py-1 rounded-full inline-block">
            🌟 Promoted from {ROLE_LABELS[user.previousRole]}
          </p>
        )}
      </div>

      {/* Quick Actions - Mobile optimized */}
      {quickActions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(action => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 rounded-xl bg-white border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className={`w-9 h-9 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <action.icon size={16} className="text-white" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-700 text-center sm:text-left truncate">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Stat cards with animated counters */}
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

      {/* Chart + commission */}
      <div className="grid lg:grid-cols-2 gap-4">
        {trend.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <BarChart2 size={14} className="text-green-600" /> Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={v => formatCurrency(v)}
                  contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#22c55e" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {summary && isEmployeeRole(user?.role) && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <DollarSign size={14} className="text-amber-500" /> Commission Breakdown
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Total Earned',    val: summary.total,        color: 'text-green-700',  bg: 'bg-green-50',  icon: '💰' },
                { label: 'Retail Price',    val: summary.RETAIL_PRICE, color: 'text-rose-700',   bg: 'bg-rose-50',   icon: '🎯' },
                { label: 'Incentive (IV)',  val: summary.IV,           color: 'text-blue-700',   bg: 'bg-blue-50',   icon: '⚡' },
                { label: 'Salary (SV)',     val: summary.SV,           color: 'text-purple-700', bg: 'bg-purple-50', icon: '💼' },
                { label: 'Reward (RF)',     val: summary.RF,          color: 'text-amber-700',  bg: 'bg-amber-50',  icon: '🏆' },
                { label: 'This Month',      val: summary.thisMonth,   color: 'text-emerald-700',bg: 'bg-emerald-50',icon: '📅' },
              ].map(c => (
                <div key={c.label} className={`flex items-center justify-between px-4 py-3 rounded-xl ${c.bg} group hover:shadow-sm transition-all`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{c.icon}</span>
                    <span className="text-xs font-medium text-slate-600">{c.label}</span>
                  </div>
                  <span className={`text-sm font-bold ${c.color}`}>
                    <AnimatedStat value={c.val || 0} format="currency" />
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Activity Timeline + Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-4">
        {orders.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Activity size={14} className="text-blue-500" /> Activity Timeline
              </h3>
            </div>
            <ActivityTimeline orders={orders} />
          </Card>
        )}

        {orders.length > 0 && (
          <Card padding={false}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-50">
              <h3 className="text-sm font-semibold text-slate-800">Recent Orders</h3>
              <button
                onClick={() => exportCSV(orders.map(o => ({
                  Product: o.productId?.name || '',
                  Customer: o.farmerId?.name || o.customerName || '',
                  Amount: o.total,
                  Status: o.status,
                  Date: o.createdAt?.slice(0, 10),
                })), 'recent_orders')}
                className="btn-export"
              >
                <Download size={12} /> Export
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {orders.slice(0, 5).map(o => (
                <div key={o._id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{o.productId?.name || 'Order'}</p>
                    <p className="text-xs text-slate-400">{o.farmerId?.name || o.customerName || '—'} · {o.createdAt?.slice(0,10)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-700">{formatCurrency(o.total)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.status] || ''}`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
