import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../api/analytics.api';
import { ordersApi } from '../api/orders.api';
import { usersApi } from '../api/users.api';
import { productsApi } from '../api/products.api';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp, Users, ShoppingCart, DollarSign, AlertTriangle,
  Package, Plus, UserCheck, Activity, BarChart3, Target,
  AlertCircle, Award, CheckCircle, XCircle, Clock, Filter, Search
} from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../utils/helpers';

const STATUS_VARIANT = {
  DELIVERED: 'default',
  APPROVED: 'secondary',
  SHIPPED: 'secondary',
  PENDING: 'outline',
  CANCELLED: 'destructive',
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('day'); // 'day', 'week', 'month'

  useEffect(() => {
    const controller = new AbortController();
    
    Promise.all([
      analyticsApi.getDashboard({ signal: controller.signal }),
      ordersApi.getAll({ signal: controller.signal }),
      usersApi.getPending({ signal: controller.signal }),
      productsApi.getAll({ signal: controller.signal }),
      analyticsApi.getTopAdvisors({ signal: controller.signal }),
      analyticsApi.getRevenueTrend({ signal: controller.signal }),
    ]).then(([statsRes, ordersRes, pendingRes, productsRes, topRes, trendRes]) => {
      setStats(statsRes.data.data);
      setOrders(ordersRes.data.data || []);
      setPendingUsers(pendingRes.data.data || []);
      const products = productsRes.data.data || [];
      setLowStockProducts(products.filter(p => (p.stock || 0) < 10));
      setTopPerformers((topRes.data.data || []).slice(0, 10));
      setRevenueTrend(trendRes.data.data || []);
      setLoading(false);
    }).catch((err) => {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        console.error('Admin Dashboard error:', err);
      }
      setLoading(false);
    });

    return () => controller.abort();
  }, []);

  const alerts = useMemo(() => {
    const result = [];
    if (pendingUsers.length > 0) {
      result.push({
        type: 'warning',
        title: 'Pending User Approvals',
        message: `${pendingUsers.length} users waiting for approval`,
        action: () => navigate('/app/user-approvals'),
        icon: UserCheck,
        count: pendingUsers.length,
      });
    }
    const failedOrders = orders.filter(o => o.status === 'CANCELLED').length;
    if (failedOrders > 0) {
      result.push({
        type: 'info',
        title: 'Failed Orders',
        message: `${failedOrders} orders cancelled or failed`,
        action: () => setOrderStatusFilter('CANCELLED'),
        icon: XCircle,
        count: failedOrders,
      });
    }
    return result;
  }, [pendingUsers, orders, navigate]);

  const filteredOrders = useMemo(() => {
    // Only show retail sales (Mini Stock → Customer)
    let filtered = orders.filter(o => o.buyerType === 'CUSTOMER' && o.sellerType === 'MINI_STOCK');
    
    if (orderStatusFilter !== 'ALL') {
      filtered = filtered.filter(o => o.status === orderStatusFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.productId?.name?.toLowerCase().includes(query) ||
        o.customerName?.toLowerCase().includes(query) ||
        o.farmerId?.name?.toLowerCase().includes(query) ||
        o.advisorId?.name?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [orders, orderStatusFilter, searchQuery]);

  // Aggregate data based on time range - ONLY COMPANY REVENUE (Company → Wholesale)
  const aggregatedData = useMemo(() => {
    // Filter only company sales (Company → Wholesale)
    const companySales = orders.filter(o => 
      o.buyerType === 'WHOLESALE' && 
      o.sellerType === 'COMPANY' && 
      o.status !== 'CANCELLED'
    );
    
    if (timeRange === 'month') {
      return revenueTrend || [];
    }
    
    if (timeRange === 'week') {
      // Calculate actual weekly data from company orders only
      const weeklyMap = {};
      const now = new Date();
      const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
      
      companySales.forEach(order => {
        const orderDate = new Date(order.createdAt);
        if (orderDate < twelveWeeksAgo) return;
        
        // Calculate week number (start of week = Sunday)
        const weekStart = new Date(orderDate);
        weekStart.setDate(orderDate.getDate() - orderDate.getDay());
        const weekKey = weekStart.toISOString().slice(0, 10);
        
        if (!weeklyMap[weekKey]) {
          weeklyMap[weekKey] = { sales: 0, orders: 0, date: weekStart };
        }
        weeklyMap[weekKey].sales += Number(order.total || 0);
        weeklyMap[weekKey].orders += 1;
      });
      
      return Object.entries(weeklyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, data]) => {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const weekLabel = `${monthNames[data.date.getMonth()]} ${data.date.getDate()}`;
          return {
            month: weekLabel,
            sales: data.sales,
            orders: data.orders,
          };
        });
    }
    
    if (timeRange === 'day') {
      // Calculate actual daily data from company orders only (last 30 days)
      const dailyMap = {};
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Initialize all days with 0
      for (let i = 0; i < 30; i++) {
        const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().slice(0, 10);
        dailyMap[dateKey] = { sales: 0, orders: 0, date: new Date(date) };
      }
      
      // Aggregate actual company order data
      companySales.forEach(order => {
        const orderDate = new Date(order.createdAt);
        if (orderDate < thirtyDaysAgo) return;
        
        const dateKey = orderDate.toISOString().slice(0, 10);
        if (dailyMap[dateKey]) {
          dailyMap[dateKey].sales += Number(order.total || 0);
          dailyMap[dateKey].orders += 1;
        }
      });
      
      return Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, data]) => {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const dayLabel = `${monthNames[data.date.getMonth()]} ${data.date.getDate()}`;
          return {
            month: dayLabel,
            sales: data.sales,
            orders: data.orders,
          };
        });
    }
    
    return revenueTrend || [];
  }, [revenueTrend, timeRange, orders]);

  const welcome = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{welcome}, Admin</h1>
          <p className="text-muted-foreground mt-1">Super Admin · Full System Control</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/app/products/create')} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Product
          </Button>
          <Button onClick={() => navigate('/app/user-approvals')} variant="outline" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Pending Approvals
            {pendingUsers.length > 0 && (
              <Badge variant="destructive">{pendingUsers.length}</Badge>
            )}
          </Button>
          <Button onClick={() => navigate('/app/stock-shops')} variant="outline" className="gap-2">
            <Package className="h-4 w-4" />
            Stock Shops
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wholesale Sales</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.wholesaleSales || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Company → Wholesale ({stats?.wholesaleOrders || 0} orders)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mini Stock Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.miniStockSales || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Wholesale → Mini Stock ({stats?.miniStockOrders || 0} orders)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retail Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.retailSales || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Mini Stock → Customer ({stats?.retailOrders || 0} orders)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalSales || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">All channels ({stats?.totalOrders || 0} orders)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeNetwork || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total active network members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeUsers || stats?.activeNetwork || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Users active in last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {alerts.length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              System Alerts - Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 bg-card rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                  onClick={alert.action}
                >
                  <div className="flex items-start gap-3">
                    <alert.icon className={`h-5 w-5 mt-0.5 ${
                      alert.type === 'warning' ? 'text-yellow-600' : 
                      alert.type === 'danger' ? 'text-red-600' : 
                      'text-blue-600'
                    }`} />
                    <div>
                      <p className="font-semibold text-sm">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <Badge variant={alert.type === 'danger' ? 'destructive' : 'secondary'}>
                    {alert.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                Company Revenue Trend
              </CardTitle>
              <CardDescription>
                {timeRange === 'day' ? 'Daily company revenue (Last 30 days)' : timeRange === 'week' ? 'Weekly company revenue' : 'Monthly company revenue'} - Wholesale purchases only
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  <LineChart data={aggregatedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border rounded-lg shadow-lg p-3">
                            <p className="font-semibold text-sm mb-2">{data.month}</p>
                            <div className="space-y-1">
                              <div className="flex justify-between gap-4">
                                <span className="text-xs text-muted-foreground">Sales</span>
                                <span className="text-sm font-bold" style={{ color: '#3b82f6' }}>
                                  {formatCurrency(data.sales)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No revenue data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'PENDING' && o.buyerType === 'CUSTOMER' && o.sellerType === 'MINI_STOCK').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting processing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'DELIVERED' && o.buyerType === 'CUSTOMER' && o.sellerType === 'MINI_STOCK').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Successfully delivered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled Orders</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'CANCELLED' && o.buyerType === 'CUSTOMER' && o.sellerType === 'MINI_STOCK').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Failed or cancelled</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Retail Orders</CardTitle>
              <CardDescription>Mini Stock sales to customers (retail transactions)</CardDescription>
              <div className="flex gap-2 mt-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  {filteredOrders.slice(0, 10).map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">{order.productId?.name || 'Order'}</TableCell>
                      <TableCell>{order.farmerId?.name || order.customerName || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.advisorId?.name ? `${order.advisorId.name} (${order.advisorId.advisorCode})` : '—'}
                      </TableCell>
                      <TableCell className="font-semibold" style={{ color: '#3b82f6' }}>
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{order.createdAt?.slice(0, 10)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                Network Overview
              </CardTitle>
              <CardDescription>System-wide network statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Network analytics coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-muted-foreground" />
                Top Performing Advisors
              </CardTitle>
              <CardDescription>Highest revenue generators in the network</CardDescription>
            </CardHeader>
            <CardContent>
              {topPerformers.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topPerformers}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border rounded-lg shadow-lg p-3">
                            <p className="font-semibold text-sm mb-2">{data.name}</p>
                            <div className="flex justify-between gap-4">
                              <span className="text-xs text-muted-foreground">Sales</span>
                              <span className="text-sm font-bold" style={{ color: '#3b82f6' }}>
                                {formatCurrency(data.totalSales)}
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="totalSales" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
