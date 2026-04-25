import React, { useState } from 'react';
import {
  Award, Clock, CheckCircle2, XCircle, ChevronRight,
  AlertTriangle, Sparkles, Shield,
} from 'lucide-react';
import { PROMOTION_STATUS, promotionRules, getNextRole, usePromotion } from '../../contexts/PromotionContext';
import { ROLE_LABELS } from '../../contexts/AuthContext';

const STATUS_CONFIG = {
  [PROMOTION_STATUS.NONE]: {
    icon: Award,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-400',
    label: 'Not Yet Eligible',
    labelColor: 'text-slate-500',
    bg: 'bg-slate-50 border-slate-100',
    desc: 'Keep growing your sales and team to unlock promotion eligibility.',
  },
  [PROMOTION_STATUS.ELIGIBLE]: {
    icon: Sparkles,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    label: 'Eligible for Promotion! 🎉',
    labelColor: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    desc: 'You\'ve met all the criteria. Request your promotion now!',
  },
  [PROMOTION_STATUS.REQUESTED]: {
    icon: Clock,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    label: 'Request Submitted',
    labelColor: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    desc: 'Your promotion request is awaiting your manager\'s approval.',
  },
  [PROMOTION_STATUS.PARENT_APPROVED]: {
    icon: Shield,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    label: 'Manager Approved',
    labelColor: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
    desc: 'Your manager approved! Awaiting final Admin approval.',
  },
  [PROMOTION_STATUS.ADMIN_APPROVED]: {
    icon: CheckCircle2,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    label: '🎉 Promotion Approved!',
    labelColor: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    desc: 'Congratulations! Your promotion has been officially approved.',
  },
  [PROMOTION_STATUS.REJECTED]: {
    icon: XCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
    label: 'Request Rejected',
    labelColor: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    desc: 'Your promotion request was not approved this time.',
  },
};

/**
 * PromotionStatusCard — shows current promotion status and action button.
 * Props:
 *  - userId:   logged-in user id
 *  - userRole: logged-in user role
 */
export default function PromotionStatusCard({ userId, userRole }) {
  const { getMyStatus, requestPromotion, getMyRequest } = usePromotion();
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const status = getMyStatus(userId, userRole);
  const myRequest = getMyRequest(userId);
  const nextRole = getNextRole(userRole);
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG[PROMOTION_STATUS.NONE];
  const StatusIcon = cfg.icon;

  const handleRequest = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = requestPromotion(userId, userRole);
    setToast(result);
    setIsLoading(false);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
          <Award size={16} className="text-purple-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">Promotion Status</h3>
      </div>

      {/* Status block */}
      <div className={`rounded-xl border p-4 ${cfg.bg} mb-4`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-9 h-9 ${cfg.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <StatusIcon size={18} className={cfg.iconColor} />
          </div>
          <div>
            <p className={`text-sm font-bold ${cfg.labelColor}`}>{cfg.label}</p>
            {nextRole && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                {ROLE_LABELS[userRole]}
                <ChevronRight size={11} />
                {ROLE_LABELS[nextRole]}
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500">{cfg.desc}</p>

        {/* Rejection reason */}
        {status === PROMOTION_STATUS.REJECTED && myRequest?.rejectionReason && (
          <div className="mt-2 flex items-start gap-2 p-2 bg-red-100 rounded-lg">
            <AlertTriangle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-600">{myRequest.rejectionReason}</p>
          </div>
        )}
      </div>

      {/* Show criteria reminder for NONE status */}
      {status === PROMOTION_STATUS.NONE && promotionRules[userRole] && (
        <div className="text-xs text-slate-400 space-y-1 mb-4">
          <p className="font-semibold text-slate-500">Requirements to unlock:</p>
          <p>• Sales ≥ ₹{promotionRules[userRole].sales.toLocaleString()}</p>
          <p>• Team Size ≥ {promotionRules[userRole].teamSize}</p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`mb-3 px-3 py-2 rounded-lg text-xs font-medium ${
          toast.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Action button */}
      {(status === PROMOTION_STATUS.ELIGIBLE || status === PROMOTION_STATUS.REJECTED) && (
        <button
          onClick={handleRequest}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl
            hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {status === PROMOTION_STATUS.REJECTED ? 'Re-apply for Promotion' : 'Request Promotion'}
        </button>
      )}

      {/* Go to My Performance link */}
      <a href="/my-performance" className="mt-3 flex items-center justify-center gap-1 text-xs text-blue-600 hover:underline">
        View full performance details <ChevronRight size={12} />
      </a>
    </div>
  );
}
