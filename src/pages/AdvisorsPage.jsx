import React, { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import { PageHeader, Card, SkeletonTable } from '../components/ui';
import { UserCheck, TrendingUp, Users, Search, Download, UserPlus, X } from 'lucide-react';
import { exportCSV } from '../utils/exportCSV';

export default function AdvisorsPage() {
  const [advisors, setAdvisors] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [doManagers, setDoManagers] = useState([]);
  const [assignModal, setAssignModal] = useState(null); // { advisorId, advisorName }
  const [selectedParent, setSelectedParent] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    
    // Fetch advisors
    usersApi.getAll({ role: 'ADVISOR' }, { signal: controller.signal })
      .then(r => setAdvisors(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    
    // Fetch DO Managers for parent assignment
    usersApi.getAll({ role: 'DO_MANAGER', status: 'APPROVED' }, { signal: controller.signal })
      .then(r => setDoManagers(r.data.data || []))
      .catch(() => {});
    
    return () => controller.abort();
  }, []);

  const filtered = advisors.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.advisorCode?.toLowerCase().includes(search.toLowerCase()) ||
    a.region?.toLowerCase().includes(search.toLowerCase())
  );
  const active = advisors.filter(a => a.status === 'Active').length;

  const handleAssignParent = async () => {
    if (!selectedParent || !assignModal) return;
    setAssigning(true);
    try {
      await usersApi.assignParent(assignModal.advisorId, selectedParent);
      // Refresh advisors list
      const res = await usersApi.getAll({ role: 'ADVISOR' });
      setAdvisors(res.data.data || []);
      setAssignModal(null);
      setSelectedParent('');
      alert('Parent assigned successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign parent');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Advisors" subtitle="All advisors in your downline"
        actions={advisors.length > 0 && (
          <button onClick={() => exportCSV(advisors.map(a => ({ 
            Name: a.name, 
            Code: a.advisorCode, 
            Parent: a.parentId?.name || 'Not Assigned',
            'Parent Role': a.parentId?.role?.replace(/_/g, ' ') || '—',
            Region: a.region || '—', 
            Phone: a.phone, 
            Status: a.status, 
            Promoted: a.isPromoted ? 'Yes' : 'No' 
          })), 'advisors')} className="btn-export">
            <Download size={12} /> Export
          </button>
        )}
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Advisors', value: advisors.length, icon: Users,     bg: 'bg-blue-50',  color: 'text-blue-600'  },
          { label: 'Active',         value: active,           icon: UserCheck, bg: 'bg-green-50', color: 'text-green-600' },
          { label: 'Inactive',       value: advisors.length - active, icon: TrendingUp, bg: 'bg-slate-50', color: 'text-slate-600' },
        ].map(s => (
          <Card key={s.label}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon size={18} className={s.color} /></div>
              <div><p className="text-xs text-slate-500">{s.label}</p><p className="text-xl font-bold text-slate-800">{s.value}</p></div>
            </div>
          </Card>
        ))}
      </div>

      {loading ? <SkeletonTable rows={5} cols={5} /> : (
        <div className="table-container">
          <div className="p-4 border-b border-slate-50">
            <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input-field pl-9 text-sm py-2" placeholder="Search by name, code, or region..."
                value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="table-header">
                {['Advisor','Code','Parent (DO)','Region','Status','Promoted','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                  {search ? 'No matching advisors.' : 'No advisors found.'}
                </td></tr>
              ) : filtered.map(a => (
                <tr key={a._id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-bold">{a.avatar || a.name?.slice(0,2)}</div>
                      <div><p className="text-sm font-medium text-slate-800">{a.name}</p><p className="text-xs text-slate-400">{a.phone}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-blue-600">{a.advisorCode || '—'}</td>
                  <td className="px-4 py-3">
                    {a.parentId ? (
                      <div>
                        <p className="text-sm font-medium text-slate-700">{a.parentId.name}</p>
                        <p className="text-xs text-slate-400">{a.parentId.role?.replace(/_/g, ' ')}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-amber-600 font-medium">Not Assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{a.region || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === 'APPROVED' ? 'bg-green-50 text-green-700' : a.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {a.isPromoted
                      ? <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium">✓ Promoted</span>
                      : <span className="text-xs text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setAssignModal({ advisorId: a._id, advisorName: a.name, currentParent: a.parentId })}
                      className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 font-medium"
                      title={a.parentId ? 'Reassign Parent' : 'Assign Parent'}
                    >
                      <UserPlus size={12} />
                      {a.parentId ? 'Reassign' : 'Assign'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
