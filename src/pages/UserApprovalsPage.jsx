import React, { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import { PageHeader, Card, SkeletonPage } from '../components/ui';
import { UserCheck, UserX, Users, MapPin, Mail, Phone, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function UserApprovalsPage() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [doManagers, setDoManagers] = useState([]);
  const [selectedParent, setSelectedParent] = useState({});

  const fetchPending = async () => {
    try {
      const res = await usersApi.getPending();
      setPending(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch pending users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoManagers = async () => {
    try {
      const res = await usersApi.getAll({ role: 'DO_MANAGER', status: 'APPROVED' });
      setDoManagers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch DO Managers:', err);
    }
  };

  useEffect(() => {
    fetchPending();
    fetchDoManagers();
  }, []);

  const handleAssignParent = async (userId, parentId) => {
    if (!parentId) {
      alert('Please select a DO Manager');
      return;
    }
    
    setProcessing(userId);
    try {
      await usersApi.assignParent(userId, parentId);
      // Update local state
      setPending(prev => prev.map(u => {
        if (u._id === userId) {
          const parent = doManagers.find(dm => dm._id === parentId);
          return { ...u, parentId: parent };
        }
        return u;
      }));
      alert('✅ Parent assigned successfully!');
    } catch (err) {
      alert('Failed to assign parent: ' + (err.response?.data?.error || err.message));
    } finally {
      setProcessing(null);
    }
  };

  const handleApprove = async (userId) => {
    const user = pending.find(u => u._id === userId);
    
    // Check if advisor has parent assigned
    if (user?.role === 'ADVISOR' && !user.parentId) {
      alert('⚠️ Please assign a DO Manager before approving this advisor');
      return;
    }
    
    if (!confirm('Approve this user?')) return;
    setProcessing(userId);
    try {
      await usersApi.approve(userId);
      setPending(prev => prev.filter(u => u._id !== userId));
      alert('✅ User approved successfully!');
    } catch (err) {
      alert('Failed to approve user: ' + (err.response?.data?.error || err.message));
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId) => {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return; // User cancelled
    
    setProcessing(userId);
    try {
      await usersApi.reject(userId, reason);
      setPending(prev => prev.filter(u => u._id !== userId));
      alert('User rejected');
    } catch (err) {
      alert('Failed to reject user: ' + (err.response?.data?.error || err.message));
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <SkeletonPage />;

  return (
    <div className="space-y-5">
      <PageHeader 
        title="User Approvals" 
        subtitle={`${pending.length} pending approval${pending.length !== 1 ? 's' : ''}`}
      />

      {/* Summary Card */}
      <Card>
        <div className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
            <AlertCircle size={24} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Pending Registrations</p>
            <p className="text-xs text-slate-500">Review and approve new user registrations</p>
          </div>
        </div>
      </Card>

      {/* Pending Users List */}
      {pending.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <p className="text-lg font-semibold text-slate-800 mb-2">All caught up!</p>
            <p className="text-sm text-slate-500">No pending user approvals at the moment</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pending.map(user => (
            <Card key={user._id}>
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-md">
                    {user.avatar || user.name?.slice(0, 2).toUpperCase()}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">{user.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                            {user.role?.replace(/_/g, ' ')}
                          </span>
                          {user.advisorCode && (
                            <span className="text-xs font-mono text-blue-600 font-semibold">
                              {user.advisorCode}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(user._id)}
                          disabled={processing === user._id}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          <UserCheck size={14} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(user._id)}
                          disabled={processing === user._id}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          <UserX size={14} />
                          Reject
                        </button>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {user.email && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail size={14} className="text-slate-400" />
                          <span>{user.email}</span>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.region && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin size={14} className="text-slate-400" />
                          <span>{user.region}{user.state ? `, ${user.state}` : ''}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        <span>Registered {formatDate(user.createdAt)}</span>
                      </div>
                    </div>

                    {/* Parent Assignment - Show for Advisors without parent */}
                    {!user.parentId && user.role === 'ADVISOR' && (
                      <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                          <Users size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-blue-800 mb-2">Assign DO Manager</p>
                            <div className="flex gap-2">
                              <select
                                value={selectedParent[user._id] || ''}
                                onChange={(e) => setSelectedParent(prev => ({ ...prev, [user._id]: e.target.value }))}
                                className="flex-1 text-sm px-3 py-2 border border-blue-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                              >
                                <option value="">Select DO Manager...</option>
                                {doManagers.map(dm => (
                                  <option key={dm._id} value={dm._id}>
                                    {dm.name} - {dm.region || 'No Region'} ({dm.advisorCode || dm.phone})
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleAssignParent(user._id, selectedParent[user._id])}
                                disabled={!selectedParent[user._id] || processing === user._id}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                Assign
                              </button>
                            </div>
                            <p className="text-xs text-blue-600 mt-2">
                              ⚠️ Must assign a DO Manager before approval
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Parent Info */}
                    {user.parentId && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-green-600 mb-1 font-medium">✓ Assigned Parent</p>
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            {user.parentId.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-200 text-green-700">
                            {user.parentId.role?.replace(/_/g, ' ')}
                          </span>
                          {user.parentId.region && (
                            <span className="text-xs text-green-600">
                              • {user.parentId.region}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
