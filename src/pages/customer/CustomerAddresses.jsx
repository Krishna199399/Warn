import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Edit2, Trash2, Home, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import PublicNavbar from '../../components/PublicNavbar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { EmptyState } from '../../components/ui/empty-state';
import { Badge } from '../../components/ui/badge';

export default function CustomerAddresses() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    type: 'HOME',
    name: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setAddresses(addresses.map(addr => 
        addr.id === editingId ? { ...formData, id: editingId } : addr
      ));
      toast.success('Address updated successfully');
    } else {
      const newAddress = { ...formData, id: Date.now() };
      setAddresses([...addresses, newAddress]);
      toast.success('Address added successfully');
    }
    resetForm();
  };

  const handleEdit = (address) => {
    setFormData(address);
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
    toast.success('Address deleted successfully');
  };



  const resetForm = () => {
    setFormData({
      type: 'HOME',
      name: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      phone: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  const getAddressIcon = (type) => {
    return type === 'HOME' ? Home : Briefcase;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-stone-50/60 to-orange-50/70">
      <PublicNavbar />
      
      <div className="p-6 max-w-7xl mx-auto space-y-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>My Addresses</h1>
          <p className="text-slate-600 mt-1">Manage your delivery addresses</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add New Address
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Address' : 'Add New Address'}</CardTitle>
            <CardDescription>Fill in the details for your delivery address</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Address Type</Label>
                  <Select name="type" value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOME">Home</SelectItem>
                      <SelectItem value="WORK">Work</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Label</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Home, Office"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="House no., Building name, Street"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white">
                  {editingId ? 'Update Address' : 'Add Address'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="border-amber-200/60 hover:bg-amber-50/80 backdrop-blur-sm">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Addresses List */}
      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => {
            const Icon = getAddressIcon(address.type);
            return (
              <Card key={address.id} className="relative">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-lg bg-amber-100/80 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Icon className="h-6 w-6 text-amber-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{address.name}</h3>
                      <Badge variant="secondary" className="mt-1 bg-amber-100/80 backdrop-blur-sm text-amber-700 hover:bg-amber-100/80">{address.type}</Badge>
                    </div>
                  </div>

                  <div className="text-sm text-slate-600 space-y-1 mb-4">
                    <p>{address.street}</p>
                    <p>{address.city}, {address.state} {address.pincode}</p>
                    <p className="pt-2 font-medium text-slate-900">{address.phone}</p>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-amber-100/40">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(address)}
                      className="text-amber-700 hover:text-amber-800 hover:bg-amber-50/80 backdrop-blur-sm"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(address.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50/80 backdrop-blur-sm"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : !showForm && (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={MapPin}
              title="No addresses added yet"
              description="Add your first delivery address"
              action={
                <Button onClick={() => setShowForm(true)} className="bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}
      </div>

      {/* Footer */}
      <footer className="mt-24 border-t border-amber-200/60 bg-gradient-to-br from-amber-100/50 via-stone-100/40 to-orange-100/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <button onClick={() => navigate('/')} className="flex items-center gap-2">
                <img src="/logo-full.png" srcSet="/logo-full@2x.png 2x, /logo-full@3x.png 3x" alt="Warnamayii Krishi Resources" className="h-10" />
              </button>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-xs">
                Cultivating a greener tomorrow with organic essentials, trusted by farmers and home gardeners.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Shop</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><button onClick={() => navigate('/products')} className="hover:text-amber-700">All Products</button></li>
                <li><button onClick={() => navigate('/categories')} className="hover:text-amber-700">Categories</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><button onClick={() => navigate('/about')} className="hover:text-amber-700">About Us</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-amber-700">Contact</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Newsletter</h4>
              <p className="text-sm text-slate-600 mb-4">Get growing tips & 10% off your first order.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="flex-1 rounded-full border border-amber-200/60 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm outline-none focus:border-amber-600"
                />
                <button className="rounded-full bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white px-6 py-2 text-sm font-medium">Join</button>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Warnamayii Agri Network System. All rights reserved.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-amber-700">Privacy</a>
              <a href="#" className="hover:text-amber-700">Terms</a>
              <a href="#" className="hover:text-amber-700">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
