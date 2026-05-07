import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { Leaf, User, Phone, Lock, Store, MapPin, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ACCOUNT_TYPES = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'WHOLESALE', label: 'Wholesale' },
  { value: 'MINI_STOCK', label: 'Mini Stock' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('CUSTOMER');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    shopName: '',
    location: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) return setError('Full name is required');
    if (!formData.phone.trim()) return setError('Phone number is required');
    if (formData.phone.length < 10) return setError('Phone number must be at least 10 digits');
    if (!formData.password) return setError('Password is required');
    if (formData.password.length < 6) return setError('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: accountType,
      };

      if ((accountType === 'WHOLESALE' || accountType === 'MINI_STOCK') && formData.shopName.trim()) {
        payload.shopName = formData.shopName.trim();
      }
      if (accountType === 'CUSTOMER' && formData.location.trim()) {
        payload.location = formData.location.trim();
      }

      const response = await authApi.register(payload);
      
      if (response.data.success) {
        if (response.data.data.accessToken) {
          sessionStorage.setItem('accessToken', response.data.data.accessToken);
          navigate('/dashboard');
        } else {
          alert(response.data.message);
          navigate('/login');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden page-enter bg-gradient-to-br from-amber-50 via-stone-100 to-orange-50">
      {/* Blur circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-stone-200/30 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md py-8">
        {/* Back to Home Link */}
        <div className="absolute -top-4 left-0">
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
          <div className="inline-flex items-center justify-center mb-3">
            <img 
              src="/logo-full-tagline.png" 
              srcSet="/logo-full-tagline@2x.png 2x"
              alt="Warnamayii Krishi Resources" 
              className="h-24 w-auto object-contain"
            />
          </div>
        </div>

        {/* Registration Form Card */}
        <Card className="shadow-xl shadow-amber-900/10 border-amber-200/50 backdrop-blur-sm bg-white/90">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Account Type Dropdown */}
              <div className="space-y-1.5">
                <Label>Account Type</Label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Account Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="pl-9"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Use this to login</p>
              </div>

              {/* Conditional: Shop Name (Wholesale/Mini Stock) */}
              {(accountType === 'WHOLESALE' || accountType === 'MINI_STOCK') && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <Label>Shop Name <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                  <div className="relative">
                    <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      name="shopName"
                      value={formData.shopName}
                      onChange={handleChange}
                      placeholder="Enter your shop name"
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              {/* Conditional: Location (Customer) */}
              {accountType === 'CUSTOMER' && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <Label>Location <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Enter your location"
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <Label>Password</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password (min 6 characters)"
                    className="pl-9 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label>Confirm Password</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="pl-9 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle size={16} className="text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Info Message for Wholesale/Mini Stock */}
              {(accountType === 'WHOLESALE' || accountType === 'MINI_STOCK') && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    🏪 Shop registrations require admin approval. You'll be able to log in once your shop is approved.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Login Link */}
        <p className="text-center text-sm text-stone-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-700 hover:underline font-semibold transition-colors">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
