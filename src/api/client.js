import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,          // send httpOnly refreshToken cookie
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach access token to every request ──────────────────────────────────────
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-refresh on 401 — with infinite-loop protection ───────────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

const redirectToLogin = () => {
  sessionStorage.removeItem('accessToken');
  // Only redirect if not already on an auth page to avoid redirect loops
  if (!window.location.pathname.startsWith('/login') &&
      !window.location.pathname.startsWith('/register')) {
    window.location.href = '/login';
  }
};

client.interceptors.response.use(
  res => res,
  async (error) => {
    const original = error.config;

    // ── Skip retry for: ──────────────────────────────────────────────────────
    // 1. Already retried requests
    // 2. The refresh endpoint itself (prevents refresh → 401 → refresh loop)
    // 3. Auth endpoints (login, register)
    // 4. Non-401 errors
    const isAuthEndpoint = original.url?.includes('/auth/');
    if (
      error.response?.status !== 401 ||
      original._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    // ── No token at all → don't even try to refresh ───────────────────────
    const hasToken = !!sessionStorage.getItem('accessToken');
    if (!hasToken) {
      // Silently reject — HierarchyContext and other providers handle this gracefully
      return Promise.reject(error);
    }

    // ── Queue concurrent requests while refreshing ────────────────────────
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        original.headers.Authorization = `Bearer ${token}`;
        return client(original);
      }).catch(err => Promise.reject(err));
    }

    original._retry = true;
    isRefreshing    = true;

    try {
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const { accessToken } = data.data;
      sessionStorage.setItem('accessToken', accessToken);
      processQueue(null, accessToken);
      original.headers.Authorization = `Bearer ${accessToken}`;
      return client(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      redirectToLogin();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default client;
