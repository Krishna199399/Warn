import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../api/analytics.api';
import { formatCurrency } from '../utils/helpers';
import { TrendingUp, BarChart2, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function RevenueAnalyticsPage() {
  const [trend,   setTrend]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    analyticsApi.getRevenueTrend()
      .then(t => setTrend(t.data.data || []))
      .catch(err => setError(err?.response?.data?.error || 'Failed to load revenue analytics'))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = trend.reduce((s, t) => s + (t.sales || 0), 0);
  const peak = trend.reduce((max, t) => (t.sales || 0) > (max.sales || 0) ? t : max, {});

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid sm:grid-cols-2 gap-4">{[1,2].map(i=><Skeleton key={i} className="h-24 rounded-xl"/>)}</div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Monthly revenue trend and regional breakdown</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0" />{error}
        </div>
      )}

      {!error && trend.length > 0 && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center"><TrendingUp size={20} className="text-primary" /></div>
                <div><p className="text-xs text-muted-foreground">Total Revenue (Period)</p><p className="text-xl font-bold text-primary">{formatCurrency(totalRevenue)}</p></div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center"><BarChart2 size={20} className="text-amber-700" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Peak Month</p>
                  <p className="text-xl font-bold text-amber-700">{peak.month || '—'}</p>
                  {peak.sales && <p className="text-xs text-muted-foreground">{formatCurrency(peak.sales)}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp size={14} className="text-primary" /> Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={v => formatCurrency(v)} 
                    contentStyle={{ 
                      borderRadius:'0.75rem', 
                      border:'1px solid hsl(var(--border))',
                      backgroundColor: 'white'
                    }} 
                  />
                  <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {!error && trend.length === 0 && (
        <Card>
          <CardContent className="text-center py-14">
            <BarChart2 size={40} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No revenue trend data available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
