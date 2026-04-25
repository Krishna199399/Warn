import React, { useEffect, useState } from 'react';
import { commissionsApi } from '../api/commissions.api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, Card, SkeletonPage, AnimatedStat } from '../components/ui';
import { DollarSign, TrendingUp, Award, BarChart2, ChevronDown, ChevronUp, Download, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/helpers';
import { exportCSV } from '../utils/exportCSV';

export default function CommissionPage() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [expanded,    setExpanded]    = useState({});
  const [loading,     setLoading]     = useState(true);
  const [filterType,  setFilterType]  = useState('ALL');
  const [search,      setSearch]      = useState('');

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      commissionsApi.getMy({ signal: controller.signal }),
      commissionsApi.getSummary({ signal: controller.signal }),
    ]).then(([c, s]) => {
      setCommissions(c.data.data || []);
      setSummary(s.data.data);
    }).catch(() => {})
    .finally(() => setLoading(false));
    return () => controller.abort();
  }, [user]);

  const filtered = commissions.filter(c => {
    const matchType = filterType === 'ALL' || c.type === filterType;
    const matchSearch = !search || 
      c.type?.toLowerCase().includes(search.toLowerCase()) ||
      c.role?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Monthly breakdown
  const monthlyBreakdown = (() => {
    const map = {};
    commissions.forEach(c => {
      const month = c.date?.slice(0,7);
      if (!month) return;
      if (!map[month]) map[month] = 0;
      map[month] += c.amount;
    });
    return Object.entries(map)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month: month.slice(5) + '/' + month.slice(2,4), amount }));
  })();

  if (loading) return <SkeletonPage />;

  return (
    <div className="space-y-5">
      <PageHeader title="My Commissions" subtitle="Snapshot-protected earnings history"
        actions={commissions.length > 0 && (
          <button onClick={() => exportCSV(commissions.map(c => ({
            Type: c.type, Level: c.level, Amount: c.amount, Role: c.role, Date: c.date?.slice(0,10), Snapshot: c.snapshotUsed ? 'Yes' : 'No'
          })), 'commissions')} className="btn-export">
            <Download size={12} /> Export CSV
          </button>
        )}
      />

      {/* Summary cards with tooltips */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Earned',    value: summary.total,        icon: DollarSign,  bg: 'bg-green-50',   color: 'text-green-600',   tooltip: 'Total commission from all sources' },
            { label: 'Retail Price',    value: summary.RETAIL_PRICE, icon: Award,       bg: 'bg-rose-50',    color: 'text-rose-600',    tooltip: '100% of Retail Value for your direct sales' },
            { label: 'Incentive (IV)',  value: summary.IV,           icon: Award,       bg: 'bg-blue-50',    color: 'text-blue-600',    tooltip: 'Incentive pool distribution from hierarchy' },
            { label: 'Salary (SV)',     value: summary.SV,           icon: TrendingUp,  bg: 'bg-purple-50',  color: 'text-purple-600',  tooltip: 'Salary pool distribution from hierarchy' },
            { label: 'Reward (RF)',     value: summary.RF,          icon: BarChart2,   bg: 'bg-amber-50',   color: 'text-amber-600',   tooltip: 'Reward pool distribution from hierarchy' },
            { label: 'This Month',      value: summary.thisMonth,   icon: BarChart2,   bg: 'bg-emerald-50', color: 'text-emerald-600', tooltip: 'Total commission earned this month' },
          ].map(s => (
            <Card key={s.label} title={s.tooltip} className="hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon size={18} className={s.color} /></div>
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-lg font-bold text-slate-800"><AnimatedStat value={s.value || 0} format="currency" /></p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Monthly chart */}
      {monthlyBreakdown.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Monthly Earnings</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(1)}k`} />
              <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0' }} />
              <Bar dataKey="amount" fill="#22c55e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Commission info card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
            <Award size={22} className="text-blue-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900">Understanding Your Commission</h3>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              <strong>Retail Price:</strong> You earn 100% of the Retail Value for your own sales. 
              <strong className="ml-2">IV/SV/RF:</strong> Pool-based earnings from your hierarchy chain (30%/30%/20% of each sale distributed across levels).
            </p>
          </div>
        </div>
      </Card>

      {/* Filters - Mobile optimized */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {['ALL', 'RETAIL_PRICE', 'IV', 'SV', 'RF'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${filterType === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t === 'ALL' ? 'All' : t === 'RETAIL_PRICE' ? 'Retail' : t}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-8 text-xs py-1.5 w-full" placeholder="Search..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Commission records */}
      <Card padding={false}>
        <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Commission Records</h3>
          <p className="text-xs text-slate-400">{filtered.length} records</p>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No commissions match this filter.
            {filterType !== 'ALL' && (
              <p className="text-xs mt-2 text-slate-500">Try selecting "All" to see all commission types</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((c, i) => {
              const open = expanded[c._id];
              return (
                <div key={c._id || i}>
                  <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setExpanded(prev => ({ ...prev, [c._id]: !open }))}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        c.type === 'RETAIL_PRICE' ? 'bg-rose-100 text-rose-700' :
                        c.type === 'IV' ? 'bg-blue-100 text-blue-700' : 
                        c.type === 'SV' ? 'bg-purple-100 text-purple-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {c.type === 'RETAIL_PRICE' ? 'RP' : c.type}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.type === 'RETAIL_PRICE' ? 'Retail Price' : c.type} - {c.role?.replace(/_/g,' ')}</p>
                        <p className="text-xs text-slate-400">{c.level} · {c.percentage}% {c.type === 'RETAIL_PRICE' ? 'of RV' : 'of pool'} · {c.date?.slice(0,10)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-green-700">{formatCurrency(c.amount)}</p>
                      {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </div>
                  </div>
                  {open && (
                    <div className="px-5 pb-3 pt-0 bg-slate-50/60">
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <span>Type: <strong className={
                          c.type === 'RETAIL_PRICE' ? 'text-rose-700' :
                          c.type === 'IV' ? 'text-blue-700' : 
                          c.type === 'SV' ? 'text-purple-700' : 
                          'text-amber-700'
                        }>{c.type === 'RETAIL_PRICE' ? 'Retail Price' : c.type}</strong></span>
                        <span>{c.type === 'RETAIL_PRICE' ? 'Sale Amount' : 'Pool Amount'}: <strong>{formatCurrency(c.poolAmount)}</strong></span>
                        <span>Your %: <strong>{c.percentage}%</strong></span>
                        <span>Your Earning: <strong className="text-green-700">{formatCurrency(c.amount)}</strong></span>
                        <span>Sale RV: <strong>{formatCurrency(c.saleRV)}</strong></span>
                        <span>Level: <strong>{c.level}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
