import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi }    from '../api/orders.api';
import { inventoryApi } from '../api/inventory.api';
import { useAuth, ROLE_LABELS } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge }     from '@/components/ui/badge';
import { Button }    from '@/components/ui/button';
import { Skeleton }  from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress }  from '@/components/ui/progress';
import {
  TrendingUp, TrendingDown, ShoppingCart, Package,
  AlertTriangle, Clock, CheckCircle2, Truck, XCircle,
  ArrowUpRight, ArrowDownRight, Store, ShoppingBag,
  Activity, BarChart2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatCurrency, calculateWholesaleKPIs, getOrderStatusBreakdown } from '../utils/helpers';

/* ── Status config ────────────────────────────────────────── */
const STATUS_CFG = {
  DELIVERED: { variant:'default',     icon:CheckCircle2, color:'text-primary'      },
  APPROVED:  { variant:'secondary',   icon:CheckCircle2, color:'text-blue-600'     },
  SHIPPED:   { variant:'secondary',   icon:Truck,        color:'text-purple-600'   },
  PENDING:   { variant:'outline',     icon:Clock,        color:'text-amber-600'    },
  CANCELLED: { variant:'destructive', icon:XCircle,      color:'text-destructive'  },
};

const STATUS_BAR = {
  PENDING:   { label:'Pending',   bg:'bg-amber-500'  },
  APPROVED:  { label:'Approved',  bg:'bg-blue-500'   },
  SHIPPED:   { label:'Shipped',   bg:'bg-purple-500' },
  DELIVERED: { label:'Delivered', bg:'bg-primary'    },
  CANCELLED: { label:'Cancelled', bg:'bg-destructive'},
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : '—';
const welcome  = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

/* ── Stat Card ────────────────────────────────────────────── */
function StatCard({ label, value, format, icon: Icon, bg, iconColor, isBad }) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon size={16} className="text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {format === 'currency' ? `₹${Number(value || 0).toLocaleString('en-IN')}` : (value || 0)}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${isBad ? 'text-destructive' : 'text-primary'}`}>
          {isBad ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
          {format === 'currency' ? 'lifetime total' : 'total count'}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Loading ──────────────────────────────────────────────── */
function WholesaleSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-7">
        <Skeleton className="col-span-4 h-80 rounded-xl" />
        <Skeleton className="col-span-3 h-80 rounded-xl" />
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────── */
export default function WholesaleDashboard() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [orders,    setOrders]    = useState([]);
  const [inventory, setInventory] = useState({});
  const [loading,   setLoading]   = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // 'day', 'month'

  useEffect(() => {
    const ctrl = new AbortController();
    
    const fetchOrders = async () => {
      try {
        let salesRes, purchasesRes, invRes;
        
        if (user?.role === 'MINI_STOCK') {
          // For Mini Stock: getMiniOrders now returns ALL orders (both purchases and POS sales)
          [salesRes, invRes] = await Promise.all([
            ordersApi.getMiniOrders({ signal: ctrl.signal }),
            inventoryApi.getMy({ signal: ctrl.signal }),
          ]);
          
          console.log('Mini Stock Orders:', salesRes.data.data);
          setOrders(salesRes.data.data || []);
        } else {
          // For Wholesale: fetch sales and purchases separately
          [salesRes, purchasesRes, invRes] = await Promise.all([
            ordersApi.getWholesaleOrders({ signal: ctrl.signal }),
            ordersApi.getMyPurchases({ signal: ctrl.signal }),
            inventoryApi.getMy({ signal: ctrl.signal }),
          ]);
          
          setOrders([...(salesRes.data.data || []), ...(purchasesRes.data.data || [])]);
        }
        
        console.log('User ID:', user._id);
        console.log('User Role:', user?.role);
        setInventory(invRes.data.data || {});
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
    return () => ctrl.abort();
  }, [user?.role, user?._id]);

  if (loading) return <WholesaleSkeleton />;

  const kpis            = calculateWholesaleKPIs(orders, inventory, user._id);
  const statusBreakdown = getOrderStatusBreakdown(orders);
  const total           = Object.values(statusBreakdown).reduce((s, c) => s + c, 0);
  const inventoryItems  = inventory?.items || [];
  const lowStock        = inventoryItems.filter(i => i.current < 10 && i.current > 0);

  /* Chart — last 6 months for monthly view */
  const monthlyChartData = Array.from({ length: 6 }, (_, i) => {
    const now  = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key  = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
    const m    = orders.filter(o => {
      const d = new Date(o.createdAt);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` === key && o.status !== 'CANCELLED';
    });
    
    // For Mini Stock: POS sales (source='POS') are sales, others where they're buyer are purchases
    // For Wholesale: where they're seller are sales, where they're buyer are purchases
    const purchases = m.filter(o => {
      const isBuyer = o.buyerId?._id === user._id || o.buyerId === user._id;
      const isPOS = o.source === 'POS';
      // If it's a POS sale, don't count it as purchase
      return isBuyer && !isPOS;
    }).reduce((s,o) => s+o.total, 0);
    
    const sales = m.filter(o => {
      const isSeller = o.sellerId?._id === user._id || o.sellerId === user._id;
      const isPOS = o.source === 'POS';
      // Count as sale if they're seller OR if it's a POS sale
      return isSeller || isPOS;
    }).reduce((s,o) => s+o.total, 0);
    
    return {
      month:     date.toLocaleDateString('en-IN', { month:'short', year:'numeric' }),
      purchases,
      sales,
    };
  });
  
  console.log('Monthly Chart Data:', monthlyChartData);
  console.log('Total orders for chart:', orders.length);
  console.log('Sample order structure:', orders[0]);

  /* Chart — last 12 weeks for weekly view */
  const weeklyChartData = Array.from({ length: 12 }, (_, i) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (11 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const m = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= weekStart && d <= weekEnd && o.status !== 'CANCELLED';
    });
    
    const purchases = m.filter(o => {
      const isBuyer = o.buyerId?._id === user._id || o.buyerId === user._id;
      const isPOS = o.source === 'POS';
      return isBuyer && !isPOS;
    }).reduce((s,o) => s+o.total, 0);
    
    const sales = m.filter(o => {
      const isSeller = o.sellerId?._id === user._id || o.sellerId === user._id;
      const isPOS = o.source === 'POS';
      return isSeller || isPOS;
    }).reduce((s,o) => s+o.total, 0);
    
    return {
      month: `Week ${i + 1}`,
      purchases,
      sales,
    };
  });

  /* Chart — last 30 days for daily view */
  const dailyChartData = Array.from({ length: 30 }, (_, i) => {
    const now = new Date();
    const date = new Date(now);
    date.setDate(now.getDate() - (29 - i));
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    
    const m = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= date && d < nextDay && o.status !== 'CANCELLED';
    });
    
    const purchases = m.filter(o => {
      const isBuyer = o.buyerId?._id === user._id || o.buyerId === user._id;
      const isPOS = o.source === 'POS';
      return isBuyer && !isPOS;
    }).reduce((s,o) => s+o.total, 0);
    
    const sales = m.filter(o => {
      const isSeller = o.sellerId?._id === user._id || o.sellerId === user._id;
      const isPOS = o.source === 'POS';
      return isSeller || isPOS;
    }).reduce((s,o) => s+o.total, 0);
    
    return {
      month: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      purchases,
      sales,
    };
  });

  // Select chart data based on time range
  const chartData = timeRange === 'day' ? dailyChartData : monthlyChartData;
  
  console.log('=== CHART DEBUG ===');
  console.log('Time Range:', timeRange);
  console.log('Chart Data:', chartData);
  console.log('Has data?', chartData.some(d => d.purchases > 0 || d.sales > 0));
  console.log('Total Orders:', orders.length);
  console.log('Orders:', orders);

  const statCards = [
    { label:'Total Purchases', value:kpis.totalPurchaseValue, format:'currency', icon:TrendingDown,  bg:'bg-red-50',     iconColor:'text-destructive', isBad:true  },
    { label:'Total Sales',     value:kpis.totalSalesValue,    format:'currency', icon:TrendingUp,    bg:'bg-primary/10', iconColor:'text-primary',     isBad:false },
    { label:'Total Orders',    value:kpis.totalOrders,        format:'number',   icon:ShoppingCart,  bg:'bg-blue-50',    iconColor:'text-blue-600',    isBad:false },
    { label:'Pending Orders',  value:kpis.pendingOrders,      format:'number',   icon:Clock,         bg:'bg-amber-50',   iconColor:'text-amber-600',   isBad:true  },
    { label:'Delivered',       value:kpis.deliveredOrders,    format:'number',   icon:CheckCircle2,  bg:'bg-primary/10', iconColor:'text-primary',     isBad:false },
    { label:'Stock Items',     value:kpis.totalStockItems,    format:'number',   icon:Package,       bg:'bg-purple-50',  iconColor:'text-purple-600',  isBad:false },
    { label:'Low Stock Alerts',value:kpis.lowStockAlerts,     format:'number',   icon:AlertTriangle, bg:'bg-orange-50',  iconColor:'text-orange-600',  isBad:true  },
  ];

  const quickLinks = [
    { label:'Products',  icon:Package,      path:'/app/products'   },
    { label:'Inventory', icon:Store,        path:'/app/inventory'  },
    { label:'Cart',      icon:ShoppingBag,  path:'/app/cart'       },
    { label:'Orders',    icon:ShoppingCart, path:'/app/orders'     },
  ];

  return (
    <div className="space-y-6">

      {/* ── Greeting ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{welcome()}, {user?.name}</h1>
          <p className="text-muted-foreground mt-1">
            {ROLE_LABELS[user?.role]}{user?.region ? ` · ${user.region}` : ''}
            {user?.employeeCode && <span className="font-mono"> · {user.employeeCode}</span>}
          </p>
        </div>
      </div>

      {/* ── Quick Nav ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickLinks.map(l => (
          <Button key={l.path} variant="outline" className="justify-start gap-2 h-10" onClick={() => navigate(l.path)}>
            <l.icon size={15} className="text-muted-foreground" /> {l.label}
          </Button>
        ))}
      </div>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.slice(0, 4).map(s => <StatCard key={s.label} {...s} />)}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.slice(4).map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ──────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-7">

            {/* Orders Over Time chart */}
            <Card className="lg:col-span-4">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Orders Over Time</CardTitle>
                    <CardDescription>Purchase vs sales volume</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={timeRange === 'day' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setTimeRange('day')}
                    >
                      Day
                    </Button>
                    <Button
                      variant={timeRange === 'month' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setTimeRange('month')}
                    >
                      Month
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {chartData.some(d => d.purchases > 0 || d.sales > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData} margin={{ top:4, right:4, left:0, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize:11 }} />
                      <YAxis tick={{ fontSize:11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={v => [formatCurrency(v)]}
                        contentStyle={{ borderRadius:'10px', border:'1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="purchases" stroke="#ef4444" strokeWidth={3} name="Purchases" dot={{ r:3 }} />
                      <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} name="Sales" dot={{ r:3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                    No order data available yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Status breakdown */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Order Status</CardTitle>
                <CardDescription>Breakdown of all your orders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {total === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
                ) : (
                  Object.entries(STATUS_BAR).map(([status, { label, bg }]) => {
                    const count = statusBreakdown[status] || 0;
                    const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                    const Cfg   = STATUS_CFG[status];
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Cfg.icon size={13} className={Cfg.color} />
                            <span className="text-sm font-medium">{label}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold">{count}</span>
                            <span className="text-xs text-muted-foreground ml-1">({pct}%)</span>
                          </div>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Your latest 6 orders</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
              ) : (
                orders.slice(0, 6).map((order, idx) => {
                  const isPurchase = order.buyerId?._id === user._id || order.buyerId === user._id;
                  const Cfg = STATUS_CFG[order.status] || STATUS_CFG.PENDING;
                  return (
                    <div key={order._id}>
                      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors">
                        <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Cfg.icon size={14} className={Cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{order.productId?.name || 'Order'}</p>
                          <p className="text-xs text-muted-foreground">
                            {fmtDate(order.createdAt)} ·{' '}
                            <span className={isPurchase ? 'text-destructive' : 'text-primary'}>
                              {isPurchase ? 'Purchase' : 'Sale'}
                            </span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-primary">{formatCurrency(order.total)}</p>
                          <Badge variant={Cfg.variant} className="text-[10px] h-4 px-1.5 mt-0.5">{order.status}</Badge>
                        </div>
                      </div>
                      {idx < 5 && <Separator className="mx-4" />}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Orders Tab ────────────────────────────────────── */}
        <TabsContent value="orders">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">All Orders</CardTitle>
              <CardDescription>Combined purchase and sales history</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No orders found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Type</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.slice(0, 20).map(order => {
                      const isPurchase = order.buyerId?._id === user._id || order.buyerId === user._id;
                      const Cfg = STATUS_CFG[order.status] || STATUS_CFG.PENDING;
                      return (
                        <TableRow key={order._id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {order.orderNumber || `#${order._id?.slice(-8)}`}
                          </TableCell>
                          <TableCell className="font-medium text-sm">{order.productId?.name || '—'}</TableCell>
                          <TableCell className="text-center">{order.quantity}</TableCell>
                          <TableCell className="text-right font-bold text-primary">{formatCurrency(order.total)}</TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPurchase ? 'text-destructive' : 'text-primary'}`}>
                              {isPurchase ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                              {isPurchase ? 'Purchase' : 'Sale'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={Cfg.variant}>{order.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{fmtDate(order.createdAt)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Inventory Tab ─────────────────────────────────── */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">

            {/* Stock List */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package size={15} className="text-blue-600" /> Stock Items
                </CardTitle>
                <CardDescription>Top items by quantity</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pb-2">
                {inventoryItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No inventory</p>
                ) : (
                  [...inventoryItems]
                    .sort((a, b) => b.current - a.current)
                    .slice(0, 8)
                    .map((item, idx) => (
                      <div key={item._id || idx}>
                        <div className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground/50 w-5">#{idx+1}</span>
                            <span className="text-sm font-medium truncate max-w-[180px]">{item.productId?.name || 'Unknown'}</span>
                          </div>
                          <span className="text-sm font-bold text-primary">{item.current} units</span>
                        </div>
                        {idx < 7 && <Separator className="mx-4" />}
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            {/* Low Stock */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-500" /> Low Stock Alerts
                </CardTitle>
                <CardDescription>Items below 10 units</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pb-2">
                {lowStock.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">All stock levels healthy ✓</p>
                ) : (
                  lowStock.map((item, idx) => (
                    <div key={item._id || idx}>
                      <div className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors">
                        <span className="text-sm font-medium truncate max-w-[200px]">{item.productId?.name || 'Unknown'}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Progress value={(item.current / 10) * 100} className="w-16 h-1.5" />
                          <span className="text-sm font-bold text-amber-600 w-16 text-right">{item.current} left</span>
                        </div>
                      </div>
                      {idx < lowStock.length - 1 && <Separator className="mx-4" />}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => navigate('/app/inventory')}>
              <Package size={14} className="mr-1.5" /> View Full Inventory
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
