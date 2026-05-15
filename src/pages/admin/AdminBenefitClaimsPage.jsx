import React, { useEffect, useState } from 'react';
import { benefitClaimsApi } from '../../api/benefitClaims.api';
import { formatCurrency, formatPoints } from '../../utils/helpers';
import { HandCoins, CheckCircle2, Clock, XCircle, ChevronRight, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const STATUS_META = {
  PENDING:  { label: 'Pending',    cls: 'bg-amber-100 text-amber-700',   Icon: Clock        },
  APPROVED: { label: 'Approved',   cls: 'bg-blue-100 text-blue-700',     Icon: CheckCircle2 },
  PAID:     { label: 'Paid',       cls: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2 },
  REJECTED: { label: 'Rejected',   cls: 'bg-red-100 text-red-700',       Icon: XCircle      },
};

const LEVEL_META = {
  STAR:  { icon: '⭐', color: 'text-amber-600'  },
  RUBY:  { icon: '💎', color: 'text-rose-600'   },
  PEARL: { icon: '🏆', color: 'text-indigo-600' },
};

export default function AdminBenefitClaimsPage() {
  const [claims,    setClaims]    = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRole,   setFilterRole]   = useState('');
  const [filterLevel,  setFilterLevel]  = useState('');

  // Modal states
  const [approveModal, setApproveModal] = useState(false);
  const [paidModal,    setPaidModal]    = useState(false);
  const [rejectModal,  setRejectModal]  = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [modalLoading,  setModalLoading] = useState(false);

  // Form states
  const [adminNotes,     setAdminNotes]     = useState('');
  const [paymentMethod,  setPaymentMethod]  = useState('BANK_TRANSFER');
  const [referenceId,    setReferenceId]    = useState('');
  const [paymentNotes,   setPaymentNotes]   = useState('');

  const loadClaims = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterRole) params.role = filterRole;
      if (filterLevel) params.level = filterLevel;

      const res = await benefitClaimsApi.getAll(params);
      setClaims(res.data.data || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      console.error('Failed to load claims:', err);
      toast.error('Failed to load benefit claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, [filterStatus, filterRole, filterLevel]);

  const handleOpenApprove = (claim) => {
    setSelectedClaim(claim);
    setAdminNotes('');
    setApproveModal(true);
  };

  const handleOpenPaid = (claim) => {
    setSelectedClaim(claim);
    setPaymentMethod('BANK_TRANSFER');
    setReferenceId('');
    setPaymentNotes('');
    setPaidModal(true);
  };

  const handleOpenReject = (claim) => {
    setSelectedClaim(claim);
    setAdminNotes('');
    setRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedClaim) return;
    setModalLoading(true);
    try {
      await benefitClaimsApi.approve(selectedClaim._id, { adminNotes });
      toast.success('Claim approved successfully');
      setApproveModal(false);
      loadClaims();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve claim');
    } finally {
      setModalLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedClaim) return;
    if (!referenceId.trim()) {
      toast.error('Payment reference ID is required');
      return;
    }
    setModalLoading(true);
    try {
      await benefitClaimsApi.markPaid(selectedClaim._id, {
        paymentMethod,
        referenceId,
        notes: paymentNotes,
      });
      toast.success('Claim marked as paid successfully');
      setPaidModal(false);
      loadClaims();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark claim as paid');
    } finally {
      setModalLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedClaim) return;
    if (!adminNotes.trim()) {
      toast.error('Admin notes are required when rejecting a claim');
      return;
    }
    setModalLoading(true);
    try {
      await benefitClaimsApi.reject(selectedClaim._id, { adminNotes });
      toast.success('Claim rejected');
      setRejectModal(false);
      loadClaims();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject claim');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl"/>)}
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Benefit Claims</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and process employee benefit claims</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-amber-600" />
              <p className="text-xs text-muted-foreground">Pending Claims</p>
            </div>
            <p className="text-2xl font-bold text-amber-700">{summary?.pending || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(summary?.pendingAmount || 0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={14} className="text-blue-600" />
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">{summary?.approved || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <p className="text-xs text-muted-foreground">Paid</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{summary?.paid || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <HandCoins size={14} className="text-primary" />
              <p className="text-xs text-muted-foreground">Total Amount</p>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(summary?.totalAmount || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter size={14} />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  <SelectItem value="ADVISOR">Promotion Representative (PR)</SelectItem>
                  <SelectItem value="DO_MANAGER">Development Officer (DO)</SelectItem>
                  <SelectItem value="AREA_MANAGER">Regional Manager (RM)</SelectItem>
                  <SelectItem value="ZONAL_MANAGER">Zonal Manager (ZM)</SelectItem>
                  <SelectItem value="STATE_HEAD">Executive Manager (EM)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Level</Label>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  <SelectItem value="STAR">⭐ STAR</SelectItem>
                  <SelectItem value="RUBY">💎 RUBY</SelectItem>
                  <SelectItem value="PEARL">🏆 PEARL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Benefit Claims</CardTitle>
        </CardHeader>
        <CardContent>
          {claims.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No benefit claims found matching the filters.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {claims.map(claim => {
                const sm = STATUS_META[claim.claimStatus] || STATUS_META.PENDING;
                const lm = LEVEL_META[claim.salaryLevel] || { icon: '💰', color: 'text-gray-600' };
                const SmIcon = sm.Icon;

                return (
                  <div key={claim._id} className="px-5 py-4 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Employee Info */}
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <HandCoins size={18} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-semibold">{claim.userId?.name || 'Unknown'}</p>
                            <Badge variant="outline" className="text-[10px] h-5">
                              {claim.userId?.role?.replace(/_/g, ' ') || 'N/A'}
                            </Badge>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${sm.cls}`}>
                              {SmIcon && <SmIcon size={10} />}
                              {sm.label}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-lg ${lm.color}`}>{lm.icon}</span>
                            <p className="text-sm font-medium">{claim.benefitName}</p>
                            <span className="text-xs text-muted-foreground">·</span>
                            <p className="text-xs text-muted-foreground">{claim.salaryLevel} Level</p>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span>Amount: <strong className="text-primary">{formatPoints(claim.benefitAmount)} RV</strong></span>
                            <span>·</span>
                            <span>Claimed: {new Date(claim.claimedAt).toLocaleDateString('en-IN')}</span>
                            {claim.userId?.advisorCode && (
                              <>
                                <span>·</span>
                                <span>Code: {claim.userId.advisorCode}</span>
                              </>
                            )}
                          </div>

                          {claim.adminNotes && (
                            <div className="mt-2 p-2 bg-muted rounded-lg">
                              <p className="text-xs text-muted-foreground">
                                <strong>Admin Notes:</strong> {claim.adminNotes}
                              </p>
                            </div>
                          )}

                          {claim.paymentDetails?.paidAt && (
                            <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                              <p className="text-xs text-emerald-700">
                                <strong>Payment:</strong> {claim.paymentDetails.method} · 
                                Ref: {claim.paymentDetails.referenceId} · 
                                Paid: {new Date(claim.paymentDetails.paidAt).toLocaleDateString('en-IN')}
                              </p>
                              {claim.paymentDetails.notes && (
                                <p className="text-xs text-emerald-600 mt-1">{claim.paymentDetails.notes}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {claim.claimStatus === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenApprove(claim)}
                              className="h-8 text-xs"
                            >
                              <CheckCircle2 size={12} className="mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenReject(claim)}
                              className="h-8 text-xs text-red-600 hover:text-red-700"
                            >
                              <XCircle size={12} className="mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {claim.claimStatus === 'APPROVED' && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenPaid(claim)}
                            className="h-8 text-xs"
                          >
                            <CheckCircle2 size={12} className="mr-1" />
                            Mark as Paid
                          </Button>
                        )}
                        {claim.claimStatus === 'PAID' && (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <CheckCircle2 size={12} className="mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Modal */}
      <Dialog open={approveModal} onOpenChange={setApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Benefit Claim</DialogTitle>
            <DialogDescription>
              Approve {selectedClaim?.userId?.name}'s claim for {selectedClaim?.benefitName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm"><strong>Employee:</strong> {selectedClaim?.userId?.name}</p>
              <p className="text-sm"><strong>Benefit:</strong> {selectedClaim?.benefitName}</p>
              <p className="text-sm"><strong>Amount:</strong> {formatPoints(selectedClaim?.benefitAmount || 0)} RV</p>
            </div>
            <div className="space-y-1.5">
              <Label>Admin Notes (Optional)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModal(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={modalLoading}>
              {modalLoading ? 'Approving...' : 'Approve Claim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Modal */}
      <Dialog open={paidModal} onOpenChange={setPaidModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Claim as Paid</DialogTitle>
            <DialogDescription>
              Record payment details for {selectedClaim?.userId?.name}'s {selectedClaim?.benefitName} claim
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm"><strong>Employee:</strong> {selectedClaim?.userId?.name}</p>
              <p className="text-sm"><strong>Benefit:</strong> {selectedClaim?.benefitName}</p>
              <p className="text-sm"><strong>Amount:</strong> {formatPoints(selectedClaim?.benefitAmount || 0)} RV</p>
            </div>
            
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Reference ID *</Label>
              <Input
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="Transaction ID, UTR, or Cheque Number"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Payment Notes (Optional)</Label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add any additional payment details..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaidModal(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button onClick={handleMarkPaid} disabled={modalLoading}>
              {modalLoading ? 'Processing...' : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModal} onOpenChange={setRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Benefit Claim</DialogTitle>
            <DialogDescription>
              Reject {selectedClaim?.userId?.name}'s claim for {selectedClaim?.benefitName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>Warning:</strong> This action will reject the claim. The employee will be notified.
              </p>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm"><strong>Employee:</strong> {selectedClaim?.userId?.name}</p>
              <p className="text-sm"><strong>Benefit:</strong> {selectedClaim?.benefitName}</p>
              <p className="text-sm"><strong>Amount:</strong> {formatPoints(selectedClaim?.benefitAmount || 0)} RV</p>
            </div>

            <div className="space-y-1.5">
              <Label>Reason for Rejection *</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Explain why this claim is being rejected..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={modalLoading}
            >
              {modalLoading ? 'Rejecting...' : 'Reject Claim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
