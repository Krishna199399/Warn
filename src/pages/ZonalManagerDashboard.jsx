import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../api/analytics.api';
import { commissionsApi } from '../api/commissions.api';
import { ordersApi } from '../api/orders.api';
import { usersApi } from '../api/users.api';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp, Users, ShoppingCart, DollarSign, AlertTriangle,
  UserCheck, Activity, Award, ArrowRight, TrendingDown,
  BarChart3, Target, AlertCircle, CheckCircle2
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

export default function ZonalManagerDashboard() {
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
    
    // Phase 1: Load critical data first (fastest APIs)
    Promise.all([
      analyticsApi.getDashboard({ signal: controller.signal }),
      commissionsApi.getSummary({ signal: controller.signal }),
    ]).then(([statsRes, summaryRes]) => {
      setStats(statsRes.data.data);
      setSummary(summaryRes.data.data);
      setLoading(false); // Show dashboard immediately with stats
      
      // Phase 2: Load downline data (slower)
      usersApi.getDownline(user._id)
        .then(downlineRes => {
          setDownline(downlineRes.data.data || []);
          
          // Phase 3: Load orders last (slowest)
          ordersApi.getAll({ signal: controller.signal })
            .then(ordersRes => {
              setOrders(ordersRes.data.data || []);
              setOrdersLoading(false);
            })
            .catch(() => {
              setOrders([]);
              setOrdersLoading(false);
            });
        })
        .catch(() => setDownline([]));
    }).catch((err) => {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        console.error('Dashboard error:', err);
      }
      setLoading(false);
    });

    return () => controller.abort();
  }, [user]);

  // Calculate Area Manager metrics (optimized)
  const areaManagerMetrics = useMemo(() => {
    const areaManagers = downline.filter(u => u.role === 'AREA_MANAGER');
    const doManagers = downline.filter(u => u.role === 'DO_MANAGER');
    const advisors = downline.filter(u => u.role === 'ADVISOR');
    
    // Quick active check - only if we have orders loaded
    let activeAMs = areaManagers.length;
    if (orders.length > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentOrders = orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
      const activeAdvisorIds = new Set(recentOrders.map(o => o.advisorId?._id || o.advisorId).filter(Boolean));
      
      activeAMs = areaManagers.filter(am => {
        const amDOs = doManagers.filter(d => (d.parentId?._id || d.parentId) === am._id);
        const amAdvisors = advisors.filter(a => 
          amDOs.some(d => (a.parentId?._id || a.parentId) === d._id)
        );
        return amAdvisors.some(a => activeAdvisorIds.has(a._id)) || am.status === 'ACTIVE';
      }).length;
    }

    return {
      totalAMs: areaManagers.length,
      activeAMs,
      totalDOs: doManagers.length,
      totalAdvisors: advisors.length,
      totalNetworkSize: doManagers.length + advisors.length,
    };
  }, [downline, orders]);

  // Calculate Area Manager performance (optimized)
  const areaManagerPerformance = useMemo(() => {
    const areaManagers = downline.filter(u => u.role === 'AREA_MANAGER');
    
    // If no orders yet, return basic structure
    if (orders.length === 0) {
      return areaManagers.map(am => ({
        ...am,
        totalSales: 0,
        doCount: 0,
        advisorCount: 0,
        orderCount: 0,
        performanceLevel: 'low',
        performanceTrend: 'down',
      }));
    }
    
    const doManagers = downline.filter(u => u.role === 'DO_MANAGER');
    const advisors = downline.filter(u => u.role === 'ADVISOR');
    
    // Build lookup maps for faster access
    const dosByAM = new Map();
    const advisorsByDO = new Map();
    
    doManagers.forEach(d => {
      const parentId = d.parentId?._id || d.parentId;
      if (!dosByAM.has(parentId)) dosByAM.set(parentId, []);
      dosByAM.get(parentId).push(d);
    });
    
    advisors.forEach(a => {
      const parentId = a.parentId?._id || a.parentId;
      if (!advisorsByDO.has(parentId)) advisorsByDO.set(parentId, []);
      advisorsByDO.get(parentId).push(a);
    });
    
    return areaManagers.map(am => {
      const amDOs = dosByAM.get(am._id) || [];
      const amAdvisors = amDOs.flatMap(d => advisorsByDO.get(d._id) || []);
      const advisorIds = new Set(amAdvisors.map(a => a._id));
      
      const amOrders = orders.filter(o => {
        const advisorId = o.advisorId?._id || o.advisorId;
        return advisorIds.has(advisorId);
      });
      
      const totalSales = amOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      
      let performanceLevel = 'low';
      let performanceTrend = 'down';
      if (totalSales >= 100000) {
        performanceLevel = 'high';
        performanceTrend = 'up';
      } else if (totalSales >= 50000) {
        performanceLevel = 'medium';
        performanceTrend = 'stable';
      }
      
      return {
        ...am,
        totalSales,
        doCount: amDOs.length,
        advisorCount: amAdvisors.length,
        orderCount: amOrders.length,
        performanceLevel,
        performanceTrend,
      };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }, [downline, orders]);

  // Calculate alerts
  const alerts = useMemo(() => {
    const result = [];
    
    // Low performing AMs (sales < 50k)
    const lowPerformingAMs = areaManagerPerformance.filter(am => am.performanceLevel === 'low');
    if (lowPerformingAMs.length > 0) {
      result.push({
        type: 'warning',
        title: 'Low Performing Area Managers',
        message: `${lowPerformingAMs.length} Area Managers below ₹50,000 sales`,
        action: () => setShowLowPerformingModal(true),
        icon: TrendingDown,
        data: lowPerformingAMs,
      });
    }
    
    // Inactive AMs
    const inactiveAMs = areaManagerPerformance.filter(am => am.status !== 'ACTIVE' && am.totalSales === 0);
    if (inactiveAMs.length > 0) {
      result.push({
        type: 'info',
        title: 'Inactive Area Managers',
        message: `${inactiveAMs.length} Area Managers with no recent activity`,
        action: () => navigate('/app/area-employees'),
        icon: AlertCircle,
      });
    }
    
    return result;
  }, [areaManagerPerformance, navigate]);

  // Area-wise sales chart data (optimized - limit to top 10)
  const areaSalesChart = useMemo(() => {
    return areaManagerPerformance.slice(0, 10).map(am => ({
      area: am.region?.split('-').pop()?.trim() || am.name.split(' ')[0],
      sales: am.totalSales,
    }));
  }, [areaManagerPerformance]);

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
            Zonal Manager · {user?.state} · {user?.region}
            {user?.employeeCode && <span className="font-mono"> · {user.employeeCode}</span>}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Area Managers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {areaManagerMetrics.totalAMs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Area Managers in your zone
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Area Managers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {areaManagerMetrics.activeAMs} / {areaManagerMetrics.totalAMs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Zone Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalSales || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aggregated from all Area Managers
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
              {areaManagerMetrics.totalNetworkSize}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {areaManagerMetrics.totalDOs} DOs + {areaManagerMetrics.totalAdvisors} Advisors
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

      {/* Area Manager Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            Area Manager Performance
          </CardTitle>
          <CardDescription>
            Performance levels: High (≥₹100k) · Medium (≥₹50k) · Low (&lt;₹50k)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area Manager</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>DO Count</TableHead>
                  <TableHead>Advisor Count</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areaManagerPerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No Area Managers found
                    </TableCell>
                  </TableRow>
                ) : (
                  areaManagerPerformance.map((am) => (
                    <TableRow 
                      key={am._id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => navigate(`/app/employees/${am._id}`)}
                    >
                      <TableCell className="font-medium">{am.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {am.region?.split('-').pop()?.trim() || '—'}
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-600">
                        {formatCurrency(am.totalSales)}
                      </TableCell>
                      <TableCell>{am.doCount}</TableCell>
                      <TableCell>{am.advisorCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            am.performanceLevel === 'high' ? 'default' :
                            am.performanceLevel === 'medium' ? 'secondary' :
                            'outline'
                          } className={
                            am.performanceLevel === 'high' ? 'bg-green-100 text-green-700 border-green-300' :
                            am.performanceLevel === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                            'bg-red-100 text-red-700 border-red-300'
                          }>
                            {am.performanceTrend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                            {am.performanceTrend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                            {am.performanceTrend === 'stable' && <Activity className="h-3 w-3 mr-1" />}
                            {am.performanceLevel === 'high' ? 'High' : am.performanceLevel === 'medium' ? 'Medium' : 'Low'}
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

      {/* Zone Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            Zone Performance by Area
          </CardTitle>
          <CardDescription>Area-wise sales comparison</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading chart data...</p>
              </div>
            </div>
          ) : areaSalesChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaSalesChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="area" 
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
                        <p className="font-semibold text-sm mb-2">{data.area}</p>
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
          <CardDescription>Aggregated zone-level updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Loading activity...</p>
              </div>
            ) : areaManagerPerformance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              areaManagerPerformance.slice(0, 5).map((am) => {
                // Quick calculation - just show if AM has any sales
                if (am.totalSales === 0) return null;
                
                return (
                  <div key={am._id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {am.region?.split('-').pop()?.trim() || am.name} - {formatCurrency(am.totalSales)} total sales
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Area Manager: {am.name}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                );
              }).filter(Boolean)
            )}
          </div>
        </CardContent>
      </Card>

      {/* Low Performing AMs Modal */}
      <Dialog open={showLowPerformingModal} onOpenChange={setShowLowPerformingModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Low Performing Area Managers
            </DialogTitle>
            <DialogDescription>
              Area Managers with sales below ₹50,000
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 mt-4">
            {alerts.find(a => a.title === 'Low Performing Area Managers')?.data?.map((am) => (
              <div
                key={am._id}
                className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 hover:border-red-400 transition-colors cursor-pointer"
                onClick={() => {
                  setShowLowPerformingModal(false);
                  navigate(`/app/employees/${am._id}`);
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{am.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {am.region?.split('-').pop()?.trim() || 'Area'} · {am.doCount} DOs · {am.advisorCount} Advisors
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-700 text-lg">
                    {formatCurrency(am.totalSales)}
                  </p>
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 mt-1">
                    {((am.totalSales / 50000) * 100).toFixed(0)}% of target
                  </Badge>
                  <p className="text-xs text-red-600 mt-1">
                    Need {formatCurrency(50000 - am.totalSales)} more
                  </p>
                </div>
              </div>
            ))}
            {(!alerts.find(a => a.title === 'Low Performing Area Managers')?.data?.length) && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No low performing Area Managers</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setShowLowPerformingModal(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowLowPerformingModal(false);
              navigate('/app/area-employees');
            }}>
              View All Area Managers
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
