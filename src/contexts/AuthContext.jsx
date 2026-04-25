import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api';

// ─── Role constants ───────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN:         'ADMIN',
  STATE_HEAD:    'STATE_HEAD',
  ZONAL_MANAGER: 'ZONAL_MANAGER',
  AREA_MANAGER:  'AREA_MANAGER',
  DO_MANAGER:    'DO_MANAGER',
  ADVISOR:       'ADVISOR',
  WHOLESALE:     'WHOLESALE',
  MINI_STOCK:    'MINI_STOCK',
  CUSTOMER:      'CUSTOMER',
};

export const ROLE_LABELS = {
  ADMIN:         'Admin',
  STATE_HEAD:    'State Head',
  ZONAL_MANAGER: 'Zonal Manager',
  AREA_MANAGER:  'Area Manager',
  DO_MANAGER:    'DO Manager',
  ADVISOR:       'Advisor',
  WHOLESALE:     'Wholesale',
  MINI_STOCK:    'Mini Stock',
  CUSTOMER:      'Customer',
};

export const isEmployeeRole = (role) =>
  ['ADMIN','STATE_HEAD','ZONAL_MANAGER','AREA_MANAGER','DO_MANAGER','ADVISOR'].includes(role);

export const isStockRole = (role) =>
  ['WHOLESALE','MINI_STOCK'].includes(role);

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);   // true while checking session on mount
  const [error,   setError]   = useState(null);

  // ── Restore session on page load ──────────────────────────────────────────
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.me()
      .then(res => setUser(res.data.data))
      .catch(() => {
        sessionStorage.removeItem('accessToken');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (identifier, password) => {
    setError(null);
    try {
      const res   = await authApi.login(identifier, password);
      const { accessToken, user: userData } = res.data.data;
      sessionStorage.setItem('accessToken', accessToken);
      setUser(userData);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      return { success: false, message };
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch (_) {}
    sessionStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  // ── promoteUser — called by PromotionContext after admin approval ──────────
  // Updates the current session if the promoted user IS the logged-in user.
  const promoteUser = useCallback(async (userId, newRole) => {
    setUser(prev => {
      if (!prev) return prev;
      const id = prev._id || prev.id;
      if (id !== userId && id !== userId?.toString()) return prev;
      return {
        ...prev,
        role:       newRole,
        isPromoted: true,
        promotedAt: new Date().toISOString(),
        previousRole: prev.role,
        // Archive the advisor code without removing it
        advisorCode: prev.advisorCode,
      };
    });
    // Refresh user object from server to get latest state
    try {
      const res = await authApi.me();
      setUser(res.data.data);
    } catch (_) {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, promoteUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
