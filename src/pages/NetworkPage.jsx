import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users.api';
import { analyticsApi } from '../api/analytics.api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { exportCSV } from '../utils/exportCSV';
import { Users, TrendingUp, Search, Download, UserPlus, X, Flame, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, StatCard, LoadingGrid } from '@/components/ui';
import { useApi } from '../hooks/useApi';

const ROLE_CONFIG = {
  ALL:            { label: 'All',        badgeClass: 'bg-slate-100 text-slate-700' },
  ADMIN:          { label: 'Admin',      badgeClass: 'bg-purple-100 text-purple-700' },
  STATE_HEAD:     { label: 'State Head', badgeClass: 'bg-blue-100 text-blue-700' },
  ZONAL_MANAGER:  { label: 'Zonal',     badgeClass: 'bg-indigo-100 text-indigo-700' },
  AREA_MANAGER:   { label: 'Area',      badgeClass: 'bg-green-100 text-green-700' },
  DO_MANAGER:     { label: 'DO Mgr',    badgeClass: 'bg-amber-100 text-amber-700' },
  ADVISOR:        { label: 'Advisor',   badgeClass: 'bg-rose-100 text-rose-700' },
  WHOLESALE:      { label: 'Wholesale', badgeClass: 'bg-orange-100 text-orange-700' },
  MINI_STOCK:     { label: 'Mini Stock',badgeClass: 'bg-pink-100 text-pink-700' },
};
const STATUS_CLASS = {
  APPROVED:     'bg-green-50 text-green-700',
  TERMINATED:   'bg-red-50 text-red-700',
  SELF_DELETED: 'bg-orange-50 text-orange-700',
  PENDING:      'bg-amber-50 text-amber-700',
};

const TABS = ['ALL', 'ADMIN', 'STATE_HEAD', 'ZONAL_MANAGER', 'AREA_MANAGER', 'DO_MANAGER', 'ADVISOR'];

export default function NetworkPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: nodes, loading: nodesLoading, refetch } = useApi(() => usersApi.getHierarchy(), { defaultValue: [] });
  const { data: stats } = useApi(() => user?._id ? analyticsApi.getDashboard() : null, { immediate: !!user?._id });
  const { data: doManagers } = useApi(() => usersApi.getAll({ role: 'DO_MANAGER', status: 'APPROVED' }), { defaultValue: [] });
  
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  // Assign parent dialog
  const [assignModal,    setAssignModal]    = useState(null);
  const [selectedParent, setSelectedParent] = useState('');
  const [assigning,      setAssigning]      = useState(false);

  // Fire dialog
  const [fireModal,  setFireModal]  = useState(null);
  const [fireReason, setFireReason] = useState('');
  const [firing,     setFiring]     = useState(false);
  const [fireError,  setFireError]  = useState('');

  const filtered = nodes.filter(n => {
    const q = search.toLowerCase();
    const matchesSearch = !q || n.name?.toLowerCase().includes(q) || n.role?.toLowerCase().includes(q) || n.region?.toLowerCase().includes(q);
    const matchesTab = activeTab === 'ALL' || n.role === activeTab;
    return matchesSearch && matchesTab;
  });

  const getRoleCount = (role) => role === 'ALL' ? nodes.length : nodes.filter(n => n.role === role).length;

  const handleAssignParent = async () => {
    if (!selectedParent || !assignModal) return;
    setAssigning(true);
    try {
      await usersApi.assignParent(assignModal.advisorId, selectedParent);
      await refetch();
      setAssignModal(null);
      setSelectedParent('');
    } catch (err) { console.error(err); }
    finally { setAssigning(false); }
  };

  const handleTerminate = async () => {
    if (!fireReason.trim() || !fireModal) return;
    setFiring(true);
    setFireError('');
    try {
      await usersApi.terminate(fireModal._id, fireReason);
      await refetch();
      setFireModal(null);
      setFireReason('');
    } catch (err) {
      setFireError(err.response?.data?.error || 'Failed to terminate');
    } finally { setFiring(false); }
  };

  if (nodesLoading) return <LoadingGrid count={6} columns="lg:grid-cols-3" />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users & Network"
        description={`${nodes.length} members in the network`}
        actions={
          <Button variant="outline" size="sm" onClick={() => exportCSV(filtered.map(n => ({ Name: n.name, Role: n.role?.replace(/_/g,' '), Region: n.region, Status: n.status, Code: n.employeeCode || '' })), 'network')}>
            <Download size={13} className="mr-1.5" /> Export
          </Button>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Active Network" value={stats.activeNetwork} icon={Users} format="number" />
          <StatCard label="Total Sales" value={stats.totalSales} icon={TrendingUp} format="currency" />
          <StatCard label="Total Orders" value={stats.totalOrders} icon={TrendingUp} format="number" />
        </div>
      )}

      {/* Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle className="text-base">Members</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search network..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
          {/* Role Tabs */}
          <div className="overflow-x-auto mt-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto flex-wrap gap-1 bg-muted/60">
                {TABS.map(tab => (
                  <TabsTrigger key={tab} value={tab} className="text-xs px-3 py-1.5 gap-1.5">
                    {ROLE_CONFIG[tab]?.label || tab}
                    <span className="text-[10px] bg-background/60 px-1.5 py-0.5 rounded-full">
                      {getRoleCount(tab)}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Code</TableHead>
                {user?.role === 'ADMIN' && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={user?.role === 'ADMIN' ? 6 : 5} className="py-12 text-center text-muted-foreground">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(n => (
                  <TableRow key={n._id}>
                    <TableCell onClick={() => navigate(`/app/employees/${n._id}`)} className="cursor-pointer hover:bg-muted/20">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                          {n.avatar || n.name?.slice(0, 2)}
                        </div>
                        <p className="text-sm font-medium">{n.name}</p>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => navigate(`/app/employees/${n._id}`)} className="cursor-pointer hover:bg-muted/20">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_CONFIG[n.role]?.badgeClass || 'bg-muted text-muted-foreground'}`}>
                        {ROLE_CONFIG[n.role]?.label || n.role}
                      </span>
                    </TableCell>
                    <TableCell onClick={() => navigate(`/app/employees/${n._id}`)} className="cursor-pointer hover:bg-muted/20 text-sm text-muted-foreground">{n.region || '—'}</TableCell>
                    <TableCell onClick={() => navigate(`/app/employees/${n._id}`)} className="cursor-pointer hover:bg-muted/20">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[n.status] || 'bg-muted text-muted-foreground'}`}>
                        {n.status === 'SELF_DELETED' ? 'DELETED' : n.status}
                      </span>
                    </TableCell>
                    <TableCell onClick={() => navigate(`/app/employees/${n._id}`)} className="cursor-pointer hover:bg-muted/20 text-xs font-mono text-primary">{n.employeeCode || '—'}</TableCell>
                    {user?.role === 'ADMIN' && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="View Details"
                            onClick={() => navigate(`/app/employees/${n._id}`)}>
                            <Eye size={13} />
                          </Button>
                          {activeTab === 'ADVISOR' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Assign Parent"
                              onClick={() => setAssignModal({ advisorId: n._id, advisorName: n.name, currentParent: n.parentId })}>
                              <UserPlus size={13} />
                            </Button>
                          )}
                          {n.role !== 'ADMIN' && n.status === 'APPROVED' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" title="Fire Employee"
                              onClick={() => setFireModal(n)}>
                              <Flame size={13} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Assign Parent Dialog */}
      <Dialog open={!!assignModal} onOpenChange={() => { setAssignModal(null); setSelectedParent(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{assignModal?.currentParent ? 'Reassign Parent' : 'Assign Parent'}</DialogTitle>
            <DialogDescription>Assign a DO Manager for <strong>{assignModal?.advisorName}</strong></DialogDescription>
          </DialogHeader>
          {assignModal?.currentParent && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
              <p className="text-xs font-medium text-amber-700 mb-0.5">Current Parent</p>
              <p className="font-semibold text-amber-900">{assignModal.currentParent.name}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label>Select DO Manager</Label>
            <Select value={selectedParent} onValueChange={setSelectedParent}>
              <SelectTrigger>
                <SelectValue placeholder="-- Select DO Manager --" />
              </SelectTrigger>
              <SelectContent>
                {doManagers.map(dm => (
                  <SelectItem key={dm._id} value={dm._id}>{dm.name} — {dm.region || 'No Region'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignModal(null); setSelectedParent(''); }} disabled={assigning}>Cancel</Button>
            <Button onClick={handleAssignParent} disabled={!selectedParent || assigning}>
              {assigning ? 'Assigning...' : 'Assign Parent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fire Employee Dialog */}
      <Dialog open={!!fireModal} onOpenChange={() => { setFireModal(null); setFireReason(''); setFireError(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame size={18} className="text-destructive" /> Fire Employee
            </DialogTitle>
            <DialogDescription>
              This permanently terminates <strong>{fireModal?.name}</strong> ({fireModal?.role?.replace(/_/g,' ')}) and blocks their access.
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <p className="font-semibold mb-1">⚠️ This will:</p>
            <ul className="list-disc ml-4 space-y-0.5">
              <li>Permanently block their login</li>
              <li>Reassign all their farmers to DO Manager</li>
              <li>Remove from commission network</li>
            </ul>
          </div>
          <div className="space-y-2">
            <Label>Reason for termination *</Label>
            <Textarea
              value={fireReason}
              onChange={e => setFireReason(e.target.value)}
              placeholder="Enter the reason for termination..."
              rows={3}
            />
          </div>
          {fireError && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{fireError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFireModal(null); setFireReason(''); setFireError(''); }} disabled={firing}>Cancel</Button>
            <Button variant="destructive" onClick={handleTerminate} disabled={firing || !fireReason.trim()}>
              <Flame size={14} className="mr-1.5" />
              {firing ? 'Terminating...' : 'Fire Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
