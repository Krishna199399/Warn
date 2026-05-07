import React, { useState } from 'react';
import { useApi } from '@/hooks';
import { payoutsApi } from '../api/payouts.api';
import { formatCurrency, formatPoints } from '../utils/helpers';
import { CheckCircle2, Clock, AlertTriangle, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { LoadingGrid } from '@/components/ui/loading-grid';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

const STATUS_META = {
  PENDING: { label: 'Pending', cls: 'bg-amber-100 text-amber-700',  Icon: Clock },
  PAID:    { label: 'Paid',    cls: 'bg-green-100 text-green-700',  Icon: CheckCircle2 },
  FAILED:  { label: 'Failed',  cls: 'bg-red-100 text-red-700',      Icon: AlertTriangle },
  ON_HOLD: { label: 'On Hold', cls: 'bg-slate-100 text-slate-500',  Icon: null },
};

export default function MyPayoutsPage() {
  const { data, loading, error } = useApi(() => payoutsApi.getMyPayouts(), { defaultValue: {} });
  const [filter, setFilter] = useState('');

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="My Payouts" description="Your RP and salary payment history" />
        <LoadingGrid count={2} columns="sm:grid-cols-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader title="My Payouts" description="Your RP and salary payment history" />
        <EmptyState
          icon={Wallet}
          title="Failed to load payouts"
          description={error}
        />
      </div>
    );
  }

  const records = (data?.records || []).filter(r => !filter || r.type === filter);

  return (
    <div className="space-y-5">
      <PageHeader 
        title="My Payouts" 
        description="Your RP and salary payment history" 
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard
          label="Total Received"
          value={data?.totalPaid || 0}
          icon={CheckCircle2}
          format="currency"
        />
        <StatCard
          label="Pending"
          value={data?.totalPending || 0}
          icon={Clock}
          format="currency"
        />
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="RP" className="text-xs">Retail Point</TabsTrigger>
          <TabsTrigger value="SALARY" className="text-xs">Salary</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Payment Records ({records.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No payout records yet"
              description="Your payment history will appear here once processed"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>UTR Number</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r, i) => {
                  const sm = STATUS_META[r.status] || { label: r.status, cls: 'bg-muted text-muted-foreground', Icon: null };
                  return (
                    <TableRow key={r._id || i}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${r.type === 'RP' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {r.type === 'RP' ? '₹' : '💵'}
                          </div>
                          <span className="text-sm font-medium">
                            {r.type === 'RP' ? 'Retail Point' : 'Salary'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {new Date(r.periodStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {new Date(r.periodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status.toLowerCase()} />
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-bold ${r.status === 'PAID' ? 'text-primary' : 'text-muted-foreground'}`}>
                          {r.status === 'PAID' ? '+' : ''}{formatPoints(r.points)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {r.paidAt ? new Date(r.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground font-mono">
                          {r.utrNumber || '—'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
