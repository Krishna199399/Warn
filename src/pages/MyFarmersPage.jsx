import React, { useState } from 'react';
import { useApi } from '@/hooks';
import { farmersApi } from '../api/farmers.api';
import { ordersApi } from '../api/orders.api';
import { formatCurrency } from '../utils/helpers';
import { exportCSV } from '../utils/exportCSV';
import { Users, MapPin, Wheat, ShoppingCart, TrendingUp, Phone, Download, Search, Package, Calendar, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { LoadingGrid } from '@/components/ui/loading-grid';
import { EmptyState } from '@/components/ui/empty-state';

export default function MyFarmersPage() {
  const { data: farmers, loading, error } = useApi(() => farmersApi.getMy(), { defaultValue: [] });
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const filtered = farmers.filter(f => {
    const matchSearch = 
      f.name?.toLowerCase().includes(search.toLowerCase()) || 
      f.village?.toLowerCase().includes(search.toLowerCase()) || 
      f.crop?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalSpent = farmers.reduce((s, f) => s + (f.spent || 0), 0);
  const totalOrders = farmers.reduce((s, f) => s + (f.totalOrders || 0), 0);
  const active = farmers.filter(f => f.status === 'Active').length;

  const villageMap = {};
  farmers.forEach(f => {
    const v = f.village || 'Unknown';
    if (!villageMap[v]) villageMap[v] = { count: 0, farmers: [], totalAcres: 0, crops: new Set() };
    villageMap[v].count++;
    villageMap[v].farmers.push(f);
    villageMap[v].totalAcres += (f.acres || 0);
    if (f.crop) villageMap[v].crops.add(f.crop);
  });
  const villages = Object.entries(villageMap).sort((a, b) => b[1].count - a[1].count);

  const handleExport = () => {
    exportCSV(
      farmers.map(f => ({
        Name: f.name,
        Phone: f.phone,
        Village: f.village,
        Crop: f.crop,
        Acres: f.acres,
        Status: f.status,
        Spent: f.spent || 0,
        Orders: f.totalOrders || 0
      })),
      'my_farmers'
    );
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="My Customers" description="Loading..." />
        <LoadingGrid count={4} columns="lg:grid-cols-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader title="My Customers" />
        <EmptyState
          icon={Wheat}
          title="Failed to load customers"
          description={error}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Customers"
        description={`${farmers.length} registered customers`}
        actions={
          farmers.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download size={13} className="mr-1.5" /> Export
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Customers"
          value={farmers.length}
          icon={Users}
          format="number"
        />
        <StatCard
          label="Active"
          value={active}
          icon={TrendingUp}
          format="number"
        />
        <StatCard
          label="Total Orders"
          value={totalOrders}
          icon={ShoppingCart}
          format="number"
        />
        <StatCard
          label="Total Spent"
          value={totalSpent}
          icon={TrendingUp}
          format="currency"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Search name, village or crop..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            {['ALL', 'Active', 'Inactive'].map(s => (
              <TabsTrigger key={s} value={s} className="text-xs">
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="list" className="text-xs">List</TabsTrigger>
            <TabsTrigger value="village" className="text-xs">
              <MapPin size={11} className="mr-1" />Village Map
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === 'village' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {villages.map(([name, data]) => (
            <Card key={name} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold">{name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {data.count} customer{data.count !== 1 ? 's' : ''} · {data.totalAcres.toFixed(1)} acres
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {[...data.crops].map(crop => (
                      <span key={crop} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {crop}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 space-y-1">
                    {data.farmers.slice(0, 3).map(f => (
                      <p key={f._id} className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {f.name} — {f.acres} acres
                      </p>
                    ))}
                    {data.farmers.length > 3 && (
                      <p className="text-xs text-muted-foreground italic">
                        +{data.farmers.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {view === 'list' && (
        <Card>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Wheat}
              title={search ? 'No matching customers found' : statusFilter !== 'ALL' ? `No ${statusFilter.toLowerCase()} customers` : 'No customers registered yet'}
              description={search ? 'Try adjusting your search' : 'Customers will appear here once registered'}
            />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(f => (
                <div 
                  key={f._id} 
                  className="px-5 py-4 flex items-center justify-between hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedCustomer(f)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {f.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{f.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                        <MapPin size={10} /> {f.village} <span className="mx-1">·</span>
                        <Wheat size={10} /> {f.crop} <span className="mx-1">·</span> {f.acres} acres
                      </p>
                      {f.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone size={9} /> {f.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{formatCurrency(f.spent || 0)}</p>
                    <p className="text-xs text-muted-foreground">{f.totalOrders || 0} orders</p>
                    <Badge
                      variant={f.status === 'Active' ? 'default' : 'secondary'}
                      className="text-[10px] mt-1"
                    >
                      {f.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-lg">
                {selectedCustomer?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-bold">{selectedCustomer?.name}</p>
                <Badge variant={selectedCustomer?.status === 'Active' ? 'default' : 'secondary'} className="text-xs mt-1">
                  {selectedCustomer?.status}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {selectedCustomer?.phone && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Phone size={16} className="text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                )}
                {selectedCustomer?.email && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Mail size={16} className="text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{selectedCustomer.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Farm Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Farm Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <MapPin size={16} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Village</p>
                    <p className="text-sm font-medium">{selectedCustomer?.village || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Wheat size={16} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Crop</p>
                    <p className="text-sm font-medium">{selectedCustomer?.crop || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <TrendingUp size={16} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Acres</p>
                    <p className="text-sm font-medium">{selectedCustomer?.acres || 0} acres</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Summary */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Purchase Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <ShoppingCart size={20} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold text-primary">{selectedCustomer?.totalOrders || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <TrendingUp size={20} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(selectedCustomer?.spent || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Date */}
            {selectedCustomer?.createdAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <Calendar size={12} />
                <span>Registered on {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
