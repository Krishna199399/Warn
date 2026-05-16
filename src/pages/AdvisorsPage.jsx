import React, { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import { exportCSV } from '../utils/exportCSV';
import { UserCheck, TrendingUp, Users, Search, Download, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader, StatCard, LoadingGrid, StatusBadge } from '@/components/ui';
import { useApi } from '@/hooks';

export default function AdvisorsPage() {
  const { data: advisors, loading, refetch } = useApi(() => usersApi.getAll({ role: 'ADVISOR' }));
  const { data: doManagers } = useApi(() => usersApi.getAll({ role: 'DO_MANAGER', status: 'APPROVED' }));
  const [search,        setSearch]        = useState('');
  const [assignModal,   setAssignModal]   = useState(null);
  const [selectedParent,setSelectedParent]= useState('');
  const [assigning,     setAssigning]     = useState(false);
  const [assignError,   setAssignError]   = useState('');

  const filtered = (advisors || []).filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.employeeCode?.toLowerCase().includes(search.toLowerCase()) ||
    a.region?.toLowerCase().includes(search.toLowerCase())
  );
  const active = (advisors || []).filter(a => a.status === 'APPROVED').length;

  const handleAssignParent = async () => {
    if (!selectedParent || !assignModal) return;
    setAssigning(true); setAssignError('');
    try {
      await usersApi.assignParent(assignModal.advisorId, selectedParent);
      await refetch();
      setAssignModal(null); setSelectedParent('');
    } catch (err) {
      setAssignError(err.response?.data?.error || 'Failed to assign parent');
    } finally { setAssigning(false); }
  };

  if (loading) return <LoadingGrid count={6} columns="lg:grid-cols-3" />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Promotion Representatives"
        description="All Promotion Representatives in your downline"
        actions={
          (advisors?.length > 0) && (
            <Button variant="outline" size="sm" onClick={() => exportCSV(advisors.map(a => ({ Name:a.name, Code:a.employeeCode, Parent:a.parentId?.name||'Not Assigned', 'Parent Role':a.parentId?.role?.replace(/_/g,' ')||'—', Region:a.region||'—', Phone:a.phone, Status:a.status })), 'advisors')}>
              <Download size={13} className="mr-1.5" /> Export
            </Button>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Promotion Reps" value={advisors?.length || 0} icon={Users} />
        <StatCard label="Active" value={active} icon={UserCheck} />
        <StatCard label="Inactive" value={(advisors?.length || 0) - active} icon={TrendingUp} />
      </div>

      {/* Search + Table */}
      <Card>
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9 h-9" placeholder="Search by name, code, or region..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>{['Promotion Rep.','Code','Parent (DO)','Region','Status','Actions'].map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{search ? 'No matching Promotion Reps.' : 'No Promotion Representatives found.'}</TableCell></TableRow>
            ) : filtered.map(a => (
              <TableRow key={a._id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold shrink-0">{a.avatar||a.name?.slice(0,2)}</div>
                    <div><p className="text-sm font-medium">{a.name}</p><p className="text-xs text-muted-foreground">{a.phone}</p></div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-blue-600">{a.employeeCode||'—'}</TableCell>
                <TableCell>
                  {a.parentId ? (
                    <div><p className="text-sm font-medium">{a.parentId.name}</p><p className="text-xs text-muted-foreground">{a.parentId.role?.replace(/_/g,' ')}</p></div>
                  ) : <span className="text-sm text-amber-600 font-medium">Not Assigned</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{a.region||'—'}</TableCell>
                <TableCell><StatusBadge status={a.status} type="user" /></TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAssignModal({ advisorId: a._id, advisorName: a.name, currentParent: a.parentId })}>
                    <UserPlus size={11} className="mr-1" /> {a.parentId ? 'Reassign' : 'Assign'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Assign Parent Dialog */}
      <Dialog open={!!assignModal} onOpenChange={o => { if (!o) { setAssignModal(null); setSelectedParent(''); setAssignError(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{assignModal?.currentParent ? 'Reassign Parent' : 'Assign Parent'}</DialogTitle>
            <DialogDescription>Promotion Rep.: <strong>{assignModal?.advisorName}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {assignModal?.currentParent && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-medium mb-1">Current Parent</p>
                <p className="text-sm font-semibold text-amber-900">{assignModal.currentParent.name}</p>
                <p className="text-xs text-amber-600">{assignModal.currentParent.role?.replace(/_/g,' ')}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Select Development Officer {assignModal?.currentParent && '(New Parent)'}</Label>
              <Select value={selectedParent} onValueChange={setSelectedParent}>
                <SelectTrigger><SelectValue placeholder="-- Select Development Officer --" /></SelectTrigger>
                <SelectContent>
                  {(doManagers || []).map(dm => (
                    <SelectItem key={dm._id} value={dm._id}>{dm.name} — {dm.region||'No Region'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {assignError && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{assignError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignModal(null); setSelectedParent(''); setAssignError(''); }} disabled={assigning}>Cancel</Button>
            <Button onClick={handleAssignParent} disabled={!selectedParent || assigning}>
              {assigning ? 'Assigning...' : 'Assign Parent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
