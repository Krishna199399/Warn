import React, { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import { commissionsApi } from '../api/commissions.api';
import { promotionsApi } from '../api/promotions.api';
import { useAuth, ROLE_LABELS } from '../contexts/AuthContext';
import { PROMOTION_CHAIN, promotionRules, getNextRole, checkEligibility, getProgressToPromotion } from '../contexts/PromotionContext';
import { PageHeader, Card } from '../components/ui';
import { TrendingUp, Star, Award, Target, ChevronRight, AlertCircle, CheckCircle2, Clock, Users, DollarSign, TrendingDown, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

export default function MyPerformancePage() {
  const { user } = useAuth();
  const [perf,       setPerf]       = useState(null);
  const [summary,    setSummary]    = useState(null);
  const [myRequest,  setMyReq]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    if (!user?._id) return;
    Promise.all([
      usersApi.getPerformance(user._id),
      commissionsApi.getSummary(),
      promotionsApi.getMy(),
    ]).then(([p, s, r]) => {
      const perfData = p.data.data;
      const summaryData = s.data.data;
      
      // Ensure data consistency
      setPerf(perfData);
      setSummary(summaryData);
      setMyReq(r.data.data);
    }).catch((err) => {
      console.error('Failed to load performance data:', err);
    })
    .finally(() => setLoading(false));
  }, [user]);

  const nextRole    = getNextRole(user?.role);
  const rule        = promotionRules[user?.role];
  const eligible    = perf ? checkEligibility(user?.role, perf) : false;
  const progress    = perf ? getProgressToPromotion(user?.role, perf) : { salesPct: 0, teamPct: 0 };
  const hasActive   = myRequest && ['REQUESTED','PARENT_APPROVED'].includes(myRequest.status);
  const wasApproved = myRequest?.status === 'ADMIN_APPROVED';

  const requestPromotion = async () => {
    setRequesting(true);
    try {
      await promotionsApi.request();
      const r = await promotionsApi.getMy();
      setMyReq(r.data.data);
      showToast('🎉 Promotion request submitted!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit request', false);
    }
    setRequesting(false);
  };

  if (loading) return <div className="py-16 text-center text-slate-400">Loading performance data...</div>;

  // Calculate additional metrics
  const avgMonthlySales = perf?.monthlyPerformance?.length > 0 
    ? perf.monthlyPerformance.reduce((sum, m) => sum + m.sales, 0) / perf.monthlyPerformance.length 
    : 0;
  
  const lastMonthSales = perf?.monthlyPerformance?.[perf.monthlyPerformance.length - 1]?.sales || 0;
  const prevMonthSales = perf?.monthlyPerformance?.[perf.monthlyPerformance.length - 2]?.sales || 0;
  const salesGrowth = prevMonthSales > 0 ? ((lastMonthSales - prevMonthSales) / prevMonthSales * 100) : 0;

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.ok ? <CheckCircle2 size={15}/> : <AlertCircle size={15}/>} {toast.msg}
        </div>
      )}

      <PageHeader title="My Performance" subtitle={`${ROLE_LABELS[user?.role]} — ${user?.region}`} />

      {/* Enhanced Stats row with tooltips */}
      <div className={`grid gap-4 ${user?.role === 'ADVISOR' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow" title="Your total sales revenue from all orders">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">Total Sales</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(perf?.totalSales || 0)}</p>
              <p className="text-xs text-blue-600 mt-1">Avg: {formatCurrency(avgMonthlySales)}/mo</p>
            </div>
            <div className="w-10 h-10 bg-blue-200 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-blue-700" />
            </div>
          </div>
        </Card>

        {/* Hide Team Size card for Advisors - they don't have downline teams */}
        {user?.role !== 'ADVISOR' && (
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow" title="Number of active team members in your downline">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">Team Size</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{perf?.teamSize || 0}</p>
                <p className="text-xs text-green-600 mt-1">Active members</p>
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-green-700" />
              </div>
            </div>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-md transition-shadow" title="Total commission earned from all sources">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-amber-600 font-medium">Total Earnings</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">{formatCurrency(summary?.total || 0)}</p>
              <p className="text-xs text-amber-600 mt-1">All time</p>
            </div>
            <div className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center">
              <DollarSign size={20} className="text-amber-700" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow" title="Commission earned this month">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-purple-600 font-medium">This Month</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{formatCurrency(summary?.thisMonth || 0)}</p>
              <div className="flex items-center gap-1 mt-1">
                {salesGrowth >= 0 ? (
                  <TrendingUp size={12} className="text-green-600" />
                ) : (
                  <TrendingDown size={12} className="text-red-600" />
                )}
                <p className={`text-xs font-medium ${salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {salesGrowth >= 0 ? '+' : ''}{salesGrowth.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="w-10 h-10 bg-purple-200 rounded-xl flex items-center justify-center">
              <Calendar size={20} className="text-purple-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Monthly Performance Chart */}
        {perf?.monthlyPerformance?.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Monthly Performance</h3>
              <span className="text-xs text-slate-500">Last 6 months</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
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

        {/* Sales Trend Chart */}
        {perf?.monthlyPerformance?.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Sales Trend</h3>
              <span className="text-xs text-slate-500">Growth trajectory</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={perf.monthlyPerformance}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fill="url(#salesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Promotion card */}
      {nextRole && (
        <Card className={eligible ? 'border-2 border-green-200 bg-green-50/30' : ''}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${eligible ? 'bg-green-100' : 'bg-slate-100'}`}>
                <Award size={18} className={eligible ? 'text-green-600' : 'text-slate-400'} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Promotion Track</h3>
                <p className="text-xs text-slate-500">{ROLE_LABELS[user?.role]} → {ROLE_LABELS[nextRole]}</p>
              </div>
            </div>
            {eligible && !hasActive && !wasApproved && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                <Star size={10} fill="currentColor" /> ELIGIBLE
              </span>
            )}
          </div>

          {/* Progress bars */}
          {rule && (
            <div className="space-y-3 mb-4">
              {[
                { label: 'Sales Target', pct: progress.salesPct, current: formatCurrency(perf?.totalSales || 0), target: formatCurrency(rule.sales) },
                { label: 'Team Size',    pct: progress.teamPct,  current: perf?.teamSize || 0, target: rule.teamSize },
              ].map(b => (
                <div key={b.label}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{b.label}</span>
                    <span className="font-semibold">{b.current} / {b.target}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${b.pct >= 100 ? 'bg-green-500' : 'bg-blue-400'}`} style={{ width: `${b.pct}%` }} />
                  </div>
                  <p className="text-right text-[10px] text-slate-400 mt-0.5">{b.pct}%</p>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          {wasApproved ? (
            <div className="flex items-center gap-2 p-3 bg-green-100 rounded-xl">
              <CheckCircle2 size={16} className="text-green-600" />
              <p className="text-sm font-semibold text-green-700">🎉 You've been promoted to {ROLE_LABELS[nextRole || user?.role]}!</p>
            </div>
          ) : hasActive ? (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
              <Clock size={16} className="text-blue-500" />
              <p className="text-sm text-blue-600">Request submitted — status: <strong>{myRequest.status.replace(/_/g,' ')}</strong></p>
            </div>
          ) : eligible ? (
            <button onClick={requestPromotion} disabled={requesting}
              className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-60">
              {requesting ? 'Submitting...' : `🚀 Request Promotion → ${ROLE_LABELS[nextRole]}`}
              {!requesting && <ChevronRight size={14} />}
            </button>
          ) : (
            <div className="space-y-2">
              <button disabled
                className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 rounded-lg text-sm font-semibold border-2 border-dashed border-slate-300 cursor-not-allowed flex items-center justify-center gap-2">
                <Award size={16} />
                Request Promotion (Not Eligible Yet)
              </button>
              <p className="text-xs text-slate-500 text-center">Complete both targets above to unlock this button</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
