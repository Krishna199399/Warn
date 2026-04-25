import React, { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, Card } from '../components/ui';
import { TrendingUp, Users, Target, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/helpers';

export default function PerformancePage() {
  const { user } = useAuth();
  const [perf,    setPerf]    = useState(null);
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    Promise.all([
      usersApi.getPerformance(user._id),
      usersApi.getAll({ role: 'ADVISOR' }),
    ]).then(([p, a]) => {
      setPerf(p.data.data);
      setAdvisors(a.data.data || []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="py-16 text-center text-slate-400">Loading performance...</div>;

  return (
    <div className="space-y-5">
      <PageHeader title="Performance" subtitle="Your team's performance metrics" />

      {perf && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Total Sales',    value: formatCurrency(perf.totalSales), icon: TrendingUp, bg: 'bg-green-50', color: 'text-green-600' },
            { label: 'Team Size',      value: perf.teamSize,                   icon: Users,      bg: 'bg-blue-50',  color: 'text-blue-600'  },
            { label: 'Advisors',       value: advisors.length,                 icon: Award,      bg: 'bg-amber-50', color: 'text-amber-600' },
          ].map(s => (
            <Card key={s.label}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon size={18} className={s.color} /></div>
                <div><p className="text-xs text-slate-500">{s.label}</p><p className="text-lg font-bold text-slate-800">{s.value}</p></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {perf?.monthlyPerformance?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Monthly Team Sales</h3>
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

      <Card padding={false}>
        <div className="p-4 border-b border-slate-50"><h3 className="text-sm font-semibold text-slate-800">Advisors in my team</h3></div>
        <div className="divide-y divide-slate-50">
          {advisors.slice(0,10).map(a => (
            <div key={a._id} className="px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-bold">{a.avatar || a.name?.slice(0,2)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{a.name}</p>
                <p className="text-xs text-slate-400">{a.region} · {a.advisorCode}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{a.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
