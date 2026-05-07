import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../api/orders.api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, countByField } from '../utils/helpers';
import {
  ShoppingCart, CheckCircle, Truck, PackageCheck, XCircle,
  Clock, Search, Package, AlertCircle,
  ThumbsUp, ThumbsDown, Send, Building2, Store, Info, MapPin, Phone, User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { LoadingGrid } from '@/components/ui/loading-grid';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';

// ── Status config ─────────────────────────────────────────────────────────────
const S = {
  PENDING:   { label: 'Pending',   Icon: Clock,        variant: 'outline',     color: 'text-amber-600'   },
  APPROVED:  { label: 'Approved',  Icon: CheckCircle,  variant: 'secondary',   color: 'text-blue-600'    },
  SHIPPED:   { label: 'Shipped',   Icon: Truck,        variant: 'secondary',   color: 'text-purple-600'  },
  DELIVERED: { label: 'Delivered', Icon: PackageCheck, variant: 'default',     color: 'text-primary'     },
  CANCELLED: { label: 'Cancelled', Icon: XCircle,      variant: 'destructive', color: 'text-destructive' },
};
const STEPS = ['PENDING','APPROVED','SHIPPED','DELIVERED'];

function StatusBadge({ status }) {
  const m = S[status] || S.PENDING;
  return (
    <Badge variant={m.variant} className={status === 'PENDING' ? 'border-amber-200 text-amber-600' : ''}>
      <m.Icon size={12} className="mr-1"/>{m.label}
    </Badge>
  );
}

// ── Order Tracker stepper ─────────────────────────────────────────────────────
function Stepper({ status }) {
  if (status === 'CANCELLED') return (
    <span className="text-xs text-destructive font-medium flex items-center gap-1"><XCircle size={13}/>Cancelled</span>
  );
  const cur = STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STEPS.map((step, i) => {
        const done = i <= cur; const active = i === cur;
        const m = S[step];
        return (
          <React.Fragment key={step}>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${active ? 'text-primary' : done ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                active ? 'border-primary bg-primary text-primary-foreground' :
                done   ? 'border-muted-foreground bg-background text-muted-foreground' :
                         'border-muted bg-background text-muted-foreground/40'
              }`}>
                {done && !active ? <CheckCircle size={10}/> : <m.Icon size={10}/>}
              </div>
              <span className="hidden sm:inline whitespace-nowrap">{m.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`h-0.5 w-6 rounded-full ${i < cur ? 'bg-primary/50' : 'bg-muted'}`}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Wholesale Purchase Card ───────────────────────────────────────────────────
function PurchaseCard({ order, onDeliver, userRole }) {
  const navigate = useNavigate();
  const getSellerDisplay = () => {
    if (order.sellerType === 'COMPANY') return { icon: Building2, text: 'Company → You' };
    if (order.sellerType === 'WHOLESALE') return { icon: Store, text: 'Wholesale → You' };
    if (order.sellerType === 'MINI_STOCK') return { icon: Store, text: 'Mini Stock → You' };
    return { icon: Building2, text: 'Seller → You' };
  };
  
  // Determine if tax should be shown
  const shouldShowTax = () => {
    // WHOLESALE purchasing from Company (B2B) - show tax
    if (userRole === 'WHOLESALE' && order.sellerType === 'COMPANY') return true;
    // MINI_STOCK purchasing from Wholesale (B2B) - show tax
    if (userRole === 'MINI_STOCK' && order.sellerType === 'WHOLESALE') return true;
    // All other cases - no tax display
    return false;
  };
  
  const showTax = shouldShowTax();
  const taxAmount = order.taxAmount || 0;
  const subtotal = order.total - taxAmount;
  
  const sellerDisplay = getSellerDisplay();
  const SellerIcon = sellerDisplay.icon;

  // Show "Pay Now" for Mini Stock orders purchased from Wholesale with pending payment
  // Only show if payment proof has NOT been submitted yet (no paymentMethod means no proof submitted)
  const showPayNow = userRole === 'MINI_STOCK'
    && order.sellerType === 'WHOLESALE'
    && order.paymentStatus === 'PENDING'
    && !order.paymentMethod  // No payment method means proof not submitted yet
    && order.status !== 'CANCELLED';
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Package size={20} className="text-primary"/>
            </div>
            <div>
              <p className="font-semibold text-foreground line-clamp-1">{order.productId?.name || '—'}</p>
              <p className="text-sm text-muted-foreground">
                {order.quantity} units
                {showTax && taxAmount > 0 ? (
                  <span className="ml-2">
                    <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                    <span className="text-xs"> + Tax {formatCurrency(taxAmount)}</span>
                    <span className="font-semibold text-foreground"> = {formatCurrency(order.total)}</span>
                  </span>
                ) : (
                  <span> · <span className="font-medium text-foreground">{formatCurrency(order.total)}</span></span>
                )}
              </p>
            </div>
          </div>
          <StatusBadge status={order.status}/>
        </div>

        <div className="bg-muted/40 rounded-xl p-3">
          <Stepper status={order.status}/>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><SellerIcon size={14}/>{sellerDisplay.text}</span>
          <span>{new Date(order.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span>
          <span className={`flex items-center gap-1 font-semibold ${order.paymentStatus==='PAID'?'text-emerald-600':'text-amber-600'}`}>
            {order.paymentStatus==='PAID'?<CheckCircle size={12}/>:<AlertCircle size={12}/>}
            {order.paymentStatus}
          </span>
        </div>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <div className="bg-muted/40 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <MapPin size={14} className="text-primary"/>
              Delivery Address
            </div>
            {order.deliveryAddress.shopName && (
              <p className="text-sm font-medium text-foreground">{order.deliveryAddress.shopName}</p>
            )}
            <div className="text-xs text-muted-foreground space-y-0.5">
              {order.deliveryAddress.name && (
                <p className="flex items-center gap-1.5">
                  <User size={12}/>
                  {order.deliveryAddress.name}
                  {order.deliveryAddress.phone && ` • ${order.deliveryAddress.phone}`}
                </p>
              )}
              {order.deliveryAddress.street && <p>{order.deliveryAddress.street}</p>}
              {(order.deliveryAddress.city || order.deliveryAddress.state || order.deliveryAddress.pinCode) && (
                <p>
                  {[order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.pinCode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              {order.deliveryAddress.landmark && (
                <p className="text-[11px] italic">Landmark: {order.deliveryAddress.landmark}</p>
              )}
            </div>
          </div>
        )}

        {/* Pay Now — Mini Stock only, unpaid orders */}
        {showPayNow && (
          <Button
            id={`pay-now-${order._id}`}
            onClick={() => navigate(`/app/pay/${order._id}`)}
            className="w-full gap-2"
            variant="default"
          >
            Pay Now (UPI / Cash)
          </Button>
        )}

        {/* Payment Proof Submitted - Waiting for Verification */}
        {userRole === 'MINI_STOCK' 
          && order.sellerType === 'WHOLESALE' 
          && order.paymentStatus === 'PENDING' 
          && order.paymentMethod 
          && order.status !== 'CANCELLED' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <Clock size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Payment Proof Submitted</p>
              <p className="text-xs text-amber-700 mt-1">
                Your {order.paymentMethod} payment proof is waiting for seller verification.
              </p>
            </div>
          </div>
        )}

        {order.status === 'SHIPPED' && (
          <Button onClick={() => onDeliver(order._id)} className="w-full mt-2" variant="default">
            <PackageCheck size={16} className="mr-2"/>Confirm Delivery Received
          </Button>
        )}

        {order.orderNumber && <p className="text-[10px] text-muted-foreground font-mono text-right mt-2">{order.orderNumber}</p>}
      </CardContent>
    </Card>
  );
}

// ── Admin Management Card ─────────────────────────────────────────────────────
function AdminCard({ order, onVerifyPayment, onApprove, onReject, onShip }) {
  const isPending  = order.status === 'PENDING';
  const isApproved = order.status === 'APPROVED';
  const isShipped  = order.status === 'SHIPPED';
  const isPaid     = order.paymentStatus === 'PAID';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Package size={20} className="text-blue-600"/>
            </div>
            <div>
              <p className="font-semibold text-foreground line-clamp-1">{order.productId?.name || '—'}</p>
              <p className="text-sm text-muted-foreground">{order.quantity} units · <span className="font-medium text-foreground">{formatCurrency(order.total)}</span></p>
            </div>
          </div>
          <StatusBadge status={order.status}/>
        </div>

        <div className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3">
          <Store size={16} className="text-muted-foreground flex-shrink-0"/>
          <div className="text-sm">
            <span className="text-muted-foreground">Buyer: </span>
            <span className="font-semibold text-foreground">{order.buyerId?.name || '—'}</span>
            <p className="text-muted-foreground text-xs mt-0.5">{order.buyerId?.email}</p>
          </div>
        </div>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
              <MapPin size={14} className="text-blue-600"/>
              Delivery Address
            </div>
            {order.deliveryAddress.shopName && (
              <p className="text-sm font-medium text-blue-900">{order.deliveryAddress.shopName}</p>
            )}
            <div className="text-xs text-blue-700 space-y-0.5">
              {order.deliveryAddress.name && (
                <p className="flex items-center gap-1.5">
                  <User size={12}/>
                  {order.deliveryAddress.name}
                  {order.deliveryAddress.phone && (
                    <span className="flex items-center gap-1">
                      • <Phone size={11}/>{order.deliveryAddress.phone}
                    </span>
                  )}
                </p>
              )}
              {order.deliveryAddress.street && <p>{order.deliveryAddress.street}</p>}
              {(order.deliveryAddress.city || order.deliveryAddress.state || order.deliveryAddress.pinCode) && (
                <p>
                  {[order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.pinCode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              {order.deliveryAddress.landmark && (
                <p className="text-[11px] italic">Landmark: {order.deliveryAddress.landmark}</p>
              )}
            </div>
          </div>
        )}

        {isPending && !isPaid && (
          <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-xl py-2 px-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <h5 className="text-xs font-semibold">Payment Not Confirmed</h5>
            </div>
            <div className="text-xs mt-1 ml-6 flex items-center justify-between">
              Cannot approve order yet.
              <Button onClick={() => onVerifyPayment(order._id)} size="sm" variant="outline" className="h-7 text-xs bg-white text-amber-700 border-amber-300 hover:bg-amber-100">
                Mark as Paid
              </Button>
            </div>
          </div>
        )}
        
        {isPaid && isPending && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-emerald-700 text-xs font-medium">
            <CheckCircle size={14} />
            Payment verified — ready to approve
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{new Date(order.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span>
          <span className={`flex items-center gap-1 font-semibold ${order.paymentStatus==='PAID'?'text-emerald-600':'text-amber-600'}`}>
            {order.paymentStatus==='PAID'?<CheckCircle size={12}/>:<AlertCircle size={12}/>}
            {order.paymentStatus}
          </span>
          {order.orderNumber && <span className="font-mono text-[10px]">{order.orderNumber}</span>}
        </div>

        {isPending && (
          <div className="flex gap-2 pt-2">
            <Button onClick={() => onApprove(order._id)} disabled={order.paymentStatus !== 'PAID'} className="flex-1" variant="default">
              <ThumbsUp size={14} className="mr-2"/>Approve
            </Button>
            <Button onClick={() => onReject(order._id)} variant="outline" className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
              <ThumbsDown size={14} className="mr-2"/>Reject
            </Button>
          </div>
        )}
        {isApproved && (
          <Button onClick={() => onShip(order._id)} className="w-full mt-2" variant="default">
            <Send size={16} className="mr-2"/>Mark as Shipped
          </Button>
        )}
        {isShipped && (
          <div className="flex items-center justify-center gap-2 py-2 mt-2 rounded-xl bg-purple-50 text-purple-700 text-sm font-medium">
            <Truck size={16}/>Shipped · Awaiting buyer confirmation
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Wholesale Incoming Table ──────────────────────────────────────────────────
function IncomingTable({ orders, userId, onApprove, onShip, onVerifyPayment, onReject }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Delivery To</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Payment</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(o => {
              const isSeller = o.sellerId?._id === userId;
              const isCustomerOrder = o.buyerType === 'CUSTOMER';
              const canVerifyPayment = o.status === 'PENDING' && o.paymentStatus === 'PENDING' && isSeller && !isCustomerOrder;
              const canApprove = o.status === 'PENDING' && isSeller && (o.paymentStatus === 'PAID' || isCustomerOrder);
              const canReject = o.status === 'PENDING' && isSeller;
              const canShip = o.status === 'APPROVED' && isSeller;
              
              return (
                <TableRow key={o._id} className="hover:bg-muted/30">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                  </TableCell>
                  <TableCell className="font-medium">{o.productId?.name||'—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{o.buyerId?.name||'—'}</TableCell>
                  <TableCell className="text-xs max-w-[200px]">
                    {o.deliveryAddress ? (
                      <div className="space-y-0.5">
                        {o.deliveryAddress.shopName && (
                          <p className="font-medium text-foreground">{o.deliveryAddress.shopName}</p>
                        )}
                        {o.deliveryAddress.name && (
                          <p className="text-muted-foreground">
                            {o.deliveryAddress.name}
                            {o.deliveryAddress.phone && ` • ${o.deliveryAddress.phone}`}
                          </p>
                        )}
                        {o.deliveryAddress.city && o.deliveryAddress.state && (
                          <p className="text-muted-foreground">
                            {o.deliveryAddress.city}, {o.deliveryAddress.state}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {o.quantity || (o.total && o.price ? Math.round(o.total / o.price) : '—')}
                  </TableCell>
                  <TableCell className="font-bold text-primary text-right">{formatCurrency(o.total)}</TableCell>
                  <TableCell className="text-center"><StatusBadge status={o.status}/></TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs font-semibold ${o.paymentStatus==='PAID'?'text-emerald-600':'text-amber-600'}`}>
                      {o.paymentStatus}
                    </span>
                    {isCustomerOrder && o.paymentStatus === 'PENDING' && (
                      <span className="block text-[10px] text-muted-foreground">Cash sale</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      {canVerifyPayment && (
                        <Button onClick={() => onVerifyPayment(o._id)} size="sm" variant="outline" className="h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-50">
                          Mark Paid
                        </Button>
                      )}
                      {canApprove && (
                        <Button onClick={() => onApprove(o._id)} size="sm" variant="default" className="h-7 text-xs">
                          Approve
                        </Button>
                      )}
                      {canReject && (
                        <Button onClick={() => onReject(o._id)} size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                          Reject
                        </Button>
                      )}
                      {canShip && (
                        <Button onClick={() => onShip(o._id)} size="sm" variant="default" className="h-7 text-xs">
                          Ship
                        </Button>
                      )}
                      {!canVerifyPayment && !canApprove && !canReject && !canShip && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="px-4 py-3 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground font-medium">{orders.length} order{orders.length!==1?'s':''}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Stat card (REMOVED - using StatCard component) ──────────────────────────

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { user } = useAuth();
  const isAdmin     = user?.role === 'ADMIN';
  const isWholesale = user?.role === 'WHOLESALE';

  const [purchases,  setPurchases]  = useState([]);
  const [incoming,   setIncoming]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [spinning,   setSpinning]   = useState(false);
  const [tab,        setTab]        = useState('purchases');
  const [filter,     setFilter]     = useState('All');
  const [search,     setSearch]     = useState('');

  const fetchAll = async (spin = false) => {
    spin ? setSpinning(true) : setLoading(true);
    try {
      if (isAdmin) {
        const r = await ordersApi.getAdminOrders();
        setPurchases(r.data.data || []);
      } else if (isWholesale) {
        const [p, i] = await Promise.all([ordersApi.getMyPurchases(), ordersApi.getWholesaleOrders()]);
        setPurchases(p.data.data || []);
        setIncoming(i.data.data || []);
      } else {
        const r = await ordersApi.getMiniOrders();
        setPurchases(r.data.data || []);
      }
    } catch (_) {}
    finally { setLoading(false); setSpinning(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // Actions
  const handleVerifyPayment = async (id) => {
    if (!window.confirm('Mark this order payment as PAID? This allows approval.')) return;
    try {
      await ordersApi.verifyPayment(id);
      const upd = o => o._id === id ? { ...o, paymentStatus: 'PAID' } : o;
      setPurchases(p => p.map(upd));
      setIncoming(p => p.map(upd));
    } catch (e) { alert(e.response?.data?.error || 'Failed to verify payment'); }
  };
  const handleApprove = async (id) => {
    try {
      await ordersApi.approve(id);
      const upd = o => o._id === id ? { ...o, status: 'APPROVED' } : o;
      isAdmin ? setPurchases(p => p.map(upd)) : setIncoming(p => p.map(upd));
    } catch (e) { alert(e.response?.data?.error || 'Failed to approve'); }
  };
  const handleReject = async (id) => {
    if (!window.confirm('Reject this order?')) return;
    try {
      await ordersApi.reject(id);
      const upd = o => o._id === id ? { ...o, status: 'CANCELLED' } : o;
      isAdmin ? setPurchases(p => p.map(upd)) : setIncoming(p => p.map(upd));
    } catch (e) { alert(e.response?.data?.error || 'Failed to reject'); }
  };
  const handleShip = async (id) => {
    try {
      await ordersApi.ship(id);
      const upd = o => o._id === id ? { ...o, status: 'SHIPPED' } : o;
      isAdmin ? setPurchases(p => p.map(upd)) : setIncoming(p => p.map(upd));
    } catch (e) { alert(e.response?.data?.error || 'Failed to ship'); }
  };
  const handleDeliver = async (id) => {
    if (!window.confirm('Confirm you received this delivery?')) return;
    try {
      await ordersApi.confirmDelivery(id);
      setPurchases(p => p.map(o => o._id === id ? { ...o, status: 'DELIVERED' } : o));
    } catch (e) { alert(e.response?.data?.error || 'Failed to confirm delivery'); }
  };

  const activeList = tab === 'incoming' ? incoming : purchases;
  const displayed = useMemo(() => {
    let list = filter === 'All' ? activeList : activeList.filter(o => o.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.productId?.name?.toLowerCase().includes(q) ||
        o.buyerId?.name?.toLowerCase().includes(q) ||
        o.orderNumber?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeList, filter, search]);

  const stats = useMemo(() => countByField(activeList, 'status'), [activeList]);
  stats.total = activeList.length;

  const STATUSES = ['All','PENDING','APPROVED','SHIPPED','DELIVERED','CANCELLED'];
  const pendingIncoming = incoming.filter(o => o.status === 'PENDING').length;

  return (
    <div className="space-y-6 page-enter">

      {/* Header */}
      <PageHeader
        title={isAdmin ? 'Wholesale Orders' : isWholesale ? 'My Orders' : 'Order Tracking'}
        description={
          isAdmin ? 'Approve, reject and ship wholesale purchase orders'
            : isWholesale ? 'Track your purchases and manage incoming Mini Stock orders'
            : 'Track your purchase orders from Wholesale'
        }
        onRefresh={() => fetchAll(true)}
        refreshing={spinning}
      />

      {/* Role explanation banner */}
      {isAdmin && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h5 className="text-primary font-semibold text-sm">You are the Company (Seller)</h5>
            <p className="text-primary/80 text-sm mt-1">
              Approve or reject pending orders, then ship approved ones. Wholesale buyers will confirm delivery on their end.
            </p>
          </div>
        </div>
      )}

      {/* Wholesale tabs */}
      {isWholesale && (
        <Tabs value={tab} onValueChange={(val) => { setTab(val); setFilter('All'); }} className="w-fit">
          <TabsList className="h-11">
            <TabsTrigger value="purchases" className="flex items-center gap-2 text-sm px-5">
              <Building2 size={16}/> My Purchases
              <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                {purchases.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="incoming" className="flex items-center gap-2 text-sm px-5">
              <Store size={16}/> Incoming
              {pendingIncoming > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0">{pendingIncoming}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={stats.total} icon={Package} format="number" />
        <StatCard label="Pending" value={stats.PENDING || 0} icon={Clock} format="number" />
        <StatCard label="Approved" value={stats.APPROVED || 0} icon={CheckCircle} format="number" />
        <StatCard label="Delivered" value={stats.DELIVERED || 0} icon={PackageCheck} format="number" />
      </div>

      {/* Filter + Search */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {STATUSES.map(s => {
              const cnt = s === 'All' ? activeList.length : activeList.filter(o => o.status === s).length;
              return (
                <Button 
                  key={s} 
                  onClick={() => setFilter(s)}
                  variant={filter === s ? "default" : "outline"}
                  size="sm"
                  className="rounded-full px-4 h-9"
                >
                  {s === 'All' ? 'All Orders' : S[s]?.label || s}
                  <Badge variant={filter === s ? "secondary" : "outline"} className="ml-2 text-[10px] px-1.5 py-0 h-5">
                    {cnt}
                  </Badge>
                </Button>
              );
            })}
          </div>
          <div className="relative w-full md:w-72 shrink-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search product, buyer..."
              className="pl-9 h-10 bg-muted/30 border-muted" />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <LoadingGrid count={6} columns="xl:grid-cols-3" />
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders found"
          description={
            search ? 'Try adjusting your search query or clear the filter to see more results.'
              : filter !== 'All' ? `You don't have any orders with the status "${filter.toLowerCase()}".`
              : "It looks like you don't have any orders yet."
          }
          action={search && <Button variant="outline" onClick={() => setSearch('')}>Clear Search</Button>}
        />
      ) : tab === 'incoming' && isWholesale ? (
        <div className="pt-2"><IncomingTable orders={displayed} userId={user._id} onApprove={handleApprove} onShip={handleShip} onVerifyPayment={handleVerifyPayment} onReject={handleReject} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
          {displayed.map(o => isAdmin
            ? <AdminCard key={o._id} order={o} onVerifyPayment={handleVerifyPayment} onApprove={handleApprove} onReject={handleReject} onShip={handleShip}/>
            : <PurchaseCard key={o._id} order={o} onDeliver={handleDeliver} userRole={user.role}/>
          )}
        </div>
      )}
    </div>
  );
}
