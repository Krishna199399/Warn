import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api';
import { setTokenGetter } from '../api/client';

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
  // 🔒 SECURITY: Store access token in memory only (not sessionStorage) to prevent XSS attacks
  const [accessToken, setAccessToken] = useState(null);

  // ── Setup token getter for API client ─────────────────────────────────────
  useEffect(() => {
    setTokenGetter(() => accessToken);
    // Setup global token updater for refresh flow
    window.__updateAccessToken = setAccessToken;
    return () => {
      window.__updateAccessToken = null;
    };
  }, [accessToken]);

  // ── Restore session on page load ──────────────────────────────────────────
  useEffect(() => {
    // 🔒 SECURITY: CSRF protection is disabled on backend
    // Try to restore session using refresh token (httpOnly cookie)
    const restoreSession = async () => {
      try {
        // First, try to refresh the access token using the httpOnly refresh token cookie
        const refreshRes = await authApi.refresh();
        const { accessToken: token } = refreshRes.data.data;
        
        // Store the new access token in memory
        setAccessToken(token);
        
        // Now fetch user data with the new token
        const meRes = await authApi.me();
        setUser(meRes.data.data);
      } catch (error) {
        // Refresh failed - user needs to login
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (identifier, password) => {
    setError(null);
    try {
      const res   = await authApi.login(identifier, password);
      const { accessToken: token, user: userData } = res.data.data;
      // 🔒 SECURITY: Store token in memory only (React state)
      setAccessToken(token);
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
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
