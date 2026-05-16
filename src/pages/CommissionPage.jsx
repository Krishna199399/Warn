import React, { useEffect, useState } from 'react';
import { commissionsApi } from '../api/commissions.api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatPoints } from '../utils/helpers';
import { exportCSV } from '../utils/exportCSV';
import { DollarSign, TrendingUp, Award, BarChart2, Download, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TYPE_META = {
  RP: { label: 'Retail Point', bg: 'bg-rose-100 text-rose-700' },
  IV: { label: 'Incentive',    bg: 'bg-blue-100 text-blue-700' },
  SV: { label: 'Salary Value', bg: 'bg-purple-100 text-purple-700' },
  RV: { label: 'Rewards',      bg: 'bg-amber-100 text-amber-700' },
};

export default function CommissionPage() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [filterType,  setFilterType]  = useState('ALL');
  const [search,      setSearch]      = useState('');
  const [timeRange,   setTimeRange]   = useState('day'); // 'day', 'week', 'month'

  useEffect(() => {
    const ctrl = new AbortController();
    Promise.all([
      commissionsApi.getMy({ signal: ctrl.signal }),
      commissionsApi.getSummary({ signal: ctrl.signal }),
    ]).then(([c, s]) => {
      setCommissions(c.data.data || []);
      setSummary(s.data.data);
    }).catch(e => { if (e?.name !== 'AbortError') console.error(e); })
    .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [user]);

  const tabs = user?.role === 'ADVISOR' 
    ? ['ALL', 'RP'] 
    : ['ALL', 'IV']; // Managers: Hide SV and RV tabs (salary and rewards are private)

  const filtered = commissions.filter(c => {
    // For ALL users: Hide SV and RV transactions (salary and rewards are private)
    if (c.type === 'SV' || c.type === 'RV') {
      return false;
    }
    
    const matchType = filterType === 'ALL' || c.type === filterType;
    const matchSearch = !search || c.type?.toLowerCase().includes(search.toLowerCase()) || c.role?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const monthlyBreakdown = React.useMemo(() => {
    if (timeRange === 'day') {
      // Real daily data from commissions
      const dailyMap = {};
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      commissions.forEach(c => {
        const date = new Date(c.date);
        if (date >= thirtyDaysAgo) {
          const day = c.date?.slice(0, 10); // YYYY-MM-DD
          if (day) {
            dailyMap[day] = (dailyMap[day] || 0) + (c.amount || c.points || 0);
          }
        }
      });
      
      // Fill in missing days with 0
      const dailyData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().slice(0, 10);
        const dayNum = date.getDate();
        dailyData.push({
          month: `Day ${dayNum}`,
          points: dailyMap[dateStr] || 0,
          fullDate: dateStr,
        });
      }
      return dailyData;
    }
    
    if (timeRange === 'week') {
      // Real weekly data from commissions
      const weeklyMap = {};
      const now = new Date();
      const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
      
      commissions.forEach(c => {
        const date = new Date(c.date);
        if (date >= twelveWeeksAgo) {
          // Get week number
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
          const weekKey = weekStart.toISOString().slice(0, 10);
          weeklyMap[weekKey] = (weeklyMap[weekKey] || 0) + (c.amount || c.points || 0);
        }
      });
      
      // Convert to array and sort
      const weeklyData = Object.entries(weeklyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, points], idx) => ({
          month: `W${idx + 1}`,
          points,
          fullDate: week,
        }));
      
      return weeklyData.slice(-12); // Last 12 weeks
    }
    
    // Monthly data (default)
    const map = {};
    commissions.forEach(c => {
      const month = c.date?.slice(0, 7); // YYYY-MM
      if (!month) return;
      map[month] = (map[month] || 0) + (c.amount || c.points || 0);
    });
    
    const monthlyData = Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, points]) => ({ 
        month: month.slice(5) + '/' + month.slice(2, 4), // MM/YY
        points, 
        fullDate: month 
      }));
    
    return monthlyData;
  }, [commissions, timeRange]);

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i=><Skeleton key={i} className="h-24 rounded-xl"/>)}</div>
      <Skeleton className="h-56 w-full rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Commissions</h1>
          <p className="text-muted-foreground text-sm mt-1">Snapshot-protected earnings history</p>
        </div>
          {commissions.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => exportCSV(commissions.map(c => ({
            Type: c.type, Level: c.level, Amount: c.amount || c.points || 0, Role: c.role, Date: c.date?.slice(0,10)
          })), 'commissions')}>
            <Download size={13} className="mr-1.5" /> Export CSV
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(user?.role === 'ADVISOR' ? [
            // For ADVISOR: Show all pools (RP + SV + RV)
            { label: 'Total Earned',       value: summary.total,        icon: DollarSign, bg: 'bg-primary/10', color: 'text-primary' },
            { label: 'Retail Point (RP)',  value: summary.RP,           icon: Award,      bg: 'bg-rose-50',    color: 'text-rose-600' },
            { label: 'Today Earned',       value: summary.today || 0,   icon: TrendingUp, bg: 'bg-blue-50',    color: 'text-blue-600' },
            { label: 'This Month',         value: summary.thisMonth,    icon: BarChart2,  bg: 'bg-emerald-50', color: 'text-emerald-600' },
          ] : [
            // For MANAGERS: Show only IV-related cards (SV and RV have their own tabs)
            { label: 'Total Earned (₹)',   value: summary.IV,                icon: DollarSign, bg: 'bg-primary/10', color: 'text-primary' },
            { label: 'Incentive (₹)',      value: summary.IV,                icon: Award,      bg: 'bg-blue-50',    color: 'text-blue-600' },
            { label: 'Today Earned',       value: summary.todayIV || 0,      icon: TrendingUp, bg: 'bg-purple-50',  color: 'text-purple-600' },
            { label: 'This Month',         value: summary.thisMonthIV || 0,  icon: BarChart2,  bg: 'bg-emerald-50', color: 'text-emerald-600' },
          ]).map(s => (
            <Card key={s.label} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon size={18} className={s.color} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{formatCurrency(s.value || 0)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Monthly Chart */}
      {monthlyBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              {timeRange === 'day' ? 'Daily' : timeRange === 'week' ? 'Weekly' : 'Monthly'} Earnings
            </CardTitle>
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
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(1)}k`} />
                <Tooltip 
                  formatter={v => formatCurrency(v)} 
                  contentStyle={{ 
                    borderRadius: '0.75rem', 
                    border: '1px solid #e5e7eb',
                    backgroundColor: 'white'
                  }} 
                />
                <Bar dataKey="points" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Info banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <Award size={18} className="text-blue-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">Understanding Your Commission</p>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              {user?.role === 'ADVISOR'
                ? <><strong>RP (Retail Point):</strong> Promotion Rep. earns 100% of the product's RP value × qty sold.</>
                : <><strong>RP:</strong> PR earns 100% RP × qty.&nbsp; <strong>IV:</strong> DO 42% → RM 23% → ZM 15% → EM 10%.&nbsp; <strong>SV/RV:</strong> PR 42% + DO 23% + RM 15% + ZM 10% + EM 10%.</>
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Type Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={filterType} onValueChange={setFilterType}>
          <TabsList>
            {tabs.map(t => (
              <TabsTrigger key={t} value={t} className="text-xs px-3">
                {t === 'ALL' ? 'All' : TYPE_META[t]?.label || t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Records */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Commission Records</CardTitle>
          <span className="text-xs text-muted-foreground">{filtered.length} records</span>
        </CardHeader>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No commissions match this filter.</p>
          ) : (
            filtered.map((c, i) => {
              const meta = TYPE_META[c.type] || { label: c.type, bg: 'bg-muted text-muted-foreground' };
              return (
                <div key={c._id || i}>
                  <div className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${meta.bg}`}>{c.type}</span>
                      <div>
                        <p className="text-sm font-medium">{meta.label} — {c.role?.replace(/_/g,' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.role === 'ADVISOR' 
                            ? `${c.level} · ${c.date?.slice(0,10)}` 
                            : `${c.level} · ${c.percentage}% of pool · ${c.date?.slice(0,10)}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-primary">{formatCurrency(c.amount || c.points || 0)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
