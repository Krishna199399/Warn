import React, { useState, useEffect } from 'react';
import { Award, Users, CheckCircle2, Clock, XCircle, Shield, ChevronRight, Star, TrendingUp, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES, ROLE_LABELS } from '../contexts/AuthContext';
import { usePromotion, PROMOTION_STATUS } from '../contexts/PromotionContext';
import { useHierarchy } from '../contexts/HierarchyContext';
import { PageHeader, Card, Badge } from '../components/ui';
import PromotionRequestTable from '../components/promotion/PromotionRequestTable';
import { usersApi } from '../api/users.api';
import { promotionsApi } from '../api/promotions.api';
import { promotionRules, getNextRole, checkEligibility, getProgressToPromotion } from '../contexts/PromotionContext';
import { formatCurrency } from '../utils/helpers';

// ─── Summary stat mini-card ───────────────────────────────────────────────────
function MiniStat({ label, value, icon: Icon, color }) {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-600',
    amber:  'bg-amber-50 text-amber-600',
    green:  'bg-green-50 text-green-600',
    red:    'bg-red-50 text-red-500',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// ─── Timeline / recent activity ───────────────────────────────────────────────
function RequestTimeline({ request }) {
  const steps = [
    { label: 'Submitted',       done: true,                            color: 'bg-blue-500'   },
    { label: 'Manager Review',  done: [PROMOTION_STATUS.PARENT_APPROVED, PROMOTION_STATUS.ADMIN_APPROVED].includes(request.status),
                                                                        color: 'bg-purple-500' },
    { label: 'Admin Approval',  done: request.status === PROMOTION_STATUS.ADMIN_APPROVED,
                                                                        color: 'bg-green-500'  },
  ];
  if (request.status === PROMOTION_STATUS.REJECTED) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-500">
        <XCircle size={14} /> Rejected{request.rejectionReason ? `: ${request.rejectionReason}` : ''}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <React.Fragment key={s.label}>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${s.done ? s.color : 'bg-slate-200'}`} />
            <span className={`text-[10px] ${s.done ? 'text-slate-600 font-medium' : 'text-slate-300'}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <div className="w-4 h-px bg-slate-200" />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function PromotionRequestsPage() {
  const navigate = useNavigate();
  const { user, promoteUser } = useAuth();
  const { executePromotion } = useHierarchy();

  const [activeTab, setActiveTab] = useState('pending');
  const [toast, setToast] = useState(null);
  const [perf, setPerf] = useState(null);
  const [myRequest, setMyReq] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isEmployee = ![ROLES.ADMIN, ROLES.WHOLESALE, ROLES.MINI_STOCK].includes(user?.role);

  // Load promotion requests from API
  useEffect(() => {
    const loadData = async () => {
      try {
        if (isAdmin) {
          // Admin: load pending admin requests and all requests
          const [pending, all] = await Promise.all([
            promotionsApi.getPendingAdmin(),
            promotionsApi.getAll(),
          ]);
          setPendingRequests(pending.data.data || []);
          setAllRequests(all.data.data || []);
        } else if (isEmployee) {
          // Employee: load their performance, their request, and pending requests for approval
          const [p, r, pending, all] = await Promise.all([
            usersApi.getPerformance(user._id),
            promotionsApi.getMy(),
            promotionsApi.getPending(),
            promotionsApi.getAll(),
          ]);
          setPerf(p.data.data);
          setMyReq(r.data.data);
          setPendingRequests(pending.data.data || []);
          setAllRequests(all.data.data || []);
        } else {
          // Stock users: just load all requests
          const all = await promotionsApi.getAll();
          setAllRequests(all.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load promotion data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      loadData();
    }
  }, [user, isAdmin, isEmployee]);

  const nextRole = getNextRole(user?.role);
  const rule = promotionRules[user?.role];
  const eligible = perf ? checkEligibility(user?.role, perf) : false;
  const progress = perf ? getProgressToPromotion(user?.role, perf) : { salesPct: 0, teamPct: 0 };
  const hasActive = myRequest && ['REQUESTED','PARENT_APPROVED'].includes(myRequest.status);
  const wasApproved = myRequest?.status === 'ADMIN_APPROVED';

  // Build views
  const pendingForMe = pendingRequests;

  // Summary counts
  const totalRequests  = allRequests.length;
  const pendingCount   = allRequests.filter(r => r.status === PROMOTION_STATUS.REQUESTED).length;
  const approvedCount  = allRequests.filter(r => r.status === PROMOTION_STATUS.ADMIN_APPROVED).length;
  const rejectedCount  = allRequests.filter(r => r.status === PROMOTION_STATUS.REJECTED).length;
  const waitingAdmin   = allRequests.filter(r => r.status === PROMOTION_STATUS.PARENT_APPROVED).length;

  const showToast = (message, success = true) => {
    setToast({ message, success });
    setTimeout(() => setToast(null), 3500);
  };

  const requestPromotion = async () => {
    setRequesting(true);
    try {
      await promotionsApi.request();
      const r = await promotionsApi.getMy();
      setMyReq(r.data.data);
      showToast('🎉 Promotion request submitted successfully!', true);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit request', false);
    }
    setRequesting(false);
  };

  const handleApprove = async (reqId, note) => {
    try {
      if (isAdmin) {
        await promotionsApi.approveAdmin(reqId, note);
        showToast('✅ Promotion approved successfully!', true);
      } else {
        await promotionsApi.approveParent(reqId, note);
        showToast('✅ Request approved and forwarded to admin', true);
      }
      
      // Reload data
      const [pending, all] = await Promise.all([
        isAdmin ? promotionsApi.getPendingAdmin() : promotionsApi.getPending(),
        promotionsApi.getAll(),
      ]);
      setPendingRequests(pending.data.data || []);
      setAllRequests(all.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to approve request', false);
    }
  };

  const handleReject = async (reqId, reason) => {
    try {
      if (isAdmin) {
        await promotionsApi.rejectAdmin(reqId, reason);
      } else {
        await promotionsApi.rejectParent(reqId, reason);
      }
      showToast('Request rejected', true);
      
      // Reload data
      const [pending, all] = await Promise.all([
        isAdmin ? promotionsApi.getPendingAdmin() : promotionsApi.getPending(),
        promotionsApi.getAll(),
      ]);
      setPendingRequests(pending.data.data || []);
      setAllRequests(all.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to reject request', false);
    }
  };

  const tabs = [
    { id: 'pending', label: isAdmin ? 'Awaiting Final Approval' : 'Pending My Approval', count: pendingForMe.length },
    { id: 'all', label: 'All Requests', count: totalRequests },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Promotion Requests" subtitle="Loading..." />
        <div className="py-16 text-center text-slate-400">Loading promotion data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={isAdmin ? 'Promotion Management' : 'Promotion Requests'}
        subtitle={isAdmin
          ? 'Review and give final approval to promotion requests'
          : isEmployee 
            ? 'Track your promotion progress and submit requests'
            : `Manage promotion requests from your direct downline`}
        actions={
          pendingForMe.length > 0 && (
            <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1.5">
              <Clock size={12} /> {pendingForMe.length} awaiting your action
            </span>
          )
        }
      />

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
          toast.success ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
        }`}>
          {toast.success ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
          {toast.message}
        </div>
      )}

      {/* Employee Promotion Card - Show for non-admin employees */}
      {isEmployee && nextRole && !loading && (
        <Card className={eligible ? 'border-2 border-green-200 bg-green-50/30' : 'border-2 border-blue-200 bg-blue-50/30'}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${eligible ? 'bg-green-100' : 'bg-blue-100'}`}>
                <Award size={22} className={eligible ? 'text-green-600' : 'text-blue-600'} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Your Promotion Track</h3>
                <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-0.5">
                  {ROLE_LABELS[user?.role]} 
                  <ChevronRight size={14} className="text-slate-400" />
                  <span className="font-semibold text-green-600">{ROLE_LABELS[nextRole]}</span>
                </p>
              </div>
            </div>
            {eligible && !hasActive && !wasApproved && (
              <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1.5">
                <Star size={12} fill="currentColor" /> ELIGIBLE NOW
              </span>
            )}
          </div>

          {/* Progress bars */}
          {rule && (
            <div className="space-y-3 mb-4">
              {[
                { label: 'Sales Target', pct: progress.salesPct, current: formatCurrency(perf?.totalSales || 0), target: formatCurrency(rule.sales), icon: TrendingUp },
                { label: 'Team Size',    pct: progress.teamPct,  current: perf?.teamSize || 0, target: rule.teamSize, icon: Users },
              ].map(b => (
                <div key={b.label}>
                  <div className="flex justify-between items-center text-sm text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5 font-medium">
                      <b.icon size={14} className="text-slate-500" />
                      {b.label}
                    </span>
                    <span className="font-bold">{b.current} / {b.target}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${b.pct >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-blue-500'}`} style={{ width: `${Math.min(b.pct, 100)}%` }} />
                  </div>
                  <p className="text-right text-xs text-slate-500 mt-1 font-semibold">{b.pct.toFixed(0)}% Complete</p>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          {wasApproved ? (
            <div className="flex items-center gap-2 p-4 bg-green-100 rounded-xl border border-green-200">
              <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-green-700">🎉 Congratulations! You've been promoted to {ROLE_LABELS[nextRole || user?.role]}!</p>
            </div>
          ) : hasActive ? (
            <div className="flex items-center gap-2 p-4 bg-blue-100 rounded-xl border border-blue-200">
              <Clock size={18} className="text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-700">Request Under Review</p>
                <p className="text-xs text-blue-600 mt-0.5">Status: <strong>{myRequest.status.replace(/_/g,' ')}</strong></p>
              </div>
            </div>
          ) : eligible ? (
            <button onClick={requestPromotion} disabled={requesting}
              className="btn-primary w-full justify-center py-3 text-base font-bold disabled:opacity-60 shadow-lg">
              {requesting ? 'Submitting Request...' : `🚀 Apply for Promotion to ${ROLE_LABELS[nextRole]}`}
            </button>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-600 text-center">
                <strong>Keep going!</strong> Complete both targets above to become eligible for promotion.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat label="Total Requests"   value={totalRequests} icon={Award}         color="blue"   />
        <MiniStat label="Pending Review"   value={pendingCount}  icon={Clock}         color="amber"  />
        <MiniStat label="Waiting Admin"    value={waitingAdmin}  icon={Shield}        color="purple" />
        <MiniStat label="Promoted"         value={approvedCount} icon={CheckCircle2}  color="green"  />
      </div>

      {/* How promotion flow works (info panel) */}
      {totalRequests === 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
              <Award size={16} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">How the Promotion Flow Works</h3>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            {[
              { step: '1', title: 'Employee Eligible', desc: 'System checks sales & team size criteria', color: 'bg-blue-50 text-blue-700' },
              { step: '2', title: 'Request Sent',      desc: 'Employee clicks "Request Promotion"',      color: 'bg-amber-50 text-amber-700' },
              { step: '3', title: 'Parent Reviews',    desc: 'Direct manager approves or rejects',       color: 'bg-purple-50 text-purple-700' },
              { step: '4', title: 'Admin Finalizes',   desc: 'Admin gives final approval',               color: 'bg-green-50 text-green-700' },
            ].map(s => (
              <div key={s.step} className={`p-3 rounded-xl ${s.color.split(' ')[0]} border border-current/10`}>
                <span className={`text-xs font-bold ${s.color.split(' ')[1]} mb-1 block`}>Step {s.step}</span>
                <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-100">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'pending' && (
        <Card padding={false}>
          <div className="p-5 border-b border-slate-50">
            <h3 className="text-sm font-semibold text-slate-800">
              {isAdmin ? 'Manager-Approved Requests — Awaiting Final Approval' : 'Requests Awaiting Your Approval'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAdmin
                ? 'These have already been approved by the direct manager.'
                : 'Only requests from your direct downline are shown here.'}
            </p>
          </div>
          <PromotionRequestTable
            requests={pendingForMe}
            variant={isAdmin ? 'admin' : 'parent'}
            currentUserId={user?.id}
            currentUserRole={user?.role}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </Card>
      )}

      {activeTab === 'all' && (
        <Card padding={false}>
          <div className="p-5 border-b border-slate-50">
            <h3 className="text-sm font-semibold text-slate-800">All Promotion Requests</h3>
            <p className="text-xs text-slate-400 mt-0.5">Complete history of all requests in the system.</p>
          </div>
          {allRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                <Award size={22} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No requests yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Ask eligible employees to request their promotion from the Dashboard or My Performance page.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {allRequests.map(req => {
                const statusColors = {
                  [PROMOTION_STATUS.REQUESTED]:       'blue',
                  [PROMOTION_STATUS.PARENT_APPROVED]: 'purple',
                  [PROMOTION_STATUS.ADMIN_APPROVED]:  'green',
                  [PROMOTION_STATUS.REJECTED]:        'red',
                };
                const statusLabels = {
                  [PROMOTION_STATUS.REQUESTED]:       'Pending Review',
                  [PROMOTION_STATUS.PARENT_APPROVED]: 'Manager Approved',
                  [PROMOTION_STATUS.ADMIN_APPROVED]:  'Promoted ✓',
                  [PROMOTION_STATUS.REJECTED]:        'Rejected',
                };
                return (
                  <div key={req._id} className="px-5 py-4 flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      req.status === PROMOTION_STATUS.ADMIN_APPROVED ? 'bg-green-100' : 'bg-slate-100'
                    }`}>
                      {req.status === PROMOTION_STATUS.ADMIN_APPROVED
                        ? <Star size={16} className="text-green-600" />
                        : <Users size={16} className="text-slate-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-slate-800">
                          {req.userId?.name || 'Unknown User'}
                        </p>
                        <Badge color={statusColors[req.status] || 'slate'}>{statusLabels[req.status] || req.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        {ROLE_LABELS[req.currentRole]}
                        <ChevronRight size={11} />
                        <span className={req.status === PROMOTION_STATUS.ADMIN_APPROVED ? 'text-green-600 font-semibold' : ''}>
                          {ROLE_LABELS[req.targetRole]}
                        </span>
                        <span className="mx-1">·</span>
                        {new Date(req.createdAt).toLocaleDateString('en-IN')}
                      </p>
                      {/* Show what changed after promotion */}
                      {req.status === PROMOTION_STATUS.ADMIN_APPROVED && (
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            ✓ Role changed to {ROLE_LABELS[req.targetRole]}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            Parent reassigned in hierarchy
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            Login email unchanged
                          </span>
                          {req.approvedAt && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                              Promoted {new Date(req.approvedAt).toLocaleDateString('en-IN')}
                            </span>
                          )}
                        </div>
                      )}
                      {req.status !== PROMOTION_STATUS.ADMIN_APPROVED && (
                        <div className="mt-1.5">
                          <RequestTimeline request={req} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
