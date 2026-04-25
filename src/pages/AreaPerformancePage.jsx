import React, { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, Card } from '../components/ui';
import { TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/helpers';

export default function AreaPerformancePage() {
  const { user } = useAuth();
  const [perf,    setPerf]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    usersApi.getPerformance(user._id)
      .then(r => setPerf(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="py-16 text-center text-slate-400">Loading...</div>;

  return (
    <div className="space-y-5">
      <PageHeader title="Area Performance" subtitle="Your area's sales performance" />

      {perf && (
        <div className="grid grid-cols-2 gap-4">
          <Card><div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center"><TrendingUp size={18} className="text-green-600"/></div><div><p className="text-xs text-slate-500">Area Sales</p><p className="text-lg font-bold text-slate-800">{formatCurrency(perf.totalSales)}</p></div></div></Card>
          <Card><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Users size={18} className="text-blue-600"/></div><div><p className="text-xs text-slate-500">Team Size</p><p className="text-lg font-bold text-slate-800">{perf.teamSize}</p></div></div></Card>
        </div>
      )}

      {perf?.monthlyPerformance?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Monthly Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={perf.monthlyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Bar dataKey="sales"  fill="#22c55e" radius={[4,4,0,0]} name="Actual" />
              <Bar dataKey="target" fill="#e2e8f0" radius={[4,4,0,0]} name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
