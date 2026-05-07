import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, CheckCircle, XCircle, Eye, Loader2, 
  Store, User, Phone, MapPin, Building2, 
  Calendar, Search, Filter, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../api/users.api';
import { formatDate } from '../../utils/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function ShopApprovalsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Approval Modal
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalAction, setApprovalAction] = useState(null); // 'approve' or 'reject'

  // Load pending users
  useEffect(() => {
    loadPendingUsers();
    loadStats();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const res = await usersApi.getPending();
      const users = res.data.data || [];
      // Filter to only show WHOLESALE and MINI_STOCK users
      const shopUsers = users.filter(u => ['WHOLESALE', 'MINI_STOCK'].includes(u.role));
      setPendingUsers(shopUsers);
      setFilteredUsers(shopUsers);
    } catch (error) {
      console.error('Failed to load pending users:', error);
      toast.error('Failed to load pending shop registrations');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get all users to calculate stats
      const res = await usersApi.getAll({ role: 'WHOLESALE,MINI_STOCK' });
      const users = res.data.data || [];
      
      const stats = {
        pending: users.filter(u => u.status === 'PENDING').length,
        approved: users.filter(u => u.status === 'APPROVED').length,
        rejected: users.filter(u => u.status === 'REJECTED').length,
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...pendingUsers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.shopName?.toLowerCase().includes(query) ||
        user.location?.toLowerCase().includes(query)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => 
        user.role.toLowerCase() === roleFilter.toLowerCase()
      );
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, pendingUsers]);

  const handleApproval = (user, action) => {
    setSelectedUser(user);
    setApprovalAction(action);
    setShowApprovalModal(true);
    setRejectionReason('');
  };

  const submitApproval = async () => {
    if (!selectedUser || !approvalAction) return;
    
    if (approvalAction === 'reject' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      if (approvalAction === 'approve') {
        await usersApi.approve(selectedUser._id);
        toast.success(`${selectedUser.name}'s shop registration approved!`);
      } else {
        await usersApi.reject(selectedUser._id, rejectionReason.trim());
        toast.success(`${selectedUser.name}'s shop registration rejected`);
      }

      setShowApprovalModal(false);
      setSelectedUser(null);
      setRejectionReason('');
      setApprovalAction(null);
      
      // Reload data
      loadPendingUsers();
      loadStats();
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error(error.response?.data?.error || 'Failed to process approval');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      WHOLESALE: { variant: 'default', color: 'text-blue-600', bg: 'bg-blue-50' },
      MINI_STOCK: { variant: 'secondary', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    };
    
    const config = variants[role] || variants.WHOLESALE;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Store size={12} />
        {role === 'WHOLESALE' ? 'Wholesale' : 'Mini Stock'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 page-enter">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shop Approvals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve shop registrations for Wholesale and Mini Stock users
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pending Approval
                </p>
                <p className="text-3xl font-bold tracking-tight text-amber-600">
                  {stats.pending}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Clock size={24} className="text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Awaiting your review</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Approved Shops
                </p>
                <p className="text-3xl font-bold tracking-tight text-emerald-600">
                  {stats.approved}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Active shops</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Rejected
                </p>
                <p className="text-3xl font-bold tracking-tight text-destructive">
                  {stats.rejected}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <XCircle size={24} className="text-destructive" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Declined registrations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, phone, shop name, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-muted/30"
            />
          </div>
          <div className="w-full md:w-48 shrink-0">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-10 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-muted-foreground" />
                  <SelectValue placeholder="Filter by Role" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="wholesale">Wholesale</SelectItem>
                <SelectItem value="mini_stock">Mini Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pending Users List */}
      <Card>
        {filteredUsers.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Store size={28} className="text-muted-foreground/60" />
            </div>
            <p className="text-lg font-semibold text-foreground">No pending shop registrations</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {searchQuery || roleFilter !== 'all'
                ? 'Try adjusting your search filters'
                : 'New shop registrations will appear here for approval'}
            </p>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <div key={user._id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Store size={24} className="text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">
                              {user.shopName || user.name}
                            </h3>
                            {getRoleBadge(user.role)}
                          </div>
                          {user.shopName && (
                            <p className="text-sm text-muted-foreground">
                              Owner: {user.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Registered
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        {/* Phone */}
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">
                            {user.phone || 'No phone'}
                          </span>
                        </div>

                        {/* Location */}
                        {user.location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin size={14} className="text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground truncate">
                              {user.location}
                            </span>
                          </div>
                        )}

                        {/* UPI ID */}
                        {user.upiId && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 size={14} className="text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground font-mono text-xs">
                              {user.upiId}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Shop Address */}
                      {user.shopAddress && (
                        <div className="bg-muted/30 rounded-lg p-3 mb-3">
                          <p className="text-xs text-muted-foreground mb-1">Shop Address:</p>
                          <p className="text-sm text-foreground">
                            {[
                              user.shopAddress.street,
                              user.shopAddress.city,
                              user.shopAddress.state,
                              user.shopAddress.pinCode
                            ].filter(Boolean).join(', ')}
                          </p>
                          {user.shopAddress.landmark && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Landmark: {user.shopAddress.landmark}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleApproval(user, 'approve')}
                          className="flex-1 h-9"
                        >
                          <CheckCircle size={16} className="mr-2" />
                          Approve Shop
                        </Button>
                        <Button
                          onClick={() => handleApproval(user, 'reject')}
                          variant="destructive"
                          className="flex-1 h-9"
                        >
                          <XCircle size={16} className="mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Approval Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve Shop Registration' : 'Reject Shop Registration'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              {/* User Summary */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Shop Name:</span>
                  <span className="text-sm font-semibold">
                    {selectedUser.shopName || selectedUser.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Owner:</span>
                  <span className="text-sm font-semibold">{selectedUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <span className="text-sm font-semibold">
                    {selectedUser.role === 'WHOLESALE' ? 'Wholesale' : 'Mini Stock'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Phone:</span>
                  <span className="text-sm font-semibold">{selectedUser.phone}</span>
                </div>
              </div>

              {/* Rejection Reason Input */}
              {approvalAction === 'reject' && (
                <div className="space-y-2">
                  <Label htmlFor="rejectionReason">
                    Rejection Reason *
                  </Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="e.g., Incomplete information, invalid documents, duplicate registration..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Confirmation Message */}
              <div className={`p-3 rounded-lg border ${
                approvalAction === 'approve' 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-destructive/10 border-destructive/20'
              }`}>
                <p className={`text-sm ${
                  approvalAction === 'approve' ? 'text-emerald-800' : 'text-destructive'
                }`}>
                  {approvalAction === 'approve' 
                    ? '✅ This shop will be approved and the user can log in immediately.'
                    : '❌ This registration will be rejected and the user will be notified.'
                  }
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setShowApprovalModal(false)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={submitApproval}
              disabled={processing || (approvalAction === 'reject' && !rejectionReason.trim())}
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
              className="w-full sm:w-auto"
            >
              {processing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : approvalAction === 'approve' ? (
                <CheckCircle size={16} className="mr-2" />
              ) : (
                <XCircle size={16} className="mr-2" />
              )}
              {approvalAction === 'approve' ? 'Approve Shop' : 'Reject Registration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}