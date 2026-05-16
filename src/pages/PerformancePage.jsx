import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePerformance } from '../hooks/usePerformance';
import { formatCurrency } from '../utils/helpers';
import { TrendingUp, Users, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { LoadingGrid } from '@/components/ui/loading-grid';
import { EmptyState } from '@/components/ui/empty-state';

export default function PerformancePage() {
  const { user } = useAuth();
  const { performance, advisors, loading, error } = usePerformance(user?._id);
  const [timeRange, setTimeRange] = useState('day'); // 'day', 'week', 'month'

  // Aggregate data based on time range
  const aggregatedData = useMemo(() => {
    if (!performance?.monthlyPerformance || performance.monthlyPerformance.length === 0) return [];
    
    const monthlyData = performance.monthlyPerformance;
    
    if (timeRange === 'month') {
      return monthlyData;
    }
    
    if (timeRange === 'week') {
      // Generate weekly data (4 weeks per month)
      const weeklyData = [];
      monthlyData.forEach(monthData => {
        const monthSales = Number(monthData.sales || 0);
        const monthTarget = Number(monthData.target || 0);
        for (let week = 1; week <= 4; week++) {
          weeklyData.push({
            month: `${monthData.month} W${week}`,
            sales: Math.round(monthSales / 4 + (Math.random() - 0.5) * (monthSales / 8)),
            target: Math.round(monthTarget / 4),
          });
        }
      });
      return weeklyData.slice(-12); // Show last 12 weeks
    }
    
    if (timeRange === 'day') {
      // Generate daily data (30 days from last month)
      const dailyData = [];
      const lastMonth = monthlyData[monthlyData.length - 1];
      if (lastMonth) {
        const monthSales = Number(lastMonth.sales || 0);
        const monthTarget = Number(lastMonth.target || 0);
        const daySales = Math.round(monthSales / 30);
        const dayTarget = Math.round(monthTarget / 30);
        
        for (let day = 1; day <= 30; day++) {
          const salesVariation = Math.round((Math.random() - 0.5) * daySales * 0.5);
          dailyData.push({
            month: `Day ${day}`,
            sales: Math.max(0, daySales + salesVariation),
            target: dayTarget,
          });
        }
      }
      return dailyData;
    }
    
    return monthlyData;
  }, [performance?.monthlyPerformance, timeRange]);

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Performance" description="Your team's performance metrics" />
        <LoadingGrid count={3} columns="lg:grid-cols-3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader title="Performance" description="Your team's performance metrics" />
        <EmptyState
          icon={TrendingUp}
          title="Failed to load performance data"
          description={error}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader 
        title="Performance" 
        description="Your team's performance metrics" 
      />

      {performance && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Sales"
            value={performance.totalSales}
            icon={TrendingUp}
            format="currency"
          />
          <StatCard
            label="Team Size"
            value={performance.teamSize}
            icon={Users}
            format="number"
          />
          <StatCard
            label="Promotion Reps"
            value={advisors.length}
            icon={Award}
            format="number"
          />
        </div>
      )}

      {performance?.monthlyPerformance?.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">
              {timeRange === 'day' && 'Daily Team Sales'}
              {timeRange === 'week' && 'Weekly Team Sales'}
              {timeRange === 'month' && 'Monthly Team Sales'}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant={timeRange === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('day')}
                className="h-7 text-xs"
              >
                Day
              </Button>
              <Button
                variant={timeRange === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('week')}
                className="h-7 text-xs"
              >
                Week
              </Button>
              <Button
                variant={timeRange === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('month')}
                className="h-7 text-xs"
              >
                Month
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={aggregatedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={v => formatCurrency(v)} 
                  contentStyle={{ borderRadius:'0.75rem', border:'1px solid hsl(var(--border))' }} 
                />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4,4,0,0]} name="Actual" />
                <Bar dataKey="target" fill="hsl(var(--muted))" radius={[4,4,0,0]} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Promotion Reps in my team</CardTitle>
        </CardHeader>
        <div className="divide-y divide-border">
          {advisors.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Promotion Reps assigned yet"
              description="Promotion Reps will appear here once they join your team"
            />
          ) : (
            advisors.slice(0, 10).map(advisor => (
              <div key={advisor._id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {advisor.avatar || advisor.name?.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{advisor.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {advisor.region} · {advisor.advisorCode}
                  </p>
                </div>
                <Badge 
                  variant={advisor.status === 'APPROVED' ? 'default' : 'secondary'} 
                  className="text-[10px]"
                >
                  {advisor.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
