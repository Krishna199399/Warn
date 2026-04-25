import React, { useState, useCallback, useRef } from 'react';
import { User, Mail, Phone, MapPin, Building2, Map, Hash, Globe } from 'lucide-react';

// InputField component outside to prevent re-creation
const InputField = ({ icon: Icon, label, name, type = 'text', placeholder, required = true, value, onChange, error }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-colors ${
          error ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-green-500'
        }`}
      />
    </div>
    {error && (
      <p className="mt-1 text-xs text-red-600">{error}</p>
    )}
  </div>
);

export default function CheckoutForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });

  const [errors, setErrors] = useState({});
  const isSubmittingRef = useRef(false);

  // Reset submission flag when loading completes
  React.useEffect(() => {
    if (!loading) {
      isSubmittingRef.current = false;
    }
  }, [loading]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    setErrors(prev => {
      if (prev[name]) {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone must be 10 digits';
    }
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmittingRef.current) {
      return;
    }
    
    if (validate()) {
      isSubmittingRef.current = true;
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Details */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Personal Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            icon={User}
            label="Full Name"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
          />
          <InputField
            icon={Mail}
            label="Email"
            name="email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />
          <InputField
            icon={Phone}
            label="Phone"
            name="phone"
            type="tel"
            placeholder="9876543210"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
          />
        </div>
      </div>

      {/* Shipping Details */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Shipping Details</h2>
        <div className="space-y-4">
          <InputField
            icon={MapPin}
            label="Address"
            name="address"
            placeholder="Street address, apartment, suite, etc."
            value={formData.address}
            onChange={handleChange}
            error={errors.address}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              icon={Building2}
              label="City"
              name="city"
              placeholder="Mumbai"
              value={formData.city}
              onChange={handleChange}
              error={errors.city}
            />
            <InputField
              icon={Map}
              label="State"
              name="state"
              placeholder="Maharashtra"
              value={formData.state}
              onChange={handleChange}
              error={errors.state}
            />
            <InputField
              icon={Hash}
              label="Zip Code"
              name="zipCode"
              placeholder="400001"
              value={formData.zipCode}
              onChange={handleChange}
              error={errors.zipCode}
            />
            <InputField
              icon={Globe}
              label="Country"
              name="country"
              placeholder="India"
              value={formData.country}
              onChange={handleChange}
              error={errors.country}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          'Place Order'
        )}
      </button>
    </form>
  );
}
