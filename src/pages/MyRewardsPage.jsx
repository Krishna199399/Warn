import React, { useEffect, useState } from 'react';
import { salaryApi, commissionsApi } from '../api/commissions.api';
import { benefitClaimsApi } from '../api/benefitClaims.api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatPoints } from '../utils/helpers';
import { exportCSV } from '../utils/exportCSV';
import { Gift, Lock, CheckCircle2, ChevronRight, Download, HandCoins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const LEVEL_META = {
  STAR:  { icon: '⭐', bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-700',  bar: '#f59e0b', badge: 'bg-amber-100 text-amber-700'  },
  RUBY:  { icon: '💎', bg: 'bg-rose-50',   border: 'border-rose-300',   text: 'text-rose-700',   bar: '#f43f5e', badge: 'bg-rose-100 text-rose-700'    },
  PEARL: { icon: '🏆', bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', bar: '#6366f1', badge: 'bg-indigo-100 text-indigo-700' },
};
const BENEFIT_ICONS = {
  'Car Fund':'🚗','Car EMI':'🚗','Kiran Fund':'🌾','Kirana Fund':'🛒','SIP':'📈',
  'Home Rent':'🏠','Plot Fund':'🏡','Land Fund':'🌍','Home Fund':'🏠','Home Buying Fund':'🏠',
  'Insurance':'🛡️','Hospital Fund':'🏥','Gold Fund':'🪙','Trip Fund':'✈️',
  'Bike Fund':'🏍️','Plot EMI':'🏡','Land EMI':'🌍','Land Purchase Reserve':'🌍',
};

function BenefitRow({ benefit, isActive, activeBenefit, isLocked, isTierCompleted, levelMeta, salaryLevel, onClaim, claims }) {
  const icon = BENEFIT_ICONS[benefit.name] || '💰';
  const rvTarget = benefit.rvPointsTarget || benefit.rvTarget || 0;
  
  const claim = claims?.find(c =>
    c.salaryLevel === salaryLevel &&
    c.benefitName === benefit.name
  );
  
  if (benefit.earned) return (
    <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-primary">{benefit.name}</p>
        <p className="text-xs text-muted-foreground">
          Earned {benefit.earnedAt ? new Date(benefit.earnedAt).toLocaleDateString('en-IN') : ''} · {formatPoints(rvTarget)} RV target
        </p>
        {claim && (
          <p className="text-xs mt-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
              claim.claimStatus === 'PENDING'  ? 'bg-amber-100 text-amber-700' :
              claim.claimStatus === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
              claim.claimStatus === 'PAID'     ? 'bg-emerald-100 text-emerald-700' :
              'bg-red-100 text-red-700'
            }`}>
              {claim.claimStatus === 'PENDING'  && '⏳ Claim Pending'}
              {claim.claimStatus === 'APPROVED' && '✓ Approved - Payment Processing'}
              {claim.claimStatus === 'PAID'     && '✓ Paid'}
              {claim.claimStatus === 'REJECTED' && '✗ Claim Rejected'}
            </span>
          </p>
        )}
      </div>
      {!claim && (
        <button
          onClick={() => onClaim(salaryLevel, benefit.name)}
          className="shrink-0 h-8 px-3 text-xs rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-1 hover:bg-primary/90"
        >
          <HandCoins size={14} /> Claim
        </button>
      )}
      {claim && claim.claimStatus !== 'PAID' && <CheckCircle2 size={18} className="text-primary shrink-0" />}
      {claim && claim.claimStatus === 'PAID'  && <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />}
    </div>
  );

  if (isActive && activeBenefit) return (
    <div className={`p-3.5 rounded-xl border-2 ${levelMeta.border} ${levelMeta.bg}`}>
      <div className="flex items-center gap-3 mb-2.5">
        <span className="text-xl">{icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold">{benefit.name}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${levelMeta.badge}`}>ACTIVE</span>
          </div>
          <p className="text-xs text-muted-foreground">{formatPoints(activeBenefit.rvEarned)} of {formatPoints(rvTarget)} RV</p>
        </div>
        <p className={`text-sm font-bold ${levelMeta.text}`}>{formatPoints(activeBenefit.rvRemaining)} left</p>
      </div>
      <Progress value={activeBenefit.progress} className="h-2.5" />
      <div className="flex justify-center text-xs text-muted-foreground mt-1">
        <span>{activeBenefit.progress}% complete</span>
      </div>
    </div>
  );

  // Tier completed but benefit not earned → show as "missed / tier moved on"
  if (isTierCompleted) return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-xl opacity-60">
      <span className="text-xl grayscale">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{benefit.name}</p>
        <p className="text-xs text-muted-foreground">{formatPoints(rvTarget)} RV — tier complete</p>
      </div>
      <CheckCircle2 size={16} className="text-muted-foreground/40 shrink-0" />
    </div>
  );

  return (
    <div className="flex items-center gap-3 p-3 bg-muted border border-border rounded-xl opacity-50">
      <span className="text-xl grayscale">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{benefit.name}</p>
        <p className="text-xs text-muted-foreground">{isLocked ? 'Reward tier not yet open' : `${formatPoints(rvTarget)} RV needed`}</p>
      </div>
      <Lock size={14} className="text-muted-foreground/50 shrink-0" />
    </div>
  );
}

function RewardLevelCard({ level, claims, onClaim }) {
  const meta = LEVEL_META[level.salaryLevel];
  const totalBenefitValue = level.benefits.reduce((s, b) => s + (b.rvPointsTarget || b.rvTarget || 0), 0);
  const prereq = level.salaryLevel === 'RUBY' ? 'STAR Salary' : level.salaryLevel === 'PEARL' ? 'RUBY Salary' : null;

  // Visual states:
  // isCompleted = STAR salary earned → STAR tier shows COMPLETED (locked from further earning)
  // rewardActive && !isCompleted = currently earning benefits here (ACTIVE)
  // !rewardActive = not yet unlocked (LOCKED)
  const isActive    = level.rewardActive && !level.isCompleted;
  const isCompleted = level.isCompleted;
  const isLocked    = !level.rewardActive;

  const cardStyle = isLocked
    ? 'bg-muted border-border opacity-70'
    : isCompleted
      ? `${meta.bg} ${meta.border} opacity-80`
      : `${meta.bg} ${meta.border} shadow-md`;

  return (
    <div className={`rounded-2xl border-2 p-5 ${cardStyle}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`text-3xl ${isLocked ? 'grayscale opacity-40' : ''}`}>{meta.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <p className={`text-base font-bold ${isLocked ? 'text-muted-foreground' : meta.text}`}>{level.salaryLevel} Level Rewards</p>
              {isActive && (
                <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
              )}
              {isCompleted && (
                <span className="text-[10px] bg-muted-foreground text-background px-2 py-0.5 rounded-full font-bold">COMPLETED</span>
              )}
              {isLocked && (
                <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">🔒 Locked</span>
              )}
            </div>
            {isActive && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {level.salaryLevel === 'STAR' && <span className="text-amber-600 font-medium">🚀 Active from Day 1 · </span>}
                {level.earnedCount}/{level.totalCount} benefits earned {level.allComplete && '✅'}
              </p>
            )}
            {isCompleted && (
              <p className="text-xs text-muted-foreground mt-0.5">
                ✅ {level.earnedCount}/{level.totalCount} benefits earned · Tier complete — next tier now active
              </p>
            )}
            {isLocked && (
              <p className="text-xs text-muted-foreground mt-0.5">🔒 Reach <strong>{prereq}</strong> to unlock</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total Value</p>
          <p className={`text-lg font-bold ${isLocked ? 'text-muted-foreground/40' : meta.text}`}>{formatPoints(totalBenefitValue || 0)}</p>
        </div>
      </div>
      {(isActive || isCompleted) && (
        <div className="mb-4">
          <Progress value={Math.round((level.earnedCount / Math.max(level.totalCount, 1)) * 100)} className="h-1.5" />
        </div>
      )}
      <div className="space-y-2">
        {level.benefits.map((benefit, idx) => {
          const isFirstUnearned = isActive && !benefit.earned &&
                                  level.benefits.slice(0, idx).every(b => b.earned);
          const isThisActive = isActive && !benefit.earned &&
                               (level.activeBenefit?.name === benefit.name || (!level.activeBenefit && isFirstUnearned));

          let activeBenefitData = isThisActive ? level.activeBenefit : null;
          if (isThisActive && !level.activeBenefit && isFirstUnearned) {
            const rvTarget = benefit.rvPointsTarget || benefit.rvTarget || 0;
            activeBenefitData = { name: benefit.name, rvTarget, rvEarned: 0, rvRemaining: rvTarget, progress: 0 };
          }

          return (
            <BenefitRow
              key={idx}
              benefit={benefit}
              isActive={isThisActive}
              activeBenefit={activeBenefitData}
              isLocked={isLocked}
              isTierCompleted={isCompleted}
              levelMeta={meta}
              salaryLevel={level.salaryLevel}
              claims={claims}
              onClaim={onClaim}
            />
          );
        })}
      </div>
    </div>
  );
}


export default function MyRewardsPage() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [rvLog,   setRvLog]   = useState([]);
  const [claims,  setClaims]  = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const ctrl = new AbortController();
    try {
      const [r, c, cl] = await Promise.all([
        salaryApi.getMyRewards(),
        commissionsApi.getMy({ signal: ctrl.signal }),
        benefitClaimsApi.getMyClaims(),
      ]);
      setData(r.data.data);
      setRvLog((c.data.data || []).filter(i => i.type === 'RV'));
      setClaims(cl.data.data || []);
    } catch (e) { 
      // Ignore abort errors (intentional cleanup)
      if (e?.name !== 'AbortError' && e?.name !== 'CanceledError') {
        console.error(e); 
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleClaim = async (salaryLevel, benefitName) => {
    try {
      await benefitClaimsApi.create({ salaryLevel, benefitName });
      toast.success('Benefit claim submitted successfully! Admin will review and process your payment.');
      // Reload claims to show the new one
      const cl = await benefitClaimsApi.getMyClaims();
      setClaims(cl.data.data || []);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit claim';
      toast.error(errorMsg);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid sm:grid-cols-3 gap-4">{[1,2,3].map(i=><Skeleton key={i} className="h-24 rounded-xl"/>)}</div>
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  );

  const totalRvEarned       = data?.totalRvEarned       || 0;
  const totalBenefitsEarned = data?.totalBenefitsEarned || 0;
  const totalBenefitsCount  = data?.totalBenefitsCount  || 0;
  const currentLevel        = data?.currentLevel        || 'NONE';
  const currentMeta         = LEVEL_META[currentLevel];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Rewards</h1>
          <p className="text-muted-foreground text-sm mt-1">Complete each benefit's RV target to earn company rewards</p>
        </div>
        {rvLog.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => exportCSV(rvLog.map(c => ({ Points: c.points, Role: c.role, Date: c.date?.slice(0,10) })), 'my-rv')}>
            <Download size={13} className="mr-1.5" /> Export
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-xl">💰</div>
            <div><p className="text-xs text-muted-foreground">RV Earned (All Time)</p><p className="text-xl font-bold text-amber-700">{formatPoints(totalRvEarned)}</p></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center"><Gift size={20} className="text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Benefits Earned</p>
              <p className="text-xl font-bold">{totalBenefitsEarned}<span className="text-sm text-muted-foreground font-normal"> / {totalBenefitsCount}</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-2 ${currentMeta ? `${currentMeta.bg} ${currentMeta.border}` : 'bg-muted border-border'}`}>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="text-3xl">{currentMeta?.icon || '—'}</span>
            <div>
              <p className="text-xs text-muted-foreground">Salary Level</p>
              <p className={`text-xl font-bold ${currentMeta?.text || 'text-muted-foreground'}`}>{currentLevel === 'NONE' ? 'Not Reached' : currentLevel}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5"><ChevronRight size={16} className="text-blue-600" /></div>
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">How Rewards Work</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              ⭐ <strong>STAR rewards</strong> open from Day 1 — earn each benefit by accumulating RV from 0. Each benefit's counter resets after it's earned (overflow carries to the next benefit).
            </p>
            <p className="text-xs text-blue-600 mt-1">
              When you reach <strong>STAR Salary</strong>, STAR rewards lock ✅ and 💎 <strong>RUBY rewards open</strong>. When you reach <strong>RUBY Salary</strong>, RUBY rewards lock ✅ and 🏆 <strong>PEARL rewards open</strong>.
            </p>
          </div>
        </CardContent>
      </Card>


      {/* Level Cards */}
      {data?.rewardLevels?.length > 0 ? (
        <div className="space-y-4">
          {data.rewardLevels.map(level => (
            <RewardLevelCard 
              key={level.salaryLevel} 
              level={level} 
              claims={claims}
              onClaim={handleClaim}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-10">
            <div className="text-4xl mb-3">🎁</div>
            <p className="text-sm font-medium">Your STAR rewards are active from Day 1!</p>
            <p className="text-xs text-muted-foreground mt-1">Start earning RV from sales to unlock your first benefit</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
