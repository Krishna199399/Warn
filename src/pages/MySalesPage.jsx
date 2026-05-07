import React, { useState } from 'react';
import { useApi } from '@/hooks';
import { ordersApi } from '../api/orders.api';
import { formatCurrency } from '../utils/helpers';
import { exportCSV } from '../utils/exportCSV';
import { ShoppingBag, TrendingUp, DollarSign, Package, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { LoadingGrid } from '@/components/ui/loading-grid';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';

export default function MySalesPage() {
  const { data: orders, loading, error } = useApi(() => ordersApi.getMy(), {
    defaultValue: []
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('all');

  const totalRevenue = orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0);
  const delivered = orders.filter(o => o.status === 'DELIVERED').length;
  const thisMonth = orders.filter(o => o.createdAt?.startsWith(new Date().toISOString().slice(0, 7))).length;

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchSearch = !search || 
      o.farmerId?.name?.toLowerCase().includes(search.toLowerCase()) || 
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.productId?.name?.toLowerCase().includes(search.toLowerCase());
    
    let matchDate = true;
    if (dateRange !== 'all' && o.createdAt) {
      const d = new Date(o.createdAt), now = new Date();
      if (dateRange === 'month') matchDate = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      else if (dateRange === 'quarter') matchDate = d >= new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      else if (dateRange === 'year') matchDate = d.getFullYear() === now.getFullYear();
    }
    return matchStatus && matchSearch && matchDate;
  });

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="My Sales" description="Loading..." />
        <LoadingGrid count={4} columns="lg:grid-cols-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader title="My Sales" />
        <EmptyState
          icon={ShoppingBag}
          title="Failed to load sales"
          description={error}
        />
      </div>
    );
  }

  const handleExport = () => {
    exportCSV(
      filtered.map(o => ({
        Date: o.createdAt?.slice(0, 10),
        Customer: o.farmerId?.name || o.customerName || '—',
        Product: o.productId?.name,
        Qty: o.quantity,
        Total: o.total,
        Status: o.status
      })),
      'my_sales'
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Sales"
        description={`${orders.length} total orders`}
        actions={
          orders.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download size={13} className="mr-1.5" /> Export
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={orders.length}
          icon={ShoppingBag}
          format="number"
        />
        <StatCard
          label="Delivered"
          value={delivered}
          icon={Package}
          format="number"
        />
        <StatCard
          label="Total Revenue"
          value={totalRevenue}
          icon={DollarSign}
          format="currency"
        />
        <StatCard
          label="This Month"
          value={thisMonth}
          icon={TrendingUp}
          format="number"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="flex-wrap h-auto">
            {['ALL', 'PENDING', 'APPROVED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => (
              <TabsTrigger key={s} value={s} className="text-xs px-2.5">
                {s === 'ALL' ? 'All' : s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Search customer or product..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {['Date', 'Customer', 'Product', 'Qty', 'Total', 'Status'].map(h => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState
                    icon={ShoppingBag}
                    title="No sales match your filters"
                    description="Try adjusting your search or filters"
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(o => (
                <TableRow key={o._id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {o.createdAt
                      ? new Date(o.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '—'}
                  </TableCell>
                  <TableCell className="font-medium">{o.farmerId?.name || o.customerName || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{o.productId?.name || '—'}</TableCell>
                  <TableCell className="font-semibold">{o.quantity || '—'}</TableCell>
                  <TableCell className="font-semibold text-primary">
                    {formatCurrency(o.total)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} type="order" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
