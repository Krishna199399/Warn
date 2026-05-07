import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../api/users.api';
import { toast } from 'sonner';
import PublicNavbar from '../../components/PublicNavbar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await usersApi.update(user._id, formData);
      setUser(response.data.data);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-stone-50/60 to-orange-50/70">
      <PublicNavbar />
      
      <div className="p-6 max-w-4xl mx-auto space-y-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>My Profile</h1>
          <p className="text-slate-600 mt-1">Manage your personal information</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={loading} className="border-amber-200/60 hover:bg-amber-50/80 backdrop-blur-sm">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur-sm shadow-md text-white">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-amber-100/90 via-stone-100/80 to-orange-100/90 backdrop-blur-md p-8 border-b border-amber-200/40">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-amber-200/60 shadow-lg bg-white">
              <AvatarFallback className="bg-amber-600/90 backdrop-blur-sm text-white text-2xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 drop-shadow-sm">{user?.name}</h2>
              <Badge variant="secondary" className="mt-2 bg-amber-100/80 backdrop-blur-sm text-amber-700 border-amber-200/60 hover:bg-amber-100/80">
                {user?.role}
              </Badge>
              <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-amber-600" />
                Member since {new Date(user?.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <CardContent className="p-8 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name
            </Label>
            {isEditing ? (
              <Input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            ) : (
              <div className="px-4 py-2 bg-slate-50 rounded-lg text-slate-900">{user?.name}</div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            {isEditing ? (
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            ) : (
              <div className="px-4 py-2 bg-slate-50 rounded-lg text-slate-900">{user?.email}</div>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            {isEditing ? (
              <Input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            ) : (
              <div className="px-4 py-2 bg-slate-50 rounded-lg text-slate-900">{user?.phone || 'Not provided'}</div>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </Label>
            {isEditing ? (
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
              />
            ) : (
              <div className="px-4 py-2 bg-slate-50 rounded-lg text-slate-900">{user?.address || 'Not provided'}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">User ID</p>
              <p className="font-mono text-sm text-slate-900 mt-1">{user?._id}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Account Type</p>
              <p className="text-sm text-slate-900 mt-1">{user?.role}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <Badge className="mt-1 bg-amber-100/80 backdrop-blur-sm text-amber-700 hover:bg-amber-100/80 shadow-sm">
                Active
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-600">Joined</p>
              <p className="text-sm text-slate-900 mt-1">
                {new Date(user?.createdAt).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
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
