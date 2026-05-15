import React, { useEffect, useState } from 'react';
import { salaryApi, commissionsApi } from '../api/commissions.api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatPoints } from '../utils/helpers';
import { exportCSV } from '../utils/exportCSV';
import { Download, Lock, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

const LEVEL_COLORS = {
  STAR:  { bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-700',  icon: '⭐', bar: '#f59e0b' },
  RUBY:  { bg: 'bg-rose-50',   border: 'border-rose-300',   text: 'text-rose-700',   icon: '💎', bar: '#f43f5e' },
  PEARL: { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', icon: '🏆', bar: '#6366f1' },
  NONE:  { bg: 'bg-muted',     border: 'border-border',     text: 'text-muted-foreground', icon: '—', bar: '#94a3b8' },
};
const LEVEL_PREREQ_NAME = { STAR: null, RUBY: 'STAR', PEARL: 'RUBY' };

function LevelCard({ plan }) {
  const c = LEVEL_COLORS[plan.level] || LEVEL_COLORS.NONE;
  const { isUnlocked, isCurrent, prerequisiteAchieved, svEarned, svRemaining, progress, svTarget, monthlySalaryPoints } = plan;
  // isCurrent = ACTIVE (working toward this level)
  // isUnlocked = COMPLETED
  // isLocked = prerequisite not yet met
  const isLocked = !prerequisiteAchieved && !isUnlocked;
  const prereqName = LEVEL_PREREQ_NAME[plan.level];

  return (
    <div className={`rounded-2xl border-2 p-5 transition-all ${isLocked ? 'bg-muted border-border opacity-60 select-none' : isUnlocked ? `${c.bg} ${c.border} shadow-md` : `${c.bg} ${c.border}`} ${isCurrent ? 'ring-2 ring-offset-2 ring-primary' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-2xl ${isLocked ? 'grayscale opacity-40' : ''}`}>{c.icon}</span>
          <div>
            <p className={`text-sm font-bold ${isLocked ? 'text-muted-foreground' : c.text}`}>{plan.level} Level</p>
            {isCurrent  && <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">ACTIVE</span>}
            {isUnlocked && <span className="text-[10px] bg-muted-foreground text-background px-2 py-0.5 rounded-full font-bold">COMPLETED</span>}
            {isLocked   && <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">🔒 Locked</span>}
          </div>
        </div>
        {isUnlocked ? <CheckCircle2 size={20} className="text-primary" /> : <Lock size={16} className={isLocked ? 'text-muted-foreground/40' : 'text-muted-foreground'} />}
      </div>

      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">
        {isLocked && prereqName ? `Unlocks after ${prereqName} level` : 'SV Target (fresh counter)'}
      </p>
      <p className={`text-xl font-bold mb-2 ${isLocked ? 'text-muted-foreground/40' : c.text}`}>{formatPoints(svTarget || 0)}</p>

      {isLocked ? (
        <Progress value={0} className="h-2" />
      ) : (
        <>
          <Progress value={progress} className="h-2.5 mb-1.5" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{isUnlocked ? '✅ Achieved!' : `${formatPoints(svEarned)} earned`}</span>
            <span>{progress}%</span>
          </div>
          {!isUnlocked && <p className="text-xs text-muted-foreground mt-0.5">{formatPoints(svRemaining)} more needed</p>}
        </>
      )}

      {(monthlySalaryPoints || 0) > 0 && (
        <div className={`mt-3 p-2.5 rounded-xl border ${isUnlocked ? 'bg-background/70 border-border/50' : 'bg-muted/50 border-border/30'}`}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Monthly Salary</p>
          <p className={`text-base font-bold ${isUnlocked ? c.text : 'text-muted-foreground/40'}`}>{formatCurrency(monthlySalaryPoints || 0)}</p>
        </div>
      )}
    </div>
  );
}

export default function MySalaryPage() {
  const { user } = useAuth();
  const [status,      setStatus]      = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [timeRange,   setTimeRange]   = useState('day'); // 'day', 'week', 'month'

  useEffect(() => {
    const ctrl = new AbortController();
    Promise.all([
      salaryApi.getMyStatus(),
      commissionsApi.getMy({ signal: ctrl.signal }),
    ]).then(([s, c]) => {
      console.log('📊 Salary Status Response:', s.data.data);
      console.log('📊 Levels Progress:', s.data.data?.levelsProgress);
      setStatus(s.data.data);
      setCommissions((c.data.data || []).filter(i => i.type === 'SV'));
    }).catch(e => { if (e?.name !== 'AbortError') console.error(e); }).finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [user]);
  
  const monthlyBreakdown = React.useMemo(() => {
    if (timeRange === 'day') {
      // Real daily data from SV commissions
      const dailyMap = {};
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      commissions.forEach(c => {
        const date = new Date(c.date);
        if (date >= thirtyDaysAgo) {
          const day = c.date?.slice(0, 10); // YYYY-MM-DD
          if (day) {
            dailyMap[day] = (dailyMap[day] || 0) + (c.amount || c.points || 0);
          }
        }
      });
      
      // Fill in missing days with 0
      const dailyData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().slice(0, 10);
        const dayNum = date.getDate();
        dailyData.push({
          month: `Day ${dayNum}`,
          points: dailyMap[dateStr] || 0,
          fullDate: dateStr,
        });
      }
      return dailyData;
    }
    
    if (timeRange === 'week') {
      // Real weekly data from SV commissions
      const weeklyMap = {};
      const now = new Date();
      const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
      
      commissions.forEach(c => {
        const date = new Date(c.date);
        if (date >= twelveWeeksAgo) {
          // Get week number
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
          const weekKey = weekStart.toISOString().slice(0, 10);
          weeklyMap[weekKey] = (weeklyMap[weekKey] || 0) + (c.amount || c.points || 0);
        }
      });
      
      // Convert to array and sort
      const weeklyData = Object.entries(weeklyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, points], idx) => ({
          month: `W${idx + 1}`,
          points,
          fullDate: week,
        }));
      
      return weeklyData.slice(-12); // Last 12 weeks
    }
    
    // Monthly data (default)
    const map = {};
    commissions.forEach(c => {
      const month = c.date?.slice(0, 7); // YYYY-MM
      if (!month) return;
      map[month] = (map[month] || 0) + (c.amount || c.points || 0);
    });
    
    const monthlyData = Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, points]) => ({ 
        month: month.slice(5) + '/' + month.slice(2, 4), // MM/YY
        points, 
        fullDate: month 
      }));
    
    return monthlyData;
  }, [commissions, timeRange]);

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="grid md:grid-cols-3 gap-4">{[1,2,3].map(i=><Skeleton key={i} className="h-48 rounded-2xl"/>)}</div>
    </div>
  );

  const currentLevel = status?.currentLevel || 'NONE';
  const totalSv      = status?.totalSvEarned || 0;
  // Find the highest completed level plan to show its salary
  const LEVEL_ORDER   = ['STAR', 'RUBY', 'PEARL'];
  const completedPlans = status?.levelsProgress?.filter(p => p.isUnlocked) || [];
  const highestCompletedPlan = completedPlans.sort((a, b) => LEVEL_ORDER.indexOf(b.level) - LEVEL_ORDER.indexOf(a.level))[0] || null;
  // The plan user is actively working toward
  const activePlan   = status?.levelsProgress?.find(p => p.isCurrent);
  const nextPlan     = status?.nextPlan;
  const c = LEVEL_COLORS[currentLevel] || LEVEL_COLORS.NONE;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Salary</h1>
          <p className="text-muted-foreground text-sm mt-1">Salary targets, levels and monthly earnings</p>
        </div>
        {commissions.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => exportCSV(commissions.map(c => ({ Type: c.type, Level: c.level, Amount: c.amount || c.points || 0, Role: c.role, Date: c.date?.slice(0,10) })), 'my-salary')}>
            <Download size={13} className="mr-1.5" /> Export
          </Button>
        )}
      </div>

      {/* Current level banner */}
      <Card className={`border-2 ${c.border} ${c.bg}`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{c.icon}</span>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Your Current Level</p>
                <p className={`text-2xl font-bold ${c.text}`}>{currentLevel === 'NONE' ? 'Not Achieved Yet' : `${currentLevel} Level`}</p>
                {(highestCompletedPlan?.monthlySalaryPoints || 0) > 0 && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Monthly Salary: <strong className="text-primary">{formatCurrency(highestCompletedPlan.monthlySalaryPoints)}</strong>
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              {activePlan ? (
                <>
                  <p className="text-xs text-muted-foreground">SV Earned for {activePlan.level}</p>
                  <p className="text-xl font-bold text-purple-700">{formatPoints(activePlan.svEarned || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatPoints(activePlan.svRemaining)} more → {activePlan.level} Level</p>
                </>
              ) : nextPlan ? (
                <>
                  <p className="text-xs text-muted-foreground">SV Earned for {nextPlan.level}</p>
                  <p className="text-xl font-bold text-purple-700">{formatPoints(nextPlan.svEarned || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatPoints(nextPlan.svRemaining)} more → {nextPlan.level} Level</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Total SV Earned</p>
                  <p className="text-xl font-bold text-purple-700">{formatPoints(totalSv)}</p>
                  {currentLevel === 'PEARL' && <p className="text-xs text-primary mt-1 font-semibold">🏆 All levels complete!</p>}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Level Roadmap */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Level Roadmap</p>
        {status?.levelsProgress?.length > 0 ? (
          <>
            <div className="grid md:grid-cols-3 gap-4">
              {status.levelsProgress.map(plan => <LevelCard key={plan.level} plan={plan} />)}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              {status.levelsProgress.map((p, i) => (
                <span key={p.level}>
                  {LEVEL_COLORS[p.level]?.icon} 0 → {formatPoints(p.svTarget)} SV → <strong>{p.level}</strong>
                  {i < status.levelsProgress.length - 1 && <span className="mx-1 text-muted-foreground/60">→ Reset →</span>}
                </span>
              ))}
            </p>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Loading salary levels...</p>
              <p className="text-xs text-muted-foreground mt-2">
                If this persists, please ensure salary plans are configured in the backend.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Monthly chart */}
      {monthlyBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">
              {timeRange === 'day' ? 'Daily' : timeRange === 'week' ? 'Weekly' : 'Monthly'} SV Earnings
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={timeRange === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('day')}
              >
                Day
              </Button>
              <Button
                variant={timeRange === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('week')}
              >
                Week
              </Button>
              <Button
                variant={timeRange === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('month')}
              >
                Month
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k pts`} />
                <Tooltip 
                  formatter={v => formatPoints(v)} 
                  contentStyle={{ 
                    borderRadius:'0.75rem', 
                    border:'1px solid #e5e7eb',
                    backgroundColor: 'white'
                  }} 
                />
                <Bar dataKey="points" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
