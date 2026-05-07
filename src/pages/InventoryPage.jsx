import React, { useEffect, useState } from 'react';
import { inventoryApi } from '../api/inventory.api';
import { productsApi } from '../api/products.api';
import { useAuth } from '../contexts/AuthContext';
import { Archive, AlertTriangle, TrendingDown, Plus, Send, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, StatCard, LoadingGrid, StatusBadge } from '@/components/ui';
import { useApi, useForm } from '@/hooks';

// ─── ADD STOCK DIALOG ─────────────────────────────────────────────────────────
function AddStockDialog({ open, onClose }) {
  const [products, setProducts] = useState([]);
  const [form,     setForm]     = useState({ productId: '', quantity: '' });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  useEffect(() => { 
    if (open) {
      productsApi.getAll().then(r => {
        // Filter out deleted products
        const activeProducts = (r.data.data || []).filter(p => !p.isDeleted);
        setProducts(activeProducts);
      });
    }
  }, [open]);
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await inventoryApi.addStock({ productId: form.productId, quantity: Number(form.quantity) }); onClose(); setForm({ productId:'', quantity:'' }); }
    catch (err) { setError(err.response?.data?.error || 'Failed to add stock'); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={o => { if (!o) { onClose(); setError(''); setForm({ productId:'', quantity:'' }); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Stock from Company</DialogTitle><DialogDescription>Receive new stock for your warehouse.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Product *</Label>
            <Select value={form.productId} onValueChange={v => setForm(f => ({ ...f, productId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>{products.map(p => <SelectItem key={p._id} value={p._id}>{p.name} ({p.sku})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Quantity *</Label>
            <Input type="number" min="1" placeholder="Enter quantity" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { onClose(); setError(''); setForm({ productId:'', quantity:'' }); }} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.productId || !form.quantity}>{loading ? 'Adding...' : 'Add Stock'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── TRANSFER DIALOG ──────────────────────────────────────────────────────────
function TransferDialog({ open, onClose }) {
  const [miniStocks, setMiniStocks] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [form,       setForm]       = useState({ miniStockId: '', productId: '', quantity: '' });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  useEffect(() => {
    if (open) {
      Promise.all([inventoryApi.getMiniStockUsers(), productsApi.getAll()])
        .then(([ms, p]) => { 
          setMiniStocks(ms.data.data||[]); 
          // Filter out deleted products
          const activeProducts = (p.data.data || []).filter(prod => !prod.isDeleted);
          setProducts(activeProducts);
        });
    }
  }, [open]);
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await inventoryApi.transfer({ miniStockId: form.miniStockId, productId: form.productId, quantity: Number(form.quantity) }); onClose(); setForm({ miniStockId:'', productId:'', quantity:'' }); }
    catch (err) { setError(err.response?.data?.error || 'Transfer failed'); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={o => { if (!o) { onClose(); setError(''); setForm({ miniStockId:'', productId:'', quantity:'' }); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Transfer to Mini Stock</DialogTitle><DialogDescription>Send stock to a mini stock shop.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Mini Stock *</Label>
            <Select value={form.miniStockId} onValueChange={v => setForm(f => ({ ...f, miniStockId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select mini stock" /></SelectTrigger>
              <SelectContent>{miniStocks.map(ms => <SelectItem key={ms._id} value={ms._id}>{ms.name}{ms.shopName ? ` (${ms.shopName})` : ''} — {ms.phone}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Product *</Label>
            <Select value={form.productId} onValueChange={v => setForm(f => ({ ...f, productId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>{products.map(p => <SelectItem key={p._id} value={p._id}>{p.name} ({p.sku})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Quantity *</Label>
            <Input type="number" min="1" placeholder="Enter quantity" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { onClose(); setError(''); setForm({ miniStockId:'', productId:'', quantity:'' }); }} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.miniStockId || !form.productId || !form.quantity}>{loading ? 'Transferring...' : 'Transfer Stock'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── HISTORY DIALOG ────────────────────────────────────────────────────────────
function HistoryDialog({ open, onClose }) {
  const [transfers, setTransfers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  useEffect(() => {
    if (open) { setLoading(true); inventoryApi.getTransfers().then(r => setTransfers(r.data.data||[])).finally(() => setLoading(false)); }
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Transfer History</DialogTitle></DialogHeader>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-12 w-full rounded-lg"/>)}</div>
        ) : transfers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No transfers yet.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>{['Date','Type','Product','From','To','Qty'].map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map(t => {
                  const isDeleted = t.productId?.isDeleted;
                  const productName = t.productId?.name || '—';
                  return (
                    <TableRow key={t._id}>
                      <TableCell className="text-xs text-muted-foreground">{new Date(t.transferDate).toLocaleDateString()}</TableCell>
                      <TableCell><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.transferType==='COMPANY_TO_WHOLESALE'?'bg-blue-50 text-blue-700':'bg-primary/10 text-primary'}`}>{t.transferType==='COMPANY_TO_WHOLESALE'?'Company':'Transfer'}</span></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-medium ${isDeleted ? 'text-muted-foreground line-through' : ''}`}>
                            {productName}
                          </span>
                          {isDeleted && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-red-50 text-red-600 border border-red-200">
                              Deleted
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.fromUserId?.name||'—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.toUserId?.name||'—'}</TableCell>
                      <TableCell className="font-semibold text-right">{t.quantity}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { user } = useAuth();
  const { data: inv, loading, refetch } = useApi(() => inventoryApi.getMy());
  const [showAdd,     setShowAdd]     = useState(false);
  const [showTransfer,setShowTransfer]= useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (loading) return <LoadingGrid count={6} columns="lg:grid-cols-3" />;
  if (!inv) return <div className="py-16 text-center text-muted-foreground text-sm">No inventory found.</div>;

  const items    = inv.items || [];
  const lowItems = items.filter(i => i.current <= i.minLevel && i.current > 0).length;
  const outItems = items.filter(i => i.current === 0).length;
  const totalVal = items.reduce((s, i) => s + (i.current || 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory"
        description={`${inv.ownerRole} — ${items.length} product lines`}
        actions={
          <div className="flex gap-2">
            {user?.role === 'WHOLESALE' && (
              <>
                <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={14} className="mr-1" /> Add Stock</Button>
                <Button size="sm" variant="outline" onClick={() => setShowTransfer(true)}><Send size={14} className="mr-1" /> Transfer</Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowHistory(true)}><History size={14} className="mr-1" /> History</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Stock" value={`${totalVal} units`} icon={Archive} />
        <StatCard label="Low Stock" value={lowItems} icon={TrendingDown} trend={{ value: lowItems, direction: lowItems > 0 ? 'down' : 'neutral' }} />
        <StatCard label="Out of Stock" value={outItems} icon={AlertTriangle} trend={{ value: outItems, direction: outItems > 0 ? 'down' : 'neutral' }} />
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>{['Product','SKU','Received','Dispatched','Current','Min Level','Status'].map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No inventory items.</TableCell></TableRow>
            ) : items.map((item, i) => {
              const isDeleted = item.productId?.isDeleted;
              const productName = item.productId?.name || '—';
              const productSku = item.productId?.sku || '—';
              
              const status = item.current === 0 ? 'Out' : item.current <= item.minLevel ? 'Low' : 'OK';
              const sColor = status === 'OK' ? 'bg-primary/10 text-primary' : status === 'Low' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600';
              
              return (
                <TableRow key={i} className={isDeleted ? 'bg-muted/30' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isDeleted ? 'text-muted-foreground line-through' : ''}`}>
                        {productName}
                      </span>
                      {isDeleted && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600 border border-red-200">
                          Deleted
                        </span>
                      )}
                    </div>
                    {isDeleted && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Product archived on {new Date(item.productId.deletedAt).toLocaleDateString()}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{productSku}</TableCell>
                  <TableCell>{item.received}</TableCell>
                  <TableCell>{item.dispatched}</TableCell>
                  <TableCell className="font-bold">{item.current}</TableCell>
                  <TableCell className="text-muted-foreground">{item.minLevel}</TableCell>
                  <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sColor}`}>{status}</span></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Dialogs */}
      <AddStockDialog  open={showAdd}      onClose={() => { setShowAdd(false);      refetch(); }} />
      <TransferDialog  open={showTransfer} onClose={() => { setShowTransfer(false); refetch(); }} />
      <HistoryDialog   open={showHistory}  onClose={() => setShowHistory(false)} />
    </div>
  );
}
