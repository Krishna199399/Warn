import React, { useEffect, useState } from 'react';
import { tasksApi } from '../api/tasks.api';
import { PageHeader, Card, SkeletonCards } from '../components/ui';
import { CheckSquare, Clock, AlertTriangle, Trash2, Download, Search } from 'lucide-react';
import { exportCSV } from '../utils/exportCSV';

const PRIORITY_COLOR = {
  High:   'text-red-600 bg-red-50',
  Medium: 'text-amber-600 bg-amber-50',
  Low:    'text-slate-600 bg-slate-100'
};
const STATUS_COLOR = {
  Pending:   'bg-blue-50 text-blue-600',
  Completed: 'bg-green-50 text-green-700',
  Overdue:   'bg-red-50 text-red-600'
};

export default function TasksPage() {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('All');
  const [search,  setSearch]  = useState('');

  const load = () => {
    setLoading(true);
    tasksApi.getMy()
      .then(r => setTasks(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markDone = async (id) => {
    await tasksApi.update(id, { status: 'Completed' });
    setTasks(prev => prev.map(t => t._id === id ? { ...t, status: 'Completed' } : t));
  };

  const remove = async (id) => {
    await tasksApi.remove(id);
    setTasks(prev => prev.filter(t => t._id !== id));
  };

  const statuses = ['All', 'Pending', 'Completed', 'Overdue'];
  const filtered = tasks.filter(t => {
    const matchStatus = filter === 'All' || t.status === filter;
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = { Pending: 0, Completed: 0, Overdue: 0 };
  tasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });

  return (
    <div className="space-y-5">
      <PageHeader title="My Tasks" subtitle={`${tasks.length} tasks assigned`}
        actions={tasks.length > 0 && (
          <button onClick={() => exportCSV(tasks.map(t => ({ Title: t.title, Priority: t.priority, Status: t.status, Type: t.type, Due: t.due?.slice(0,10) })), 'my_tasks')} className="btn-export">
            <Download size={12} /> Export
          </button>
        )}
      />

      {loading ? <SkeletonCards count={3} /> : (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending',   count: counts.Pending,   icon: Clock,         color: 'text-blue-600',  bg: 'bg-blue-50',  tooltip: 'Tasks waiting to be started' },
          { label: 'Completed', count: counts.Completed, icon: CheckSquare,   color: 'text-green-600', bg: 'bg-green-50', tooltip: 'Successfully completed tasks' },
          { label: 'Overdue',   count: counts.Overdue,   icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-50',   tooltip: 'Tasks past their due date' },
        ].map(s => (
          <Card key={s.label} title={s.tooltip} className="hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-xl font-bold text-slate-800">{s.count}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}

      {/* Filter + Search - Mobile optimized */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${filter === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-8 text-xs py-1.5 w-full" placeholder="Search tasks..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <Card padding={false}>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading tasks...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
            {search ? 'No matching tasks.' : 'No tasks in this category.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(t => (
              <div key={t._id} className="px-5 py-4 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button onClick={() => t.status !== 'Completed' && markDone(t._id)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      t.status === 'Completed' ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-green-400'}`}>
                    {t.status === 'Completed' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${t.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{t.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[t.status]}`}>{t.status}</span>
                      <span className="text-[10px] text-slate-400">{t.type}</span>
                      <span className="text-[10px] text-slate-400">Due: {t.due?.slice(0,10)}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => remove(t._id)} className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
