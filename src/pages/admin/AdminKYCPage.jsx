import React, { useState, useEffect } from 'react';
import { usersApi } from '../../api/users.api';
import { 
  CheckCircle, XCircle, Clock, User, Eye, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function AdminKYCPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll();
      const allUsers = response.data.data;
      
      // Filter users who have submitted KYC
      const usersWithKYC = allUsers.filter(user => 
        user.kyc && user.kyc.status && 
        ['ADVISOR', 'AREA_MANAGER', 'DO_MANAGER', 'ZONAL_MANAGER', 'STATE_HEAD', 'WHOLESALE', 'MINI_STOCK'].includes(user.role)
      );
      
      setUsers(usersWithKYC);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load KYC submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewKYC = (user) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleApprove = async (userId) => {
    try {
      setActionLoading(true);
      await usersApi.approveKYC(userId);
      toast.success('KYC approved successfully');
      await loadUsers();
      setViewDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (user) => {
    setSelectedUser(user);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      await usersApi.rejectKYC(selectedUser._id, rejectionReason);
      toast.success('KYC rejected successfully');
      await loadUsers();
      setRejectDialogOpen(false);
      setViewDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const getFilteredUsers = (status) => {
    return users.filter(user => user.kyc?.status === status);
  };

  const pendingUsers = getFilteredUsers('PENDING');
  const verifiedUsers = getFilteredUsers('VERIFIED');
  const rejectedUsers = getFilteredUsers('REJECTED');

  const renderUserCard = (user) => {
    const kyc = user.kyc;
    const statusConfig = {
      PENDING: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50', badge: 'secondary' },
      VERIFIED: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', badge: 'default' },
      REJECTED: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', badge: 'destructive' },
    };

    const config = statusConfig[kyc.status] || statusConfig.PENDING;
    const StatusIcon = config.icon;

    return (
      <Card key={user._id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 rounded-full ${config.bgColor}`}>
                <User className={config.color} size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{user.name}</h3>
                  <Badge variant={config.badge} className="text-xs">
                    {kyc.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Role: {user.role} • Phone: {user.phone || 'N/A'}
                </p>
                {kyc.submittedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted: {new Date(kyc.submittedAt).toLocaleDateString()}
                  </p>
                )}
                {kyc.status === 'REJECTED' && kyc.rejectionReason && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                    <strong>Reason:</strong> {kyc.rejectionReason}
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewKYC(user)}
            >
              <Eye size={14} className="mr-1" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="KYC Management"
          description="Review and approve KYC submissions"
        />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="KYC Management"
        description="Review and approve KYC submissions from employees and shops"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-50">
                <Clock className="text-yellow-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{pendingUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-50">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">{verifiedUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-50">
                <XCircle className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{rejectedUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verified ({verifiedUsers.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pendingUsers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <AlertCircle className="mx-auto mb-2" size={32} />
                <p>No pending KYC submissions</p>
              </CardContent>
            </Card>
          ) : (
            pendingUsers.map(renderUserCard)
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-4 mt-4">
          {verifiedUsers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <AlertCircle className="mx-auto mb-2" size={32} />
                <p>No verified KYC records</p>
              </CardContent>
            </Card>
          ) : (
            verifiedUsers.map(renderUserCard)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-4">
          {rejectedUsers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <AlertCircle className="mx-auto mb-2" size={32} />
                <p>No rejected KYC records</p>
              </CardContent>
            </Card>
          ) : (
            rejectedUsers.map(renderUserCard)
          )}
        </TabsContent>
      </Tabs>

      {/* View KYC Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Details - {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Review the submitted KYC information
            </DialogDescription>
          </DialogHeader>

          {selectedUser && selectedUser.kyc && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User size={16} />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{selectedUser.kyc.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date of Birth</Label>
                    <p className="font-medium">
                      {selectedUser.kyc.dateOfBirth 
                        ? new Date(selectedUser.kyc.dateOfBirth).toLocaleDateString() 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Gender</Label>
                    <p className="font-medium">{selectedUser.kyc.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Father's/Spouse Name</Label>
                    <p className="font-medium">{selectedUser.kyc.fatherName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">PAN Number</Label>
                    <p className="font-medium">{selectedUser.kyc.panNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Aadhaar Number</Label>
                    <p className="font-medium">
                      XXXX XXXX {selectedUser.kyc.aadhaarNumber?.slice(-4) || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="font-semibold mb-3">Bank Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Account Holder Name</Label>
                    <p className="font-medium">{selectedUser.kyc.accountHolderName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Bank Name</Label>
                    <p className="font-medium">{selectedUser.kyc.bankName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Account Number</Label>
                    <p className="font-medium">
                      XXXXXX{selectedUser.kyc.accountNumber?.slice(-4) || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">IFSC Code</Label>
                    <p className="font-medium">{selectedUser.kyc.ifscCode}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Branch Name</Label>
                    <p className="font-medium">{selectedUser.kyc.branchName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Account Type</Label>
                    <p className="font-medium">{selectedUser.kyc.accountType}</p>
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div>
                <h3 className="font-semibold mb-3">Address Details</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Current Address</Label>
                    <p className="font-medium">
                      {selectedUser.kyc.currentAddress}, {selectedUser.kyc.currentCity}, 
                      {selectedUser.kyc.currentState} - {selectedUser.kyc.currentPinCode}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Permanent Address</Label>
                    <p className="font-medium">
                      {selectedUser.kyc.permanentAddress}, {selectedUser.kyc.permanentCity}, 
                      {selectedUser.kyc.permanentState} - {selectedUser.kyc.permanentPinCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedUser?.kyc?.status === 'PENDING' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleRejectClick(selectedUser)}
                  disabled={actionLoading}
                >
                  <XCircle size={16} className="mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedUser._id)}
                  disabled={actionLoading}
                >
                  <CheckCircle size={16} className="mr-1" />
                  {actionLoading ? 'Approving...' : 'Approve'}
                </Button>
              </>
            )}
            {selectedUser?.kyc?.status !== 'PENDING' && (
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject KYC Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this KYC submission. The user will be able to see this reason and resubmit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Bank account number is incorrect, Aadhaar details don't match..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? 'Rejecting...' : 'Reject KYC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
