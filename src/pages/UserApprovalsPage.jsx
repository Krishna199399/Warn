import React, { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import { formatDate } from '../utils/helpers';
import {
  UserCheck, UserX, Users, MapPin, Mail, Phone, Calendar, AlertCircle, CheckCircle, Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PageHeader, LoadingGrid, EmptyState } from '@/components/ui';
import { useApi } from '../hooks/useApi';
import { toast } from 'sonner';

const ROLE_COLOR = {
  ADVISOR:       'bg-green-100 text-green-700',
  DO_MANAGER:    'bg-amber-100 text-amber-700',
  AREA_MANAGER:  'bg-blue-100 text-blue-700',
  ZONAL_MANAGER: 'bg-indigo-100 text-indigo-700',
  STATE_HEAD:    'bg-purple-100 text-purple-700',
  WHOLESALE:     'bg-orange-100 text-orange-700',
  MINI_STOCK:    'bg-rose-100 text-rose-700',
  CUSTOMER:      'bg-gray-100 text-gray-700',
};

// Employee roles that require approval and hierarchy
const EMPLOYEE_ROLES = ['STATE_HEAD', 'ZONAL_MANAGER', 'AREA_MANAGER', 'DO_MANAGER', 'ADVISOR'];

// Role hierarchy mapping (child -> parent)
const ROLE_HIERARCHY = {
  'ADVISOR': 'DO_MANAGER',
  'DO_MANAGER': 'AREA_MANAGER',
  'AREA_MANAGER': 'ZONAL_MANAGER',
  'ZONAL_MANAGER': 'STATE_HEAD',
  'STATE_HEAD': null, // Top level, no parent
};

// Helper to check if role is employee role
const isEmployeeRole = (role) => EMPLOYEE_ROLES.includes(role);

// Helper to get parent role for a given role
const getParentRole = (role) => ROLE_HIERARCHY[role] || null;

export default function UserApprovalsPage() {
  const { data: pending, loading, error, refetch } = useApi(() => usersApi.getPending(), {
    transform: (res) => res.data.data || [],
    defaultValue: []
  });
  
  const [processing, setProcessing] = useState(null);
  const [selectedParent, setSelectedParent] = useState({});
  const [parentOptions, setParentOptions] = useState({});
  const [loadingParents, setLoadingParents] = useState({});

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Fetch parent options for each employee role user
  useEffect(() => {
    if (!pending || pending.length === 0) return;

    const fetchParentOptions = async () => {
      for (const user of pending) {
        // Only fetch for employee roles that need parents
        if (isEmployeeRole(user.role) && user.role !== 'STATE_HEAD' && !user.parentId) {
          const parentRole = getParentRole(user.role);
          if (parentRole && !parentOptions[user._id]) {
            setLoadingParents(prev => ({ ...prev, [user._id]: true }));
            try {
              const response = await usersApi.getAll({ 
                role: parentRole, 
                status: 'APPROVED' 
              });
              const parents = response.data.data || [];
              setParentOptions(prev => ({ ...prev, [user._id]: parents }));
            } catch (err) {
              console.error(`Failed to fetch ${parentRole} options:`, err);
              toast.error(`Failed to load ${parentRole} options`);
            } finally {
              setLoadingParents(prev => ({ ...prev, [user._id]: false }));
            }
          }
        }
      }
    };

    fetchParentOptions();
  }, [pending]);

  const handleApprove = async (userId) => {
    const user = pending.find(u => u._id === userId);
    if (!user) return;

    setProcessing(userId);
    try {
      // Check if this is an employee role
      if (isEmployeeRole(user.role)) {
        // STATE_HEAD doesn't need parent
        if (user.role === 'STATE_HEAD') {
          await usersApi.approveEmployeeRegistration(userId);
          toast.success(`${user.name} approved as Executive Manager!`);
        } else {
          // Other employee roles need parent assignment
          if (!user.parentId && !selectedParent[userId]) {
            toast.error('Please assign a parent before approving');
            setProcessing(null);
            return;
          }

          const parentId = user.parentId || selectedParent[userId];
          await usersApi.approveEmployeeRegistration(userId, parentId);
          toast.success(`${user.name} approved successfully!`);
        }
      } else {
        // Legacy approval for WHOLESALE, MINI_STOCK, CUSTOMER
        await usersApi.approve(userId);
        toast.success(`${user.name} approved successfully!`);
      }
      
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to approve user');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      // Check if this is an employee role
      if (isEmployeeRole(rejectTarget.role)) {
        await usersApi.rejectEmployeeRegistration(rejectTarget._id, rejectReason);
      } else {
        await usersApi.reject(rejectTarget._id, rejectReason);
      }
      
      toast.success(`${rejectTarget.name} rejected`);
      await refetch();
      setRejectTarget(null);
      setRejectReason('');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to reject user');
    } finally {
      setRejecting(false);
    }
  };

  if (loading) return <LoadingGrid count={3} type="card" />;

  // Show error state if API call failed
  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="User Approvals"
          description="Review and approve new user registrations"
        />
        <Card className="p-8">
          <div className="text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold">Failed to Load Pending Users</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={refetch} variant="outline">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="User Approvals"
        description="Review and approve new user registrations"
        actions={
          <Badge variant={(pending?.length || 0) > 0 ? 'destructive' : 'secondary'} className="text-sm px-3 py-1">
            {pending?.length || 0} pending
          </Badge>
        }
      />

      {(pending?.length || 0) === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="All caught up!"
          description="No pending user approvals at the moment"
        />
      ) : (
        <div className="grid gap-4">
          {(pending || []).map(user => {
            const isEmployee = isEmployeeRole(user.role);
            const parentRole = getParentRole(user.role);
            const needsParent = isEmployee && user.role !== 'STATE_HEAD' && !user.parentId;
            const parents = parentOptions[user._id] || [];
            const loadingParentOptions = loadingParents[user._id];

            return (
              <Card key={user._id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-start gap-5 p-5">
                    {/* Avatar */}
                    <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-primary-foreground text-lg font-bold flex-shrink-0">
                      {user.avatar || user.name?.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0 space-y-4">
                      {/* Name + role + actions row */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold">{user.name}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[user.role] || 'bg-slate-100 text-slate-700'}`}>
                              {user.role?.replace(/_/g, ' ')}
                            </span>
                            {isEmployee && (
                              <Badge variant="outline" className="text-xs">
                                <Briefcase className="w-3 h-3 mr-1" />
                                Employee
                              </Badge>
                            )}
                            {user.advisorCode && (
                              <span className="text-xs font-mono text-primary font-semibold">
                                {user.advisorCode}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(user._id)}
                            disabled={processing === user._id || (needsParent && !selectedParent[user._id])}
                            title={
                              needsParent && !selectedParent[user._id]
                                ? `Select a ${parentRole?.replace(/_/g, ' ')} first` 
                                : 'Approve user'
                            }
                          >
                            <UserCheck className="mr-1.5 w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setRejectTarget(user)}
                            disabled={processing === user._id}
                          >
                            <UserX className="mr-1.5 w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      </div>

                      {/* Contact details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        {user.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5" /> {user.email}
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5" /> {user.phone}
                          </div>
                        )}
                        {user.region && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" />
                            {user.region}{user.state ? `, ${user.state}` : ''}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" /> Registered {formatDate(user.createdAt)}
                        </div>
                      </div>

                      {/* Parent Assignment - Required for employee roles (except STATE_HEAD) */}
                      {needsParent && !selectedParent[user._id] && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                          <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Assign a {parentRole?.replace(/_/g, ' ')} before approving
                          </p>
                          <div className="flex gap-2 items-center">
                            <Select
                              value={selectedParent[user._id] || ''}
                              onValueChange={(v) => setSelectedParent(prev => ({ ...prev, [user._id]: v }))}
                              disabled={loadingParentOptions}
                            >
                              <SelectTrigger className="flex-1 h-9 text-sm">
                                <SelectValue placeholder={loadingParentOptions ? 'Loading...' : `Select ${parentRole?.replace(/_/g, ' ')}...`} />
                              </SelectTrigger>
                              <SelectContent>
                                {parents.length === 0 ? (
                                  <div className="p-2 text-xs text-muted-foreground text-center">
                                    No approved {parentRole?.replace(/_/g, ' ')} found
                                  </div>
                                ) : (
                                  parents.map(parent => (
                                    <SelectItem key={parent._id} value={parent._id}>
                                      {parent.name} {parent.employeeCode && `(${parent.employeeCode})`} — {parent.region || 'No Region'}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {parents.length === 0 && !loadingParentOptions && (
                            <p className="text-xs text-amber-700">
                              ⚠️ No approved {parentRole?.replace(/_/g, ' ')} available. Please approve a {parentRole?.replace(/_/g, ' ')} first.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Show selected parent confirmation */}
                      {selectedParent[user._id] && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-300 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-700" />
                          <span className="text-sm font-medium text-green-900">
                            Selected: {parents.find(p => p._id === selectedParent[user._id])?.name}
                            {parents.find(p => p._id === selectedParent[user._id])?.employeeCode && 
                              ` (${parents.find(p => p._id === selectedParent[user._id])?.employeeCode})`
                            }
                          </span>
                        </div>
                      )}

                      {/* Parent assigned */}
                      {user.parentId && (
                        <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <Users className="w-4 h-4 text-primary" />
                          {typeof user.parentId === 'object' ? (
                            <>
                              <span className="text-sm font-medium text-primary">{user.parentId.name}</span>
                              {user.parentId.employeeCode && (
                                <span className="text-xs font-mono text-muted-foreground">
                                  ({user.parentId.employeeCode})
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {user.parentId.role?.replace(/_/g, ' ')} · {user.parentId.region || 'No Region'}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-medium text-primary">
                              Parent Assigned (ID: {user.parentId})
                            </span>
                          )}
                        </div>
                      )}

                      {/* STATE_HEAD info - no parent needed */}
                      {user.role === 'STATE_HEAD' && (
                        <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <Briefcase className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-900">
                            Top-level position (Executive Manager) - No parent assignment required
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={() => { setRejectTarget(null); setRejectReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User</DialogTitle>
            <DialogDescription>
              Rejecting <strong>{rejectTarget?.name}</strong>. Optionally provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={rejecting}>
              {rejecting ? 'Rejecting...' : 'Reject User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
