import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks';
import { visitsApi } from '../api/visits.api';
import { formatCurrency } from '../utils/helpers';
import {
  Calendar, MapPin, Package, Clock, CheckCircle, AlertCircle,
  XCircle, User, Phone, Search, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { LoadingGrid } from '@/components/ui/loading-grid';
import { EmptyState } from '@/components/ui/empty-state';

// Status configuration
const STATUS_CONFIG = {
  PENDING: { label: 'Pending', icon: Clock, variant: 'outline', color: 'text-amber-600' },
  COMPLETED: { label: 'Completed', icon: CheckCircle, variant: 'default', color: 'text-primary' },
  MISSED: { label: 'Missed', icon: XCircle, variant: 'destructive', color: 'text-destructive' },
  RESCHEDULED: { label: 'Rescheduled', icon: AlertCircle, variant: 'secondary', color: 'text-blue-600' }
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon size={12} className="mr-1" />
      {config.label}
    </Badge>
  );
}

// Visit Card Component
function VisitCard({ visit, onClick }) {
  const isOverdue = visit.status === 'PENDING' && new Date(visit.scheduledDate) < new Date();
  const scheduledDate = new Date(visit.scheduledDate);
  const isToday = scheduledDate.toDateString() === new Date().toDateString();

  return (
    <Card 
      className={`hover:shadow-md transition-shadow cursor-pointer ${isOverdue ? 'border-destructive' : ''}`}
      onClick={() => onClick(visit._id)}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isOverdue ? 'bg-destructive/10' : 'bg-primary/10'
            }`}>
              <User size={20} className={isOverdue ? 'text-destructive' : 'text-primary'} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {visit.farmerId?.name || 'Unknown Farmer'}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone size={12} />
                {visit.farmerId?.phone || '—'}
              </p>
            </div>
          </div>
          <StatusBadge status={visit.status} />
        </div>

        {/* Product Info */}
        <div className="bg-muted/40 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Package size={14} className="text-muted-foreground" />
            <span className="font-medium">{visit.productId?.name || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={14} />
            <span>{visit.farmerId?.village || 'Location not specified'}</span>
          </div>
        </div>

        {/* Date Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar size={14} className={isOverdue ? 'text-destructive' : 'text-muted-foreground'} />
            <span className={isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}>
              {scheduledDate.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
            {isToday && (
              <Badge variant="default" className="ml-2 text-xs">Today</Badge>
            )}
          </div>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">Overdue</Badge>
          )}
        </div>

        {/* Order Info */}
        {visit.orderId && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Order: {visit.orderId.orderNumber} • Qty: {visit.orderId.quantity} • {formatCurrency(visit.orderId.total)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MyVisitsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('upcoming');
  const [search, setSearch] = useState('');

  // Fetch data based on tab
  const { data: todayVisits, loading: loadingToday } = useApi(
    () => visitsApi.getToday(),
    { defaultValue: [], enabled: tab === 'today' }
  );

  const { data: upcomingVisits, loading: loadingUpcoming } = useApi(
    () => visitsApi.getUpcoming(),
    { defaultValue: [], enabled: tab === 'upcoming' }
  );

  const { data: overdueVisits, loading: loadingOverdue } = useApi(
    () => visitsApi.getOverdue(),
    { defaultValue: [], enabled: tab === 'overdue' }
  );

  const { data: allVisits, loading: loadingAll } = useApi(
    () => visitsApi.getMy(),
    { defaultValue: [], enabled: tab === 'all' || tab === 'completed' }
  );

  // Get current data based on tab
  const getCurrentData = () => {
    switch (tab) {
      case 'today': return todayVisits;
      case 'upcoming': return upcomingVisits;
      case 'overdue': return overdueVisits;
      case 'completed': return allVisits.filter(v => v.status === 'COMPLETED');
      case 'all': return allVisits;
      default: return [];
    }
  };

  const currentData = getCurrentData();
  const loading = loadingToday || loadingUpcoming || loadingOverdue || loadingAll;

  // Filter by search
  const filtered = currentData.filter(v =>
    !search ||
    v.farmerId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.farmerId?.phone?.includes(search) ||
    v.productId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.farmerId?.village?.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate stats
  const stats = {
    today: todayVisits.length,
    upcoming: upcomingVisits.length,
    overdue: overdueVisits.length,
    completed: allVisits.filter(v => v.status === 'COMPLETED').length
  };

  const handleVisitClick = (visitId) => {
    navigate(`/app/visits/${visitId}`);
  };

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="My Visits"
        description="Track and manage your farmer visits (next 30 days)"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Visits"
          value={stats.today}
          icon={Calendar}
          format="number"
        />
        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          icon={Clock}
          format="number"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={AlertCircle}
          format="number"
          className={stats.overdue > 0 ? 'border-destructive' : ''}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle}
          format="number"
        />
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="today" className="text-xs px-3">
              Today
              {stats.today > 0 && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-[10px]">
                  {stats.today}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs px-3">
              Upcoming
              {stats.upcoming > 0 && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-[10px]">
                  {stats.upcoming}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="text-xs px-3">
              Overdue
              {stats.overdue > 0 && (
                <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-[10px]">
                  {stats.overdue}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs px-3">
              Completed
              {stats.completed > 0 && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-[10px]">
                  {stats.completed}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs px-3">
              All Visits
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search farmer, product..."
            className="pl-9 h-10 bg-muted/30 border-muted"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingGrid count={6} columns="xl:grid-cols-3" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No visits found"
          description={
            search
              ? 'Try adjusting your search query'
              : tab === 'today'
              ? "You don't have any visits scheduled for today"
              : tab === 'overdue'
              ? "Great! You don't have any overdue visits"
              : tab === 'completed'
              ? "You haven't completed any visits yet"
              : "You don't have any visits yet"
          }
          action={search && <Button variant="outline" onClick={() => setSearch('')}>Clear Search</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(visit => (
            <VisitCard key={visit._id} visit={visit} onClick={handleVisitClick} />
          ))}
        </div>
      )}
    </div>
  );
}
