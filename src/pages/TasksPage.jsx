import React, { useEffect, useState } from 'react';
import { tasksApi } from '../api/tasks.api';
import { exportCSV } from '../utils/exportCSV';
import { CheckSquare, Clock, AlertTriangle, Trash2, Download, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, StatCard, LoadingGrid } from '@/components/ui';
import { useApi } from '../hooks/useApi';

const PRIORITY_COLOR = {
  High:   'text-red-600 bg-red-50',
  Medium: 'text-amber-600 bg-amber-50',
  Low:    'text-muted-foreground bg-muted',
};
const STATUS_COLOR = {
  Pending:   'bg-blue-50 text-blue-600',
  Completed: 'bg-primary/10 text-primary',
  Overdue:   'bg-red-50 text-red-600',
};

export default function TasksPage() {
  const { data: tasks = [], loading, refetch } = useApi(() => tasksApi.getMy());
  const [filter,  setFilter]  = useState('All');
  const [search,  setSearch]  = useState('');

  const markDone = async (id) => {
    await tasksApi.update(id, { status: 'Completed' });
    refetch();
  };
  const remove = async (id) => {
    await tasksApi.remove(id);
    refetch();
  };

  const filtered = tasks.filter(t => {
    const matchStatus = filter === 'All' || t.status === filter;
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = { Pending: 0, Completed: 0, Overdue: 0 };
  tasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Tasks"
        description={`${tasks.length} tasks assigned`}
        actions={tasks.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => exportCSV(tasks.map(t => ({ Title: t.title, Priority: t.priority, Status: t.status, Type: t.type, Due: t.due?.slice(0,10) })), 'my_tasks')}>
            <Download size={13} className="mr-1.5" /> Export
          </Button>
        )}
      />

      {/* Stats */}
      {loading ? (
        <LoadingGrid count={3} columns="grid-cols-3" type="card" />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Pending" value={counts.Pending} icon={Clock} format="number" />
          <StatCard label="Completed" value={counts.Completed} icon={CheckSquare} format="number" />
          <StatCard label="Overdue" value={counts.Overdue} icon={AlertTriangle} format="number" />
        </div>
      )}

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            {['All','Pending','Completed','Overdue'].map(s => <TabsTrigger key={s} value={s} className="text-xs">{s}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Task List */}
      <Card>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading tasks...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{search ? 'No matching tasks.' : 'No tasks in this category.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(t => (
              <div key={t._id} className="px-5 py-4 flex items-start justify-between gap-3 hover:bg-muted/40 transition-colors">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => t.status !== 'Completed' && markDone(t._id)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${t.status === 'Completed' ? 'bg-primary border-primary' : 'border-border hover:border-primary'}`}
                  >
                    {t.status === 'Completed' && <div className="w-2 h-2 bg-primary-foreground rounded-full" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${t.status === 'Completed' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PRIORITY_COLOR[t.priority] || 'bg-muted text-muted-foreground'}`}>{t.priority}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[t.status] || 'bg-muted text-muted-foreground'}`}>{t.status}</span>
                      <span className="text-[10px] text-muted-foreground">{t.type}</span>
                      <span className="text-[10px] text-muted-foreground">Due: {t.due?.slice(0,10)}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 mt-0.5" onClick={() => remove(t._id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
