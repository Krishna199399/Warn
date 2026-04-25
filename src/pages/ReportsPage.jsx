import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../api/analytics.api';
import { usersApi } from '../api/users.api';
import { ordersApi } from '../api/orders.api';
import { commissionsApi } from '../api/commissions.api';
import { useAuth, ROLE_LABELS, ROLES } from '../contexts/AuthContext';
import { PageHeader, Card } from '../components/ui';
import { 
  DollarSign, TrendingUp, Users, ShoppingCart, Award, Download, 
  AlertCircle, Filter, Calendar, MapPin, Target, Briefcase,
  TrendingDown, Activity, UserCheck, Wheat
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '../utils/helpers';
import { exportCSV } from '../utils/exportCSV';

// Color palette for charts
const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [dateRange, setDateRange] = useState('all'); // all, month, quarter, year
  const [selectedRegion, setSelectedRegion] = useState('all');
  
  // Data states
  const [summary, setSummary] = useState(null);
  const [downlineUsers, setDownlineUsers] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [roleDistribution, setRoleDistribution] = useState([]);

  const isAdmin = user?.role === ROLES.ADMIN;

  useEffect(() => {
    loadReportData();
  }, [user, dateRange, selectedRegion]);

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (isAdmin) {
        await loadAdminReports();
      } else {
        await loadEmployeeReports();
      }
    } catch (err) {
      setError('Failed to load report data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminReports = async () => {
    const [dashData, trendData, regionsData, topAdvisorsData] = await Promise.all([
      analyticsApi.getDashboard(),
      analyticsApi.getRevenueTrend(),
      analyticsApi.getRegions(),
      analyticsApi.getTopAdvisors(),
    ]);

    setSummary(dashData.data.data);
    setSalesTrend(trendData.data.data || []);
    setRegionData(regionsData.data.data || []);
    setTopPerformers(topAdvisorsData.data.data || []);

    // Calculate role distribution from actual users
    try {
      const usersRes = await usersApi.getAll();
      const users = usersRes.data.data || [];
      
      const roleCounts = users.reduce((acc, user) => {
        const role = user.role;
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      const roleLabels = {
        ADVISOR: 'Advisors',
        DO_MANAGER: 'DO Managers',
        AREA_MANAGER: 'Area Managers',
        ZONAL_MANAGER: 'Zonal Managers',
        STATE_HEAD: 'State Heads',
      };

      const distribution = Object.entries(roleCounts)
        .filter(([role]) => roleLabels[role]) // Only employee roles
        .map(([role, count]) => ({
          name: roleLabels[role],
          value: count,
          count: count,
        }));

      setRoleDistribution(distribution);
    } catch (err) {
      console.error('Failed to load role distribution:', err);
      setRoleDistribution([]);
    }
  };

  const loadEmployeeReports = async () => {
    // Get own performance
    const perfRes = await usersApi.getPerformance(user._id);
    const myPerf = perfRes.data.data;

    // For Advisors - show only personal data
    if (user.role === ROLES.ADVISOR) {
      // Get commission summary for accurate earnings
      const commRes = await commissionsApi.getSummary();
      const commSummary = commRes.data.data;

      // Get actual farmers count
      let farmersCount = 0;
      try {
        const { farmersApi } = await import('../api/farmers.api');
        const farmersRes = await farmersApi.getMy();
        farmersCount = (farmersRes.data.data || []).length;
      } catch (_) {}

      setSummary({
        totalSales: myPerf?.totalSales || 0,
        totalOrders: myPerf?.totalOrders || 0,
        activeNetwork: farmersCount,           // Actual farmers count
        totalEarnings: commSummary?.total || 0, // Use commission data
      });

      // Sales trend from monthly performance
      setSalesTrend(myPerf?.monthlyPerformance || []);

      // No downline data for advisors
      setDownlineUsers([]);
      setPerformanceData([]);
      setTopPerformers([]);
      setRegionData([]);
      return;
    }

    // For Managers - show downline data
    const downlineRes = await usersApi.getDownline(user._id);
    const downline = downlineRes.data.data || [];
    setDownlineUsers(downline);

    // Get commission summary for accurate earnings
    const commRes = await commissionsApi.getSummary();
    const commSummary = commRes.data.data;

    const totalSales = myPerf?.totalSales || 0;
    const teamSize = downline.length;
    
    setSummary({
      totalSales,
      totalOrders: myPerf?.totalOrders || 0,
      activeNetwork: teamSize,
      totalEarnings: commSummary?.total || 0, // Use commission data
      teamSales: downline.reduce((sum, u) => sum + (u.totalSales || 0), 0),
    });

    // Build performance data by downline
    const perfData = downline.map(u => ({
      name: u.name,
      role: u.role,
      sales: u.totalSales || 0,
      orders: u.totalOrders || 0,
      region: u.region,
    })).sort((a, b) => b.sales - a.sales);
    
    setPerformanceData(perfData);
    setTopPerformers(perfData.slice(0, 10));

    // Sales trend from monthly performance
    setSalesTrend(myPerf?.monthlyPerformance || []);

    // Region breakdown
    const regionMap = {};
    downline.forEach(u => {
      const region = u.region || 'Unknown';
      if (!regionMap[region]) regionMap[region] = { region, sales: 0, count: 0 };
      regionMap[region].sales += u.totalSales || 0;
      regionMap[region].count += 1;
    });
    setRegionData(Object.values(regionMap).sort((a, b) => b.sales - a.sales));
  };

  const exportReport = () => {
    const data = performanceData.map(p => ({
      Name: p.name,
      Role: ROLE_LABELS[p.role],
      Region: p.region,
      Sales: p.sales,
      Orders: p.orders,
    }));
    exportCSV(data, `report_${user?.role}_${new Date().toISOString().split('T')[0]}`);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Reports" subtitle="Loading..." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader 
        title={isAdmin ? 'System Reports' : 'My Reports'} 
        subtitle={isAdmin ? 'Complete system analytics and performance' : `${ROLE_LABELS[user?.role]} — Your team performance`}
        actions={
          <button onClick={exportReport} className="btn-export">
            <Download size={12} /> Export CSV
          </button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle size={16} />{error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-600">Filters:</span>
          </div>
          
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          {regionData.length > 0 && (
            <select 
              value={selectedRegion} 
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium"
            >
              <option value="all">All Regions</option>
              {regionData.map(r => (
                <option key={r.region} value={r.region}>{r.region}</option>
              ))}
            </select>
          )}

          <div className="ml-auto text-xs text-slate-400">
            <Calendar size={12} className="inline mr-1" />
            Updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">
                  {user?.role === ROLES.ADVISOR ? 'My Sales' : 'Total Sales'}
                </p>
                <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(summary.totalSales || 0)}</p>
                {!isAdmin && user?.role !== ROLES.ADVISOR && summary.teamSales > 0 && (
                  <p className="text-xs text-green-600 mt-1">Team: {formatCurrency(summary.teamSales)}</p>
                )}
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-xl flex items-center justify-center">
                <DollarSign size={20} className="text-green-700" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">
                  {user?.role === ROLES.ADVISOR ? 'My Orders' : 'Total Orders'}
                </p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{summary.totalOrders || 0}</p>
                <p className="text-xs text-blue-600 mt-1">Completed</p>
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-xl flex items-center justify-center">
                <ShoppingCart size={20} className="text-blue-700" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-purple-600 font-medium">
                  {isAdmin ? 'Total Employees' : user?.role === ROLES.ADVISOR ? 'My Farmers' : 'Team Size'}
                </p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{summary.activeNetwork || 0}</p>
                <p className="text-xs text-purple-600 mt-1">
                  {isAdmin ? 'Active users' : user?.role === ROLES.ADVISOR ? 'Registered' : 'Downline'}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-200 rounded-xl flex items-center justify-center">
                {user?.role === ROLES.ADVISOR ? (
                  <Wheat size={20} className="text-purple-700" />
                ) : (
                  <Users size={20} className="text-purple-700" />
                )}
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-amber-600 font-medium">
                  {user?.role === ROLES.ADVISOR ? 'My Earnings' : 'Total Earnings'}
                </p>
                <p className="text-2xl font-bold text-amber-900 mt-1">{formatCurrency(summary.totalEarnings || 0)}</p>
                <p className="text-xs text-amber-600 mt-1">Commission</p>
              </div>
              <div className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} className="text-amber-700" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Sales Trend */}
        {salesTrend.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">
                {user?.role === ROLES.ADVISOR ? 'My Sales Trend' : 'Sales Trend'}
              </h3>
              <span className="text-xs text-slate-500">Last 6 months</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Line type="monotone" dataKey="sales" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Region Performance - Hide for Advisors */}
        {regionData.length > 0 && user?.role !== ROLES.ADVISOR && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Region Performance</h3>
              <MapPin size={14} className="text-slate-400" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={regionData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Monthly Target Progress - For Advisors */}
        {user?.role === ROLES.ADVISOR && salesTrend.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Monthly Performance</h3>
              <Target size={14} className="text-slate-400" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Bar dataKey="sales" fill="#22c55e" radius={[4,4,0,0]} name="Actual" />
                {salesTrend[0]?.target && (
                  <Bar dataKey="target" fill="#e2e8f0" radius={[4,4,0,0]} name="Target" />
                )}
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Role Distribution (Admin Only) */}
      {isAdmin && roleDistribution.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Employee Distribution by Role</h3>
          <div className="grid lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {roleDistribution.map((role, i) => (
                <div key={role.name} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-sm text-slate-700">{role.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{role.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Top Performers Table - Hide for Advisors */}
      {topPerformers.length > 0 && user?.role !== ROLES.ADVISOR && (
        <Card padding={false}>
          <div className="p-5 border-b border-slate-50">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Award size={14} className="text-amber-500" />
              {isAdmin ? 'Top Performers' : 'Team Performance'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAdmin ? 'Best performing advisors across all regions' : 'Your direct and indirect downline performance'}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600">Rank</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600">Region</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600">Orders</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600">Total Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topPerformers.map((performer, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-amber-100 text-amber-700' : 
                        index === 1 ? 'bg-slate-200 text-slate-600' :
                        index === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-slate-800">{performer.name}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                        {ROLE_LABELS[performer.role] || 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{performer.region || 'N/A'}</td>
                    <td className="px-5 py-3 text-right text-sm font-medium text-slate-700">{performer.orders || 0}</td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-green-700">{formatCurrency(performer.sales || performer.totalSales || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && topPerformers.length === 0 && user?.role !== ROLES.ADVISOR && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Activity size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-500">No performance data available</p>
            <p className="text-xs text-slate-400 mt-1">
              {isAdmin ? 'System data will appear here once users start making sales' : 'Build your team to see performance reports'}
            </p>
          </div>
        </Card>
      )}

      {/* Advisor-specific message */}
      {user?.role === ROLES.ADVISOR && !loading && (
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <Briefcase size={22} className="text-blue-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-900">Your Personal Performance Report</h3>
              <p className="text-xs text-blue-600 mt-0.5">
                This shows your individual sales, orders, farmers, and earnings. Keep up the great work!
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
