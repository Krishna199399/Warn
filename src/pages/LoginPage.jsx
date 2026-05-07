import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, Eye, EyeOff, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden page-enter bg-gradient-to-br from-amber-50 via-stone-100 to-orange-50">
      {/* Blur circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-stone-200/30 rounded-full blur-3xl" />

      <div className="relative w-full max-w-sm">
        {/* Back to Home Link */}
        <div className="absolute -top-12 left-0">
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-amber-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="/logo-full-tagline.png" 
              srcSet="/logo-full-tagline@2x.png 2x"
              alt="Warnamayii Krishi Resources" 
              className="h-24 w-auto object-contain"
            />
          </div>
        </div>

        <Card className="shadow-xl shadow-amber-900/10 border-amber-200/50 backdrop-blur-sm bg-white/90">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-destructive/10 rounded-xl mb-5 border border-destructive/20">
                <AlertCircle size={16} className="text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email, Phone, or Employee Code</Label>
                <Input
                  type="text"
                  placeholder="admin@wans.com, 1234567890, or ADV-2025-0001"
                  value={form.identifier}
                  onChange={e => setForm({ ...form, identifier: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter your email, phone number, or employee code
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPass ? 'text' : 'password'}
                    className="pr-10"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={busy} className="w-full h-11 mt-2">
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={18} className="mr-2" />
                    Sign in
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3 mt-6">
          <p className="text-center text-stone-600 text-sm">
            New to Warnamayii?{' '}
            <Link to="/register-select" className="text-amber-700 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
        <p className="text-center text-stone-500 text-xs mt-4">
          &copy; 2024 Warnamayii Krishi Resources
        </p>
      </div>
    </div>
  );
}
