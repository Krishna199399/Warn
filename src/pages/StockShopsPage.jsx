import React, { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import { formatDate } from '../utils/helpers';
import { exportCSV } from '../utils/exportCSV';
import { Store, Package, ShoppingCart, Activity, Download, Eye, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '../utils/helpers';
import { PageHeader, StatCard, LoadingGrid } from '@/components/ui';
import { useApi } from '../hooks/useApi';

const STATUS_COLOR = { APPROVED: 'bg-primary/10 text-primary', PENDING: 'bg-amber-50 text-amber-600', REJECTED: 'bg-red-50 text-red-600' };
const ROLE_COLOR   = { WHOLESALE: 'bg-purple-100 text-purple-700', MINI_STOCK: 'bg-amber-100 text-amber-700' };

export default function StockShopsPage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  useEffect(() => {
    Promise.all([usersApi.getAll({ role:'WHOLESALE' }), usersApi.getAll({ role:'MINI_STOCK' })])
      .then(([w, m]) => setShops([...(w.data.data||[]), ...(m.data.data||[])]))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleView = async (shop) => {
    setDetailModal(shop); setDetailLoading(true); setDetailData(null);
    try { setDetailData((await usersApi.getActivity(shop._id)).data.data); } catch {} finally { setDetailLoading(false); }
  };

  const filtered = shops.filter(s => {
    const q = search.toLowerCase();
    return (!search || s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.phone?.includes(search) || s.region?.toLowerCase().includes(q))
      && (!typeFilter   || s.role   === typeFilter)
      && (!statusFilter || s.status === statusFilter);
  });

  const stats = { total: shops.length, wholesale: shops.filter(s=>s.role==='WHOLESALE').length, miniStock: shops.filter(s=>s.role==='MINI_STOCK').length, active: shops.filter(s=>s.status==='APPROVED').length };

  if (loading) return <LoadingGrid count={8} columns="lg:grid-cols-4" />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Shops"
        description={`${stats.total} shops (${stats.wholesale} Wholesale, ${stats.miniStock} Mini Stock)`}
        actions={shops.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => exportCSV(filtered.map(s => ({ Name:s.name, Type:s.role, Phone:s.phone, Email:s.email, Location:s.region||s.state, Status:s.status })), 'stock_shops')}>
            <Download size={13} className="mr-1.5" /> Export
          </Button>
        )}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Shops" value={stats.total} icon={Store} format="number" />
        <StatCard label="Wholesale" value={stats.wholesale} icon={Package} format="number" />
        <StatCard label="Mini Stock" value={stats.miniStock} icon={ShoppingCart} format="number" />
        <StatCard label="Active" value={stats.active} icon={Activity} format="number" />
      </div>

      {/* Filters + Table */}
      <Card>
        <div className="p-4 border-b border-border flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Input className="h-9" placeholder="Search shops..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="WHOLESALE">Wholesale</SelectItem>
              <SelectItem value="MINI_STOCK">Mini Stock</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="APPROVED">Active</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>{['Shop','Type','Contact','Location','Status','Joined','Actions'].map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No shops found.</TableCell></TableRow>
            ) : filtered.map(shop => (
              <TableRow key={shop._id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">{shop.avatar||shop.name?.slice(0,2)}</div>
                    <div><p className="text-sm font-semibold">{shop.name}</p><p className="text-xs text-muted-foreground">{shop.email}</p></div>
                  </div>
                </TableCell>
                <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[shop.role]||'bg-muted text-muted-foreground'}`}>{shop.role==='WHOLESALE'?'Wholesale':'Mini Stock'}</span></TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone size={11} />{shop.phone||'—'}</div>
                    {shop.email && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail size={11} />{shop.email}</div>}
                  </div>
                </TableCell>
                <TableCell><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={11} />{shop.region||shop.state||'—'}</div></TableCell>
                <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[shop.status]||'bg-muted text-muted-foreground'}`}>{shop.status}</span></TableCell>
                <TableCell><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar size={11} />{formatDate(shop.createdAt)}</div></TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleView(shop)}>
                    <Eye size={11} className="mr-1" /> View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailModal} onOpenChange={o => { if (!o) { setDetailModal(null); setDetailData(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailModal?.name} — Details</DialogTitle>
          </DialogHeader>
          {detailModal && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-lg font-bold">{detailModal.avatar||detailModal.name?.slice(0,2)}</div>
                <div>
                  <h4 className="font-semibold">{detailModal.name}</h4>
                  <p className="text-sm text-muted-foreground">{detailModal.role==='WHOLESALE'?'Wholesale Shop':'Mini Stock Shop'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${STATUS_COLOR[detailModal.status]||''}`}>{detailModal.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Phone,    label: 'Phone',    val: detailModal.phone||'—'      },
                  { icon: Mail,     label: 'Email',    val: detailModal.email||'—'      },
                  { icon: MapPin,   label: 'Location', val: detailModal.region||detailModal.state||'—' },
                  { icon: Calendar, label: 'Joined',   val: formatDate(detailModal.createdAt) },
                ].map(f => (
                  <div key={f.label} className="bg-muted/40 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><f.icon size={12} />{f.label}</div>
                    <p className="text-sm font-medium truncate">{f.val}</p>
                  </div>
                ))}
              </div>
              {detailLoading ? (
                <div className="space-y-2">{[1,2].map(i=><Skeleton key={i} className="h-16 rounded-xl"/>)}</div>
              ) : detailData ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-primary/5 rounded-xl p-3 text-center"><p className="text-lg font-bold text-primary">{detailData.orders?.total||0}</p><p className="text-xs text-muted-foreground">Orders</p></div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center"><p className="text-lg font-bold text-blue-700">{formatCurrency(detailData.orders?.revenue||0)}</p><p className="text-xs text-muted-foreground">Revenue</p></div>
                    <div className="bg-purple-50 rounded-xl p-3 text-center"><p className="text-lg font-bold text-purple-700">{detailData.inventory?.totalProducts||0}</p><p className="text-xs text-muted-foreground">Products</p></div>
                  </div>
                  {detailData.inventory && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-amber-50 rounded-xl p-3 text-center"><p className="text-lg font-bold text-amber-700">{detailData.inventory.totalStock||0}</p><p className="text-xs text-muted-foreground">Total Stock</p></div>
                      <div className="bg-red-50 rounded-xl p-3 text-center"><p className="text-lg font-bold text-red-700">{detailData.inventory.lowStockItems||0}</p><p className="text-xs text-muted-foreground">Low Stock</p></div>
                    </div>
                  )}
                  {detailData.recentOrders?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Recent Orders</p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {detailData.recentOrders.map(o => (
                          <div key={o._id} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                            <div><p className="text-xs font-medium">{o.productId?.name||'Product'}</p><p className="text-xs text-muted-foreground">{o.customerName||'—'} · {formatDate(o.createdAt)}</p></div>
                            <span className="text-sm font-bold">{formatCurrency(o.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-4">No activity data.</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
