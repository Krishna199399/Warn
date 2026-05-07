import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { payoutsApi } from '../../api/payouts.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, CheckCircle2, Clock, AlertTriangle, ChevronLeft, X } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const STATUS_COLOR = {
  PENDING:  'bg-amber-100 text-amber-700',
  PAID:     'bg-green-100 text-green-700',
  FAILED:   'bg-red-100 text-red-700',
  ON_HOLD:  'bg-slate-100 text-slate-600',
};

export default function AdminBatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch,   setBatch]   = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);  // recordId being paid
  const [utr,      setUtr]      = useState('');
  const [remarks,  setRemarks]  = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [searchQ,  setSearchQ]  = useState('');

  const load = async () => {
    try {
      const res = await payoutsApi.getBatchDetail(id);
      setBatch(res.data.data.batch);
      setRecords(res.data.data.records);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handlePayOne = async () => {
    setPayLoading(true);
    try {
      await payoutsApi.payOne(batch._id, { recordId: payModal, utrNumber: utr, remarks });
      setPayModal(null); setUtr(''); setRemarks('');
      load();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    finally { setPayLoading(false); }
  };

  const handlePayAll = async () => {
    if (!confirm('Mark ALL pending records as PAID?')) return;
    try {
      await payoutsApi.payAll(batch._id);
      load();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  const handleExport = async () => {
    try {
      const res = await payoutsApi.exportBatch(batch._id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a'); a.href = url; a.download = `${batch.batchId}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } catch {}
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid sm:grid-cols-4 gap-3">{[1,2,3,4].map(i=><Skeleton key={i} className="h-20 rounded-xl"/>)}</div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
  if (!batch) return <div className="p-8 text-center text-muted-foreground">Batch not found</div>;

  const filtered = records.filter(r => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return r.userId?.name?.toLowerCase().includes(q) ||
           r.bankSnapshot?.accountHolderName?.toLowerCase().includes(q) ||
           r.role?.toLowerCase().includes(q);
  });

  const pendingCount = records.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{batch.batchId}</h1>
          <p className="text-muted-foreground text-sm mt-1">{batch.totalEmployees} employees · {new Date(batch.periodStart).toLocaleDateString('en-IN')} – {new Date(batch.periodEnd).toLocaleDateString('en-IN')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}><ChevronLeft size={14}/> Back</Button>
          <Button variant="outline" size="sm" onClick={handleExport}><Download size={14}/> Export CSV</Button>
          {pendingCount > 0 && (
            <Button size="sm" onClick={handlePayAll}><CheckCircle2 size={14}/> Pay All ({pendingCount})</Button>
          )}
        </div>
      </div>

      {/* Batch summary */}
      <div className="grid sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Amount', value: formatCurrency(batch.totalAmount), color: 'text-foreground' },
          { label: 'Paid', value: `${batch.paidCount}/${batch.totalEmployees}`, color: 'text-primary' },
          { label: 'Pending', value: pendingCount, color: 'text-amber-600' },
          { label: 'Status', value: batch.status, color: batch.status === 'COMPLETED' ? 'text-primary' : 'text-amber-600' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="text-center py-3 px-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-lg font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Records table */}
      <Card>
        <div className="px-5 py-3 border-b border-border flex items-center gap-3">
          <Input className="h-8 max-w-xs" placeholder="Search name, bank holder, role..."
            value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          <p className="text-xs text-muted-foreground ml-auto">{filtered.length} records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr className="text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-4 py-2 text-left">Employee</th>
                <th className="px-4 py-2 text-left">Bank Details</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-center">Type</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2 text-center">UTR</th>
                <th className="px-4 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(r => {
                const bank = r.bankSnapshot;
                return (
                  <tr key={r._id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{r.userId?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{r.role?.replace(/_/g,' ')} · {r.userId?.advisorCode || r.userId?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {bank ? (
                        <>
                          <p className="text-xs font-medium text-slate-700">{bank.accountHolderName}</p>
                          <p className="text-xs text-slate-400">{bank.bankName} · {bank.accountNumber}</p>
                          <p className="text-xs text-slate-400">IFSC: {bank.ifscCode}</p>
                          {bank.city && <p className="text-xs text-slate-400">{bank.city}, {bank.state}</p>}
                        </>
                      ) : (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <AlertTriangle size={11}/> Bank details missing
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-bold text-slate-800">{formatCurrency(r.amount)}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[r.status] || ''}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-400">
                      {r.utrNumber || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.status === 'PENDING' || r.status === 'FAILED' ? (
                        <button onClick={() => { setPayModal(r._id); setUtr(''); setRemarks(''); }}
                          className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1 rounded-lg font-semibold transition-colors">
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-xs text-green-600 flex items-center gap-1 justify-center">
                          <CheckCircle2 size={11}/> Done
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pay One Dialog */}
      <Dialog open={!!payModal} onOpenChange={o => { if (!o) { setPayModal(null); setUtr(''); setRemarks(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark as Paid</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>UTR / Transaction Ref</Label>
              <Input placeholder="Bank UTR number..." value={utr} onChange={e => setUtr(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Remarks <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="Any note..." value={remarks} onChange={e => setRemarks(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPayModal(null); setUtr(''); setRemarks(''); }} disabled={payLoading}>Cancel</Button>
            <Button onClick={handlePayOne} disabled={payLoading}>{payLoading ? 'Saving...' : 'Confirm Paid'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
