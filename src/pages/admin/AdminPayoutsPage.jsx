import React, { useEffect, useState } from 'react';
import { payoutsApi } from '../../api/payouts.api';
import { formatCurrency } from '../../utils/helpers';
import { Download, CheckCircle2, Clock, AlertTriangle, ChevronRight, Play, Users, UserCheck, Briefcase, Store, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const TYPE_META = {
  RP_MID: { label: 'RP Mid-Month',   cls: 'bg-blue-100 text-blue-700',    icon: '📅', desc: '1st–14th · Advisors', category: 'advisors'     },
  RP_END: { label: 'RP End-Month',   cls: 'bg-purple-100 text-purple-700', icon: '📆', desc: '15th–Last · Advisors', category: 'advisors'     },
  ADVISOR_SALARY: { label: 'Advisor Salary', cls: 'bg-primary/10 text-primary', icon: '💵', desc: 'Advisor level salary', category: 'advisors' },
  IV_MID: { label: 'IV Mid-Month',   cls: 'bg-orange-100 text-orange-700', icon: '🏅', desc: '1st–14th · Managers', category: 'employees'      },
  IV_END: { label: 'IV End-Month',   cls: 'bg-amber-100 text-amber-700',   icon: '🏆', desc: '15th–Last · Managers', category: 'employees'     },
  EMPLOYEE_SALARY: { label: 'Employee Salary', cls: 'bg-primary/10 text-primary', icon: '💵', desc: 'Employee level salary', category: 'employees' },
  SALARY: { label: 'Monthly Salary', cls: 'bg-primary/10 text-primary',    icon: '💵', desc: 'Level salary (All)', category: 'both'             },
  WHOLESALE_COMMISSION: { label: 'Wholesale Commission', cls: 'bg-green-100 text-green-700', icon: '🏪', desc: 'Wholesale earnings', category: 'wholesale' },
  MINISTOCK_COMMISSION: { label: 'Mini Stock Commission', cls: 'bg-cyan-100 text-cyan-700', icon: '🏬', desc: 'Mini Stock earnings', category: 'ministock' },
};
const STATUS_META = {
  PENDING:    { label: 'Pending',    cls: 'bg-amber-100 text-amber-700',  Icon: Clock         },
  PROCESSING: { label: 'Processing', cls: 'bg-blue-100 text-blue-700',    Icon: Play          },
  COMPLETED:  { label: 'Completed',  cls: 'bg-primary/10 text-primary',   Icon: CheckCircle2  },
  PARTIAL:    { label: 'Partial',    cls: 'bg-orange-100 text-orange-700', Icon: AlertTriangle },
};

export default function AdminPayoutsPage() {
  const [summary,    setSummary]    = useState(null);
  const [batches,    setBatches]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [genModal,   setGenModal]   = useState(false);
  const [genType,    setGenType]    = useState('RP_MID');
  const [genDate,    setGenDate]    = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genError,   setGenError]   = useState('');
  const [activeTab,    setActiveTab]    = useState('advisors');
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    try {
      const [s, b] = await Promise.all([
        payoutsApi.getSummary(),
        payoutsApi.getBatches({ status: filterStatus }),
      ]);
      setSummary(s.data.data);
      setBatches(b.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleOpenGenerateModal = () => {
    // Set default batch type based on active tab
    if (activeTab === 'advisors') {
      setGenType('RP_MID');
    } else if (activeTab === 'employees') {
      setGenType('IV_MID');
    } else if (activeTab === 'ministock') {
      setGenType('MINISTOCK_COMMISSION');
    } else if (activeTab === 'wholesale') {
      setGenType('WHOLESALE_COMMISSION');
    }
    setGenModal(true);
  };

  const handleGenerate = async () => {
    setGenLoading(true); setGenError('');
    try {
      const res = await payoutsApi.generateBatch({ type: genType, forDate: genDate || undefined });
      setGenModal(false); setGenDate('');
      load();
    } catch (e) {
      setGenError(e.response?.data?.error || 'Error generating batch');
    } finally { setGenLoading(false); }
  };

  // Get tab-specific summary data
  const getTabSummary = () => {
    if (!summary || !batches) return { pendingCount: 0, pendingTotal: 0, paidThisMonth: 0, nextSchedule: '—' };

    const filteredBatches = batches.filter(batch => {
      const meta = TYPE_META[batch.type];
      if (!meta) return false;
      
      if (activeTab === 'advisors') {
        return meta.category === 'advisors';
      } else if (activeTab === 'employees') {
        return meta.category === 'employees';
      } else if (activeTab === 'ministock') {
        return meta.category === 'ministock';
      } else if (activeTab === 'wholesale') {
        return meta.category === 'wholesale';
      }
      return false;
    });

    const pendingBatches = filteredBatches.filter(batch => batch.status === 'PENDING');
    const completedBatches = filteredBatches.filter(batch => batch.status === 'COMPLETED');
    
    const pendingTotal = pendingBatches.reduce((sum, batch) => sum + (batch.totalAmount || 0), 0);
    const paidThisMonth = completedBatches.reduce((sum, batch) => sum + (batch.totalAmount || 0), 0);

    // Get next schedule based on tab
    let nextSchedule = '—';
    if (activeTab === 'advisors') {
      nextSchedule = summary?.schedule?.nextRpMid || '—';
    } else if (activeTab === 'employees') {
      nextSchedule = summary?.schedule?.nextRpMid || '—'; // IV also runs on 15th
    } else if (activeTab === 'ministock' || activeTab === 'wholesale') {
      nextSchedule = summary?.schedule?.nextMonthEnd || '—'; // Commission runs month-end
    }

    return {
      pendingCount: pendingBatches.length,
      pendingTotal,
      paidThisMonth,
      nextSchedule
    };
  };

  const tabSummary = getTabSummary();

  // Filter batches by active tab
  const getFilteredBatches = () => {
    return batches.filter(batch => {
      const meta = TYPE_META[batch.type];
      if (!meta) return false;
      
      if (activeTab === 'advisors') {
        return meta.category === 'advisors' || meta.category === 'both';
      } else if (activeTab === 'employees') {
        return meta.category === 'employees' || meta.category === 'both';
      } else if (activeTab === 'ministock') {
        return meta.category === 'ministock';
      } else if (activeTab === 'wholesale') {
        return meta.category === 'wholesale';
      }
      return false;
    });
  };

  const filteredBatches = getFilteredBatches();

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i=><Skeleton key={i} className="h-24 rounded-xl"/>)}</div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payout Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage RP and salary payouts for all employees</p>
        </div>
        <Button onClick={handleOpenGenerateModal}>
          <Play size={14} className="mr-1.5" /> Generate Batch
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending Batches</p>
            <p className="text-2xl font-bold text-amber-700">{tabSummary.pendingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(tabSummary.pendingTotal)} to pay</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Paid This Month</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(tabSummary.paidThisMonth)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {activeTab === 'advisors' && 'Next RP Mid (15th)'}
              {activeTab === 'employees' && 'Next IV Mid (15th)'}
              {activeTab === 'ministock' && 'Next Commission (Month-end)'}
              {activeTab === 'wholesale' && 'Next Commission (Month-end)'}
            </p>
            <p className="text-sm font-bold text-blue-700">{tabSummary.nextSchedule}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {(activeTab === 'ministock' || activeTab === 'wholesale') ? 
                `Mid-month: ${summary?.schedule?.nextRpMid || '—'}` : 
                `End-month: ${summary?.schedule?.nextMonthEnd || '—'}`
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different user types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="advisors" className="gap-2">
              <UserCheck size={14} />
              <span className="hidden sm:inline">Advisors</span>
            </TabsTrigger>
            <TabsTrigger value="employees" className="gap-2">
              <Briefcase size={14} />
              <span className="hidden sm:inline">Employees</span>
            </TabsTrigger>
            <TabsTrigger value="ministock" className="gap-2">
              <Store size={14} />
              <span className="hidden sm:inline">Mini Stock</span>
            </TabsTrigger>
            <TabsTrigger value="wholesale" className="gap-2">
              <Building2 size={14} />
              <span className="hidden sm:inline">Wholesale</span>
            </TabsTrigger>
          </TabsList>

          {/* Status Filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advisors Tab */}
        <TabsContent value="advisors" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck size={16} className="text-blue-600" />
                Advisor Payouts
              </CardTitle>
              <p className="text-xs text-muted-foreground">Retail Points (RP) commissions and monthly salary for Advisors</p>
            </CardHeader>
            <CardContent>
              {filteredBatches.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  No advisor payout batches yet. Generate one to get started.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredBatches.map(batch => {
                    const tm = TYPE_META[batch.type] || { label: batch.type, cls: 'bg-muted text-muted-foreground', icon: '📋' };
                    const sm = STATUS_META[batch.status] || { label: batch.status, cls: 'bg-muted text-muted-foreground', Icon: null };
                    const SmIcon = sm.Icon;
                    return (
                      <div key={batch._id} className="px-5 py-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{tm.icon}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold">{batch.batchId}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${sm.cls}`}>
                                {SmIcon && <SmIcon size={10} />}{sm.label}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tm.cls}`}>{tm.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(batch.periodStart).toLocaleDateString('en-IN')} – {new Date(batch.periodEnd).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div><p className="text-xs text-muted-foreground">Total</p><p className="text-sm font-bold">{formatCurrency(batch.totalAmount)}</p></div>
                          <div><p className="text-xs text-muted-foreground">Advisors</p><p className="text-sm font-semibold text-muted-foreground">{batch.paidCount}/{batch.totalEmployees}</p></div>
                          <a href={`/app/admin/payouts/${batch._id}`}
                            className="flex items-center gap-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                            View <ChevronRight size={12}/>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase size={16} className="text-orange-600" />
                Employee Payouts
              </CardTitle>
              <p className="text-xs text-muted-foreground">Monthly salary and Incentive Value (IV) for Regional Managers (RM), Development Officers (DO), and other employees</p>
            </CardHeader>
            <CardContent>
              {filteredBatches.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  No employee payout batches yet. Generate one to get started.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredBatches.map(batch => {
                    const tm = TYPE_META[batch.type] || { label: batch.type, cls: 'bg-muted text-muted-foreground', icon: '📋' };
                    const sm = STATUS_META[batch.status] || { label: batch.status, cls: 'bg-muted text-muted-foreground', Icon: null };
                    const SmIcon = sm.Icon;
                    return (
                      <div key={batch._id} className="px-5 py-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{tm.icon}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold">{batch.batchId}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${sm.cls}`}>
                                {SmIcon && <SmIcon size={10} />}{sm.label}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tm.cls}`}>{tm.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(batch.periodStart).toLocaleDateString('en-IN')} – {new Date(batch.periodEnd).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div><p className="text-xs text-muted-foreground">Total</p><p className="text-sm font-bold">{formatCurrency(batch.totalAmount)}</p></div>
                          <div><p className="text-xs text-muted-foreground">Employees</p><p className="text-sm font-semibold text-muted-foreground">{batch.paidCount}/{batch.totalEmployees}</p></div>
                          <a href={`/app/admin/payouts/${batch._id}`}
                            className="flex items-center gap-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                            View <ChevronRight size={12}/>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mini Stock Tab */}
        <TabsContent value="ministock" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Store size={16} className="text-cyan-600" />
                Mini Stock Payouts
              </CardTitle>
              <p className="text-xs text-muted-foreground">Commission earnings for Mini Stock users from wholesale purchases</p>
            </CardHeader>
            <CardContent>
              {filteredBatches.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  No Mini Stock payout batches yet. Generate one to get started.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredBatches.map(batch => {
                    const tm = TYPE_META[batch.type] || { label: batch.type, cls: 'bg-muted text-muted-foreground', icon: '📋' };
                    const sm = STATUS_META[batch.status] || { label: batch.status, cls: 'bg-muted text-muted-foreground', Icon: null };
                    const SmIcon = sm.Icon;
                    return (
                      <div key={batch._id} className="px-5 py-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{tm.icon}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold">{batch.batchId}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${sm.cls}`}>
                                {SmIcon && <SmIcon size={10} />}{sm.label}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tm.cls}`}>{tm.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(batch.periodStart).toLocaleDateString('en-IN')} – {new Date(batch.periodEnd).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div><p className="text-xs text-muted-foreground">Total</p><p className="text-sm font-bold">{formatCurrency(batch.totalAmount)}</p></div>
                          <div><p className="text-xs text-muted-foreground">Users</p><p className="text-sm font-semibold text-muted-foreground">{batch.paidCount}/{batch.totalEmployees}</p></div>
                          <a href={`/app/admin/payouts/${batch._id}`}
                            className="flex items-center gap-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                            View <ChevronRight size={12}/>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wholesale Tab */}
        <TabsContent value="wholesale" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 size={16} className="text-green-600" />
                Wholesale Payouts
              </CardTitle>
              <p className="text-xs text-muted-foreground">Commission earnings for Wholesale users from company purchases</p>
            </CardHeader>
            <CardContent>
              {filteredBatches.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  No Wholesale payout batches yet. Generate one to get started.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredBatches.map(batch => {
                    const tm = TYPE_META[batch.type] || { label: batch.type, cls: 'bg-muted text-muted-foreground', icon: '📋' };
                    const sm = STATUS_META[batch.status] || { label: batch.status, cls: 'bg-muted text-muted-foreground', Icon: null };
                    const SmIcon = sm.Icon;
                    return (
                      <div key={batch._id} className="px-5 py-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{tm.icon}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold">{batch.batchId}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${sm.cls}`}>
                                {SmIcon && <SmIcon size={10} />}{sm.label}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tm.cls}`}>{tm.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(batch.periodStart).toLocaleDateString('en-IN')} – {new Date(batch.periodEnd).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div><p className="text-xs text-muted-foreground">Total</p><p className="text-sm font-bold">{formatCurrency(batch.totalAmount)}</p></div>
                          <div><p className="text-xs text-muted-foreground">Users</p><p className="text-sm font-semibold text-muted-foreground">{batch.paidCount}/{batch.totalEmployees}</p></div>
                          <a href={`/app/admin/payouts/${batch._id}`}
                            className="flex items-center gap-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                            View <ChevronRight size={12}/>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Dialog */}
      <Dialog open={genModal} onOpenChange={o => { setGenModal(o); if (!o) { setGenError(''); setGenDate(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Payout Batch</DialogTitle>
            <DialogDescription>
              {activeTab === 'advisors' && 'Generate Retail Points (RP) or Salary batch for Advisors'}
              {activeTab === 'employees' && 'Generate Incentive Value (IV) or Salary batch for Employees'}
              {activeTab === 'ministock' && 'Generate commission batch for Mini Stock users'}
              {activeTab === 'wholesale' && 'Generate commission batch for Wholesale users'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Batch Type</Label>
              <Select value={genType} onValueChange={setGenType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="w-[400px]">
                  {activeTab === 'advisors' && (
                    <>
                      <SelectGroup><SelectLabel>Retail Points</SelectLabel>
                        <SelectItem value="RP_MID">RP Mid-Month (1st-14th)</SelectItem>
                        <SelectItem value="RP_END">RP End-Month (15th-end)</SelectItem>
                      </SelectGroup>
                      <SelectGroup><SelectLabel>Salary</SelectLabel>
                        <SelectItem value="ADVISOR_SALARY">Advisor Monthly Salary</SelectItem>
                      </SelectGroup>
                    </>
                  )}
                  {activeTab === 'employees' && (
                    <>
                      <SelectGroup><SelectLabel>Incentive Value</SelectLabel>
                        <SelectItem value="IV_MID">IV Mid-Month (1st-14th)</SelectItem>
                        <SelectItem value="IV_END">IV End-Month (15th-end)</SelectItem>
                      </SelectGroup>
                      <SelectGroup><SelectLabel>Salary</SelectLabel>
                        <SelectItem value="EMPLOYEE_SALARY">Employee Monthly Salary</SelectItem>
                      </SelectGroup>
                    </>
                  )}
                  {activeTab === 'ministock' && (
                    <SelectGroup><SelectLabel>Commission</SelectLabel>
                      <SelectItem value="MINISTOCK_COMMISSION">Mini Stock Commission</SelectItem>
                    </SelectGroup>
                  )}
                  {activeTab === 'wholesale' && (
                    <SelectGroup><SelectLabel>Commission</SelectLabel>
                      <SelectItem value="WHOLESALE_COMMISSION">Wholesale Commission</SelectItem>
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>For Date <span className="text-muted-foreground font-normal">(leave blank = today)</span></Label>
              <Input type="date" value={genDate} onChange={e => setGenDate(e.target.value)} />
            </div>
            {genError && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{genError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setGenModal(false); setGenError(''); setGenDate(''); }} disabled={genLoading}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={genLoading}>
              {genLoading ? 'Generating...' : 'Generate Batch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
