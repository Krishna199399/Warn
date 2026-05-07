import React, { useEffect, useState } from 'react';
import { salaryApi } from '../../api/commissions.api';
import { formatCurrency } from '../../utils/helpers';
import { Trophy, Award, Gift, TrendingUp, Users, Calendar, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LEVEL_META = {
  NONE:  { icon: '—', color: 'text-muted-foreground', bg: 'bg-muted', badge: 'bg-muted text-muted-foreground' },
  STAR:  { icon: '⭐', color: 'text-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
  RUBY:  { icon: '💎', color: 'text-rose-600', bg: 'bg-rose-50', badge: 'bg-rose-100 text-rose-700' },
  PEARL: { icon: '🏆', color: 'text-indigo-600', bg: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-700' },
};

function UserAchievementCard({ achievement }) {
  const { user, salary, rewards } = achievement;
  const levelMeta = LEVEL_META[salary.currentLevel];
  
  const latestAchievement = salary.pearlAchievedAt || salary.rubyAchievedAt || salary.starAchievedAt;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${levelMeta.bg} flex items-center justify-center text-2xl`}>
              {levelMeta.icon}
            </div>
            <div>
              <p className="font-semibold text-base">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.advisorCode} · {user.role}</p>
              {latestAchievement && (
                <p className="text-xs text-primary mt-0.5">
                  <Calendar size={11} className="inline mr-1" />
                  {new Date(latestAchievement).toLocaleDateString('en-IN')}
                </p>
              )}
            </div>
          </div>
          <Badge className={levelMeta.badge}>{salary.currentLevel}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2.5 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total SV</p>
            <p className="text-sm font-bold">{formatCurrency(salary.currentSv)}</p>
          </div>
          <div className="text-center p-2.5 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total RV</p>
            <p className="text-sm font-bold">{formatCurrency(rewards.totalRvEarned)}</p>
          </div>
          <div className="text-center p-2.5 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Benefits</p>
            <p className="text-sm font-bold">{rewards.totalBenefitsEarned}/15</p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mt-3 space-y-1.5">
          {['STAR', 'RUBY', 'PEARL'].map(level => {
            const achieved = salary[`${level.toLowerCase()}AchievedAt`];
            const meta = LEVEL_META[level];
            return (
              <div key={level} className="flex items-center gap-2 text-xs">
                <span className={achieved ? meta.color : 'text-muted-foreground/40'}>{meta.icon}</span>
                <span className={achieved ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                  {level}
                </span>
                {achieved ? (
                  <span className="text-primary text-[10px] ml-auto">
                    ✓ {new Date(achieved).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50 text-[10px] ml-auto">Not achieved</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAchievementsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');

  useEffect(() => {
    salaryApi.getAdminAchievements()
      .then(res => setData(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const { achievements, summary } = data;

  // Filter achievements
  const filteredAchievements = achievements.filter(a => {
    const matchesSearch = !searchTerm || 
      a.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.user.advisorCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === 'ALL' || a.salary.currentLevel === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Achievements</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track salary levels and reward benefits earned by all users
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-blue-700">{summary.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⭐</span>
              <div>
                <p className="text-xs text-muted-foreground">STAR Level</p>
                <p className="text-2xl font-bold text-amber-700">{summary.byLevel.STAR}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💎</span>
              <div>
                <p className="text-xs text-muted-foreground">RUBY Level</p>
                <p className="text-2xl font-bold text-rose-700">{summary.byLevel.RUBY}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div>
                <p className="text-xs text-muted-foreground">PEARL Level</p>
                <p className="text-2xl font-bold text-indigo-700">{summary.byLevel.PEARL}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      {summary.recentAchievements.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Recent Achievements (Last 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.recentAchievements.map((a, i) => {
                const level = a.salary.pearlAchievedAt ? 'PEARL' : a.salary.rubyAchievedAt ? 'RUBY' : 'STAR';
                const date = a.salary.pearlAchievedAt || a.salary.rubyAchievedAt || a.salary.starAchievedAt;
                const meta = LEVEL_META[level];
                return (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-background rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{meta.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{a.user.name}</p>
                        <p className="text-xs text-muted-foreground">{a.user.advisorCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={meta.badge}>{level}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-40">
            <Filter size={14} className="mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Levels</SelectItem>
            <SelectItem value="NONE">Not Reached</SelectItem>
            <SelectItem value="STAR">⭐ STAR</SelectItem>
            <SelectItem value="RUBY">💎 RUBY</SelectItem>
            <SelectItem value="PEARL">🏆 PEARL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Achievement Cards */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Showing {filteredAchievements.length} of {achievements.length} users
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map(achievement => (
            <UserAchievementCard key={achievement.user.id} achievement={achievement} />
          ))}
        </div>
      </div>

      {filteredAchievements.length === 0 && (
        <Card>
          <CardContent className="text-center py-10">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-medium">No users found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
