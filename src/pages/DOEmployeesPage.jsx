import React, { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import { PageHeader, SkeletonCards } from '../components/ui';
import EmployeeCard from '../components/cards/EmployeeCard';
import { Users, AlertCircle, Search, Download } from 'lucide-react';
import { exportCSV } from '../utils/exportCSV';

export default function DOEmployeesPage() {
  const [managers, setManagers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    const controller = new AbortController();
    usersApi.getAll({ role: 'DO_MANAGER' }, { signal: controller.signal })
      .then(r => setManagers(r.data.data || []))
      .catch(err => { if (err.name !== 'CanceledError') setError(err?.response?.data?.error || 'Failed to load DO managers'); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = managers.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.region?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader title="DO Managers" subtitle={`${managers.length} DO Managers in your area`}
        actions={managers.length > 0 && (
          <button onClick={() => exportCSV(managers.map(m => ({ Name: m.name, Region: m.region, State: m.state, Phone: m.phone, Status: m.status })), 'do_managers')} className="btn-export">
            <Download size={12} /> Export
          </button>
        )}
      />

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {!error && managers.length > 0 && (
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-9 text-sm py-2" placeholder="Search by name or region..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {loading ? (
        <SkeletonCards count={3} />
      ) : !error && filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          <Users size={32} className="mx-auto mb-2 opacity-30" />
          {search ? 'No matching managers found.' : 'No DO managers found in your area.'}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <EmployeeCard key={m._id} employee={m} accentColor="amber" />
          ))}
        </div>
      )}
    </div>
  );
}
