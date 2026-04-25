import React, { useEffect, useState } from 'react';
import { ordersApi } from '../api/orders.api';
import { PageHeader, Card } from '../components/ui';
import { ShoppingBag, TrendingUp, DollarSign, Package, Download, Search, Filter, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { exportCSV } from '../utils/exportCSV';

const STATUS_COLOR = {
  DELIVERED:  'bg-green-50 text-green-700',
  APPROVED:   'bg-blue-50 text-blue-600',
  SHIPPED:    'bg-indigo-50 text-indigo-600',
  PENDING:    'bg-amber-50 text-amber-600',
  CANCELLED:  'bg-red-50 text-red-600',
};

export default function MySalesPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    ordersApi.getMy()
      .then(r => setOrders(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0);
  const delivered    = orders.filter(o => o.status === 'DELIVERED').length;

  // Apply filters
  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchSearch = !search || 
      o.farmerId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.productId?.name?.toLowerCase().includes(search.toLowerCase());
    
    let matchDate = true;
    if (dateRange !== 'all' && o.createdAt) {
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      if (dateRange === 'month') {
        matchDate = orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      } else if (dateRange === 'quarter') {
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        matchDate = orderDate >= quarterStart;
      } else if (dateRange === 'year') {
        matchDate = orderDate.getFullYear() === now.getFullYear();
      }
    }
    
    return matchStatus && matchSearch && matchDate;
  });

  return (
    <div className="space-y-5">
      <PageHeader title="My Sales" subtitle={`${orders.length} total orders`}
        actions={orders.length > 0 && (
          <button onClick={() => exportCSV(filtered.map(o => ({
            Date: o.createdAt?.slice(0,10) || 'N/A',
            Farmer: o.farmerId?.name || 'N/A',
            Product: o.productId?.name || 'N/A',
            Quantity: o.quantity,
            Total: o.total,
            Status: o.status
          })), 'my_sales')} className="btn-export">
            <Download size={12} /> Export
          </button>
        )}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',  value: orders.length,             icon: ShoppingBag, color: 'text-blue-600',   bg: 'bg-blue-50',   tooltip: 'Total number of orders' },
          { label: 'Delivered',     value: delivered,                 icon: Package,     color: 'text-green-600',  bg: 'bg-green-50',  tooltip: 'Successfully delivered orders' },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50', raw: true, tooltip: 'Total sales revenue' },
          { label: 'This Month',    value: orders.filter(o => o.createdAt?.startsWith(new Date().toISOString().slice(0,7))).length, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', tooltip: 'Orders this month' },
        ].map(s => (
          <Card key={s.label} title={s.tooltip} className="hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon size={18} className={s.color} /></div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-lg font-bold text-slate-800">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters - Mobile optimized */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {['ALL', 'PENDING', 'APPROVED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${statusFilter === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {s}
            </button>
          ))}
        </div>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium">
          <option value="all">All Time</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-8 text-xs py-1.5 w-full" placeholder="Search farmer or product..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              {['Date','Farmer','Product','Qty','Total','Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">Loading sales...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                {search || statusFilter !== 'ALL' || dateRange !== 'all' ? 'No sales match your filters.' : 'No sales yet.'}
              </td></tr>
            ) : filtered.map(o => (
              <tr key={o._id} className="table-row">
                <td className="px-4 py-3 text-sm text-slate-600">
                  {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{o.farmerId?.name || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{o.productId?.name || o.productId?.code || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{o.qty}</td>
                <td className="px-4 py-3 text-sm font-semibold text-green-700">{formatCurrency(o.total)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.status] || ''}`}>{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
