import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '../contexts/AuthContext';
import { PageHeader, Card } from '../components/ui';
import { User, Lock, Shield, Bell, LogOut, ChevronRight, Check } from 'lucide-react';

const PERMISSIONS_MAP = {
  ADMIN: ['View All Data', 'Manage Users', 'Manage Products', 'View Reports', 'Manage Inventory', 'Process Orders', 'Commission Management', 'Role Management'],
  STATE_HEAD: ['View State Data', 'Manage Regional Users', 'View Reports', 'View Inventory', 'Process Orders'],
  ZONAL_MANAGER: ['View Zone Data', 'Manage Zone Users', 'View Reports', 'Process Orders'],
  AREA_MANAGER: ['View Area Data', 'Manage Area Users', 'Process Orders'],
  DO_MANAGER: ['View DO Data', 'Manage Advisors', 'Process Orders'],
  ADVISOR: ['View Personal Stats', 'Create Orders', 'View Commission'],
  WHOLESALE: ['View Wholesale Inventory', 'Process Orders', 'Manage Mini Stocks', 'View Commission'],
  MINI_STOCK: ['View Mini Stock Inventory', 'Process Orders', 'View Commission'],
};

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [profileSaved, setProfileSaved] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', region: user?.region || '' });
  const update = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const sections = [
    { key: 'profile', label: 'Profile Settings', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'permissions', label: 'Role Permissions', icon: Shield },
    { key: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const handleSave = e => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Sidebar nav */}
        <div className="card p-2 h-fit">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`sidebar-link w-full justify-between ${activeSection === s.key ? 'active' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  {s.label}
                </div>
                <ChevronRight size={14} className="opacity-50" />
              </button>
            );
          })}
          <div className="border-t border-slate-100 mt-2 pt-2">
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={16} /> Log out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === 'profile' && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-800 mb-5">Profile Information</h3>
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-50">
                <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                  {user?.avatar}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-sm text-slate-500">{ROLE_LABELS[user?.role]}</p>
                  <p className="text-xs text-slate-400 mt-1">{user?.region}</p>
                </div>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name</label>
                    <input className="input-field" value={form.name} onChange={update('name')} />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" className="input-field" value={form.email} onChange={update('email')} />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input className="input-field" value={form.phone} onChange={update('phone')} />
                  </div>
                  <div>
                    <label className="label">Region</label>
                    <input className="input-field" value={form.region} onChange={update('region')} readOnly />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" className="btn-primary">Save Changes</button>
                  {profileSaved && (
                    <span className="flex items-center gap-1.5 text-sm text-green-600">
                      <Check size={14} /> Saved successfully
                    </span>
                  )}
                </div>
              </form>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-800 mb-5">Change Password</h3>
              <form className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
                <button type="submit" className="btn-primary" onClick={e => { e.preventDefault(); alert('Password changed! (Demo)'); }}>Update Password</button>
              </form>
            </Card>
          )}

          {activeSection === 'permissions' && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Role Permissions</h3>
              <p className="text-xs text-slate-500 mb-5">
                Permissions for <span className="font-medium text-green-700">{ROLE_LABELS[user?.role]}</span> role
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {(PERMISSIONS_MAP[user?.role] || []).map(p => (
                  <div key={p} className="flex items-center gap-2.5 p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={11} className="text-white" />
                    </div>
                    <span className="text-sm text-slate-700">{p}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-4">Contact Admin to modify role permissions.</p>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-800 mb-5">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: 'New Order Alerts', desc: 'Get notified when a new order is placed', enabled: true },
                  { label: 'Commission Updates', desc: 'Notify on every commission credit', enabled: true },
                  { label: 'Low Stock Alerts', desc: 'Alert when inventory is below minimum', enabled: true },
                  { label: 'Weekly Reports', desc: 'Weekly performance summary email', enabled: false },
                  { label: 'Network Joins', desc: 'Notify when new members join your network', enabled: false },
                ].map((n, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{n.label}</p>
                      <p className="text-xs text-slate-400">{n.desc}</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors cursor-pointer relative ${n.enabled ? 'bg-green-500' : 'bg-slate-200'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-all ${n.enabled ? 'right-1' : 'left-1'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
