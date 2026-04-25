import React, { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import { PageHeader, SkeletonCards } from '../components/ui';
import EmployeeCard from '../components/cards/EmployeeCard';
import { Users, AlertCircle, Search, Download } from 'lucide-react';
import { exportCSV } from '../utils/exportCSV';

export default function ZonalEmployeesPage() {
  const [managers, setManagers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    const controller = new AbortController();
    usersApi.getAll({ role: 'ZONAL_MANAGER' }, { signal: controller.signal })
      .then(r => setManagers(r.data.data || []))
      .catch(err => { if (err.name !== 'CanceledError') setError(err?.response?.data?.error || 'Failed to load zonal managers'); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = managers.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.region?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Zonal Managers" subtitle={`${managers.length} Zonal Managers in your state`}
        actions={managers.length > 0 && (
          <button onClick={() => exportCSV(managers.map(m => ({ Name: m.name, Region: m.region, State: m.state, Phone: m.phone, Status: m.status })), 'zonal_managers')} className="btn-export shadow-sm hover:shadow">
            <Download size={12} /> Export CSV
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
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-10 text-sm py-2.5 shadow-sm" placeholder="Search by name or region..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {loading ? (
        <SkeletonCards count={3} />
      ) : !error && filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">
            {search ? 'No matching managers found' : 'No zonal managers found'}
          </p>
          <p className="text-xs text-slate-400">
            {search ? 'Try adjusting your search criteria' : 'Zonal managers will appear here once added'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(m => (
            <EmployeeCard key={m._id} employee={m} accentColor="blue" />
          ))}
        </div>
      )}
    </div>
  );
}
