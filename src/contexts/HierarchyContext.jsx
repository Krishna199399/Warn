import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hierarchyApi } from '../api/hierarchy.api';

// Commission rates (kept as constants — no DB needed)
export const COMMISSION_RATES = {
  ADVISOR:       0.05,
  DO_MANAGER:    0.02,
  AREA_MANAGER:  0.01,
  ZONAL_MANAGER: 0.005,
  STATE_HEAD:    0.002,
};

const HierarchyContext = createContext(null);

export function HierarchyProvider({ children }) {
  const [nodes,       setNodes]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  // ── Fetch full hierarchy tree from API ────────────────────────────────────
  const fetchTree = useCallback(async () => {
    // Don't fetch if there's no session — avoids 401 spam on login page
    if (!sessionStorage.getItem('accessToken')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await hierarchyApi.getTree();
      setNodes(res.data.data || []);
    } catch (err) {
      // Silently ignore 401 (handled by Axios interceptor / AuthContext)
      if (err.response?.status !== 401) {
        setError(err.response?.data?.error || 'Failed to load hierarchy');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  // ── Build recursive tree from flat node list ───────────────────────────────
  const buildTree = useCallback((rootId) => {
    const id  = rootId?.toString();
    const root = nodes.find(n => (n._id || n.id)?.toString() === id);
    if (!root) return null;

    const children = nodes
      .filter(n => n.parentId?.toString() === id)
      .map(child => buildTree((child._id || child.id)?.toString()))
      .filter(Boolean);

    return { ...root, id: root._id || root.id, children };
  }, [nodes]);

  // ── Get all root nodes (no parent) ────────────────────────────────────────
  const getEmployeeRoots = useCallback(() =>
    nodes.filter(n => !n.parentId)
  , [nodes]);

  // ── executePromotion — called by PromotionContext on admin approval ────────
  // Locally updates the node in state so hierarchy view refreshes instantly,
  // then re-fetches from server for ground truth.
  const executePromotion = useCallback(async (userId, newRole) => {
    const id = userId?.toString();
    setNodes(prev => prev.map(n => {
      if ((n._id || n.id)?.toString() !== id) return n;
      // Find grandparent (new parent after promotion)
      const currentParent = prev.find(p => (p._id || p.id)?.toString() === n.parentId?.toString());
      const newParentId   = currentParent?.parentId ?? null;
      return {
        ...n,
        role:         newRole,
        parentId:     newParentId,
        previousRole: n.role,
        isPromoted:   true,
        promotedAt:   new Date().toISOString(),
      };
    }));
    // Re-sync from server
    try { await fetchTree(); } catch (_) {}
  }, [fetchTree]);

  return (
    <HierarchyContext.Provider value={{
      nodes, loading, error,
      fetchTree, buildTree, getEmployeeRoots,
      executePromotion,
      // Expose empty commissions/orders arrays — CommissionPage uses its own API
      commissions: [],
      orders: [],
    }}>
      {children}
    </HierarchyContext.Provider>
  );
}

export function useHierarchy() {
  const ctx = useContext(HierarchyContext);
  if (!ctx) throw new Error('useHierarchy must be used inside HierarchyProvider');
  return ctx;
}
