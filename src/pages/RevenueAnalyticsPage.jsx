import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../api/analytics.api';
import { PageHeader, Card } from '../components/ui';
import { TrendingUp, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/helpers';

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

  if (loading) return <div className="py-16 text-center text-slate-400">Loading analytics...</div>;


  return (
    <div className="space-y-5">
      <PageHeader title="Revenue Analytics" subtitle="Monthly trend and regional breakdown" />

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <BarChart2 size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {!error && (
        <Card>
          <div className="flex items-center gap-2 mb-4"><TrendingUp size={14} className="text-green-600" /><h3 className="text-sm font-semibold text-slate-800">Revenue Trend</h3></div>
          {trend.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <BarChart2 size={32} className="mx-auto mb-2 opacity-30" />
              No revenue trend data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Area type="monotone" dataKey="sales" stroke="#22c55e" strokeWidth={2} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      )}



    </div>
  );
}
