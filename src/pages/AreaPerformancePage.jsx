import React, { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-4">{[1,2].map(i=><Skeleton key={i} className="h-24 rounded-xl"/>)}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Area Performance</h1>
        <p className="text-muted-foreground text-sm mt-1">Your area's sales performance</p>
      </div>

      {perf && (
        <div className="grid grid-cols-2 gap-4">
          <Card key="sales">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><TrendingUp size={18} className="text-primary"/></div>
              <div><p className="text-xs text-muted-foreground">Area Sales</p><p className="text-lg font-bold">{formatCurrency(perf.totalSales)}</p></div>
            </CardContent>
          </Card>
          <Card key="team">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Users size={18} className="text-blue-600"/></div>
              <div><p className="text-xs text-muted-foreground">Team Size</p><p className="text-lg font-bold">{perf.teamSize}</p></div>
            </CardContent>
          </Card>
        </div>
      )}

      {perf?.monthlyPerformance?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Performance</CardTitle></CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
