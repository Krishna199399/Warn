import React, { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import { analyticsApi } from '../api/analytics.api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, Card, SkeletonPage, AnimatedStat } from '../components/ui';
import { Users, TrendingUp, Search, Download, UserPlus, X } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { exportCSV } from '../utils/exportCSV';

export default function NetworkPage() {
  const { user } = useAuth();
  const [nodes,   setNodes]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [doManagers, setDoManagers] = useState([]);
  const [assignModal, setAssignModal] = useState(null);
  const [selectedParent, setSelectedParent] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      usersApi.getHierarchy({ signal: controller.signal }),
      user?._id ? analyticsApi.getDashboard({ signal: controller.signal }) : Promise.resolve(null),
      usersApi.getAll({ role: 'DO_MANAGER', status: 'APPROVED' }, { signal: controller.signal }),
    ]).then(([nRes, sRes, dmRes]) => {
      setNodes(nRes.data.data || []);
      if (sRes) setStats(sRes.data.data);
      setDoManagers(dmRes.data.data || []);
    }).catch(() => {})
    .finally(() => setLoading(false));
    return () => controller.abort();
  }, [user]);

  const ROLE_CONFIG = {
    ALL:            { label: 'All',           color: 'bg-slate-100 text-slate-700' },
    ADMIN:          { label: 'Admin',         color: 'bg-purple-100 text-purple-700' },
    STATE_HEAD:     { label: 'State Head',    color: 'bg-blue-100 text-blue-700' },
    ZONAL_MANAGER:  { label: 'Zonal',         color: 'bg-indigo-100 text-indigo-700' },
    AREA_MANAGER:   { label: 'Area',          color: 'bg-green-100 text-green-700' },
    DO_MANAGER:     { label: 'DO',            color: 'bg-amber-100 text-amber-700' },
    ADVISOR:        { label: 'Advisor',       color: 'bg-rose-100 text-rose-700' },
  };

  const tabs = ['ALL', 'ADMIN', 'STATE_HEAD', 'ZONAL_MANAGER', 'AREA_MANAGER', 'DO_MANAGER', 'ADVISOR'];

  const filtered = nodes.filter(n => {
    const matchesSearch = n.name?.toLowerCase().includes(search.toLowerCase()) ||
      n.role?.toLowerCase().includes(search.toLowerCase()) ||
      n.region?.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'ALL' || n.role === activeTab;
    return matchesSearch && matchesTab;
  });

  const getRoleCount = (role) => role === 'ALL' ? nodes.length : nodes.filter(n => n.role === role).length;

  const handleAssignParent = async () => {
    if (!selectedParent || !assignModal) return;
    setAssigning(true);
    try {
      await usersApi.assignParent(assignModal.advisorId, selectedParent);
      // Refresh network list
      const res = await usersApi.getHierarchy();
      setNodes(res.data.data || []);
      setAssignModal(null);
      setSelectedParent('');
      alert('Parent assigned successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign parent');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <SkeletonPage />;

  return (
    <div className="space-y-5">
      <PageHeader title="Network" subtitle={`${nodes.length} members in the network`}
        actions={nodes.length > 0 && (
          <button onClick={() => exportCSV(filtered.map(n => ({ Name: n.name, Role: n.role?.replace(/_/g,' '), Region: n.region, State: n.state, Status: n.status, Code: n.advisorCode || '' })), 'network')} className="btn-export">
            <Download size={12} /> Export
          </button>
        )}
      />

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Active Network', value: stats.activeNetwork, icon: Users,      bg: 'bg-blue-50',  color: 'text-blue-600' },
            { label: 'Total Sales',    value: stats.totalSales,    icon: TrendingUp, bg: 'bg-green-50', color: 'text-green-600' },
            { label: 'Total Orders',   value: stats.totalOrders,   icon: TrendingUp, bg: 'bg-amber-50', color: 'text-amber-600' },
          ].map(s => (
            <Card key={s.label}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon size={18} className={s.color} /></div>
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-xl font-bold text-slate-800">
                    {typeof s.value === 'number' && s.value > 100
                      ? <AnimatedStat value={s.value} format={s.label.includes('Sales') ? 'currency' : 'number'} />
                      : (s.label.includes('Sales') ? formatCurrency(s.value) : s.value)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input-field pl-9 text-sm py-2" placeholder="Search network..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-100 overflow-x-auto">
          <div className="flex gap-1 px-4 pt-3">
            {tabs.map(tab => {
              const count = getRoleCount(tab);
              const isActive = activeTab === tab;
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}>
                  {ROLE_CONFIG[tab].label}
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-100' : 'bg-slate-100'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                {['Member','Role','Region','State','Status','Code', activeTab === 'ADVISOR' && 'Actions'].filter(Boolean).map(h =>
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={activeTab === 'ADVISOR' ? 7 : 6} className="px-4 py-10 text-center text-sm text-slate-400">No members found</td></tr>
              ) : (
                filtered.map(n => (
                  <tr key={n._id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold">
                          {n.avatar || n.name?.slice(0,2)}
                        </div>
                        <p className="text-sm font-medium text-slate-800">{n.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_CONFIG[n.role]?.color || 'bg-slate-100 text-slate-500'}`}>
                        {n.role?.replace(/_/g,' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{n.region || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{n.state || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        n.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>{n.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-blue-600">{n.advisorCode || '—'}</td>
                    {activeTab === 'ADVISOR' && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setAssignModal({ advisorId: n._id, advisorName: n.name, currentParent: n.parentId })}
                          className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 font-medium"
                          title={n.parentId ? 'Reassign Parent' : 'Assign Parent'}
                        >
                          <UserPlus size={12} />
                          {n.parentId ? 'Reassign' : 'Assign'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Assign Parent Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {assignModal.currentParent ? 'Reassign Parent' : 'Assign Parent'}
              </h3>
              <button onClick={() => { setAssignModal(null); setSelectedParent(''); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Advisor</p>
                <p className="text-base font-semibold text-slate-800">{assignModal.advisorName}</p>
              </div>

              {assignModal.currentParent && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700 font-medium mb-1">Current Parent</p>
                  <p className="text-sm font-semibold text-amber-900">{assignModal.currentParent.name}</p>
                  <p className="text-xs text-amber-600">{assignModal.currentParent.role?.replace(/_/g, ' ')}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select DO Manager {assignModal.currentParent && '(New Parent)'}
                </label>
                <select
                  value={selectedParent}
                  onChange={(e) => setSelectedParent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">-- Select DO Manager --</option>
                  {doManagers.map(dm => (
                    <option key={dm._id} value={dm._id}>
                      {dm.name} - {dm.region || 'No Region'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setAssignModal(null); setSelectedParent(''); }}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                disabled={assigning}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignParent}
                disabled={!selectedParent || assigning}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigning ? 'Assigning...' : 'Assign Parent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
