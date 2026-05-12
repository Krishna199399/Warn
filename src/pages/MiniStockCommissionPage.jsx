import React, { useEffect, useState } from 'react';
import { commissionsApi } from '../api/commissions.api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/helpers';
import { exportCSV } from '../utils/exportCSV';
import { DollarSign, TrendingUp, Award, BarChart2, Download, Search, ShoppingBag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function MiniStockCommissionPage() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [timeRange, setTimeRange] = useState('month');

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

  const filtered = commissions.filter(c => {
    const matchSearch = !search || 
      c.type?.toLowerCase().includes(search.toLowerCase()) || 
      c.role?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const monthlyBreakdown = React.useMemo(() => {
    if (timeRange === 'day') {
      // Daily breakdown with real commission data
      const dailyMap = {};
      commissions.forEach(c => {
        const date = c.date?.slice(0, 10); // YYYY-MM-DD
        if (!date) return;
        dailyMap[date] = (dailyMap[date] || 0) + (c.amount || 0);
      });
      
      // Generate last 30 days with real dates
      const dailyData = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10);
        const amount = dailyMap[dateStr] || 0;
        
        dailyData.push({
          month: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount,
          fullDate: dateStr
        });
      }
      return dailyData;
    }
    
    if (timeRange === 'week') {
      // Weekly breakdown with real commission data
      const weeklyMap = {};
      commissions.forEach(c => {
        const date = c.date?.slice(0, 10);
        if (!date) return;
        
        const d = new Date(date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().slice(0, 10);
        
        weeklyMap[weekKey] = (weeklyMap[weekKey] || 0) + (c.amount || 0);
      });
      
      // Generate last 12 weeks
      const weeklyData = [];
      const today = new Date();
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (today.getDay() + (i * 7)));
        const weekKey = weekStart.toISOString().slice(0, 10);
        const amount = weeklyMap[weekKey] || 0;
        
        weeklyData.push({
          month: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount,
          fullDate: weekKey
        });
      }
      return weeklyData;
    }
    
    // Monthly breakdown (default)
    const monthlyMap = {};
    commissions.forEach(c => {
      const month = c.date?.slice(0, 7); // YYYY-MM
      if (!month) return;
      monthlyMap[month] = (monthlyMap[month] || 0) + (c.amount || 0);
    });
    
    return Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        amount,
        fullDate: month
      }));
  }, [commissions, timeRange]);

  const totalEarned = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const todayEarned = commissions
    .filter(c => c.date?.slice(0,10) === new Date().toISOString().slice(0,10))
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  const thisMonthEarned = commissions
    .filter(c => c.date?.slice(0,7) === new Date().toISOString().slice(0,7))
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i=><Skeleton key={i} className="h-24 rounded-xl"/>)}
      </div>
      <Skeleton className="h-56 w-full rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mini Stock Margins</h1>
          <p className="text-muted-foreground text-sm mt-1">Your earnings from mini stock purchases</p>
        </div>
        {commissions.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => exportCSV(commissions.map(c => ({
            Type: c.type, Level: c.level, Amount: c.amount, Role: c.role, Date: c.date?.slice(0,10)
          })), 'ministock-margins')}>
            <Download size={13} className="mr-1.5" /> Export CSV
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Earned', value: totalEarned, icon: DollarSign, bg: 'bg-primary/10', color: 'text-primary' },
          { label: 'Mini Stock Margin', value: totalEarned, icon: ShoppingBag, bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: 'Today Earned', value: todayEarned, icon: TrendingUp, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'This Month', value: thisMonthEarned, icon: BarChart2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
        ].map(s => (
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
                <Bar dataKey="amount" fill="#9333ea" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Records */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Margin Records</CardTitle>
          <span className="text-xs text-muted-foreground">{filtered.length} records</span>
        </CardHeader>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No margin records found.</p>
          ) : (
            filtered.map((c, i) => {
              return (
                <div key={c._id || i}>
                  <div className="px-5 py-3 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-purple-100 text-purple-700">
                        MS
                      </span>
                      <div>
                        <p className="text-sm font-medium">Mini Stock Margin — {c.role?.replace(/_/g,' ')}</p>
                        <p className="text-xs text-muted-foreground">{c.level} · {c.percentage}% · {c.date?.slice(0,10)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-primary">{formatCurrency(c.amount)}</p>
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
