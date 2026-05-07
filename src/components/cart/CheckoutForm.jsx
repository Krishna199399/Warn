import React, { useState, useCallback, useRef } from 'react';
import { User, Mail, Phone, MapPin, Building2, Map, Hash, Globe, Loader2, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const InputField = ({ icon: Icon, label, name, type = 'text', placeholder, required = true, value, onChange, error }) => (
  <div className="space-y-1.5">
    <Label htmlFor={name} className={error ? 'text-destructive' : ''}>
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    <div className="relative">
      <Icon size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${error ? 'text-destructive' : 'text-muted-foreground'}`} />
      <Input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`pl-9 ${error ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
      />
    </div>
    {error && (
      <p className="text-xs text-destructive">{error}</p>
    )}
  </div>
);

export default function CheckoutForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    shopName: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    landmark: '',
    country: 'India',
  });

  const [errors, setErrors] = useState({});
  const isSubmittingRef = useRef(false);

  React.useEffect(() => {
    if (!loading) {
      isSubmittingRef.current = false;
    }
  }, [loading]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

    if (!formData.shopName.trim()) newErrors.shopName = 'Shop name is required';
    if (!formData.name.trim()) newErrors.name = 'Contact person name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone must be 10 digits';
    }
    if (!formData.address.trim()) newErrors.address = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Pin code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    
    if (validate()) {
      isSubmittingRef.current = true;
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Shop Details */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Shop Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <InputField
              icon={Store}
              label="Shop Name"
              name="shopName"
              placeholder="Warnamayii Agro Store"
              value={formData.shopName}
              onChange={handleChange}
              error={errors.shopName}
            />
          </div>
          <InputField
            icon={User}
            label="Contact Person"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
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
        </CardContent>
      </Card>

      {/* Delivery Address */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Delivery Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField
            icon={MapPin}
            label="Street Address"
            name="address"
            placeholder="Shop No. 123, Main Road"
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
              label="Pin Code"
              name="zipCode"
              placeholder="400001"
              value={formData.zipCode}
              onChange={handleChange}
              error={errors.zipCode}
            />
            <InputField
              icon={MapPin}
              label="Landmark (Optional)"
              name="landmark"
              placeholder="Near City Hospital"
              value={formData.landmark}
              onChange={handleChange}
              required={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 text-base"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          'Place Order'
        )}
      </Button>
    </form>
  );
}
