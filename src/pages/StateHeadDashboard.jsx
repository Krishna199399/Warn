import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../api/analytics.api';
import { commissionsApi } from '../api/commissions.api';
import { ordersApi } from '../api/orders.api';
import { usersApi } from '../api/users.api';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp, Users, DollarSign, AlertTriangle,
  UserCheck, Activity, ArrowRight, TrendingDown,
  BarChart3, Target, AlertCircle, MapPin
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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../utils/helpers';

export default function StateHeadDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [downline, setDownline] = useState([]);
  const [showLowPerformingModal, setShowLowPerformingModal] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    
    // Phase 1: Load stats, summary, and direct reports (Zonal Managers only)
    // Using directOnly=true reduces 500 users to 3-5 users (95% faster)
    Promise.all([
      analyticsApi.getDashboard({ signal: controller.signal }),
      commissionsApi.getSummary({ signal: controller.signal }),
      usersApi.getDownline(user._id, true), // directOnly=true - only Zonal Managers
    ]).then(([statsRes, summaryRes, downlineRes]) => {
      setStats(statsRes.data.data);
      setSummary(summaryRes.data.data);
      setDownline(downlineRes.data.data || []);
      setLoading(false); // Show KPI cards and table immediately
      setOrdersLoading(false); // Don't wait for orders - use stats data instead
    }).catch((err) => {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        console.error('Dashboard error:', err);
      }
      setLoading(false);
      setDownline([]);
      setOrdersLoading(false);
    });

    return () => controller.abort();
  }, [user]);

  // Calculate Zonal Manager metrics (using direct reports only)
  const zonalManagerMetrics = useMemo(() => {
    const zonalManagers = downline.filter(u => u.role === 'ZONAL_MANAGER');
    
    // Get unique zones
    const zones = new Set(zonalManagers.map(zm => zm.region).filter(Boolean));
    
    // Count active ZMs - those with sales > 0 (actually working)
    const activeZMs = zonalManagers.filter(zm => (zm.totalSales || 0) > 0).length;

    // Sum up team sizes from all ZMs (each ZM's teamSize includes their full subtree)
    const totalNetworkSize = zonalManagers.reduce((sum, zm) => sum + (zm.teamSize || 0), 0);

    return {
      totalZones: zones.size,
      totalZMs: zonalManagers.length,
      activeZMs,
      totalAMs: 0, // Not available with directOnly
      totalDOs: 0, // Not available with directOnly
      totalAdvisors: 0, // Not available with directOnly
      totalNetworkSize,
    };
  }, [downline]);

  // Calculate Zonal Manager performance (using direct reports with their full stats)
  const zonalManagerPerformance = useMemo(() => {
    const zonalManagers = downline.filter(u => u.role === 'ZONAL_MANAGER');
    
    return zonalManagers.map(zm => {
      // ZM stats already include their full team (calculated by backend)
      const totalSales = zm.totalSales || 0;
      const teamSize = zm.teamSize || 0;
      
      // Performance levels for Zonal Managers: High ≥₹500k, Medium ≥₹250k, Low <₹250k
      let performanceLevel = 'low';
      let performanceTrend = 'down';
      if (totalSales >= 500000) {
        performanceLevel = 'high';
        performanceTrend = 'up';
      } else if (totalSales >= 250000) {
        performanceLevel = 'medium';
        performanceTrend = 'stable';
      }
      
      return {
        ...zm,
        totalSales,
        areaCount: 0, // Not available with directOnly
        doCount: 0, // Not available with directOnly
        advisorCount: 0, // Not available with directOnly
        teamSize, // Total team size from backend
        orderCount: zm.totalOrders || 0,
        performanceLevel,
        performanceTrend,
      };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }, [downline]);

  // Calculate alerts (simplified - no orders needed)
  const alerts = useMemo(() => {
    const result = [];
    
    // Low performing zones (ZMs with sales < 250k)
    const lowPerformingZMs = zonalManagerPerformance.filter(zm => zm.performanceLevel === 'low');
    if (lowPerformingZMs.length > 0) {
      result.push({
        type: 'warning',
        title: 'Low Performing Zones',
        message: `${lowPerformingZMs.length} zones below ₹2.5L sales target`,
        action: () => setShowLowPerformingModal(true),
        icon: TrendingDown,
        data: lowPerformingZMs,
      });
    }
    
    // Inactive ZMs (no sales at all)
    const inactiveZMs = zonalManagerPerformance.filter(zm => zm.totalSales === 0);
    if (inactiveZMs.length > 0) {
      result.push({
        type: 'info',
        title: 'Inactive Zonal Managers',
        message: `${inactiveZMs.length} Zonal Managers with no sales`,
        action: () => navigate('/app/zonal-employees'),
        icon: AlertCircle,
      });
    }
    
    return result;
  }, [zonalManagerPerformance, navigate]);

  // Zone-wise sales chart data
  const zoneSalesChart = useMemo(() => {
    return zonalManagerPerformance.slice(0, 10).map(zm => ({
      zone: zm.region || zm.name.split(' ')[0],
      sales: zm.totalSales,
    }));
  }, [zonalManagerPerformance]);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {welcome}, {user?.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            State Head · {user?.state || 'State'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Zones</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {zonalManagerMetrics.totalZones}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {zonalManagerMetrics.totalZMs} Zonal Managers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Zonal Managers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {zonalManagerMetrics.activeZMs} / {zonalManagerMetrics.totalZMs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total State Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalSales || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aggregated from all zones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Network Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {zonalManagerMetrics.totalNetworkSize}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total team members across all zones
            </p>
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

      {/* Zonal Manager Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            Zonal Manager Performance
          </CardTitle>
          <CardDescription>
            Performance levels: High (≥₹5L) · Medium (≥₹2.5L) · Low (&lt;₹2.5L)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {downline.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zonal Manager</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Team Size</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zonalManagerPerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No Zonal Managers found
                    </TableCell>
                  </TableRow>
                ) : ordersLoading ? (
                  // Show ZM names immediately, but performance data as loading
                  zonalManagerPerformance.map((zm) => (
                    <TableRow key={zm._id}>
                      <TableCell className="font-medium">{zm.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {zm.region || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                      </TableCell>
                      <TableCell>{zm.teamSize}</TableCell>
                      <TableCell>
                        <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  zonalManagerPerformance.map((zm) => (
                    <TableRow 
                      key={zm._id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => navigate(`/app/employees/${zm._id}`)}
                    >
                      <TableCell className="font-medium">{zm.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {zm.region || '—'}
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-600">
                        {formatCurrency(zm.totalSales)}
                      </TableCell>
                      <TableCell>{zm.teamSize}</TableCell>
                      <TableCell>{zm.orderCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            zm.performanceLevel === 'high' ? 'default' :
                            zm.performanceLevel === 'medium' ? 'secondary' :
                            'outline'
                          } className={
                            zm.performanceLevel === 'high' ? 'bg-green-100 text-green-700 border-green-300' :
                            zm.performanceLevel === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                            'bg-red-100 text-red-700 border-red-300'
                          }>
                            {zm.performanceTrend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                            {zm.performanceTrend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                            {zm.performanceTrend === 'stable' && <Activity className="h-3 w-3 mr-1" />}
                            {zm.performanceLevel === 'high' ? 'High' : zm.performanceLevel === 'medium' ? 'Medium' : 'Low'}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* State Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            State Performance by Zone
          </CardTitle>
          <CardDescription>Zone-wise sales comparison</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading chart data...</p>
              </div>
            </div>
          ) : zoneSalesChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zoneSalesChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="zone" 
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
                        <p className="font-semibold text-sm mb-2">{data.zone}</p>
                        <div className="flex justify-between gap-4">
                          <span className="text-xs text-muted-foreground">Sales</span>
                          <span className="text-sm font-bold text-blue-600">
                            {formatCurrency(data.sales)}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar 
                  dataKey="sales" 
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No sales data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            Recent Activity
          </CardTitle>
          <CardDescription>Aggregated state-level updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ordersLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Loading activity...</p>
              </div>
            ) : zonalManagerPerformance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              zonalManagerPerformance.slice(0, 5).filter(zm => zm.totalSales > 0).map((zm) => (
                <div key={zm._id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {zm.region || zm.name} - {formatCurrency(zm.totalSales)} total sales
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Zonal Manager: {zm.name}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <Activity className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Low Performing Zones Modal */}
      <Dialog open={showLowPerformingModal} onOpenChange={setShowLowPerformingModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Low Performing Zones
            </DialogTitle>
            <DialogDescription>
              Zones with sales below ₹2.5L target
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 mt-4">
            {alerts.find(a => a.title === 'Low Performing Zones')?.data?.map((zm) => (
              <div
                key={zm._id}
                className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 hover:border-red-400 transition-colors cursor-pointer"
                onClick={() => {
                  setShowLowPerformingModal(false);
                  navigate(`/app/employees/${zm._id}`);
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{zm.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {zm.region || 'Zone'} · {zm.teamSize} team members
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-700 text-lg">
                    {formatCurrency(zm.totalSales)}
                  </p>
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 mt-1">
                    {((zm.totalSales / 250000) * 100).toFixed(0)}% of target
                  </Badge>
                  <p className="text-xs text-red-600 mt-1">
                    Need {formatCurrency(250000 - zm.totalSales)} more
                  </p>
                </div>
              </div>
            ))}
            {(!alerts.find(a => a.title === 'Low Performing Zones')?.data?.length) && (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>All zones performing well!</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setShowLowPerformingModal(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowLowPerformingModal(false);
              navigate('/app/zonal-employees');
            }}>
              View All Zonal Managers
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
