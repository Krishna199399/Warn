import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../api/analytics.api';
import { usersApi } from '../api/users.api';
import { ordersApi } from '../api/orders.api';
import { commissionsApi } from '../api/commissions.api';
import { useAuth, ROLE_LABELS, ROLES } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/helpers';
import { exportCSV } from '../utils/exportCSV';
import { DollarSign, TrendingUp, Users, ShoppingCart, Award, Download, AlertCircle, Briefcase, Wheat } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader, StatCard, LoadingGrid } from '@/components/ui';

const COLORS = ['hsl(var(--primary))', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ReportsPage() {
  const { user } = useAuth();
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [dateRange,        setDateRange]        = useState('all');
  const [timeRange,        setTimeRange]        = useState('day'); // 'day', 'week', 'month'
  const [summary,          setSummary]          = useState(null);
  const [performanceData,  setPerformanceData]  = useState([]);
  const [regionData,       setRegionData]       = useState([]);
  const [topPerformers,    setTopPerformers]    = useState([]);
  const [salesTrend,       setSalesTrend]       = useState([]);
  const [roleDistribution, setRoleDistribution] = useState([]);
  const isAdmin = user?.role === ROLES.ADMIN;

  useEffect(() => { loadReportData(); }, [user, dateRange]);

  const loadReportData = async () => {
    setLoading(true); setError(null);
    try {
      if (isAdmin) await loadAdminReports();
      else await loadEmployeeReports();
    } catch (err) { setError('Failed to load report data'); }
    finally { setLoading(false); }
  };

  const loadAdminReports = async () => {
    const [dashData, trendData, regionsData, topAdvisorsData] = await Promise.all([
      analyticsApi.getDashboard(), analyticsApi.getRevenueTrend(),
      analyticsApi.getRegions(),   analyticsApi.getTopAdvisors(),
    ]);
    setSummary(dashData.data.data);
    setSalesTrend(trendData.data.data || []);
    setRegionData(regionsData.data.data || []);
    setTopPerformers(topAdvisorsData.data.data || []);
    try {
      const usersRes = await usersApi.getAll();
      const users = usersRes.data.data || [];
      const roleLabels = { ADVISOR:'Advisors', DO_MANAGER:'DO Managers', AREA_MANAGER:'Area Managers', ZONAL_MANAGER:'Zonal Managers', STATE_HEAD:'State Heads' };
      const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});
      setRoleDistribution(Object.entries(roleCounts).filter(([r]) => roleLabels[r]).map(([r, count]) => ({ name: roleLabels[r], value: count, count })));
    } catch { setRoleDistribution([]); }
  };

  const loadEmployeeReports = async () => {
    const perfRes = await usersApi.getPerformance(user._id);
    const myPerf = perfRes.data.data;
    if (user.role === ROLES.ADVISOR) {
      const commRes = await commissionsApi.getSummary();
      let farmersCount = 0;
      try { const { farmersApi } = await import('../api/farmers.api'); farmersCount = (await farmersApi.getMy()).data.data?.length || 0; } catch {}
      setSummary({ totalSales: myPerf?.totalSales||0, totalOrders: myPerf?.totalOrders||0, activeNetwork: farmersCount, totalEarnings: commRes.data.data?.total||0 });
      setSalesTrend(myPerf?.monthlyPerformance || []);
      return;
    }
    const [downlineRes, commRes] = await Promise.all([usersApi.getDownline(user._id), commissionsApi.getSummary()]);
    const downline = downlineRes.data.data || [];
    setSummary({ totalSales: myPerf?.totalSales||0, totalOrders: myPerf?.totalOrders||0, activeNetwork: downline.length, totalEarnings: commRes.data.data?.total||0, teamSales: downline.reduce((s,u)=>s+(u.totalSales||0),0) });
    const perfData = downline.map(u => ({ name: u.name, role: u.role, sales: u.totalSales||0, orders: u.totalOrders||0, region: u.region })).sort((a,b)=>b.sales-a.sales);
    setPerformanceData(perfData);
    setTopPerformers(perfData.slice(0,10));
    setSalesTrend(myPerf?.monthlyPerformance || []);
    const regionMap = {};
    downline.forEach(u => { const r = u.region||'Unknown'; if(!regionMap[r]) regionMap[r]={region:r,sales:0,count:0}; regionMap[r].sales+=u.totalSales||0; regionMap[r].count+=1; });
    setRegionData(Object.values(regionMap).sort((a,b)=>b.sales-a.sales));
  };

  const exportReport = () => exportCSV(performanceData.map(p => ({ Name:p.name, Role:ROLE_LABELS[p.role], Region:p.region, Sales:p.sales, Orders:p.orders })), `report_${user?.role}_${new Date().toISOString().split('T')[0]}`);

  // Generate chart data based on time range
  const getChartData = () => {
    if (!salesTrend || salesTrend.length === 0) return [];
    
    if (timeRange === 'month') {
      return salesTrend;
    }
    
    if (timeRange === 'week') {
      // Generate weekly data (12 weeks) with actual dates
      const weeklyData = [];
      const today = new Date(2026, 4, 4); // May 4, 2026
      
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (i * 7));
        
        weeklyData.push({
          month: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sales: 0,
          orders: 0,
        });
      }
      return weeklyData;
    }
    
    if (timeRange === 'day') {
      // Generate daily data (30 days) with actual dates
      const dailyData = [];
      const today = new Date(2026, 4, 4); // May 4, 2026
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        dailyData.push({
          month: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sales: 0,
          orders: 0,
        });
      }
      return dailyData;
    }
    
    return salesTrend;
  };

  const chartData = getChartData();

  if (loading) return <LoadingGrid count={8} columns="lg:grid-cols-4" />;

  return (
    <div className="space-y-5">
      <PageHeader
        title={isAdmin ? 'System Reports' : 'My Reports'}
        description={isAdmin ? 'Complete system analytics and performance' : `${ROLE_LABELS[user?.role]} — Your team performance`}
        actions={
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download size={13} className="mr-1.5" /> Export CSV
          </Button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
          <AlertCircle size={16} />{error}
        </div>
      )}

      {/* Filter */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <span className="text-xs font-medium text-muted-foreground">Date Range:</span>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-xs text-muted-foreground">Updated: {new Date().toLocaleDateString()}</span>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label={user?.role === ROLES.ADVISOR ? 'My Sales' : 'Total Sales'} 
            value={summary.totalSales||0} 
            icon={DollarSign} 
            format="currency" 
          />
          <StatCard 
            label={user?.role === ROLES.ADVISOR ? 'My Orders' : 'Total Orders'} 
            value={isAdmin ? (summary.wholesaleOrders||0) : (summary.totalOrders||0)} 
            icon={ShoppingCart} 
            format="number" 
          />
          <StatCard 
            label={isAdmin ? 'Total Employees' : user?.role === ROLES.ADVISOR ? 'My Customers' : 'Team Size'} 
            value={summary.activeNetwork||0} 
            icon={user?.role === ROLES.ADVISOR ? Wheat : Users} 
            format="number" 
          />
          <StatCard 
            label={user?.role === ROLES.ADVISOR ? 'My Earnings' : 'Total Earnings'} 
            value={summary.totalEarnings||0} 
            icon={TrendingUp} 
            format="currency" 
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {salesTrend.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{user?.role === ROLES.ADVISOR ? 'My Sales Trend' : 'Sales Trend'}</CardTitle>
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
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ borderRadius:'0.75rem', border:'1px solid hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Role Distribution (Admin) */}
      {isAdmin && roleDistribution.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Employee Distribution by Role</CardTitle></CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={roleDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                    labelLine={false} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                    {roleDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {roleDistribution.map((role, i) => (
                  <div key={role.name} className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm">{role.name}</span>
                    </div>
                    <span className="text-sm font-bold">{role.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performers Table */}
      {topPerformers.length > 0 && user?.role !== ROLES.ADVISOR && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Award size={14} className="text-amber-500" />{isAdmin ? 'Top Performers' : 'Team Performance'}</CardTitle>
            <CardDescription>{isAdmin ? 'Best performing advisors across all regions' : 'Your direct and indirect downline performance'}</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>{['Rank','Name','Role','Region','Orders','Total Sales'].map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>
              {topPerformers.map((p, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i===0?'bg-amber-100 text-amber-700':i===1?'bg-slate-200 text-slate-600':i===2?'bg-orange-100 text-orange-600':'bg-muted text-muted-foreground'}`}>{i+1}</span>
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">{ROLE_LABELS[p.role]||'N/A'}</span></TableCell>
                  <TableCell className="text-muted-foreground">{p.region||'N/A'}</TableCell>
                  <TableCell className="font-medium">{p.orders||0}</TableCell>
                  <TableCell className="font-bold text-primary">{formatCurrency(p.sales||p.totalSales||0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Empty / Advisor note */}
      {!loading && topPerformers.length === 0 && user?.role !== ROLES.ADVISOR && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4"><TrendingUp size={28} className="text-muted-foreground/40" /></div>
            <p className="text-sm font-semibold text-muted-foreground">No performance data available</p>
            <p className="text-xs text-muted-foreground mt-1">{isAdmin ? 'Data appears here once users start making sales' : 'Build your team to see performance reports'}</p>
          </CardContent>
        </Card>
      )}
      {user?.role === ROLES.ADVISOR && !loading && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0"><Briefcase size={22} className="text-blue-700" /></div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Your Personal Performance Report</p>
              <p className="text-xs text-blue-600 mt-0.5">This shows your individual sales, orders, farmers, and earnings. Keep up the great work!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
