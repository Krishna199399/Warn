import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '../contexts/AuthContext';
import { authApi } from '../api/auth.api';
import { User, Lock, Shield, AlertTriangle, LogOut, ChevronRight, Check, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui';

const PERMISSIONS_MAP = {
  ADMIN:          ['View All Data', 'Manage Users', 'Manage Products', 'View Reports', 'Manage Inventory', 'Process Orders', 'Commission Management', 'Role Management'],
  STATE_HEAD:     ['View State Data', 'Manage Regional Users', 'View Reports', 'View Inventory', 'Process Orders'],
  ZONAL_MANAGER:  ['View Zone Data', 'Manage Zone Users', 'View Reports', 'Process Orders'],
  AREA_MANAGER:   ['View Area Data', 'Manage Area Users', 'Process Orders'],
  DO_MANAGER:     ['View DO Data', 'Manage Advisors', 'Process Orders'],
  ADVISOR:        ['View Personal Stats', 'Create Orders', 'View Commission'],
  WHOLESALE:      ['View Wholesale Inventory', 'Process Orders', 'Manage Mini Stocks', 'View Commission'],
  MINI_STOCK:     ['View Mini Stock Inventory', 'Process Orders', 'View Commission'],
};

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection,     setActiveSection]     = useState('profile');
  const [profileSaved,      setProfileSaved]      = useState(false);
  const [form,              setForm]              = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '', region: user?.region || '',
    upiId: user?.upiId || '',
  });

  // Delete account state
  const [showDeleteModal,    setShowDeleteModal]    = useState(false);
  const [deletePassword,     setDeletePassword]     = useState('');
  const [deleteError,        setDeleteError]        = useState('');
  const [deleting,           setDeleting]           = useState(false);
  const [deleteConfirmText,  setDeleteConfirmText]  = useState('');

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const update = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const updatePassword = k => e => setPasswordForm(f => ({ ...f, [k]: e.target.value }));

  const sections = [
    { key: 'profile',       label: 'Profile',      icon: User },
    { key: 'security',      label: 'Security',     icon: Lock },
    { key: 'permissions',   label: 'Permissions',  icon: Shield },
    { key: 'danger',        label: 'Danger Zone',  icon: AlertTriangle, danger: true },
  ];

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await authApi.updateProfile(form);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') { setDeleteError('Please type DELETE to confirm'); return; }
    if (!deletePassword)               { setDeleteError('Please enter your password');     return; }
    setDeleting(true);
    setDeleteError('');
    try {
      await authApi.deleteMyAccount(deletePassword);
      logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Failed to delete account');
    } finally { setDeleting(false); }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteError('');
    setDeletePassword('');
    setDeleteConfirmText('');
  };

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Settings Nav */}
        <Card className="h-fit">
          <CardContent className="p-2">
            {sections.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                  ${activeSection === s.key
                    ? s.danger ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                    : s.danger ? 'text-destructive/70 hover:bg-destructive/5' : 'text-muted-foreground hover:bg-muted'
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <s.icon size={15} />
                  {s.label}
                </span>
                <ChevronRight size={13} className="opacity-40" />
              </button>
            ))}
            <Separator className="my-2" />
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut size={15} /> Log out
            </button>
          </CardContent>
        </Card>

        {/* Content Panel */}
        <div className="lg:col-span-3 space-y-4">

          {/* ── Profile ── */}
          {activeSection === 'profile' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-primary-foreground text-xl font-bold">
                    {user?.avatar || user?.name?.slice(0, 2)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{user?.name}</CardTitle>
                    <CardDescription>{ROLE_LABELS[user?.role]} · {user?.region}</CardDescription>
                    {user?.advisorCode && <p className="text-xs font-mono text-primary mt-0.5">Code: {user.advisorCode}</p>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { key: 'name',   label: 'Full Name', type: 'text' },
                      { key: 'email',  label: 'Email',     type: 'email' },
                      { key: 'phone',  label: 'Phone',     type: 'text' },
                      { key: 'region', label: 'Region',    type: 'text', readOnly: true },
                    ].map(f => (
                      <div key={f.key} className="space-y-1.5">
                        <Label>{f.label}</Label>
                        <Input
                          type={f.type}
                          value={form[f.key]}
                          onChange={update(f.key)}
                          readOnly={f.readOnly}
                          className={f.readOnly ? 'bg-muted cursor-not-allowed' : ''}
                        />
                      </div>
                    ))}
                  </div>
                  {/* UPI ID — visible to Wholesale & Mini Stock */}
                  {(user?.role === 'WHOLESALE' || user?.role === 'MINI_STOCK') && (
                    <div className="space-y-1.5">
                      <Label htmlFor="upiId">UPI ID <span className="text-xs text-muted-foreground">(for receiving payments)</span></Label>
                      <Input
                        id="upiId"
                        type="text"
                        placeholder="yourname@upi"
                        value={form.upiId}
                        onChange={update('upiId')}
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground">Mini Stock buyers will see this UPI ID to pay you manually.</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-1">
                    <Button type="submit">Save Changes</Button>
                    {profileSaved && (
                      <span className="flex items-center gap-1.5 text-sm text-primary">
                        <Check size={14} /> Saved successfully
                      </span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* ── Security ── */}
          {activeSection === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Change Password</CardTitle>
                <CardDescription>Update your login credentials</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Current Password</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={passwordForm.currentPassword}
                      onChange={updatePassword('currentPassword')}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>New Password</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={passwordForm.newPassword}
                      onChange={updatePassword('newPassword')}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirm New Password</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={passwordForm.confirmPassword}
                      onChange={updatePassword('confirmPassword')}
                      required
                    />
                  </div>
                  {passwordError && (
                    <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                      {passwordError}
                    </p>
                  )}
                  {passwordSuccess && (
                    <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg flex items-center gap-2">
                      <Check size={14} /> Password changed successfully
                    </p>
                  )}
                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* ── Permissions ── */}
          {activeSection === 'permissions' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Role Permissions</CardTitle>
                <CardDescription>
                  Permissions for <span className="font-semibold text-primary">{ROLE_LABELS[user?.role]}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-2">
                  {(PERMISSIONS_MAP[user?.role] || []).map(p => (
                    <div key={p} className="flex items-center gap-2.5 p-3 bg-primary/5 border border-primary/15 rounded-xl">
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-primary-foreground" />
                      </div>
                      <span className="text-sm">{p}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">Contact Admin to modify role permissions.</p>
              </CardContent>
            </Card>
          )}

          {/* ── Danger Zone ── */}
          {activeSection === 'danger' && (
            <Card className="border-destructive/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                    <AlertTriangle size={18} className="text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions — proceed with caution</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border border-destructive/20 rounded-xl p-5 bg-destructive/5">
                  <h4 className="text-sm font-semibold mb-1">Delete Your Account</h4>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    Once deleted, your account cannot be recovered. All commission history and
                    network connections will be permanently removed. If you are an advisor, your
                    farmers will be reassigned to your manager.
                  </p>
                  <Button variant="destructive" size="sm" onClick={() => setShowDeleteModal(true)}>
                    <Trash2 size={14} className="mr-1.5" /> Delete My Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={closeDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={18} /> Delete Account
            </DialogTitle>
            <DialogDescription>This action is permanent and cannot be undone.</DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            <p className="font-semibold mb-1">⚠️ This will permanently:</p>
            <ul className="text-xs space-y-1 ml-4 list-disc opacity-80">
              <li>Deactivate your login credentials</li>
              <li>Remove you from the commission network</li>
              <li>Reassign your farmers (if advisor)</li>
              <li>Cancel any pending payouts</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Type <span className="font-bold text-destructive">DELETE</span> to confirm</Label>
              <Input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Enter your password</Label>
              <Input
                type="password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {deleteError && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{deleteError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteModal} disabled={deleting}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirmText !== 'DELETE' || !deletePassword}
            >
              {deleting ? 'Deleting...' : 'Delete Forever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
