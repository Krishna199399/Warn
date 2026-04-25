import React, { useEffect, useState } from 'react';
import { farmersApi } from '../api/farmers.api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, Card, SkeletonCards, AnimatedStat } from '../components/ui';
import { Users, MapPin, Wheat, ShoppingCart, TrendingUp, Phone, Download, Search, Eye, Calendar, ChevronRight, Filter } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { exportCSV } from '../utils/exportCSV';

export default function MyFarmersPage() {
  const { user } = useAuth();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [view,    setView]    = useState('list'); // 'list' or 'village'
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const controller = new AbortController();
    farmersApi.getMy({ signal: controller.signal })
      .then(r => setFarmers(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = farmers.filter(f => {
    const matchSearch = f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.village?.toLowerCase().includes(search.toLowerCase()) ||
      f.crop?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalSpent  = farmers.reduce((s, f) => s + (f.spent || 0), 0);
  const totalOrders = farmers.reduce((s, f) => s + (f.totalOrders || 0), 0);
  const active      = farmers.filter(f => f.status === 'Active').length;

  // Village breakdown for visit tracking view
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

  return (
    <div className="space-y-5">
      <PageHeader title="My Farmers" subtitle={`${farmers.length} registered farmers`}
        actions={farmers.length > 0 && (
          <button onClick={() => exportCSV(farmers.map(f => ({
            Name: f.name, Phone: f.phone, Village: f.village, Crop: f.crop, Acres: f.acres, Status: f.status, 'Total Spent': f.spent || 0, Orders: f.totalOrders || 0
          })), 'my_farmers')} className="btn-export">
            <Download size={12} /> Export
          </button>
        )}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Farmers', value: farmers.length, icon: Users,        color: 'text-blue-600', bg: 'bg-blue-50', tooltip: 'Total registered farmers' },
          { label: 'Active',        value: active,          icon: TrendingUp,   color: 'text-green-600', bg: 'bg-green-50', tooltip: 'Farmers with Active status' },
          { label: 'Total Orders',  value: totalOrders,     icon: ShoppingCart,  color: 'text-purple-600', bg: 'bg-purple-50', tooltip: 'Total orders from all farmers' },
          { label: 'Total Spent',   value: totalSpent,      icon: TrendingUp,   color: 'text-amber-600', bg: 'bg-amber-50', format: 'currency', tooltip: 'Total revenue from farmers' },
        ].map(s => (
          <Card key={s.label} title={s.tooltip} className="hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-lg font-bold text-slate-800">
                  <AnimatedStat value={s.value} format={s.format || 'number'} />
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters + view toggle - Mobile optimized */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-9 text-sm py-2 w-full" placeholder="Search by name, village, or crop..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {['ALL', 'Active', 'Inactive'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${statusFilter === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          <button onClick={() => setView('list')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${view === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
            List View
          </button>
          <button onClick={() => setView('village')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${view === 'village' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
            <MapPin size={11} /> Village Map
          </button>
        </div>
      </div>

      {/* Village Map View (feature #9) */}
      {view === 'village' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {villages.map(([name, data]) => (
            <Card key={name} className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-800">{name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {data.count} farmer{data.count !== 1 ? 's' : ''} · {data.totalAcres.toFixed(1)} acres
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {[...data.crops].map(crop => (
                      <span key={crop} className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                        {crop}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 space-y-1">
                    {data.farmers.slice(0, 3).map(f => (
                      <p key={f._id} className="text-xs text-slate-600 truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                        {f.name} — {f.acres} acres
                      </p>
                    ))}
                    {data.farmers.length > 3 && (
                      <p className="text-xs text-slate-400 italic">+{data.farmers.length - 3} more</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <Card padding={false}>
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading farmers...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              <Wheat size={32} className="mx-auto mb-2 opacity-30" />
              {search ? 'No matching farmers found.' : statusFilter !== 'ALL' ? `No ${statusFilter.toLowerCase()} farmers.` : 'No farmers registered yet.'}
              {!search && statusFilter === 'ALL' && (
                <p className="text-xs mt-2 text-slate-500">Start adding farmers to build your network</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map(f => (
                <div key={f._id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-700 font-bold text-sm">
                      {f.name?.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{f.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin size={10} /> {f.village}
                        <span className="mx-1">·</span>
                        <Wheat size={10} /> {f.crop}
                        <span className="mx-1">·</span>
                        {f.acres} acres
                      </p>
                      {f.phone && <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone size={9}/> {f.phone}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-700">{formatCurrency(f.spent || 0)}</p>
                    <p className="text-xs text-slate-400">{f.totalOrders || 0} orders</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${f.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {f.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
