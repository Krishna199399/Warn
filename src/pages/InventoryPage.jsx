import React, { useEffect, useState } from 'react';
import { inventoryApi } from '../api/inventory.api';
import { productsApi } from '../api/products.api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, Card } from '../components/ui';
import { 
  Archive, AlertTriangle, TrendingDown, Plus, Send, 
  Package, History, X, Search 
} from 'lucide-react';

export default function InventoryPage() {
  const { user } = useAuth();
  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = () => {
    setLoading(true);
    inventoryApi.getMy()
      .then(r => setInv(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  if (loading) return <div className="py-16 text-center text-slate-400 text-sm">Loading inventory...</div>;
  if (!inv) return <div className="py-16 text-center text-slate-400 text-sm">No inventory found.</div>;

  const items = inv.items || [];
  const lowItems = items.filter(i => i.current <= i.minLevel && i.current > 0).length;
  const outItems = items.filter(i => i.current === 0).length;
  const totalVal = items.reduce((s, i) => s + (i.current || 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader 
        title="Inventory" 
        subtitle={`${inv.ownerRole} — ${items.length} product lines`}
      >
        <div className="flex gap-2">
          {user?.role === 'WHOLESALE' && (
            <>
              <button onClick={() => setShowAddStock(true)} className="btn-primary">
                <Plus size={16} /> Add Stock
              </button>
              <button onClick={() => setShowTransfer(true)} className="btn-secondary">
                <Send size={16} /> Transfer
              </button>
            </>
          )}
          <button onClick={() => setShowHistory(true)} className="btn-secondary">
            <History size={16} /> History
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Stock', value: `${totalVal} units`, icon: Archive, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Low Stock', value: lowItems, icon: TrendingDown, bg: 'bg-amber-50', color: 'text-amber-600' },
          { label: 'Out of Stock', value: outItems, icon: AlertTriangle, bg: 'bg-red-50', color: 'text-red-600' },
        ].map(s => (
          <Card key={s.label}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-xl font-bold text-slate-800">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              {['Product', 'SKU', 'Received', 'Dispatched', 'Current', 'Min Level', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const status = item.current === 0 ? 'Out' : item.current <= item.minLevel ? 'Low' : 'OK';
              const sColor = status === 'OK' ? 'bg-green-50 text-green-700' : status === 'Low' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600';
              return (
                <tr key={i} className="table-row">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.productId?.name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">{item.productId?.sku || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.received}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.dispatched}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-800">{item.current}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{item.minLevel}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sColor}`}>{status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddStock && <AddStockModal onClose={() => { setShowAddStock(false); loadInventory(); }} />}
      {showTransfer && <TransferModal onClose={() => { setShowTransfer(false); loadInventory(); }} />}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
    </div>
  );
}

// ─── ADD STOCK MODAL (WHOLESALE ONLY) ─────────────────────────────────────────
function AddStockModal({ onClose }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ productId: '', quantity: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    productsApi.getAll().then(r => setProducts(r.data.data || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await inventoryApi.addStock({ productId: form.productId, quantity: Number(form.quantity) });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Add Stock from Company</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Product</label>
            <select
              value={form.productId}
              onChange={e => setForm({ ...form, productId: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select product</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Quantity</label>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              className="input-field"
              placeholder="Enter quantity"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Adding...' : 'Add Stock'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── TRANSFER MODAL (WHOLESALE ONLY) ──────────────────────────────────────────
function TransferModal({ onClose }) {
  const [miniStocks, setMiniStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ miniStockId: '', productId: '', quantity: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      inventoryApi.getMiniStockUsers(),
      productsApi.getAll(),
    ]).then(([ms, p]) => {
      setMiniStocks(ms.data.data || []);
      setProducts(p.data.data || []);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await inventoryApi.transfer({
        miniStockId: form.miniStockId,
        productId: form.productId,
        quantity: Number(form.quantity),
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Transfer to Mini Stock</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Mini Stock</label>
            <select
              value={form.miniStockId}
              onChange={e => setForm({ ...form, miniStockId: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select mini stock</option>
              {miniStocks.map(ms => (
                <option key={ms._id} value={ms._id}>
                  {ms.name} {ms.shopName ? `(${ms.shopName})` : ''} - {ms.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Product</label>
            <select
              value={form.productId}
              onChange={e => setForm({ ...form, productId: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select product</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Quantity</label>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              className="input-field"
              placeholder="Enter quantity"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Transferring...' : 'Transfer Stock'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── HISTORY MODAL ─────────────────────────────────────────────────────────────
function HistoryModal({ onClose }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi.getTransfers()
      .then(r => setTransfers(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-3xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Transfer History</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <p className="text-center text-slate-400 py-8">Loading...</p>
        ) : transfers.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No transfers yet</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-100">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Product</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">From</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">To</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Qty</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => (
                  <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {new Date(t.transferDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.transferType === 'COMPANY_TO_WHOLESALE' 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-green-50 text-green-700'
                      }`}>
                        {t.transferType === 'COMPANY_TO_WHOLESALE' ? 'Company' : 'Transfer'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-800">{t.productId?.name || '—'}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{t.fromUserId?.name || '—'}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{t.toUserId?.name || '—'}</td>
                    <td className="px-3 py-2 text-sm font-semibold text-slate-800 text-right">{t.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
