import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks';
import { visitsApi } from '../../api/visits.api';
import { formatCurrency } from '../../utils/helpers';
import {
  Calendar, MapPin, Package, Clock, CheckCircle, AlertCircle,
  XCircle, User, Phone, Search, TrendingUp, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { LoadingGrid } from '@/components/ui/loading-grid';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Status configuration
const STATUS_CONFIG = {
  PENDING: { label: 'Pending', icon: Clock, variant: 'outline', color: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Completed', icon: CheckCircle, variant: 'default', color: 'bg-green-100 text-green-700' },
  MISSED: { label: 'Missed', icon: XCircle, variant: 'destructive', color: 'bg-red-100 text-red-700' },
  RESCHEDULED: { label: 'Rescheduled', icon: AlertCircle, variant: 'secondary', color: 'bg-blue-100 text-blue-700' }
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon size={12} />
      {config.label}
    </Badge>
  );
}

export default function AdminVisitsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  // Fetch stats
  const { data: stats, loading: loadingStats } = useApi(
    () => visitsApi.getAdminStats(),
    { defaultValue: {} }
  );

  // Fetch advisor performance
  const { data: advisorPerformance, loading: loadingPerformance } = useApi(
    () => visitsApi.getAdvisorPerformance(),
    { defaultValue: [] }
  );

  // Fetch all visits
  const { data: allVisits, loading: loadingVisits } = useApi(
    () => visitsApi.getAllVisitsAdmin(),
    { defaultValue: [] }
  );

  // Filter visits by tab
  const getCurrentData = () => {
    switch (tab) {
      case 'completed': return allVisits.filter(v => v.status === 'COMPLETED');
      case 'pending': return allVisits.filter(v => v.status === 'PENDING');
      case 'overdue': return allVisits.filter(v => v.status === 'MISSED');
      case 'all': return allVisits;
      default: return allVisits;
    }
  };

  const currentData = getCurrentData();

  // Filter by search
  const filtered = currentData.filter(v =>
    !search ||
    v.farmerId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.advisorId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.advisorId?.advisorCode?.toLowerCase().includes(search.toLowerCase()) ||
    v.productId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const loading = loadingStats || loadingPerformance || loadingVisits;

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Visit Management"
        description="Monitor and track all advisor field visits"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Visits"
          value={stats.totalVisits || 0}
          icon={Calendar}
          format="number"
        />
        <StatCard
          label="Completed"
          value={stats.completedVisits || 0}
          icon={CheckCircle}
          format="number"
        />
        <StatCard
          label="Pending"
          value={stats.pendingVisits || 0}
          icon={Clock}
          format="number"
        />
        <StatCard
          label="Missed"
          value={stats.missedVisits || 0}
          icon={XCircle}
          format="number"
        />
        <StatCard
          label="Completion Rate"
          value={stats.completionRate || 0}
          icon={TrendingUp}
          format="percent"
        />
      </div>

      {/* Advisor Performance */}
      {advisorPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award size={20} />
              Top Performing Advisors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {advisorPerformance.slice(0, 5).map((advisor, index) => (
                <div key={advisor.advisorId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{advisor.advisorName}</p>
                      <p className="text-sm text-muted-foreground">{advisor.advisorCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">{advisor.completionRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {advisor.completedVisits}/{advisor.totalVisits} visits
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList>
            <TabsTrigger value="all">All Visits</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search advisor, farmer..."
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Visits Table */}
      {loading ? (
        <LoadingGrid count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No visits found"
          description={search ? 'Try adjusting your search query' : 'No visits have been scheduled yet'}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Advisor</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(visit => (
                  <TableRow key={visit._id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{visit.advisorId?.name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{visit.advisorId?.advisorCode || '—'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{visit.farmerId?.name || '—'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone size={10} />
                          {visit.farmerId?.phone || '—'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-muted-foreground" />
                        <span>{visit.productId?.name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(visit.scheduledDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={visit.status} />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{visit.orderId?.orderNumber || '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {visit.orderId?.quantity || 0} • {formatCurrency(visit.orderId?.total || 0)}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
