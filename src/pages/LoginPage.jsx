import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form,     setForm]    = useState({ identifier: '', password: '' });
  const [showPass, setPass]    = useState(false);
  const [submitting, setSub]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSub(true);
    const res = await login(form.identifier, form.password);
    if (res.success) navigate('/dashboard');
    setSub(false);
  };

  const busy = submitting || loading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-500 rounded-2xl shadow-lg mb-4">
            <Leaf size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Warnamayii WANS</h1>
          <p className="text-green-300 text-sm mt-1">Agri Distribution &amp; Network System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-6">Sign in to your account to continue</p>

          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 rounded-xl mb-5 border border-red-100">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email or Phone</label>
              <input
                type="text"
                className="input-field"
                placeholder="admin@wans.com or 1234567890"
                value={form.identifier}
                onChange={e => setForm({ ...form, identifier: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={busy}
              className="btn-primary w-full justify-center py-2.5 text-sm font-semibold disabled:opacity-60">
              {busy
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                : <><LogIn size={16} /> Sign in</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-green-400/60 text-xs mt-4">
          New to WANS?{' '}
          <Link to="/register" className="text-green-300 font-semibold hover:text-white transition-colors">
            Create an account
          </Link>
        </p>
        <p className="text-center text-green-400/40 text-xs mt-2">
          &copy; 2024 Warnamayii Agri Network System
        </p>
      </div>
    </div>
  );
}
