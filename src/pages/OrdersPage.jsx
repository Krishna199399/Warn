import React, { useEffect, useState, useMemo } from 'react';
import { ordersApi } from '../api/orders.api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/helpers';
import {
  ShoppingCart, CheckCircle, Truck, PackageCheck, XCircle,
  Clock, Search, RefreshCw, Package, AlertCircle,
  ThumbsUp, ThumbsDown, Send, Building2, Store, DollarSign, X,
} from 'lucide-react';

// ── Status config ─────────────────────────────────────────────────────────────
const S = {
  PENDING:   { label: 'Pending',   Icon: Clock,        cls: 'bg-amber-50 text-amber-600 border-amber-200'    },
  APPROVED:  { label: 'Approved',  Icon: CheckCircle,  cls: 'bg-blue-50 text-blue-600 border-blue-200'       },
  SHIPPED:   { label: 'Shipped',   Icon: Truck,        cls: 'bg-violet-50 text-violet-600 border-violet-200' },
  DELIVERED: { label: 'Delivered', Icon: PackageCheck, cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  CANCELLED: { label: 'Cancelled', Icon: XCircle,      cls: 'bg-red-50 text-red-600 border-red-200'          },
};
const STEPS = ['PENDING','APPROVED','SHIPPED','DELIVERED'];

function Badge({ status }) {
  const m = S[status] || S.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${m.cls}`}>
      <m.Icon size={10}/>{m.label}
    </span>
  );
}

// ── Order Tracker stepper (for Wholesale tracking cards) ──────────────────────
function Stepper({ status }) {
  if (status === 'CANCELLED') return (
    <span className="text-xs text-red-500 flex items-center gap-1"><XCircle size={11}/>Cancelled</span>
  );
  const cur = STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STEPS.map((step, i) => {
        const done = i <= cur; const active = i === cur;
        const m = S[step];
        return (
          <React.Fragment key={step}>
            <div className={`flex items-center gap-1 text-xs font-medium ${active ? 'text-green-600' : done ? 'text-slate-400' : 'text-slate-300'}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                active ? 'border-green-500 bg-green-500 text-white' :
                done   ? 'border-slate-300 bg-white text-slate-400' :
                         'border-slate-200 bg-white'
              }`}>
                {done && !active ? <CheckCircle size={9}/> : <m.Icon size={9}/>}
              </div>
              <span className="hidden sm:inline whitespace-nowrap">{m.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`h-px w-4 ${i < cur ? 'bg-green-400' : 'bg-slate-200'}`}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Wholesale Purchase Card (track own orders, confirm delivery) ───────────────
function PurchaseCard({ order, onDeliver, userRole }) {
  // Determine seller display based on order seller type
  const getSellerDisplay = () => {
    if (order.sellerType === 'COMPANY') {
      return { icon: Building2, text: 'Company → You' };
    } else if (order.sellerType === 'WHOLESALE') {
      return { icon: Store, text: 'Wholesale → You' };
    } else if (order.sellerType === 'MINI_STOCK') {
      return { icon: Store, text: 'Mini Stock → You' };
    }
    return { icon: Building2, text: 'Seller → You' };
  };
  
  const sellerDisplay = getSellerDisplay();
  const SellerIcon = sellerDisplay.icon;
  
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
            <Package size={16} className="text-green-600"/>
          </div>
          <div>
            <p className="font-semibold text-slate-900">{order.productId?.name || '—'}</p>
            <p className="text-xs text-slate-500">{order.quantity} units · {formatCurrency(order.total)}</p>
          </div>
        </div>
        <Badge status={order.status}/>
      </div>

      {/* Tracker */}
      <div className="bg-slate-50 rounded-xl p-3">
        <Stepper status={order.status}/>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1"><SellerIcon size={11}/>{sellerDisplay.text}</span>
        <span>{new Date(order.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span>
        <span className={`flex items-center gap-1 font-semibold ${order.paymentStatus==='PAID'?'text-emerald-600':'text-amber-600'}`}>
          {order.paymentStatus==='PAID'?<CheckCircle size={10}/>:<AlertCircle size={10}/>}
          {order.paymentStatus}
        </span>
      </div>

      {order.status === 'SHIPPED' && (
        <button onClick={() => onDeliver(order._id)}
          className="w-full py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
          <PackageCheck size={14}/>Confirm Delivery Received
        </button>
      )}

      {order.orderNumber && <p className="text-[10px] text-slate-400 font-mono text-right">{order.orderNumber}</p>}
    </div>
  );
}

// ── Admin Management Card (Verify Payment → Approve / Reject / Ship) ─────────
function AdminCard({ order, onVerifyPayment, onApprove, onReject, onShip }) {
  const isPending  = order.status === 'PENDING';
  const isApproved = order.status === 'APPROVED';
  const isShipped  = order.status === 'SHIPPED';
  const isPaid     = order.paymentStatus === 'PAID';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
            <Package size={16} className="text-blue-600"/>
          </div>
          <div>
            <p className="font-semibold text-slate-900">{order.productId?.name || '—'}</p>
            <p className="text-xs text-slate-500">{order.quantity} units · {formatCurrency(order.total)}</p>
          </div>
        </div>
        <Badge status={order.status}/>
      </div>

      {/* Buyer info */}
      <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
        <Store size={13} className="text-slate-400 flex-shrink-0"/>
        <div className="text-xs">
          <span className="text-slate-500">Buyer: </span>
          <span className="font-semibold text-slate-800">{order.buyerId?.name || '—'}</span>
          <span className="text-slate-400 ml-2">{order.buyerId?.email}</span>
        </div>
      </div>

      {/* Payment warning + verify button */}
      {isPending && !isPaid && (
        <div className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <AlertCircle size={13}/> Payment not confirmed — cannot approve yet
          </span>
          <button onClick={() => onVerifyPayment(order._id)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors whitespace-nowrap flex items-center gap-1">
            <CheckCircle size={11}/>Mark as Paid
          </button>
        </div>
      )}
      {isPaid && isPending && (
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <CheckCircle size={13} className="text-emerald-600"/>
          <span className="text-xs text-emerald-700 font-medium">Payment verified — ready to approve</span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{new Date(order.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span>
        <span className={`flex items-center gap-1 font-semibold ${order.paymentStatus==='PAID'?'text-emerald-600':'text-amber-600'}`}>
          {order.paymentStatus==='PAID'?<CheckCircle size={10}/>:<AlertCircle size={10}/>}
          {order.paymentStatus}
        </span>
        {order.orderNumber && <span className="font-mono text-[10px]">{order.orderNumber}</span>}
      </div>

      {/* Action buttons — role-specific */}
      {isPending && (
        <div className="flex gap-2">
          <button onClick={() => onApprove(order._id)} disabled={order.paymentStatus !== 'PAID'}
            className="flex-1 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
            <ThumbsUp size={13}/>Approve
          </button>
          <button onClick={() => onReject(order._id)}
            className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5">
            <ThumbsDown size={13}/>Reject
          </button>
        </div>
      )}
      {isApproved && (
        <button onClick={() => onShip(order._id)}
          className="w-full py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
          <Send size={14}/>Mark as Shipped
        </button>
      )}
      {isShipped && (
        <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-600 text-sm font-medium">
          <Truck size={14}/>Shipped · Awaiting buyer confirmation
        </div>
      )}
    </div>
  );
}

// ── Wholesale Incoming Table (Mini → Wholesale) ───────────────────────────────
function IncomingTable({ orders, userId, onApprove, onShip, onVerifyPayment, onReject }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Date','Product','Buyer','Qty','Total','Status','Payment','Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map(o => {
              const isSeller = o.sellerId?._id === userId;
              const isCustomerOrder = o.buyerType === 'CUSTOMER';
              // For customer orders, payment should already be PAID (cash sale)
              // Only show Mark Paid for non-customer orders that are pending payment
              const canVerifyPayment = o.status === 'PENDING' && o.paymentStatus === 'PENDING' && isSeller && !isCustomerOrder;
              const canApprove = o.status === 'PENDING' && isSeller && (o.paymentStatus === 'PAID' || isCustomerOrder);
              const canReject = o.status === 'PENDING' && isSeller;
              const canShip = o.status === 'APPROVED' && isSeller;
              
              return (
                <tr key={o._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{o.productId?.name||'—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{o.buyerId?.name||'—'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{o.quantity}</td>
                  <td className="px-4 py-3 font-bold text-green-600">{formatCurrency(o.total)}</td>
                  <td className="px-4 py-3"><Badge status={o.status}/></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${o.paymentStatus==='PAID'?'text-emerald-600':'text-amber-600'}`}>
                      {o.paymentStatus}
                    </span>
                    {isCustomerOrder && o.paymentStatus === 'PENDING' && (
                      <span className="block text-[10px] text-slate-400">Cash sale</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      {canVerifyPayment && (
                        <button onClick={() => onVerifyPayment(o._id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1">
                          <DollarSign size={10}/>Mark Paid
                        </button>
                      )}
                      {canApprove && (
                        <button onClick={() => onApprove(o._id)}
                          className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors flex items-center gap-1">
                          <ThumbsUp size={10}/>Approve
                        </button>
                      )}
                      {canReject && (
                        <button onClick={() => onReject(o._id)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors flex items-center gap-1">
                          <X size={10}/>Reject
                        </button>
                      )}
                      {canShip && (
                        <button onClick={() => onShip(o._id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1">
                          <Send size={10}/>Ship
                        </button>
                      )}
                      {!canVerifyPayment && !canApprove && !canReject && !canShip && <span className="text-xs text-slate-400">—</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
        <p className="text-xs text-slate-500">{orders.length} order{orders.length!==1?'s':''}</p>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function Stat({ label, value, Icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={17} className="text-white"/>
      </div>
      <div>
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

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
      // Update both purchases and incoming lists
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

  // Displayed list
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

  const stats = useMemo(() => ({
    total:     activeList.length,
    pending:   activeList.filter(o => o.status === 'PENDING').length,
    approved:  activeList.filter(o => o.status === 'APPROVED').length,
    shipped:   activeList.filter(o => o.status === 'SHIPPED').length,
    delivered: activeList.filter(o => o.status === 'DELIVERED').length,
  }), [activeList]);

  const STATUSES = ['All','PENDING','APPROVED','SHIPPED','DELIVERED','CANCELLED'];
  const pendingIncoming = incoming.filter(o => o.status === 'PENDING').length;

  return (
    <div className="space-y-5 page-enter">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isAdmin ? 'bg-blue-600' : 'bg-green-600'}`}>
            <ShoppingCart size={18} className="text-white"/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isAdmin ? 'Wholesale Orders' : isWholesale ? 'My Orders' : 'Order Tracking'}
            </h1>
            <p className="text-sm text-slate-500">
              {isAdmin
                ? 'Approve, reject and ship wholesale purchase orders'
                : isWholesale
                ? 'Track your purchases and manage incoming Mini Stock orders'
                : 'Track your purchase orders from Wholesale'}
            </p>
          </div>
        </div>
        <button onClick={() => fetchAll(true)} disabled={spinning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50">
          <RefreshCw size={13} className={spinning ? 'animate-spin' : ''}/>Refresh
        </button>
      </div>

      {/* Role explanation banner */}
      {isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 flex items-center gap-3">
          <Building2 size={16} className="text-blue-600 flex-shrink-0"/>
          <p className="text-sm text-blue-800">
            <span className="font-semibold">You are the Company (Seller).</span> Approve or reject pending orders, then ship approved ones. Wholesale buyers confirm delivery on their end.
          </p>
        </div>
      )}

      {/* Wholesale tabs */}
      {isWholesale && (
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button onClick={() => { setTab('purchases'); setFilter('All'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab==='purchases'?'bg-white text-green-700 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
            <Building2 size={13}/>My Purchases
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab==='purchases'?'bg-green-100 text-green-700':'bg-slate-200 text-slate-500'}`}>
              {purchases.length}
            </span>
          </button>
          <button onClick={() => { setTab('incoming'); setFilter('All'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab==='incoming'?'bg-white text-blue-700 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
            <Store size={13}/>Incoming
            {pendingIncoming > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-red-500 text-white">{pendingIncoming}</span>
            )}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total"     value={stats.total}     Icon={Package}     color="bg-slate-500"/>
        <Stat label="Pending"   value={stats.pending}   Icon={Clock}       color="bg-amber-500"/>
        <Stat label="Approved"  value={stats.approved}  Icon={CheckCircle} color="bg-blue-500"/>
        <Stat label="Delivered" value={stats.delivered} Icon={PackageCheck}color="bg-emerald-500"/>
      </div>

      {/* Filter + Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => {
            const cnt = s === 'All' ? activeList.length : activeList.filter(o => o.status === s).length;
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  filter === s
                    ? 'bg-green-600 text-white border-green-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}>
                {s === 'All' ? 'All' : S[s]?.label || s}
                <span className={`ml-1.5 px-1 py-0.5 rounded-full text-[10px] font-bold ${filter===s?'bg-white/25':'bg-slate-100 text-slate-500'}`}>{cnt}</span>
              </button>
            );
          })}
        </div>
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search product, buyer, order no…"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all"/>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin"/>
          <p className="text-sm text-slate-500">Loading orders…</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Package size={24} className="text-slate-400"/>
          </div>
          <p className="font-semibold text-slate-700">No orders found</p>
          <p className="text-sm text-slate-500">
            {search ? 'Try a different search' : filter !== 'All' ? `No ${filter.toLowerCase()} orders` : 'No orders yet'}
          </p>
        </div>
      ) : tab === 'incoming' && isWholesale ? (
        /* Wholesale incoming — table */
        <IncomingTable 
          orders={displayed} 
          userId={user._id} 
          onApprove={handleApprove} 
          onShip={handleShip}
          onVerifyPayment={handleVerifyPayment}
          onReject={handleReject}
        />
      ) : (
        /* Admin cards OR Wholesale purchase cards */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map(o => isAdmin
            ? <AdminCard key={o._id} order={o} onVerifyPayment={handleVerifyPayment} onApprove={handleApprove} onReject={handleReject} onShip={handleShip}/>
            : <PurchaseCard key={o._id} order={o} onDeliver={handleDeliver} userRole={user.role}/>
          )}
        </div>
      )}
    </div>
  );
}
