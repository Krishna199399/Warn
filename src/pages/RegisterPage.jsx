import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { Leaf, User, Phone, Lock, Store, MapPin, Tag, Eye, EyeOff, AlertCircle } from 'lucide-react';

const ACCOUNT_TYPES = [
  { value: 'ADVISOR', label: 'Advisor' },
  { value: 'WHOLESALE', label: 'Wholesale' },
  { value: 'MINI_STOCK', label: 'Mini Stock' },
  { value: 'CUSTOMER', label: 'Customer' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('CUSTOMER');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
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

    // Validation
    if (!formData.name.trim()) {
      setError('Full name is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (formData.phone.length < 10) {
      setError('Phone number must be at least 10 digits');
      return;
    }
    if (!formData.password) {
      setError('Password is required');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: accountType,
      };

      // Add conditional fields
      if (accountType === 'ADVISOR' && formData.referralCode.trim()) {
        payload.referralCode = formData.referralCode.trim();
      }
      if ((accountType === 'WHOLESALE' || accountType === 'MINI_STOCK') && formData.shopName.trim()) {
        payload.shopName = formData.shopName.trim();
      }
      if (accountType === 'CUSTOMER' && formData.location.trim()) {
        payload.location = formData.location.trim();
      }

      const response = await authApi.register(payload);
      
      if (response.data.success) {
        // If auto-approved (WHOLESALE, MINI_STOCK, CUSTOMER), redirect to dashboard
        if (response.data.data.accessToken) {
          sessionStorage.setItem('accessToken', response.data.data.accessToken);
          navigate('/dashboard');
        } else {
          // If pending approval (ADVISOR), show success message
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-600 rounded-2xl shadow-lg mb-3">
            <Leaf size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
          <p className="text-sm text-slate-500 mt-1">Join WANS - Warnamayii Agri Network</p>
        </div>

        {/* Registration Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Type Dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Account Type</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm bg-white"
              >
                {ACCOUNT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Use this to login</p>
            </div>

            {/* Conditional: Referral Code (Advisor only) */}
            {accountType === 'ADVISOR' && (
              <div className="transition-all">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Referral Code <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleChange}
                    placeholder="DO Manager code or phone"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Enter your DO Manager's code or phone</p>
              </div>
            )}

            {/* Conditional: Shop Name (Wholesale/Mini Stock) */}
            {(accountType === 'WHOLESALE' || accountType === 'MINI_STOCK') && (
              <div className="transition-all">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Shop Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleChange}
                    placeholder="Enter your shop name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                  />
                </div>
              </div>
            )}

            {/* Conditional: Location (Customer) */}
            {accountType === 'CUSTOMER' && (
              <div className="transition-all">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Enter your location"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password (min 6 characters)"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Info Message for Advisor */}
            {accountType === 'ADVISOR' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  ℹ️ Advisor accounts require admin approval. You'll be notified once approved.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-slate-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold transition-colors">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
