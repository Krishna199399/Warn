import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../api/analytics.api';
import { commissionsApi } from '../api/commissions.api';
import { ordersApi } from '../api/orders.api';
import { usersApi } from '../api/users.api';
import { useAuth, ROLE_LABELS, isEmployeeRole } from '../contexts/AuthContext';
import {
  TrendingUp, Users, ShoppingCart, DollarSign,
  Package, BarChart2, Plus, UserCheck, Activity
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Line, LineChart, Legend } from 'recharts';
import { formatCurrency } from '../utils/helpers';
// AnimatedStat replaced by inline rendering
import WholesaleDashboard from './WholesaleDashboard';
import DOManagerDashboard from './DOManagerDashboard';
import AreaManagerDashboard from './AreaManagerDashboard';
import ZonalManagerDashboard from './ZonalManagerDashboard';
import StateHeadDashboard from './StateHeadDashboard';
import AdminDashboard from './AdminDashboard';

const STATUS_VARIANT = {
  DELIVERED: 'default',
  APPROVED: 'secondary',
  SHIPPED: 'secondary',
  PENDING: 'outline',
  CANCELLED: 'destructive',
};

const revenueChartConfig = {
  sales: {
    label: 'Sales',
    color: '#10b981', // Green color for sales
  },
  orders: {
    label: 'Orders',
    color: '#3b82f6', // Blue color for orders
  },
};

const formatTrendMetric = (value, key) => (
  key === 'sales' ? formatCurrency(value || 0) : Number(value || 0).toLocaleString('en-IN')
);

export default function ShadcnDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ALL hooks must come before any early returns (React rules of hooks)
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topAdvisors, setTopAdvisors] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeRevenueChart, setActiveRevenueChart] = useState('sales');
  const [timeRange, setTimeRange] = useState('day'); // 'day', 'week', 'month'

  useEffect(() => {
    // Skip fetching for roles that use specialized dashboards
    if (user?.role === 'ADMIN' || user?.role === 'WHOLESALE' || user?.role === 'MINI_STOCK' || user?.role === 'AREA_MANAGER' || user?.role === 'ZONAL_MANAGER' || user?.role === 'STATE_HEAD') {
      return;
    }

    const controller = new AbortController();
    const promises = [
      analyticsApi.getDashboard({ signal: controller.signal }),
      analyticsApi.getRevenueTrend(timeRange, { signal: controller.signal }),
      // For managers, use getAll which fetches subtree orders; for advisors use getMy
      user?.role === 'ADVISOR' 
        ? ordersApi.getMy({ signal: controller.signal })
        : ordersApi.getAll({ signal: controller.signal }),
    ];

    if (isEmployeeRole(user?.role)) {
      promises.push(commissionsApi.getSummary({ signal: controller.signal }));
    }

    if (user?.role === 'ADMIN') {
      promises.push(
        analyticsApi.getTopAdvisors({ signal: controller.signal }),
        usersApi.getPending({ signal: controller.signal })
      );
    }

    Promise.all(promises).then((results) => {
      setStats(results[0].data.data);
      const trendData = results[1].data.data || [];
      console.log('Revenue Trend Data:', trendData); // Debug log
      setTrend(trendData);
      setOrders((results[2].data.data || []).slice(0, 10));

      let idx = 3;
      if (isEmployeeRole(user?.role)) {
        setSummary(results[idx]?.data.data);
        idx++;
      }

      if (user?.role === 'ADMIN') {
        setTopAdvisors((results[idx]?.data.data || []).slice(0, 5));
        setPendingCount((results[idx + 1]?.data.data || []).length);
      }
    }).catch((err) => {
      // Ignore abort errors (component unmounted)
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED' || err.message === 'canceled') return;
      console.error('Dashboard error:', err);
      setError(err.message || 'Failed to load dashboard data');
    })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [user, timeRange]); // Added timeRange dependency

  const revenueTotals = React.useMemo(() => ({
    sales: trend.reduce((acc, curr) => acc + Number(curr.sales || 0), 0),
    orders: trend.reduce((acc, curr) => acc + Number(curr.orders || 0), 0),
  }), [trend]);

  // Use real data from backend - no synthetic data generation
  const aggregatedData = React.useMemo(() => {
    if (!trend || trend.length === 0) {
      // Return empty array if no real data exists
      return [];
    }
    
    // Backend now returns data in the correct format for the selected time range
    return trend;
  }, [trend]);

  // Early return for specialized dashboards (after all hooks)
  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }
  
  if (user?.role === 'WHOLESALE' || user?.role === 'MINI_STOCK') {
    return <WholesaleDashboard />;
  }
  
  if (user?.role === 'DO_MANAGER') {
    return <DOManagerDashboard />;
  }
  
  if (user?.role === 'AREA_MANAGER') {
    return <AreaManagerDashboard />;
  }
  
  if (user?.role === 'ZONAL_MANAGER') {
    return <ZonalManagerDashboard />;
  }
  
  if (user?.role === 'STATE_HEAD') {
    return <StateHeadDashboard />;
  }

  const welcome = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Sales',
      value: stats?.totalSales || 0,
      format: 'currency',
      icon: DollarSign,
      trend: '+12.5%',
      description: 'Total revenue generated'
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      format: 'number',
      icon: ShoppingCart,
      trend: '+8.2%',
      description: 'Orders processed'
    },
    ...(user?.role !== 'WHOLESALE' && user?.role !== 'MINI_STOCK' ? [{
      title: 'Network Size',
      value: stats?.activeNetwork || 0,
      format: 'number',
      icon: Users,
      trend: '+5.3%',
      description: 'Active network members'
    }] : []),
    ...(isEmployeeRole(user?.role) ? [{
      title: 'Commission',
      value: summary?.total || 0,
      format: 'currency',
      icon: TrendingUp,
      trend: '+15.7%',
      description: 'Total earnings'
    }] : []),
  ];

  const quickActions = user?.role === 'ADMIN' ? [
    { label: 'Pending Approvals', path: '/app/user-approvals', icon: UserCheck, count: pendingCount },
    { label: 'Stock Shops', path: '/app/stock-shops', icon: Package },
    { label: 'Create Product', path: '/app/admin/products/create', icon: Plus },
  ] : [];

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{welcome}, {user?.name}</h1>
          <p className="text-muted-foreground">
            {ROLE_LABELS[user?.role]} · {user?.region}
          </p>
        </div>
        {quickActions.length > 0 && (
          <div className="flex gap-2">
            {quickActions.map(action => (
              <Button
                key={action.path}
                onClick={() => navigate(action.path)}
                variant="outline"
                className="relative"
              >
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
                {action.count > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {action.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.format === 'currency' ? `₹${Number(stat.value || 0).toLocaleString('en-IN')}` : stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 font-medium">{stat.trend}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          {user?.role === 'ADMIN' && <TabsTrigger value="performance">Performance</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Revenue Chart */}
            <Card className="col-span-4 py-0 overflow-hidden">
              <CardHeader className="flex flex-col items-stretch border-b p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5">
                  <CardTitle>Orders Over Time</CardTitle>
                  <CardDescription>
                    Monthly sales revenue and order count
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-2 py-5 sm:p-6">
                {/* Time Range Selector */}
                <div className="flex gap-2 mb-4 justify-end">
                  <Button
                    variant={timeRange === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('day')}
                  >
                    Day
                  </Button>
                  <Button
                    variant={timeRange === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('week')}
                  >
                    Week
                  </Button>
                  <Button
                    variant={timeRange === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('month')}
                  >
                    Month
                  </Button>
                </div>
                
                {aggregatedData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={aggregatedData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                              <p className="text-sm font-semibold text-gray-900 mb-2">
                                {data.month}
                              </p>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="text-xs text-gray-600">Sales</span>
                                  </div>
                                  <span className="text-sm font-bold text-green-600">
                                    {formatCurrency(data.sales || 0)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span className="text-xs text-gray-600">Orders</span>
                                  </div>
                                  <span className="text-sm font-bold text-blue-600">
                                    {data.orders || 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                        formatter={(value) => {
                          return <span className="text-sm text-gray-700 font-medium">{value}</span>;
                        }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="sales"
                        name="Sales"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#10b981' }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="orders"
                        name="Orders"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#3b82f6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <BarChart2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest orders and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order._id} className="flex items-center">
                      <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {order.productId?.name || 'Order'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.farmerId?.name || order.customerName || 'Customer'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
                        <Badge variant={STATUS_VARIANT[order.status]} className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Complete list of recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Advisor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">
                        {order.productId?.name || 'Order'}
                      </TableCell>
                      <TableCell>
                        {order.farmerId?.name || order.customerName || '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.advisorId?.name 
                          ? `${order.advisorId.name} (${order.advisorId.advisorCode})` 
                          : '—'}
                      </TableCell>
                      <TableCell className="font-semibold text-green-700">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[order.status]}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.createdAt?.slice(0, 10)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {summary && isEmployeeRole(user?.role) && (
            <Card>
              <CardHeader>
                <CardTitle>Commission Breakdown</CardTitle>
                <CardDescription>Your earnings summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Total Earned', value: summary.total, icon: DollarSign },
                    // Only show Retail Price for ADVISOR role
                    ...(user?.role === 'ADVISOR' ? [
                      { label: 'Retail Price', value: summary.RETAIL_PRICE, icon: BarChart2 },
                    ] : []),
                    // Show Incentive (IV) for all employee roles except ADVISOR
                    ...(user?.role !== 'ADVISOR' ? [
                      { label: 'Incentive (IV)', value: summary.IV, icon: TrendingUp },
                    ] : []),
                    { label: 'This Month', value: summary.thisMonth, icon: Activity },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center space-x-4 rounded-lg border p-4">
                      <item.icon className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                        <p className="text-2xl font-bold">{formatCurrency(item.value || 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {user?.role === 'ADMIN' && (
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Highest performing advisors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topAdvisors.map((advisor, idx) => (
                    <div key={advisor._id} className="flex items-center">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${idx === 0 ? 'bg-amber-500 text-white' :
                          idx === 1 ? 'bg-slate-400 text-white' :
                            idx === 2 ? 'bg-orange-500 text-white' :
                              'bg-slate-100 text-slate-600'
                        }`}>
                        {idx + 1}
                      </div>
                      <div className="ml-4 flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{advisor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {ROLE_LABELS[advisor.role]} · {advisor.region}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-700">
                          {formatCurrency(advisor.totalSales || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {advisor.orderCount || 0} orders
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
