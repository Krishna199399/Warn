import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, CheckCircle, XCircle, Eye, Loader2, 
  Wallet, Banknote, User, Phone, FileText, 
  Calendar, Package, AlertCircle, Search, Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { manualPaymentsApi } from '../api/payments.api';
import { formatCurrency, formatDate } from '../utils/helpers';
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

// Helper function to get full screenshot URL
const getScreenshotUrl = (relativePath) => {
  if (!relativePath) return null;
  // If already a full URL, return as is
  if (relativePath.startsWith('http')) return relativePath;
  // Otherwise, prepend the backend base URL
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Remove '/api' from base URL and add the relative path
  const serverUrl = baseUrl.replace('/api', '');
  return `${serverUrl}${relativePath}`;
};

export default function PendingPaymentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [stats, setStats] = useState({ pending: 0, verified: 0, rejected: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Verification Modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Load payments
  useEffect(() => {
    loadPayments();
    loadStats();
  }, []);

  const loadPayments = async () => {
    try {
      const res = await manualPaymentsApi.getPending();
      setPayments(res.data.data || []);
      setFilteredPayments(res.data.data || []);
    } catch (error) {
      console.error('Failed to load payments:', error);
      toast.error('Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await manualPaymentsApi.getStats();
      setStats(res.data.data || { pending: 0, verified: 0, rejected: 0 });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...payments];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.orderId?.orderNumber?.toLowerCase().includes(query) ||
        payment.submittedBy?.name?.toLowerCase().includes(query) ||
        payment.referenceId?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => 
        payment.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredPayments(filtered);
  }, [searchQuery, statusFilter, payments]);

  const handleVerify = (proof, action) => {
    setSelectedProof(proof);
    setShowVerifyModal(true);
    setRejectionReason('');
  };

  const submitVerification = async (approved) => {
    if (!selectedProof) return;
    
    if (!approved && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setVerifying(true);
    try {
      await manualPaymentsApi.verifyProof({
        proofId: selectedProof._id,
        action: approved ? 'APPROVE' : 'REJECT',
        rejectionReason: approved ? null : rejectionReason.trim(),
      });

      toast.success(
        approved 
          ? 'Payment verified successfully!' 
          : 'Payment rejected'
      );

      setShowVerifyModal(false);
      setSelectedProof(null);
      setRejectionReason('');
      
      // Reload data
      loadPayments();
      loadStats();
    } catch (error) {
      console.error('Verification failed:', error);
      toast.error(error.response?.data?.error || 'Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: { variant: 'secondary', icon: Clock, color: 'text-amber-600' },
      VERIFIED: { variant: 'default', icon: CheckCircle, color: 'text-emerald-600' },
      REJECTED: { variant: 'destructive', icon: XCircle, color: 'text-destructive' },
    };
    
    const config = variants[status] || variants.PENDING;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon size={12} />
        {status}
      </Badge>
    );
  };

  const getMethodIcon = (method) => {
    return method === 'UPI' ? Wallet : Banknote;
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
          <h1 className="text-2xl font-bold tracking-tight">Payment Verification</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and verify payment proofs from Mini Stock buyers
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
                  Pending Verification
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
                  Verified
                </p>
                <p className="text-3xl font-bold tracking-tight text-emerald-600">
                  {stats.verified}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Approved payments</p>
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
            <p className="text-xs text-muted-foreground mt-3">Declined payments</p>
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
              placeholder="Search by order number, buyer name, or reference ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-muted/30"
            />
          </div>
          <div className="w-full md:w-48 shrink-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-muted-foreground" />
                  <SelectValue placeholder="Filter by Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        {filteredPayments.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileText size={28} className="text-muted-foreground/60" />
            </div>
            <p className="text-lg font-semibold text-foreground">No payment proofs found</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search filters'
                : 'Payment proofs will appear here when Mini Stock submits them'}
            </p>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredPayments.map((proof) => {
                const MethodIcon = getMethodIcon(proof.method);
                const order = proof.orderId;
                
                return (
                  <div key={proof._id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        proof.method === 'UPI' ? 'bg-emerald-50' : 'bg-amber-50'
                      }`}>
                        <MethodIcon size={24} className={
                          proof.method === 'UPI' ? 'text-emerald-600' : 'text-amber-600'
                        } />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">
                                {proof.submittedBy?.name || 'Unknown Buyer'}
                              </h3>
                              {getStatusBadge(proof.status)}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">
                              Order: {order?.orderNumber || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">
                              {formatCurrency(order?.total || 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(proof.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          {/* Buyer Info */}
                          <div className="flex items-center gap-2 text-sm">
                            <User size={14} className="text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground truncate">
                              {proof.submittedBy?.phone || 'No phone'}
                            </span>
                          </div>

                          {/* Payment Method */}
                          <div className="flex items-center gap-2 text-sm">
                            <MethodIcon size={14} className="text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">
                              {proof.method} Payment
                            </span>
                          </div>

                          {/* Product */}
                          <div className="flex items-center gap-2 text-sm">
                            <Package size={14} className="text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground truncate">
                              {order?.productId?.name || 'Product'}
                            </span>
                          </div>
                        </div>

                        {/* Payment Details */}
                        <div className="bg-muted/30 rounded-lg p-3 mb-3">
                          {proof.method === 'UPI' ? (
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-4">
                                <span className="text-xs text-muted-foreground">Reference ID:</span>
                                <span className="text-xs font-mono font-semibold text-foreground">
                                  {proof.referenceId || 'N/A'}
                                </span>
                              </div>
                              {proof.screenshotUrl && (
                                <div className="pt-2 border-t">
                                  <a
                                    href={getScreenshotUrl(proof.screenshotUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                  >
                                    <Eye size={12} />
                                    View Screenshot
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="text-xs text-muted-foreground block mb-1">Note:</span>
                              <p className="text-xs text-foreground">{proof.note || 'No note provided'}</p>
                            </div>
                          )}
                        </div>

                        {/* Rejection Reason */}
                        {proof.status === 'REJECTED' && proof.rejectionReason && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-destructive mb-1">
                                  Rejection Reason:
                                </p>
                                <p className="text-xs text-destructive/80">
                                  {proof.rejectionReason}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        {proof.status === 'PENDING' && (
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleVerify(proof, 'approve')}
                              className="flex-1 h-9"
                            >
                              <CheckCircle size={16} className="mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleVerify(proof, 'reject')}
                              variant="destructive"
                              className="flex-1 h-9"
                            >
                              <XCircle size={16} className="mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {proof.status === 'VERIFIED' && (
                          <div className="flex items-center gap-2 text-xs text-emerald-600">
                            <CheckCircle size={14} />
                            <span>Verified on {formatDate(proof.verifiedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Verification Modal */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Payment Proof</DialogTitle>
          </DialogHeader>
          
          {selectedProof && (
            <div className="space-y-4">
              {/* Proof Summary */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Buyer:</span>
                  <span className="text-sm font-semibold">{selectedProof.submittedBy?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(selectedProof.orderId?.total || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Method:</span>
                  <span className="text-sm font-semibold">{selectedProof.method}</span>
                </div>
                {selectedProof.method === 'UPI' && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ref ID:</span>
                    <span className="text-sm font-mono font-semibold">
                      {selectedProof.referenceId}
                    </span>
                  </div>
                )}
              </div>

              {/* Rejection Reason Input */}
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">
                  Rejection Reason (if rejecting)
                </Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="e.g., Invalid reference ID, amount mismatch, screenshot unclear..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={() => submitVerification(false)}
              disabled={verifying}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              {verifying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle size={16} className="mr-2" />
              )}
              Reject
            </Button>
            <Button
              onClick={() => submitVerification(true)}
              disabled={verifying}
              className="w-full sm:w-auto"
            >
              {verifying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle size={16} className="mr-2" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
