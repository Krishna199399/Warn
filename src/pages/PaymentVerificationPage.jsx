import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { manualPaymentsApi } from '@/api/payments.api';
import { toast } from 'sonner';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button }    from '@/components/ui/button';
import { Badge }     from '@/components/ui/badge';
import { Textarea }  from '@/components/ui/textarea';
import { Label }     from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  CheckCircle2, XCircle, Clock, Smartphone, Banknote,
  RefreshCw, IndianRupee, User, ShoppingBag, Eye, History,
  AlertCircle, BadgeCheck, TrendingUp,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    PENDING:  { label: 'Pending',  variant: 'outline',     icon: Clock,         className: 'text-amber-500 border-amber-400' },
    VERIFIED: { label: 'Verified', variant: 'default',     icon: CheckCircle2,  className: 'bg-green-500 text-white hover:bg-green-600' },
    REJECTED: { label: 'Rejected', variant: 'destructive', icon: XCircle,       className: '' },
  };
  const cfg  = map[status] || map.PENDING;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className={`gap-1 ${cfg.className}`}>
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

// ─── Method Badge ─────────────────────────────────────────────────────────────
function MethodBadge({ method }) {
  return method === 'UPI' ? (
    <Badge variant="secondary" className="gap-1 text-blue-600 bg-blue-500/10 border-blue-400/40 border">
      <Smartphone className="size-3" /> UPI
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1 text-emerald-600 bg-emerald-500/10 border-emerald-400/40 border">
      <Banknote className="size-3" /> Cash
    </Badge>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatsCard({ label, value, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('500', '500/10')}`}>
            <Icon className={`size-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Proof Card ───────────────────────────────────────────────────────────────
function ProofCard({ proof, onAction }) {
  const [expanded, setExpanded] = useState(false);

  const order = proof.orderId || {};
  const buyer = proof.submittedBy || {};

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header row */}
        <div className="flex items-start gap-4 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
            {buyer.name?.[0]?.toUpperCase() || 'M'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{buyer.name || 'Unknown'}</span>
              <MethodBadge method={proof.method} />
              <StatusBadge status={proof.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {buyer.shopName && <span className="mr-2">🏪 {buyer.shopName}</span>}
              {buyer.phone && <span>📞 {buyer.phone}</span>}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-primary flex items-center gap-0.5 justify-end">
              <IndianRupee className="size-3.5" />
              {order.total?.toLocaleString('en-IN') || '—'}
            </p>
            <p className="text-xs text-muted-foreground font-mono">{order.orderNumber}</p>
          </div>
        </div>

        <Separator />

        {/* Details row */}
        <div className="px-4 py-3 grid grid-cols-2 gap-3 text-sm">
          {proof.method === 'UPI' && proof.referenceId && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-0.5">Reference ID</p>
              <p className="font-mono font-semibold text-sm">{proof.referenceId}</p>
            </div>
          )}
          {proof.method === 'CASH' && proof.note && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-0.5">Cash Note</p>
              <p className="text-sm text-foreground">{proof.note}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Submitted</p>
            <p className="text-xs font-medium">{new Date(proof.createdAt).toLocaleString('en-IN')}</p>
          </div>
          {proof.status === 'REJECTED' && proof.rejectionReason && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Rejection Reason</p>
              <p className="text-xs text-destructive">{proof.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Screenshot */}
        {proof.screenshotUrl && (
          <div className="px-4 pb-3">
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Eye className="size-3.5" />
              {expanded ? 'Hide' : 'View'} Screenshot
            </button>
            {expanded && (
              <div className="mt-2 rounded-xl overflow-hidden border max-h-72">
                <img
                  src={`${API_BASE}${proof.screenshotUrl}`}
                  alt="Payment screenshot"
                  className="w-full object-contain bg-muted"
                />
              </div>
            )}
          </div>
        )}

        {/* Actions — only for PENDING */}
        {proof.status === 'PENDING' && (
          <>
            <Separator />
            <div className="flex gap-2 p-4">
              <Button
                id={`approve-${proof._id}`}
                variant="default"
                size="sm"
                className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700"
                onClick={() => onAction(proof, 'APPROVE')}
              >
                <CheckCircle2 className="size-4" />
                Approve
              </Button>
              <Button
                id={`reject-${proof._id}`}
                variant="destructive"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => onAction(proof, 'REJECT')}
              >
                <XCircle className="size-4" />
                Reject
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PaymentVerificationPage() {
  const navigate = useNavigate();

  const [stats,       setStats]       = useState(null);
  const [pending,     setPending]     = useState([]);
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [histLoading, setHistLoading] = useState(false);
  const [processing,  setProcessing]  = useState(false);

  // Reject dialog state
  const [rejectDialog, setRejectDialog] = useState({ open: false, proof: null });
  const [rejectReason,  setRejectReason] = useState('');

  // ── Loaders ───────────────────────────────────────────────────────────────
  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes] = await Promise.all([
        manualPaymentsApi.getStats(),
        manualPaymentsApi.getPending(),
      ]);
      setStats(statsRes.data?.data);
      setPending(pendingRes.data?.data || []);
    } catch {
      toast.error('Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await manualPaymentsApi.getHistory();
      setHistory(res.data?.data || []);
    } catch {
      toast.error('Failed to load payment history');
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);

  const handleTabChange = (tab) => {
    if (tab === 'history' && history.length === 0) loadHistory();
  };

  // ── Action handler ────────────────────────────────────────────────────────
  const handleAction = (proof, action) => {
    if (action === 'REJECT') {
      setRejectReason('');
      setRejectDialog({ open: true, proof });
    } else {
      executeVerify(proof._id, 'APPROVE');
    }
  };

  const executeVerify = async (proofId, action, reason) => {
    setProcessing(true);
    try {
      await manualPaymentsApi.verifyProof({
        proofId,
        action,
        rejectionReason: reason || undefined,
      });
      toast.success(
        action === 'APPROVE'
          ? 'Payment approved! Order marked as PAID.'
          : 'Payment rejected. Buyer has been notified.'
      );
      setRejectDialog({ open: false, proof: null });
      await loadPending();
      // Invalidate history so it reloads next time
      setHistory([]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold">Payment Verification</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and verify payment proofs submitted by Mini Stock buyers.
        </p>
      </div>

      {/* ── Stats ── */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="pt-5 h-20 animate-pulse bg-muted rounded-xl" /></Card>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-3 gap-4">
          <StatsCard label="Pending"  value={stats.pending}  icon={Clock}        color="text-amber-500" />
          <StatsCard label="Verified" value={stats.verified} icon={BadgeCheck}   color="text-green-500" />
          <StatsCard label="Rejected" value={stats.rejected} icon={XCircle}      color="text-destructive" />
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs defaultValue="pending" onValueChange={handleTabChange}>
        <TabsList className="w-full">
          <TabsTrigger value="pending"  className="flex-1 gap-1.5">
            <Clock className="size-3.5" />
            Pending
            {stats?.pending > 0 && (
              <Badge className="ml-1 bg-amber-500 text-white text-xs px-1.5 py-0 h-5">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 gap-1.5">
            <History className="size-3.5" />
            History
          </TabsTrigger>
        </TabsList>

        {/* ── Pending Tab ── */}
        <TabsContent value="pending" className="mt-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : pending.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="size-10 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-green-600">All caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">No pending payment proofs to review.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {pending.length} proof{pending.length !== 1 ? 's' : ''} awaiting your verification
              </p>
              {pending.map(proof => (
                <ProofCard key={proof._id} proof={proof} onAction={handleAction} />
              ))}
            </>
          )}
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history" className="mt-4 space-y-4">
          {histLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="size-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No payment history yet.</p>
              </CardContent>
            </Card>
          ) : (
            history.map(proof => (
              <ProofCard key={proof._id} proof={proof} onAction={handleAction} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* ── Reject Dialog ── */}
      <Dialog open={rejectDialog.open} onOpenChange={open => !processing && setRejectDialog(v => ({ ...v, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="size-5" /> Reject Payment
            </DialogTitle>
            <DialogDescription>
              Provide a reason so the buyer knows what to fix and resubmit.
            </DialogDescription>
          </DialogHeader>

          {rejectDialog.proof && (
            <div className="py-2 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted text-sm">
                <User className="size-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="font-medium">{rejectDialog.proof.submittedBy?.name}</span>
                  <span className="text-muted-foreground ml-2 font-mono text-xs">
                    {rejectDialog.proof.orderId?.orderNumber}
                  </span>
                </div>
                <span className="ml-auto font-bold text-primary flex items-center gap-0.5">
                  <IndianRupee className="size-3" />
                  {rejectDialog.proof.orderId?.total?.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rejectReason">
                  Rejection Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="rejectReason"
                  placeholder="e.g. Wrong reference ID, amount mismatch, screenshot unclear…"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setRejectDialog({ open: false, proof: null })}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              id="confirm-reject-btn"
              variant="destructive"
              disabled={!rejectReason.trim() || processing}
              onClick={() => executeVerify(rejectDialog.proof._id, 'REJECT', rejectReason)}
              className="gap-1.5"
            >
              {processing ? <RefreshCw className="size-4 animate-spin" /> : <XCircle className="size-4" />}
              {processing ? 'Rejecting…' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
