import React, { createContext, useContext, useState, useCallback } from 'react';
import { promotionsApi } from '../api/promotions.api';

// Keep pure helper constants (no DB needed)
export const PROMOTION_CHAIN = ['ADVISOR','DO_MANAGER','AREA_MANAGER','ZONAL_MANAGER','STATE_HEAD'];

export const PROMOTION_STATUS = {
  NONE:            'NONE',
  ELIGIBLE:        'ELIGIBLE',
  REQUESTED:       'REQUESTED',
  PARENT_APPROVED: 'PARENT_APPROVED',
  ADMIN_APPROVED:  'ADMIN_APPROVED',
  REJECTED:        'REJECTED',
};

export const promotionRules = {
  ADVISOR:       { sales: 50000,   teamSize: 5,   label: 'Advisor → DO Manager' },
  DO_MANAGER:    { sales: 200000,  teamSize: 20,  label: 'DO Manager → Area Manager' },
  AREA_MANAGER:  { sales: 500000,  teamSize: 50,  label: 'Area Manager → Zonal Manager' },
  ZONAL_MANAGER: { sales: 1000000, teamSize: 100, label: 'Zonal Manager → State Head' },
};

export const getNextRole = (role) => {
  const idx = PROMOTION_CHAIN.indexOf(role);
  return idx === -1 || idx === PROMOTION_CHAIN.length - 1 ? null : PROMOTION_CHAIN[idx + 1];
};

export const checkEligibility = (userRole, performance) => {
  const rule = promotionRules[userRole];
  if (!rule || !performance) return false;
  return performance.totalSales >= rule.sales && performance.teamSize >= rule.teamSize;
};

export const getProgressToPromotion = (userRole, performance) => {
  const rule = promotionRules[userRole];
  if (!rule || !performance) return { salesPct: 0, teamPct: 0 };
  return {
    salesPct: Math.min(Math.round((performance.totalSales / rule.sales) * 100), 100),
    teamPct:  Math.min(Math.round((performance.teamSize  / rule.teamSize)  * 100), 100),
  };
};

const PromotionContext = createContext(null);

export function PromotionProvider({ children }) {
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(false);

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await promotionsApi.getAll();
      setRequests(res.data.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  // ── Submit request ─────────────────────────────────────────────────────────
  const submitRequest = useCallback(async () => {
    const res = await promotionsApi.request();
    await fetchAll();
    return { success: true, data: res.data.data };
  }, [fetchAll]);

  // ── Parent approval ────────────────────────────────────────────────────────
  const approveByParent = useCallback(async (requestId, _, note) => {
    try {
      await promotionsApi.approveParent(requestId, note || '');
      await fetchAll();
      return { success: true, message: 'Approved and forwarded to Admin' };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Failed to approve' };
    }
  }, [fetchAll]);

  const rejectByParent = useCallback(async (requestId, _, reason) => {
    try {
      await promotionsApi.rejectParent(requestId, reason || '');
      await fetchAll();
      return { success: true, message: 'Request rejected' };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Failed to reject' };
    }
  }, [fetchAll]);

  // ── Admin approval (triggers real DB role change + hierarchy reassignment)
  const approveByAdmin = useCallback(async (
    requestId, _role, note, promoteUserFn, executePromotionFn
  ) => {
    try {
      const res  = await promotionsApi.approveAdmin(requestId, note || '');
      const data = res.data.data;
      // Update live session if promoted user == current user
      if (typeof promoteUserFn === 'function') {
        promoteUserFn(data?.user?._id, data?.request?.nextRole);
      }
      // Refresh hierarchy tree
      if (typeof executePromotionFn === 'function') {
        executePromotionFn(data?.user?._id, data?.request?.nextRole);
      }
      await fetchAll();
      return { success: true, message: res.data.message || '🎉 Promoted!' };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Failed to approve' };
    }
  }, [fetchAll]);

  const rejectByAdmin = useCallback(async (requestId, _role, reason) => {
    try {
      await promotionsApi.rejectAdmin(requestId, reason || '');
      await fetchAll();
      return { success: true, message: 'Request rejected' };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Failed' };
    }
  }, [fetchAll]);

  // ── Derived view helpers ───────────────────────────────────────────────────
  const getPendingForManager = useCallback((userId) =>
    requests.filter(r =>
      r.parentId === userId || r.parentId?._id === userId ||
      r.parentId?.toString() === userId?.toString()
    )
  , [requests]);

  const getAllPendingAdmin = useCallback(() =>
    requests.filter(r => r.status === PROMOTION_STATUS.PARENT_APPROVED)
  , [requests]);

  const getAllRequests = useCallback(() => requests, [requests]);

  const getMyRequest = useCallback((userId) =>
    requests.find(r =>
      r.userId === userId || r.userId?._id === userId ||
      r.userId?.toString() === userId?.toString()
    ) || null
  , [requests]);

  return (
    <PromotionContext.Provider value={{
      requests, loading,
      fetchAll, submitRequest,
      approveByParent, rejectByParent,
      approveByAdmin,  rejectByAdmin,
      getPendingForManager, getAllPendingAdmin,
      getAllRequests, getMyRequest,
    }}>
      {children}
    </PromotionContext.Provider>
  );
}

export function usePromotion() {
  const ctx = useContext(PromotionContext);
  if (!ctx) throw new Error('usePromotion must be inside PromotionProvider');
  return ctx;
}
