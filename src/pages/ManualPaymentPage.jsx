import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { manualPaymentsApi } from '@/api/payments.api';
import { ordersApi } from '@/api/orders.api';
import { toast } from 'sonner';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge }    from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Smartphone, Banknote, Upload, CheckCircle2,
  Clock, XCircle, Copy, AlertCircle, Package, IndianRupee,
  Image as ImageIcon, RefreshCw,
} from 'lucide-react';

// ─── Payment Method Tab ───────────────────────────────────────────────────────
function MethodTab({ active, onClick, icon: Icon, label, description }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
        active
          ? 'border-primary bg-primary/10 text-primary shadow-sm'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
      }`}
    >
      <Icon className="size-7" />
      <span className="font-semibold text-sm">{label}</span>
      <span className="text-xs opacity-70 text-center leading-tight">{description}</span>
    </button>
  );
}

// ─── Status Banner ────────────────────────────────────────────────────────────
function ProofStatusBanner({ proof }) {
  if (!proof) return null;

  const configs = {
    PENDING: {
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10 border-amber-500/30',
      title: 'Payment Proof Submitted',
      msg: 'Your proof is under review. The seller will verify it shortly.',
    },
    VERIFIED: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10 border-green-500/30',
      title: 'Payment Verified ✅',
      msg: 'Your payment has been verified! Delivery will be arranged.',
    },
    REJECTED: {
      icon: XCircle,
      color: 'text-destructive',
      bg: 'bg-destructive/10 border-destructive/30',
      title: 'Payment Rejected',
      msg: proof.rejectionReason
        ? `Reason: ${proof.rejectionReason}. Please resubmit with correct proof.`
        : 'Your payment proof was rejected. Please resubmit.',
    },
  };

  const cfg = configs[proof.status];
  const Icon = cfg.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${cfg.bg}`}>
      <Icon className={`size-5 mt-0.5 shrink-0 ${cfg.color}`} />
      <div>
        <p className={`font-semibold text-sm ${cfg.color}`}>{cfg.title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{cfg.msg}</p>
        {proof.status !== 'REJECTED' && (
          <p className="text-xs text-muted-foreground mt-1">
            Submitted: {new Date(proof.createdAt).toLocaleString('en-IN')}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ManualPaymentPage() {
  const { orderId } = useParams();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [order,        setOrder]        = useState(null);
  const [seller,       setSeller]       = useState(null);
  const [existingProof, setExistingProof] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);

  // Form state
  const [method,       setMethod]       = useState('UPI');
  const [referenceId,  setReferenceId]  = useState('');
  const [note,         setNote]         = useState('');
  const [screenshot,   setScreenshot]   = useState(null);
  const [preview,      setPreview]      = useState(null);

  // ── Load order + seller + existing proof ──────────────────────────────────
  const loadData = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const [orderRes, proofRes] = await Promise.allSettled([
        ordersApi.getOne(orderId),
        manualPaymentsApi.getProofByOrder(orderId),
      ]);

      if (orderRes.status === 'fulfilled') {
        const ord = orderRes.value.data?.data || orderRes.value.data;
        setOrder(ord);

        if (ord?.sellerId) {
          try {
            const sellerRes = await manualPaymentsApi.getSellerProfile(
              ord.sellerId?._id || ord.sellerId
            );
            setSeller(sellerRes.data?.data);
          } catch (_) {}
        }
      }

      if (proofRes.status === 'fulfilled') {
        setExistingProof(proofRes.value.data?.data);
      }
    } catch (err) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Screenshot preview ────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Screenshot must be under 5MB');
      return;
    }
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  };

  // ── Copy UPI ID ───────────────────────────────────────────────────────────
  const copyUPI = () => {
    if (seller?.upiId) {
      navigator.clipboard.writeText(seller.upiId);
      toast.success('UPI ID copied!');
    }
  };

  // ── Submit proof ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!order) return;

    // Validate
    if (method === 'UPI' && !referenceId.trim()) {
      toast.error('Please enter the UPI reference / transaction ID');
      return;
    }
    if (method === 'CASH' && !note.trim()) {
      toast.error('Please enter a note for the cash payment');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('orderId', orderId);
      fd.append('method', method);
      if (method === 'UPI') fd.append('referenceId', referenceId.trim());
      if (method === 'CASH') fd.append('note', note.trim());
      if (screenshot) fd.append('screenshot', screenshot);

      await manualPaymentsApi.submitProof(fd);
      toast.success('Payment proof submitted! Waiting for seller verification.');
      await loadData(); // Refresh to show status banner
      setReferenceId('');
      setNote('');
      setScreenshot(null);
      setPreview(null);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit payment proof';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <AlertCircle className="size-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Order not found.</p>
        <Button className="mt-4" onClick={() => navigate('/app/orders')}>Back to Orders</Button>
      </div>
    );
  }

  const isPaid     = existingProof?.status === 'VERIFIED';
  const isPending  = existingProof?.status === 'PENDING';
  const canSubmit  = !isPaid && !isPending;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* ── Back nav ── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/orders')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Pay for Order</h1>
          <p className="text-sm text-muted-foreground">{order.orderNumber}</p>
        </div>
      </div>

      {/* ── Status banner (if proof already submitted) ── */}
      {existingProof && <ProofStatusBanner proof={existingProof} />}

      {/* ── Order Summary ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="size-4" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order Number</span>
            <span className="font-mono font-semibold">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Product</span>
            <span className="font-medium">
              {order.productId?.name || 'Product'} × {order.quantity}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total Amount</span>
            <span className="text-2xl font-bold text-primary flex items-center gap-1">
              <IndianRupee className="size-5" />
              {order.total?.toLocaleString('en-IN') || '—'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Seller Payment Details ── */}
      {seller && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pay To</CardTitle>
            <CardDescription>Transfer the amount to the seller using the details below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-semibold">{seller.name}</span>
            </div>
            {seller.shopName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shop</span>
                <span className="font-medium">{seller.shopName}</span>
              </div>
            )}
            {seller.phone && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{seller.phone}</span>
              </div>
            )}
            {seller.upiId && (
              <>
                <Separator />
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">UPI ID</p>
                    <p className="font-mono font-bold text-primary text-sm mt-0.5">{seller.upiId}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={copyUPI} className="gap-1.5">
                    <Copy className="size-3.5" />
                    Copy
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Payment Form ── */}
      {canSubmit ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submit Payment Proof</CardTitle>
            <CardDescription>
              After paying manually, submit your proof below for verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Method selector */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="flex gap-3">
                  <MethodTab
                    active={method === 'UPI'}
                    onClick={() => setMethod('UPI')}
                    icon={Smartphone}
                    label="UPI"
                    description="PhonePe, GPay, Paytm"
                  />
                  <MethodTab
                    active={method === 'CASH'}
                    onClick={() => setMethod('CASH')}
                    icon={Banknote}
                    label="Cash"
                    description="Hand-delivered payment"
                  />
                </div>
              </div>

              {/* UPI fields */}
              {method === 'UPI' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="referenceId">
                      UPI Reference / Transaction ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="referenceId"
                      placeholder="e.g. 123456789012"
                      value={referenceId}
                      onChange={e => setReferenceId(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Find this in your UPI app's transaction history
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="screenshot">
                      Screenshot <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    {preview ? (
                      <div className="relative rounded-xl overflow-hidden border">
                        <img src={preview} alt="Screenshot preview" className="w-full max-h-56 object-contain bg-muted" />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 h-7 text-xs"
                          onClick={() => { setScreenshot(null); setPreview(null); }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label
                        htmlFor="screenshot"
                        className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors"
                      >
                        <ImageIcon className="size-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload payment screenshot</span>
                        <span className="text-xs text-muted-foreground/60">PNG, JPG up to 5MB</span>
                        <input
                          id="screenshot"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Cash fields */}
              {method === 'CASH' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="note">
                      Payment Note <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="note"
                      placeholder="e.g. Paid ₹5,000 cash on 5 May 2026 at 10:30 AM. Received by Ravi Sir."
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Include date, time, and amount for clear records
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cashScreenshot">
                      Optional Photo <span className="text-muted-foreground">(receipt, etc.)</span>
                    </Label>
                    {preview ? (
                      <div className="relative rounded-xl overflow-hidden border">
                        <img src={preview} alt="Receipt preview" className="w-full max-h-56 object-contain bg-muted" />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 h-7 text-xs"
                          onClick={() => { setScreenshot(null); setPreview(null); }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label
                        htmlFor="cashScreenshot"
                        className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors"
                      >
                        <Upload className="size-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload receipt / photo</span>
                        <input
                          id="cashScreenshot"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full gap-2 h-11"
                disabled={submitting}
                size="lg"
              >
                {submitting ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                {submitting ? 'Submitting…' : 'I Have Paid — Submit Proof'}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                The seller will verify your payment before delivery is arranged.
              </p>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Already submitted */
        existingProof?.status === 'PENDING' && (
          <Card className="border-amber-500/30">
            <CardContent className="pt-5 text-center space-y-2">
              <Clock className="size-8 text-amber-500 mx-auto" />
              <p className="font-semibold">Waiting for Verification</p>
              <p className="text-sm text-muted-foreground">
                Your {existingProof.method} proof has been submitted. The seller will verify it soon.
              </p>
              {existingProof.referenceId && (
                <Badge variant="outline" className="font-mono text-xs">
                  Ref: {existingProof.referenceId}
                </Badge>
              )}
              {existingProof.screenshotUrl && (
                <div className="mt-3 rounded-xl overflow-hidden border max-h-48">
                  <img
                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${existingProof.screenshotUrl}`}
                    alt="Submitted screenshot"
                    className="w-full object-contain bg-muted"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )
      )}

      {/* Verified state */}
      {existingProof?.status === 'VERIFIED' && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-5 text-center space-y-3">
            <CheckCircle2 className="size-10 text-green-500 mx-auto" />
            <p className="font-bold text-green-600 dark:text-green-400">Payment Confirmed!</p>
            <p className="text-sm text-muted-foreground">
              Verified on {new Date(existingProof.verifiedAt).toLocaleString('en-IN')}
            </p>
            <Button onClick={() => navigate('/app/orders')} className="gap-1.5">
              <ArrowLeft className="size-4" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
