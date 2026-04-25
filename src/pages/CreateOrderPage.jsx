import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, CheckCircle, AlertCircle, ArrowLeft, Zap, Package } from 'lucide-react';
import { productsApi } from '../api/products.api';
import { ordersApi } from '../api/orders.api';
import { farmersApi } from '../api/farmers.api';
import { inventoryApi } from '../api/inventory.api';
import { formatCurrency } from '../utils/helpers';
import { Card, PageHeader } from '../components/ui';

const STEPS = ['Select Product', 'Advisor Code', 'Confirm'];

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [products,   setProducts]   = useState([]);
  const [farmers,    setFarmers]    = useState([]);
  const [inventory,  setInventory]  = useState([]);
  const [step,       setStep]       = useState(0);
  const [productId,  setProductId]  = useState('');
  const [qty,        setQty]        = useState(1);
  const [farmerId,   setFarmerId]   = useState('');
  const [advisorCode, setAdvisorCode] = useState('');
  const [notes,      setNotes]      = useState('');
  const [placed,     setPlaced]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [placedData, setPlacedData] = useState(null);
  const isSubmittingRef = React.useRef(false); // Prevent double submission

  useEffect(() => {
    productsApi.getAll().then(r => setProducts(r.data.data || []));
    farmersApi.getMy().then(r => setFarmers(r.data.data || [])).catch(() => {});
    inventoryApi.getMy().then(r => setInventory(r.data.data?.items || []));
  }, []);

  const product = products.find(p => (p._id || p.id) === productId);
  const invItem = inventory.find(i => i.productId?._id === productId || i.productId?.id === productId);
  const availableStock = invItem?.current || 0;
  const farmer  = farmers.find(f => (f._id || f.id) === farmerId);
  const total   = product ? product.price * Number(qty || 0) : 0;

  const handlePlace = async () => {
    if (!advisorCode.trim()) {
      alert('Advisor code is required');
      return;
    }
    if (loading || isSubmittingRef.current) return; // Prevent double submission
    
    isSubmittingRef.current = true;
    setLoading(true);
    try {
      const res = await ordersApi.create({
        buyerType: 'CUSTOMER', // Mini Stock selling to customer
        productId,
        quantity: Number(qty),
        farmerId: farmerId || null,
        advisorCode: advisorCode.trim().toUpperCase(),
        region: farmer?.village || '',
      });
      setPlacedData(res.data.data);
      setPlaced(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to place order');
      setLoading(false);
      isSubmittingRef.current = false;
    }
    // Don't reset on success - let the success screen handle it
  };

  const resetForm = () => { 
    setPlaced(false); 
    setStep(0); 
    setProductId(''); 
    setQty(1); 
    setFarmerId(''); 
    setAdvisorCode('');
    setNotes(''); 
    setPlacedData(null);
    setLoading(false);
    isSubmittingRef.current = false; // Reset submission flag
  };

  if (placed) {
    return (
      <div className="max-w-md mx-auto pt-12 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Order Placed!</h2>
        <p className="text-sm text-slate-500 mb-1">
          <span className="font-semibold text-slate-700">{product?.name}</span> × {qty}
        </p>
        <p className="text-2xl font-bold text-green-700 mb-1">{formatCurrency(total)}</p>
        {farmer && <p className="text-sm text-slate-500 mb-6">Farmer: <span className="font-semibold text-slate-700">{farmer?.name}</span></p>}
        <p className="text-xs text-slate-400 font-mono mb-6">Order ID: {placedData?._id?.slice(-8)}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={resetForm} className="btn-primary"><Zap size={15} /> New Order</button>
          <button onClick={() => navigate('/orders')} className="btn-secondary">View Orders</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHeader
        title="Create Order"
        subtitle="Enter product and advisor details to place a sale"
        actions={
          <button onClick={() => navigate(-1)} className="btn-secondary">
            <ArrowLeft size={14} /> Back
          </button>
        }
      />

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 text-sm font-medium transition-colors
              ${i <= step ? 'text-green-700' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${i < step ? 'bg-green-600 border-green-600 text-white'
                  : i === step ? 'border-green-600 text-green-700 bg-green-50'
                  : 'border-slate-200 text-slate-400 bg-white'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded transition-all ${i < step ? 'bg-green-500' : 'bg-slate-100'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <Card>
        {/* ── Step 0: Select Product ── */}
        {step === 0 && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-slate-800">Select Product</h3>
            <div className="grid gap-3">
              {products.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Loading products...</p>}
              {products.map(p => {
                const invItem = inventory.find(i => i.productId?._id === p._id || i.productId?.id === p.id);
                const stock = invItem?.current || 0;
                const isAvailable = stock > 0;
                
                return (
                  <label key={p._id || p.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                      ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      ${productId === (p._id || p.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                    <input
                      type="radio"
                      name="product"
                      value={p._id || p.id}
                      checked={productId === (p._id || p.id)}
                      onChange={e => setProductId(e.target.value)}
                      disabled={!isAvailable}
                      className="accent-green-600"
                    />
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 flex-shrink-0">
                      <Package size={18} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-400">
                        {p.category} · {p.unit} · 
                        <span className={stock > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {' '}{stock} in stock
                        </span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-900">₹{p.price.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-400">per {p.unit}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {product && (
              <div>
                <label className="label">Quantity</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold">−</button>
                  <input type="number" min="1" max={availableStock}
                    className="input-field text-center w-24 text-base font-semibold"
                    value={qty}
                    onChange={e => setQty(Math.max(1, Math.min(availableStock, Number(e.target.value))))} />
                  <button onClick={() => setQty(q => Math.min(availableStock, q + 1))}
                    className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold">+</button>
                  <span className="text-sm text-slate-500">Max: {availableStock}</span>
                </div>
              </div>
            )}

            {product && qty > 0 && (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
                <span className="text-sm text-slate-700">{product.name} × {qty}</span>
                <span className="text-lg font-bold text-green-700">{formatCurrency(total)}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                disabled={!product || qty < 1}
                onClick={() => setStep(1)}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed px-6"
              >
                Next: Advisor Code →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Advisor Code & Farmer ── */}
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-slate-800">Advisor Code & Farmer</h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 mb-0.5">Selected Product</p>
              <p className="text-sm font-semibold text-slate-800">{product?.name}</p>
              <p className="text-xs text-slate-500 mt-1">Qty: {qty} · Total: <span className="font-semibold text-green-700">{formatCurrency(total)}</span></p>
            </div>
            
            <div>
              <label className="label">Advisor Code <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input-field uppercase"
                placeholder="Enter advisor code (e.g., ADV00123)"
                value={advisorCode}
                onChange={e => setAdvisorCode(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500 mt-1">Required: Enter the advisor's code who facilitated this sale</p>
            </div>

            <div>
              <label className="label">Farmer (optional)</label>
              <select className="input-field" value={farmerId} onChange={e => setFarmerId(e.target.value)}>
                <option value="">— Walk-in / No farmer —</option>
                {farmers.map(f => <option key={f._id} value={f._id}>{f.name} ({f.village})</option>)}
              </select>
            </div>
            
            <div>
              <label className="label">Notes (optional)</label>
              <textarea className="input-field resize-none" rows={2} placeholder="Special instructions..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            
            <div className="flex justify-between">
              <button onClick={() => setStep(0)} className="btn-secondary">← Back</button>
              <button 
                onClick={() => setStep(2)} 
                disabled={!advisorCode.trim()}
                className="btn-primary px-6 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next: Review →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Confirm ── */}
        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-slate-800">Review & Confirm</h3>

            <div className="rounded-xl border border-slate-100 overflow-hidden">
              {[
                { label: 'Product',      value: product?.name },
                { label: 'Category',     value: product?.category },
                { label: 'Quantity',     value: `${qty} ${product?.unit}` },
                { label: 'Unit Price',   value: `₹${product?.price?.toLocaleString('en-IN')}` },
                { label: 'Advisor Code', value: advisorCode.toUpperCase(), mono: true },
                { label: 'Farmer',       value: farmer?.name || '— Walk-in —' },
                { label: 'Notes',        value: notes || '—' },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex items-center gap-4 px-5 py-3 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-400 w-28 flex-shrink-0">{label}</span>
                  <span className={`text-sm font-medium text-slate-800 ${mono ? 'font-mono text-green-700' : ''}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Total highlight */}
            <div className="flex items-center justify-between p-5 bg-green-600 text-white rounded-2xl">
              <div>
                <p className="text-green-100 text-sm">Total Amount</p>
                <p className="text-3xl font-bold">{formatCurrency(total)}</p>
              </div>
              <ShoppingCart size={36} className="text-green-300 opacity-60" />
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary">← Edit</button>
              <button
                onClick={handlePlace}
                disabled={loading}
                className="btn-primary px-8 py-2.5 disabled:opacity-60"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing...</>
                ) : (
                  <><CheckCircle size={15} /> Confirm & Place Order</>
                )}
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
