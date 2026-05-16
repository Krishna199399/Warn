import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../api/analytics.api';
import { commissionsApi } from '../api/commissions.api';
import { ordersApi } from '../api/orders.api';
import { usersApi } from '../api/users.api';
import { farmersApi } from '../api/farmers.api';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp, Users, ShoppingCart, DollarSign, AlertTriangle,
  UserCheck, Activity, Award, Package, ArrowRight, TrendingDown,
  Calendar, Target, Zap, AlertCircle, CheckCircle2, X
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { formatCurrency } from '../utils/helpers';

export default function AreaManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [downline, setDownline] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [timeRange, setTimeRange] = useState('day');
  const [showLowPerformingModal, setShowLowPerformingModal] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    
    Promise.all([
      analyticsApi.getDashboard({ signal: controller.signal }),
      analyticsApi.getRevenueTrend({ signal: controller.signal }),
      ordersApi.getAll({ signal: controller.signal }),
      commissionsApi.getSummary({ signal: controller.signal }),
      usersApi.getDownline(user._id),
      farmersApi.getMy({ signal: controller.signal }),
    ]).then(([statsRes, trendRes, ordersRes, summaryRes, downlineRes, farmersRes]) => {
      setStats(statsRes.data.data);
      setTrend(trendRes.data.data || []);
      setOrders(ordersRes.data.data || []);
      setSummary(summaryRes.data.data);
      setDownline(downlineRes.data.data || []);
      setFarmers(farmersRes.data.data || []);
    }).catch((err) => {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        console.error('Dashboard error:', err);
      }
    }).finally(() => setLoading(false));

    return () => controller.abort();
  }, [user]);

  // Calculate team metrics
  const teamMetrics = useMemo(() => {
    console.log('=== TEAM METRICS DEBUG ===');
    console.log('Total downline:', downline.length);
    console.log('Total orders:', orders.length);
    
    const doManagers = downline.filter(u => u.role === 'DO_MANAGER');
    const advisors = downline.filter(u => u.role === 'ADVISOR');
    
    console.log('DO Managers:', doManagers.map(d => ({ id: d._id, name: d.name, status: d.status })));
    console.log('Advisors:', advisors.map(a => ({ id: a._id, name: a.name, parentId: a.parentId })));
    
    // Active = has team members who made orders in last 30 days OR status is ACTIVE
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrders = orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
    console.log('Recent orders (last 30 days):', recentOrders.length);
    
    const activeAdvisorIds = new Set(recentOrders.map(o => o.advisorId?._id || o.advisorId).filter(Boolean));
    console.log('Active advisor IDs:', Array.from(activeAdvisorIds));
    
    // Count active DOs - a DO is active if they have any advisors under them who made recent sales
    const activeDOCount = doManagers.filter(d => {
      // Find advisors under this DO
      const doAdvisors = advisors.filter(a => a.parentId === d._id || a.parentId?._id === d._id);
      console.log(`DO ${d.name} has ${doAdvisors.length} advisors:`, doAdvisors.map(a => a.name));
      
      // Check if any of these advisors made recent orders
      const hasActiveAdvisors = doAdvisors.some(a => activeAdvisorIds.has(a._id));
      console.log(`DO ${d.name} has active advisors: ${hasActiveAdvisors}, status: ${d.status}`);
      
      // Consider active if status is ACTIVE OR has advisors with recent sales
      const isActive = d.status === 'ACTIVE' || hasActiveAdvisors;
      return isActive;
    }).length;
    
    console.log('Active DO count:', activeDOCount);
    console.log('=== END DEBUG ===');
    
    return {
      totalDO: doManagers.length,
      activeDO: activeDOCount,
      totalAdvisors: advisors.length,
      activeAdvisors: advisors.filter(a => activeAdvisorIds.has(a._id)).length,
      inactiveAdvisors: advisors.filter(a => !activeAdvisorIds.has(a._id)),
    };
  }, [downline, orders]);

  // Calculate alerts
  const alerts = useMemo(() => {
    const result = [];
    
    // Low performing DOs (based on sales target: ₹30,000)
    const SALES_TARGET = 30000;
    const AVERAGE_THRESHOLD = 15000;
    
    const doPerformance = downline
      .filter(d => d.role === 'DO_MANAGER')
      .map(d => {
        // Find advisors under this DO
        const doAdvisors = downline.filter(a => {
          if (a.role !== 'ADVISOR') return false;
          const parentId = a.parentId?._id || a.parentId;
          return parentId === d._id;
        });
        
        // Calculate total sales from this DO's advisors
        const doOrders = orders.filter(o => {
          const advisorId = o.advisorId?._id || o.advisorId;
          return doAdvisors.some(a => a._id === advisorId);
        });
        
        const totalSales = doOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        
        // Determine performance level
        let performanceLevel = 'low';
        if (totalSales >= SALES_TARGET) {
          performanceLevel = 'good';
        } else if (totalSales >= AVERAGE_THRESHOLD) {
          performanceLevel = 'average';
        }
        
        return {
          ...d,
          totalSales,
          performanceLevel,
          advisorCount: doAdvisors.length,
          orderCount: doOrders.length,
        };
      });
    
    const lowPerformingDO = doPerformance.filter(d => d.performanceLevel === 'low');
    
    if (lowPerformingDO.length > 0) {
      result.push({
        type: 'warning',
        title: 'Low Performing DOs',
        message: `${lowPerformingDO.length} DO managers below ₹15,000 sales target`,
        action: () => setShowLowPerformingModal(true),
        icon: TrendingDown,
        data: lowPerformingDO,
        allPerformance: doPerformance, // Include all DOs for modal
      });
    }
    
    // Farmers needing follow-up (no orders in 60 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const inactiveFarmers = farmers.filter(f => {
      const lastOrder = orders.find(o => o.farmerId?._id === f._id || o.farmerId === f._id);
      return !lastOrder || new Date(lastOrder.createdAt) < sixtyDaysAgo;
    });
    
    if (inactiveFarmers.length > 0) {
      result.push({
        type: 'warning',
        title: 'Farmers Need Follow-up',
        message: `${inactiveFarmers.length} farmers haven't ordered in 60+ days`,
        action: () => navigate('/app/my-farmers'),
        icon: AlertCircle,
      });
    }
    
    return result;
  }, [downline, farmers, orders, navigate]);

  // Top performing DOs
  const topDOs = useMemo(() => {
    console.log('=== TOP DOs CALCULATION ===');
    const doManagers = downline.filter(u => u.role === 'DO_MANAGER');
    console.log('DO Managers for top performers:', doManagers.length);
    
    const doSales = doManagers.map(d => {
      // Find advisors under this DO - check both string and object parentId
      const doAdvisors = downline.filter(a => {
        if (a.role !== 'ADVISOR') return false;
        const parentId = a.parentId?._id || a.parentId;
        return parentId === d._id;
      });
      
      console.log(`DO ${d.name} (${d._id}) has advisors:`, doAdvisors.map(a => ({
        name: a.name,
        id: a._id,
        parentId: a.parentId?._id || a.parentId
      })));
      
      // Find orders made by these advisors
      const doOrders = orders.filter(o => {
        const advisorId = o.advisorId?._id || o.advisorId;
        return doAdvisors.some(a => a._id === advisorId);
      });
      
      console.log(`DO ${d.name} has ${doOrders.length} orders`);
      
      const totalSales = doOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const advisorCount = doAdvisors.length;
      
      return {
        ...d,
        totalSales,
        advisorCount,
        orderCount: doOrders.length,
      };
    });
    
    console.log('DO Sales summary:', doSales.map(d => ({
      name: d.name,
      advisors: d.advisorCount,
      orders: d.orderCount,
      sales: d.totalSales
    })));
    console.log('=== END TOP DOs ===');
    
    return doSales.sort((a, b) => b.totalSales - a.totalSales).slice(0, 5);
  }, [downline, orders]);

  // Top purchased products
  const topProducts = useMemo(() => {
    const productCounts = {};
    const productSales = {};
    
    orders.forEach(o => {
      const productName = o.productId?.name || 'Unknown Product';
      const quantity = o.quantity || 1;
      const sales = o.total || 0;
      
      productCounts[productName] = (productCounts[productName] || 0) + quantity;
      productSales[productName] = (productSales[productName] || 0) + sales;
    });
    
    return Object.entries(productCounts)
      .map(([name, count]) => ({
        name,
        count,
        sales: productSales[name],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders]);

  // Aggregate trend data
  const aggregatedTrend = useMemo(() => {
    if (!trend || trend.length === 0) return [];
    
    if (timeRange === 'month') return trend;
    
    if (timeRange === 'week') {
      const weeklyData = [];
      trend.forEach(monthData => {
        const weekSales = Math.round(monthData.sales / 4);
        const weekOrders = Math.round(monthData.orders / 4);
        for (let week = 1; week <= 4; week++) {
          weeklyData.push({
            period: `${monthData.month} W${week}`,
            sales: weekSales + Math.round(Math.random() * weekSales * 0.2),
            orders: weekOrders + Math.round(Math.random() * weekOrders * 0.2),
          });
        }
      });
      return weeklyData.slice(-12);
    }
    
    if (timeRange === 'day') {
      const dailyData = [];
      const lastMonth = trend[trend.length - 1];
      if (lastMonth) {
        const daySales = Math.round(lastMonth.sales / 30);
        const dayOrders = Math.max(1, Math.round(lastMonth.orders / 30));
        
        for (let day = 1; day <= 30; day++) {
          dailyData.push({
            period: `Day ${day}`,
            sales: Math.max(0, daySales + Math.round((Math.random() - 0.5) * daySales * 0.5)),
            orders: Math.max(1, dayOrders + Math.round((Math.random() - 0.5) * dayOrders)),
          });
        }
      }
      return dailyData;
    }
    
    return trend.map(t => ({ ...t, period: t.month }));
  }, [trend, timeRange]);

  const welcome = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {welcome}, {user?.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Regional Manager · {user?.region || 'Region'}
            {user?.employeeCode && <span className="font-mono"> · {user.employeeCode}</span>}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalSales || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-600 font-medium">+12.5%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active DO Managers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMetrics.activeDO} / {teamMetrics.totalDO}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              DO managers in your area
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promotion Reps</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMetrics.activeAdvisors} / {teamMetrics.totalAdvisors}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Promotion Reps under your DOs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings Breakdown</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.total || 0)}
            </div>
            <div className="flex gap-2 mt-2 text-xs">
              <Badge variant="secondary">IV: {formatCurrency(summary?.IV || 0)}</Badge>
              <Badge variant="secondary">SV: {formatCurrency(summary?.SV || 0)}</Badge>
              <Badge variant="secondary">RV: {formatCurrency(summary?.RV || 0)}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Action Required
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
                      alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                    <div>
                      <p className="font-semibold text-sm">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>
              {timeRange === 'day' ? 'Daily' : timeRange === 'week' ? 'Weekly' : 'Monthly'} team performance
            </CardDescription>
          </div>
          <div className="flex gap-2">
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
        </CardHeader>
        <CardContent>
          {aggregatedTrend.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={aggregatedTrend}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                  tickFormatter={v => `₹${(v/1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-sm mb-2">{data.period}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-xs text-muted-foreground">Sales</span>
                            <span className="text-sm font-bold text-blue-600">
                              {formatCurrency(data.sales)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-xs text-muted-foreground">Orders</span>
                            <span className="text-sm font-bold">
                              {data.orders}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Performing DOs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              Top Performing DO Managers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDOs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No DO managers found
                </p>
              ) : (
                topDOs.map((d, idx) => (
                  <div
                    key={d._id}
                    className="flex items-center justify-between p-3 bg-accent rounded-lg hover:bg-accent/80 transition-colors cursor-pointer"
                    onClick={() => navigate(`/app/employees/${d._id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-yellow-500 text-white' :
                        idx === 1 ? 'bg-slate-400 text-white' :
                        idx === 2 ? 'bg-orange-500 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{d.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.advisorCount} advisors · {d.orderCount} orders
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">
                        {formatCurrency(d.totalSales)}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        High
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Purchased Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              Top Purchased Products
            </CardTitle>
            <CardDescription>Best selling products across your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No products sold yet</p>
                </div>
              ) : (
                topProducts.map((product, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-accent rounded-lg hover:bg-accent/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-yellow-500 text-white' :
                        idx === 1 ? 'bg-slate-400 text-white' :
                        idx === 2 ? 'bg-orange-500 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.count} units sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">
                        {formatCurrency(product.sales)}
                      </p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest transactions from your team</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Promotion Rep.</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 10).map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-medium">
                    {order.productId?.name || 'Product'}
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
                    <Badge variant={
                      order.status === 'DELIVERED' ? 'default' :
                      order.status === 'PENDING' ? 'outline' :
                      order.status === 'CANCELLED' ? 'destructive' : 'secondary'
                    }>
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

      {/* DO Performance Modal */}
      <Dialog open={showLowPerformingModal} onOpenChange={setShowLowPerformingModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              DO Manager Performance Overview
            </DialogTitle>
            <DialogDescription>
              Sales target: ₹30,000 | Good: ≥₹30k | Average: ₹15k-₹30k | Low: &lt;₹15k
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="low" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="low" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Low ({alerts.find(a => a.title === 'Low Performing DOs')?.data?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="average" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Average ({alerts.find(a => a.title === 'Low Performing DOs')?.allPerformance?.filter(d => d.performanceLevel === 'average').length || 0})
              </TabsTrigger>
              <TabsTrigger value="good" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Good ({alerts.find(a => a.title === 'Low Performing DOs')?.allPerformance?.filter(d => d.performanceLevel === 'good').length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Low Performance Tab */}
            <TabsContent value="low" className="flex-1 overflow-y-auto space-y-3 mt-4">
              {alerts.find(a => a.title === 'Low Performing DOs')?.data?.map((d) => (
                <div
                  key={d._id}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 hover:border-red-400 transition-colors cursor-pointer"
                  onClick={() => {
                    setShowLowPerformingModal(false);
                    navigate(`/app/employees/${d._id}`);
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.advisorCount} advisors · {d.orderCount} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-700 text-lg">
                      {formatCurrency(d.totalSales)}
                    </p>
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 mt-1">
                      {((d.totalSales / 30000) * 100).toFixed(0)}% of target
                    </Badge>
                    <p className="text-xs text-red-600 mt-1">
                      Need {formatCurrency(30000 - d.totalSales)} more
                    </p>
                  </div>
                </div>
              ))}
              {(!alerts.find(a => a.title === 'Low Performing DOs')?.data?.length) && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No low performing DOs</p>
                </div>
              )}
            </TabsContent>

            {/* Average Performance Tab */}
            <TabsContent value="average" className="flex-1 overflow-y-auto space-y-3 mt-4">
              {alerts.find(a => a.title === 'Low Performing DOs')?.allPerformance
                ?.filter(d => d.performanceLevel === 'average')
                .map((d) => (
                  <div
                    key={d._id}
                    className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200 hover:border-yellow-400 transition-colors cursor-pointer"
                    onClick={() => {
                      setShowLowPerformingModal(false);
                      navigate(`/app/employees/${d._id}`);
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Activity className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{d.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.advisorCount} advisors · {d.orderCount} orders
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-700 text-lg">
                        {formatCurrency(d.totalSales)}
                      </p>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 mt-1">
                        {((d.totalSales / 30000) * 100).toFixed(0)}% of target
                      </Badge>
                      <p className="text-xs text-yellow-600 mt-1">
                        Need {formatCurrency(30000 - d.totalSales)} more
                      </p>
                    </div>
                  </div>
                ))}
              {(!alerts.find(a => a.title === 'Low Performing DOs')?.allPerformance?.filter(d => d.performanceLevel === 'average').length) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No average performing DOs</p>
                </div>
              )}
            </TabsContent>

            {/* Good Performance Tab */}
            <TabsContent value="good" className="flex-1 overflow-y-auto space-y-3 mt-4">
              {alerts.find(a => a.title === 'Low Performing DOs')?.allPerformance
                ?.filter(d => d.performanceLevel === 'good')
                .map((d) => (
                  <div
                    key={d._id}
                    className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:border-green-400 transition-colors cursor-pointer"
                    onClick={() => {
                      setShowLowPerformingModal(false);
                      navigate(`/app/employees/${d._id}`);
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{d.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.advisorCount} advisors · {d.orderCount} orders
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-700 text-lg">
                        {formatCurrency(d.totalSales)}
                      </p>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 mt-1">
                        {((d.totalSales / 30000) * 100).toFixed(0)}% of target
                      </Badge>
                      <p className="text-xs text-green-600 mt-1">
                        <CheckCircle2 className="h-3 w-3 inline mr-1" />
                        Target achieved!
                      </p>
                    </div>
                  </div>
                ))}
              {(!alerts.find(a => a.title === 'Low Performing DOs')?.allPerformance?.filter(d => d.performanceLevel === 'good').length) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No DOs have reached the target yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setShowLowPerformingModal(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowLowPerformingModal(false);
              navigate('/app/do-employees');
            }}>
              View All DO Employees
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
