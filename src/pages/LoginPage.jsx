import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, Eye, EyeOff, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPass, setPass] = useState(false);
  const [submitting, setSub] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSub(true);
    const res = await login(form.identifier, form.password);
    if (res.success) navigate('/dashboard');
    setSub(false);
  };

  const busy = submitting || loading;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-stone-50" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-200/35 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-100/20 rounded-full blur-[100px]" />

      <div className="relative w-full max-w-md z-10">
        
        {/* Back to Home Link */}
        <div className="absolute -top-12 left-0">
          <Link 
            to="/" 
            className="group inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-green-700 transition-colors duration-300"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="group-hover:-translate-x-1 transition-transform"
            >
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-white/70 backdrop-blur-md border border-stone-200/60 p-4 rounded-3xl shadow-md hover:scale-[1.02] transition-transform duration-300">
            <img 
              src="/logo-full-tagline.png" 
              srcSet="/logo-full-tagline@2x.png 2x"
              alt="Warnamayii Krishi Resources" 
              className="h-20 w-auto object-contain"
            />
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-white/50 backdrop-blur-xl bg-white/75 p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(22,163,74,0.06)] hover:border-green-200/50 transition-all duration-300">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-stone-850">Welcome back</h2>
            <p className="text-stone-600 text-sm mt-1.5 font-medium">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-55/70 border border-red-200/40 rounded-2xl mb-5 text-red-800">
              <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input: Identifier */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                Email, Phone, or Employee Code
              </label>
              <input
                type="text"
                placeholder="Enter email, phone, or code..."
                value={form.identifier}
                onChange={e => setForm({ ...form, identifier: e.target.value })}
                className="w-full h-12 px-4 rounded-2xl border border-stone-200/80 bg-white/40 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-250 text-sm placeholder:text-stone-400 text-stone-800 font-medium"
                required
              />
              <p className="text-[10px] text-stone-500 leading-relaxed pl-1">
                E.g., admin@wans.com, 9876543210, or ADV-2025-0001
              </p>
            </div>

            {/* Input: Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full h-12 pl-4 pr-11 rounded-2xl border border-stone-200/80 bg-white/40 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-250 text-sm placeholder:text-stone-400 text-stone-800 font-medium"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors duration-200"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={busy} 
              className="w-full h-12 mt-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg hover:shadow-green-600/20 border-none transition-all duration-300 flex items-center justify-center gap-2 font-bold text-sm"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign in
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Register Redirect and Footer */}
        <div className="space-y-3 mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 border border-stone-200/50 shadow-sm text-sm text-stone-600 backdrop-blur-md">
            New to Warnamayii?{' '}
            <Link to="/register-select" className="text-green-700 hover:text-green-800 font-bold underline transition-colors duration-300 ml-1">
              Create an account
            </Link>
          </div>
          <p className="text-stone-500 text-xs mt-4 font-medium">
            &copy; 2024 Warnamayii Krishi Resources. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}
