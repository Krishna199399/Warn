import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../api/analytics.api';
import { commissionsApi } from '../api/commissions.api';
import { usersApi } from '../api/users.api';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp, Users, DollarSign, AlertTriangle,
  UserCheck, Activity, ArrowRight, TrendingDown,
  BarChart3, Target, AlertCircle, Award, UserPlus
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

export default function DOManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [downline, setDownline] = useState([]);
  const [showLowPerformingModal, setShowLowPerformingModal] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    
    // Load stats, summary, and direct reports (Advisors only)
    Promise.all([
      analyticsApi.getDashboard({ signal: controller.signal }),
      commissionsApi.getSummary({ signal: controller.signal }),
      usersApi.getDownline(user._id, true), // directOnly=true - only Advisors
    ]).then(([statsRes, summaryRes, downlineRes]) => {
      setStats(statsRes.data.data);
      setSummary(summaryRes.data.data);
      setDownline(downlineRes.data.data || []);
      setLoading(false);
    }).catch((err) => {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        console.error('Dashboard error:', err);
      }
      setLoading(false);
      setDownline([]);
    });

    return () => controller.abort();
  }, [user]);

  // Calculate Advisor metrics
  const advisorMetrics = useMemo(() => {
    const advisors = downline.filter(u => u.role === 'ADVISOR');
    
    // Count active advisors - those with sales > 0
    const activeAdvisors = advisors.filter(a => (a.totalSales || 0) > 0).length;

    // Sum up total farmers from all advisors
    const totalFarmers = advisors.reduce((sum, a) => sum + (a.teamSize || 0), 0);

    return {
      totalAdvisors: advisors.length,
      activeAdvisors,
      inactiveAdvisors: advisors.length - activeAdvisors,
      totalFarmers,
    };
  }, [downline]);

  // Calculate Advisor performance
  const advisorPerformance = useMemo(() => {
    const advisors = downline.filter(u => u.role === 'ADVISOR');
    
    return advisors.map(advisor => {
      const totalSales = advisor.totalSales || 0;
      const totalFarmers = advisor.teamSize || 0;
      
      // Performance levels for Advisors: High ≥₹50k, Medium ≥₹25k, Low <₹25k
      let performanceLevel = 'low';
      let performanceTrend = 'down';
      if (totalSales >= 50000) {
        performanceLevel = 'high';
        performanceTrend = 'up';
      } else if (totalSales >= 25000) {
        performanceLevel = 'medium';
        performanceTrend = 'stable';
      }
      
      return {
        ...advisor,
        totalSales,
        totalFarmers,
        orderCount: advisor.totalOrders || 0,
        performanceLevel,
        performanceTrend,
      };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }, [downline]);

  // Calculate alerts
  const alerts = useMemo(() => {
    const result = [];
    
    // Low performing advisors (sales < 25k)
    const lowPerformingAdvisors = advisorPerformance.filter(a => a.performanceLevel === 'low');
    if (lowPerformingAdvisors.length > 0) {
      result.push({
        type: 'warning',
        title: 'Low Performing Advisors',
        message: `${lowPerformingAdvisors.length} advisors below ₹25K sales target`,
        action: () => setShowLowPerformingModal(true),
        icon: TrendingDown,
        data: lowPerformingAdvisors,
      });
    }
    
    // Inactive advisors (no sales at all)
    const inactiveAdvisors = advisorPerformance.filter(a => a.totalSales === 0);
    if (inactiveAdvisors.length > 0) {
      result.push({
        type: 'info',
        title: 'Inactive Advisors',
        message: `${inactiveAdvisors.length} advisors with no sales in last 30 days`,
        action: () => navigate('/app/advisors'),
        icon: AlertCircle,
      });
    }
    
    return result;
  }, [advisorPerformance, navigate]);

  // Advisor sales chart data
  const advisorSalesChart = useMemo(() => {
    return advisorPerformance.slice(0, 10).map(advisor => ({
      name: advisor.name.split(' ')[0],
      sales: advisor.totalSales,
    }));
  }, [advisorPerformance]);

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
            DO Manager · {user?.state || 'State'} · {user?.region || 'Zone'} · {user?.area || 'Area'}
            {user?.employeeCode && <span className="font-mono"> · {user.employeeCode}</span>}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Advisors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {advisorMetrics.totalAdvisors}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Advisors under your management
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Advisors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {advisorMetrics.activeAdvisors} / {advisorMetrics.totalAdvisors}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalSales || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aggregated from all advisors
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
              {formatCurrency(summary?.IV || 0)}
            </div>
            <div className="flex gap-2 mt-2 text-xs flex-wrap">
              <Badge variant="secondary">IV: {formatCurrency(summary?.IV || 0)}</Badge>
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

      {/* Advisor Performance Table - MAIN SECTION */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            Advisor Performance
          </CardTitle>
          <CardDescription>
            Performance levels: High (≥₹50K) · Medium (≥₹25K) · Low (&lt;₹25K)
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
                  <TableHead>Advisor Name</TableHead>
                  <TableHead>Total Farmers</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Orders Count</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advisorPerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No Advisors found
                    </TableCell>
                  </TableRow>
                ) : (
                  advisorPerformance.map((advisor) => (
                    <TableRow 
                      key={advisor._id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => navigate(`/app/employees/${advisor._id}`)}
                    >
                      <TableCell className="font-medium">
                        {advisor.name}
                        <p className="text-xs text-muted-foreground">{advisor.advisorCode}</p>
                      </TableCell>
                      <TableCell>{advisor.totalFarmers}</TableCell>
                      <TableCell className="font-semibold" style={{ color: '#3b82f6' }}>
                        {formatCurrency(advisor.totalSales)}
                      </TableCell>
                      <TableCell>{advisor.orderCount}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {advisor.lastLoginAt 
                          ? new Date(advisor.lastLoginAt).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short' 
                            })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            advisor.performanceLevel === 'high' ? 'default' :
                            advisor.performanceLevel === 'medium' ? 'secondary' :
                            'outline'
                          } className={
                            advisor.performanceLevel === 'high' ? 'border-blue-300' :
                            advisor.performanceLevel === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                            'bg-destructive/10 text-destructive border-destructive/20'
                          }
                          style={advisor.performanceLevel === 'high' ? { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' } : {}}
                          >
                            {advisor.performanceTrend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                            {advisor.performanceTrend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                            {advisor.performanceTrend === 'stable' && <Activity className="h-3 w-3 mr-1" />}
                            {advisor.performanceLevel === 'high' ? 'High' : advisor.performanceLevel === 'medium' ? 'Medium' : 'Low'}
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

      {/* Sales Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            Sales Performance by Advisor
          </CardTitle>
          <CardDescription>Top performing advisors comparison</CardDescription>
        </CardHeader>
        <CardContent>
          {advisorSalesChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={advisorSalesChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="name" 
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
                        <p className="font-semibold text-sm mb-2">{data.name}</p>
                        <div className="flex justify-between gap-4">
                          <span className="text-xs text-muted-foreground">Sales</span>
                          <span className="text-sm font-bold" style={{ color: '#3b82f6' }}>
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

      {/* Recent Activity - Advisor-based */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            Recent Advisor Activity
          </CardTitle>
          <CardDescription>Latest updates from your advisor team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {advisorPerformance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              advisorPerformance.slice(0, 5).filter(a => a.totalSales > 0).map((advisor) => (
                <div key={advisor._id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                      <TrendingUp className="h-5 w-5" style={{ color: '#3b82f6' }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {advisor.name} - {formatCurrency(advisor.totalSales)} total sales
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {advisor.orderCount} orders · {advisor.totalFarmers} farmers
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

      {/* Low Performing Advisors Modal */}
      <Dialog open={showLowPerformingModal} onOpenChange={setShowLowPerformingModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Low Performing Advisors
            </DialogTitle>
            <DialogDescription>
              Advisors with sales below ₹25K target
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 mt-4">
            {alerts.find(a => a.title === 'Low Performing Advisors')?.data?.map((advisor) => (
              <div
                key={advisor._id}
                className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/20 hover:border-destructive/40 transition-colors cursor-pointer"
                onClick={() => {
                  setShowLowPerformingModal(false);
                  navigate(`/app/employees/${advisor._id}`);
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{advisor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {advisor.advisorCode} · {advisor.totalFarmers} farmers · {advisor.orderCount} orders
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-destructive text-lg">
                    {formatCurrency(advisor.totalSales)}
                  </p>
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 mt-1">
                    {((advisor.totalSales / 25000) * 100).toFixed(0)}% of target
                  </Badge>
                  <p className="text-xs text-red-600 mt-1">
                    Need {formatCurrency(25000 - advisor.totalSales)} more
                  </p>
                </div>
              </div>
            ))}
            {(!alerts.find(a => a.title === 'Low Performing Advisors')?.data?.length) && (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>All advisors performing well!</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setShowLowPerformingModal(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowLowPerformingModal(false);
              navigate('/app/advisors');
            }}>
              View All Advisors
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
