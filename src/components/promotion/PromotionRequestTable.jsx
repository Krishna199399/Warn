import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Shield, AlertTriangle } from 'lucide-react';
import { PROMOTION_STATUS } from '../../contexts/PromotionContext';
import { ROLE_LABELS } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/helpers';
import { Badge, Modal } from '../ui';

const STATUS_BADGE = {
  [PROMOTION_STATUS.REQUESTED]:       { color: 'blue',   label: 'Pending Review'   },
  [PROMOTION_STATUS.PARENT_APPROVED]: { color: 'purple', label: 'Manager Approved' },
  [PROMOTION_STATUS.ADMIN_APPROVED]:  { color: 'green',  label: 'Promoted ✓'       },
  [PROMOTION_STATUS.REJECTED]:        { color: 'red',    label: 'Rejected'          },
  [PROMOTION_STATUS.ELIGIBLE]:        { color: 'amber',  label: 'Eligible'          },
};

/**
 * PromotionRequestTable
 * variant: 'parent' | 'admin' | 'view'
 * requests: array of request objects from PromotionContext
 * currentUserId: for authorization check
 * currentUserRole: for admin check
 * onApprove / onReject: callbacks
 */
export default function PromotionRequestTable({
  requests = [],
  variant = 'view',
  currentUserId,
  currentUserRole,
  onApprove,
  onReject,
}) {
  const [rejectModal, setRejectModal] = useState(null); // { requestId }
  const [rejectReason, setRejectReason] = useState('');
  const [approveModal, setApproveModal] = useState(null);
  const [approveNote, setApproveNote] = useState('');

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
          <Clock size={22} className="text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-500">No promotion requests</p>
        <p className="text-xs text-slate-400 mt-1">Requests from your team will appear here.</p>
      </div>
    );
  }

  const handleApproveSubmit = () => {
    if (approveModal) {
      onApprove(approveModal.id, approveNote);
      setApproveModal(null);
      setApproveNote('');
    }
  };

  const handleRejectSubmit = () => {
    if (rejectModal) {
      onReject(rejectModal.id, rejectReason);
      setRejectModal(null);
      setRejectReason('');
    }
  };

  return (
    <>
      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              {['Employee', 'Current Role', 'Requesting', 'Sales', 'Team', 'Requested', 'Status', ...(variant !== 'view' ? ['Actions'] : [])].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.map(req => {
              const badge = STATUS_BADGE[req.status] || STATUS_BADGE[PROMOTION_STATUS.REQUESTED];
              const canAct =
                (variant === 'parent' && req.parentId === currentUserId && req.status === PROMOTION_STATUS.REQUESTED) ||
                (variant === 'admin' && req.status === PROMOTION_STATUS.PARENT_APPROVED);

              return (
                <tr key={req.id} className="table-row">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                    {req.userId?.name || req.userName || 'Unknown User'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-slate-100 text-slate-600">{ROLE_LABELS[req.userRole]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <span>{ROLE_LABELS[req.userRole]}</span>
                      <span className="text-slate-300">→</span>
                      <span className="font-semibold text-green-700">{ROLE_LABELS[req.nextRole]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 font-medium">—</td>
                  <td className="px-4 py-3 text-sm text-slate-700">—</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(req.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={badge.color}>{badge.label}</Badge>
                    {req.status === PROMOTION_STATUS.REJECTED && req.rejectionReason && (
                      <p className="text-[10px] text-red-400 mt-0.5 max-w-[140px] truncate">{req.rejectionReason}</p>
                    )}
                  </td>
                  {variant !== 'view' && (
                    <td className="px-4 py-3">
                      {canAct ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setApproveModal(req)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle2 size={12} /> Approve
                          </button>
                          <button
                            onClick={() => setRejectModal(req)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Approve Modal */}
      <Modal isOpen={!!approveModal} onClose={() => setApproveModal(null)} title="Approve Promotion Request">
        {approveModal && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 rounded-xl border border-green-100">
              <p className="text-sm text-green-800 font-medium">
                Approving: {approveModal.userName || 'User'} → <strong>{ROLE_LABELS[approveModal.nextRole]}</strong>
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Note (optional)</label>
              <textarea
                value={approveNote}
                onChange={e => setApproveNote(e.target.value)}
                placeholder={variant === 'admin' ? 'Final approval note...' : 'Add a note for admin...'}
                rows={3}
                className="input-field w-full text-sm resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleApproveSubmit}
                className="flex-1 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                <CheckCircle2 size={14} />
                {variant === 'admin' ? 'Final Approve' : 'Approve & Forward to Admin'}
              </button>
              <button onClick={() => setApproveModal(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Promotion Request">
        {rejectModal && (
          <div className="space-y-4">
            <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                Rejecting {rejectModal.userName || 'User'}'s request for <strong>{ROLE_LABELS[rejectModal.nextRole]}</strong>.
                They will be notified with your reason.
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Reason for rejection <span className="text-red-400">*</span></label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Sales targets need improvement, team size insufficient..."
                rows={3}
                className="input-field w-full text-sm resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <XCircle size={14} /> Confirm Rejection
              </button>
              <button onClick={() => setRejectModal(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
