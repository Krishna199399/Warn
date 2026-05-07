const SalaryPlan          = require('../models/SalaryPlan');
const UserSalaryStatus    = require('../models/UserSalaryStatus');
const UserRewardProgress  = require('../models/UserRewardProgress');

// ─────────────────────────────────────────────────────────────────────────────
// INCREMENTAL SALARY LEVEL SYSTEM
// Star  → count 0 → 7,50,000 SV (fresh counter)
// Ruby  → count 0 → 8,50,000 SV (fresh counter after Star)
// Pearl → count 0 → 10,00,000 SV (fresh counter after Ruby)
// ─────────────────────────────────────────────────────────────────────────────
async function checkAndUpgradeLevel(userId, role, totalSv) {
  try {
    const plans = await SalaryPlan.find({ role, isActive: true }).lean();
    if (!plans.length) return null;

    const starPlan  = plans.find(p => p.level === 'STAR');
    const rubyPlan  = plans.find(p => p.level === 'RUBY');
    const pearlPlan = plans.find(p => p.level === 'PEARL');
    if (!starPlan) return null;

    let status = await UserSalaryStatus.findOne({ userId });
    if (!status) status = new UserSalaryStatus({ userId, role, totalSvEarned: totalSv });
    else status.totalSvEarned = totalSv;

    const now       = new Date();
    const baselines = status.levelBaselines || {};

    // ── STAR ─────────────────────────────────────────────────────────────────
    const starUnlocked = totalSv >= starPlan.svTarget;
    if (starUnlocked && !status.starAchievedAt) {
      status.starAchievedAt = now;
      status.currentLevel   = 'STAR';
      // Baseline = STAR svTarget (NOT totalSv) so overflow carries into RUBY.
      // e.g. earn 7,89,000 vs 7,50,000 target → RUBY starts with 39,000 already counted.
      status.levelBaselines = { ...baselines, RUBY: starPlan.svTarget };
      const alreadyStar = status.rewardsUnlocked.some(r => r.level === 'STAR');
      if (!alreadyStar && starPlan.rewardBenefits?.length) {
        status.rewardsUnlocked.push({ level: 'STAR', unlockedAt: now, benefits: starPlan.rewardBenefits });
      }
      console.log(`⭐ ${userId} achieved STAR (totalSv: ${totalSv}, overflow to RUBY: ${totalSv - starPlan.svTarget})`);
    }

    // ── RUBY ─────────────────────────────────────────────────────────────────
    if (starUnlocked && rubyPlan) {
      if (!status.levelBaselines) status.levelBaselines = {};
      // Fallback: if baseline missing, set to STAR target to preserve overflow
      if (!status.levelBaselines.RUBY) {
        status.levelBaselines = { ...status.levelBaselines, RUBY: starPlan.svTarget };
      }
      const rubyBaseline = status.levelBaselines.RUBY || 0;
      const svForRuby    = Math.max(0, totalSv - rubyBaseline);
      const rubyUnlocked = svForRuby >= rubyPlan.svTarget;
      if (rubyUnlocked && !status.rubyAchievedAt) {
        status.rubyAchievedAt = now;
        status.currentLevel   = 'RUBY';
        // Baseline = rubyBaseline + RUBY svTarget (NOT totalSv) so overflow carries into PEARL.
        if (!status.levelBaselines.PEARL) {
          const pearlBaseline = rubyBaseline + rubyPlan.svTarget;
          status.levelBaselines = { ...status.levelBaselines, PEARL: pearlBaseline };
          console.log(`💎 ${userId} achieved RUBY (svForRuby: ${svForRuby}, overflow to PEARL: ${svForRuby - rubyPlan.svTarget})`);
        }
        const alreadyRuby = status.rewardsUnlocked.some(r => r.level === 'RUBY');
        if (!alreadyRuby && rubyPlan.rewardBenefits?.length) {
          status.rewardsUnlocked.push({ level: 'RUBY', unlockedAt: now, benefits: rubyPlan.rewardBenefits });
        }
      }

      // ── PEARL ───────────────────────────────────────────────────────────────
      if (rubyUnlocked && pearlPlan) {
        const pearlBaseline = status.levelBaselines?.PEARL || 0;
        const svForPearl    = Math.max(0, totalSv - pearlBaseline);
        const pearlUnlocked = svForPearl >= pearlPlan.svTarget;
        if (pearlUnlocked && !status.pearlAchievedAt) {
          status.pearlAchievedAt = now;
          status.currentLevel    = 'PEARL';
          const alreadyPearl = status.rewardsUnlocked.some(r => r.level === 'PEARL');
          if (!alreadyPearl && pearlPlan.rewardBenefits?.length) {
            status.rewardsUnlocked.push({ level: 'PEARL', unlockedAt: now, benefits: pearlPlan.rewardBenefits });
          }
          console.log(`🏆 ${userId} achieved PEARL`);
        }
      }
    }

    status.lastUpdated = new Date();

    await status.save();
    return status;
  } catch (err) {
    console.error('❌ checkAndUpgradeLevel:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SEQUENTIAL REWARD SYSTEM
// Each benefit has its own RV counter starting fresh from 0.
// Benefits are earned ONE BY ONE in order.
// Only activates after salary level is achieved.
// ─────────────────────────────────────────────────────────────────────────────
async function checkAndUpdateRewards(userId, role, totalRv) {
  try {
    const salaryStatus = await UserSalaryStatus.findOne({ userId }).lean();
    const plans        = await SalaryPlan.find({ role, isActive: true }).lean();
    if (!plans.length) return null;

    let progress = await UserRewardProgress.findOne({ userId });
    if (!progress) progress = new UserRewardProgress({ userId, role, levelProgress: [] });

    // ─────────────────────────────────────────────────────────────────────────
    // Reward tier access:
    //   STAR  rewards → Day 1 (open until STAR salary is earned, then LOCKED/COMPLETED)
    //   RUBY  rewards → when STAR salary level is achieved
    //   PEARL rewards → when RUBY salary level is achieved
    // ─────────────────────────────────────────────────────────────────────────
    const starSalaryDone = !!salaryStatus?.starAchievedAt;
    const rubySalaryDone = !!salaryStatus?.rubyAchievedAt;

    const rewardUnlocked = {
      STAR:  true,              // always accessible
      RUBY:  starSalaryDone,   // opens when STAR salary earned
      PEARL: rubySalaryDone,   // opens when RUBY salary earned
    };

    for (const plan of plans) {
      if (!rewardUnlocked[plan.level]) continue;

      // Find or create level progress entry
      let lvl = progress.levelProgress.find(l => l.salaryLevel === plan.level);
      if (!lvl) {
        // STAR always starts from RV=0. RUBY/PEARL start from current totalRv (fresh counter)
        const initialBaseline = plan.level === 'STAR' ? 0 : totalRv;
        progress.levelProgress.push({
          salaryLevel:       plan.level,
          isActive:          true,
          activatedAt:       new Date(),
          currentBenefitIdx: 0,
          rvBaseline:        initialBaseline,
          rvPointsBaseline:  initialBaseline,
          benefits: plan.rewardBenefits.map(b => ({
            name:           b.name,
            rvTarget:       b.rvAmount,
            rvPointsTarget: b.rvAmount,
            earned:         false,
            earnedAt:       null,
          })),
        });
        lvl = progress.levelProgress[progress.levelProgress.length - 1];
        console.log(`🎯 ${role} ${userId}: ${plan.level} rewards activated (baseline: ${initialBaseline})`);
      }

      if (!lvl.isActive) { lvl.isActive = true; lvl.activatedAt = lvl.activatedAt || new Date(); }

      // Fix for existing STAR entries whose baseline was wrongly set >0
      if (plan.level === 'STAR' && lvl.currentBenefitIdx === 0 && (lvl.rvBaseline || lvl.rvPointsBaseline) > 0) {
        lvl.rvBaseline = 0;
        lvl.rvPointsBaseline = 0;
      }

      // Walk through benefits sequentially
      while (lvl.currentBenefitIdx < lvl.benefits.length) {
        const benefit    = lvl.benefits[lvl.currentBenefitIdx];
        if (benefit.earned) { lvl.currentBenefitIdx++; continue; }

        const currentBaseline = lvl.rvBaseline || lvl.rvPointsBaseline || 0;
        const rvEarned        = totalRv - currentBaseline;
        const rvTarget        = benefit.rvTarget || benefit.rvPointsTarget || 0;

        if (rvEarned >= rvTarget) {
          // Benefit earned! Set next baseline = currentBaseline + target (carryover overflow)
          benefit.earned   = true;
          benefit.earnedAt = new Date();
          lvl.currentBenefitIdx++;
          const nextBaseline = currentBaseline + rvTarget; // NOT totalRv — preserves overflow
          lvl.rvBaseline       = nextBaseline;
          lvl.rvPointsBaseline = nextBaseline;
          console.log(`🎁 ${userId} earned [${plan.level}] ${benefit.name} (overflow: ${totalRv - nextBaseline} carries to next)`);
        } else {
          break;
        }
      }
    }

    progress.lastUpdated = new Date();
    await progress.save();
    return progress;
  } catch (err) {
    console.error('❌ checkAndUpdateRewards:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/salary/my-status
// ─────────────────────────────────────────────────────────────────────────────
const getMyStatus = async (req, res, next) => {
  try {
    const { role } = req.user;
    const Commission = require('../models/Commission');

    // Fresh SV total
    const svAgg = await Commission.aggregate([
      { $match: { userId: req.user._id, type: 'SV' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalSv = svAgg[0]?.total || 0;

    // Fresh RV total
    const rvAgg = await Commission.aggregate([
      { $match: { userId: req.user._id, type: 'RV' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRv = rvAgg[0]?.total || 0;

    await checkAndUpgradeLevel(req.user._id, role, totalSv);
    await checkAndUpdateRewards(req.user._id, role, totalRv);

    const status   = await UserSalaryStatus.findOne({ userId: req.user._id }).lean();
    const plans    = await SalaryPlan.find({ role, isActive: true }).sort({ svTarget: 1 }).lean();
    const rewardPg = await UserRewardProgress.findOne({ userId: req.user._id }).lean();

    const baselines   = status?.levelBaselines || {};
    const starAchieved  = !!status?.starAchievedAt;
    const rubyAchieved  = !!status?.rubyAchievedAt;
    const pearlAchieved = !!status?.pearlAchievedAt;
    const currentLevel  = status?.currentLevel || 'NONE';

    const levelsProgress = plans.map(plan => {
      let isUnlocked = false, svEarned = 0, svTarget = plan.svTarget;
      let progress = 0, svRemaining = plan.svTarget, prerequisiteAchieved = false;

      if (plan.level === 'STAR') {
        prerequisiteAchieved = true;
        // STAR counts from 0. Once STAR is done, the RUBY baseline records
        // how much total SV existed at that moment — so STAR's counter is
        // capped at min(totalSv, rubyBaseline) to show the correct fresh counter.
        const starSvEarned = starAchieved
          ? Math.min(totalSv, baselines.RUBY || totalSv)  // cap at the snapshot taken when STAR was achieved
          : totalSv;                                        // still in progress
        svEarned    = starSvEarned;
        isUnlocked  = starAchieved || totalSv >= svTarget;
        progress    = Math.min(100, Math.round((svEarned / svTarget) * 100));
        svRemaining = Math.max(0, svTarget - svEarned);
      } else if (plan.level === 'RUBY') {
        prerequisiteAchieved = starAchieved;
        if (starAchieved) {
          const base = baselines.RUBY || 0;
          svEarned    = Math.max(0, totalSv - base);
          isUnlocked  = svEarned >= svTarget;
          progress    = Math.min(100, Math.round((svEarned / svTarget) * 100));
          svRemaining = Math.max(0, svTarget - svEarned);
        }
      } else if (plan.level === 'PEARL') {
        prerequisiteAchieved = rubyAchieved;
        if (rubyAchieved) {
          const base = baselines.PEARL || 0;
          svEarned    = Math.max(0, totalSv - base);
          isUnlocked  = svEarned >= svTarget;
          progress    = Math.min(100, Math.round((svEarned / svTarget) * 100));
          svRemaining = Math.max(0, svTarget - svEarned);
        }
      }

      // Reward progress for this level
      const rvLvl = rewardPg?.levelProgress?.find(l => l.salaryLevel === plan.level);

      // isCurrent = this is the level the user is ACTIVELY working toward
      // = it's unlocked (completed) already, OR it's the next one to achieve
      // The ACTIVE badge should go to the next incomplete level (not the last achieved)
      const isActiveTarget = !isUnlocked && prerequisiteAchieved; // working toward this
      const isCompleted    = isUnlocked;                           // already done

      return {
        level: plan.level, svTarget, monthlySalaryPoints: plan.monthlySalaryAmount,
        rewardBenefits: plan.rewardBenefits,
        isUnlocked: isCompleted,
        isCurrent: isActiveTarget,   // ACTIVE badge = currently working toward this
        isNext: false,               // deprecated, replaced by isCurrent
        prerequisiteAchieved, svEarned, svRemaining, progress,
        rewardProgress: rvLvl || null,
      };
    });


    const nextPlan = levelsProgress.find(p => !p.isUnlocked && p.prerequisiteAchieved);

    res.json({
      success: true,
      data: {
        totalSvEarned: totalSv, totalRvEarned: totalRv, currentLevel,
        starAchievedAt:  status?.starAchievedAt  || null,
        rubyAchievedAt:  status?.rubyAchievedAt  || null,
        pearlAchievedAt: status?.pearlAchievedAt || null,
        levelsProgress, nextPlan: nextPlan || null,
        rewardsUnlocked: status?.rewardsUnlocked || [],
        salaryHistory:   status?.salaryHistory   || [],
      },
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/salary/my-rewards  — separate reward progress endpoint
// ─────────────────────────────────────────────────────────────────────────────
const getMyRewards = async (req, res, next) => {
  try {
    const { role } = req.user;
    const Commission = require('../models/Commission');

    const rvAgg = await Commission.aggregate([
      { $match: { userId: req.user._id, type: 'RV' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRv = rvAgg[0]?.total || 0;

    await checkAndUpdateRewards(req.user._id, role, totalRv);

    const salaryStatus = await UserSalaryStatus.findOne({ userId: req.user._id }).lean();
    const rewardPg     = await UserRewardProgress.findOne({ userId: req.user._id }).lean();
    const plans        = await SalaryPlan.find({ role, isActive: true }).sort({ svTarget: 1 }).lean();

    const salaryAchieved = {
      STAR:  !!salaryStatus?.starAchievedAt,
      RUBY:  !!salaryStatus?.rubyAchievedAt,
      PEARL: !!salaryStatus?.pearlAchievedAt,
    };

    // Reward unlock is ONE level ahead of salary level:
    //   STAR  rewards = Day 1 (always for approved users)
    //   RUBY  rewards = when STAR salary achieved
    //   PEARL rewards = when RUBY salary achieved
    const rewardUnlocked = {
      STAR:  true,
      RUBY:  salaryAchieved.STAR,
      PEARL: salaryAchieved.RUBY,
    };

    const rewardLevels = plans.map(plan => {
      const rvLvl          = rewardPg?.levelProgress?.find(l => l.salaryLevel === plan.level);
      const isRewardActive = rewardUnlocked[plan.level];

      // A tier is COMPLETED when the NEXT salary level is achieved:
      // STAR rewards lock once STAR salary is earned (RUBY opens)
      // RUBY rewards lock once RUBY salary is earned (PEARL opens)
      const isTierCompleted = plan.level === 'STAR'  ? salaryAchieved.STAR
                            : plan.level === 'RUBY'  ? salaryAchieved.RUBY
                            : plan.level === 'PEARL' ? salaryAchieved.PEARL
                            : false;

      const earnedCount = rvLvl?.benefits?.filter(b => b.earned).length || 0;
      const totalCount  = plan.rewardBenefits.length;

      // Active benefit progress (only if tier is open and not fully locked/completed)
      let activeBenefit = null;
      if (isRewardActive && !isTierCompleted && rvLvl && rvLvl.currentBenefitIdx < rvLvl.benefits.length) {
        const ab              = rvLvl.benefits[rvLvl.currentBenefitIdx];
        const currentBaseline = rvLvl.rvBaseline || rvLvl.rvPointsBaseline || 0;
        const rvNow           = Math.max(0, totalRv - currentBaseline);
        const target          = ab.rvPointsTarget || ab.rvTarget || 0;
        activeBenefit = {
          name:        ab.name,
          rvTarget:    target,
          rvEarned:    Math.min(rvNow, target),
          rvRemaining: Math.max(0, target - rvNow),
          progress:    target > 0 ? Math.min(100, Math.round((rvNow / target) * 100)) : 0,
        };
      }

      return {
        salaryLevel:    plan.level,
        salaryAchieved: salaryAchieved[plan.level],
        rewardActive:   isRewardActive,
        isCompleted:    isTierCompleted,
        salaryTarget:   plan.svTarget,
        benefits:       rvLvl?.benefits || plan.rewardBenefits.map(b => ({ name: b.name, rvPointsTarget: b.rvAmount, earned: false, earnedAt: null })),
        earnedCount,
        totalCount,
        allComplete:    earnedCount === totalCount,
        activeBenefit,
        isActive:       rvLvl?.isActive || false,
      };
    });


    const totalBenefitsEarned = rewardLevels.reduce((s, l) => s + l.earnedCount, 0);
    const totalBenefitsCount  = rewardLevels.reduce((s, l) => s + l.totalCount,  0);

    // Debug logging
    console.log('📊 Reward Summary for', req.user.email);
    console.log('   Total RV:', totalRv);
    console.log('   Benefits Earned:', totalBenefitsEarned, '/', totalBenefitsCount);
    rewardLevels.forEach(lvl => {
      console.log(`   ${lvl.salaryLevel}: ${lvl.earnedCount}/${lvl.totalCount} earned, active=${lvl.rewardActive}`);
      console.log(`   ${lvl.salaryLevel} benefits (${lvl.benefits.length}):`, lvl.benefits.map(b => b.name).join(', '));
      if (lvl.benefits.length !== 5) {
        console.log(`   ⚠️ WARNING: Expected 5 benefits but got ${lvl.benefits.length}`);
      }
    });

    res.json({
      success: true,
      data: {
        totalRvEarned: totalRv, totalBenefitsEarned, totalBenefitsCount,
        currentLevel:  salaryStatus?.currentLevel || 'NONE',
        rewardLevels,
      },
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// Admin endpoints
// ─────────────────────────────────────────────────────────────────────────────
const getAdminPlans = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Admin only' });
    const plans = await SalaryPlan.find({}).sort({ role: 1, svTarget: 1 }).lean();
    res.json({ success: true, data: plans });
  } catch (err) { next(err); }
};

const updateAdminPlan = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Admin only' });
    const { monthlySalaryAmount, svTarget, rewardBenefits, description } = req.body;
    const plan = await SalaryPlan.findByIdAndUpdate(req.params.id,
      { monthlySalaryAmount, svTarget, rewardBenefits, description },
      { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, data: plan });
  } catch (err) { next(err); }
};

const getAdminUserStatuses = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Admin only' });
    const statuses = await UserSalaryStatus.find({})
      .populate('userId', 'name role employeeCode email')
      .sort({ currentLevel: -1, totalSvEarned: -1 }).lean();
    res.json({ success: true, data: statuses });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/salary/admin/achievements - Comprehensive achievement tracking
// ─────────────────────────────────────────────────────────────────────────────
const getAdminAchievements = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Admin only' });
    
    const Commission = require('../models/Commission');
    
    // Get all users with salary status
    const statuses = await UserSalaryStatus.find({})
      .populate('userId', 'name role employeeCode email phone')
      .sort({ currentLevel: -1, totalSvEarned: -1 })
      .lean();
    
    // Get reward progress for all users
    const rewardProgress = await UserRewardProgress.find({}).lean();
    const rewardMap = {};
    rewardProgress.forEach(rp => {
      rewardMap[rp.userId.toString()] = rp;
    });
    
    // Build comprehensive achievement data
    const achievements = await Promise.all(statuses.map(async (status) => {
      const userId = status.userId._id;
      const rewards = rewardMap[userId.toString()];
      
      // Calculate current SV and RV
      const svAgg = await Commission.aggregate([
        { $match: { userId, type: 'SV' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const currentSv = svAgg[0]?.total || 0;
      
      const rvAgg = await Commission.aggregate([
        { $match: { userId, type: 'RV' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const currentRv = rvAgg[0]?.total || 0;
      
      // Count total benefits earned
      let totalBenefitsEarned = 0;
      if (rewards?.levelProgress) {
        rewards.levelProgress.forEach(lvl => {
          totalBenefitsEarned += lvl.benefits.filter(b => b.earned).length;
        });
      }
      
      return {
        user: {
          id: status.userId._id,
          name: status.userId.name,
          email: status.userId.email,
          phone: status.userId.phone,
          role: status.userId.role,
          employeeCode: status.userId.employeeCode,
        },
        salary: {
          currentLevel: status.currentLevel || 'NONE',
          totalSvEarned: status.totalSvEarned || 0,
          currentSv,
          starAchievedAt: status.starAchievedAt,
          rubyAchievedAt: status.rubyAchievedAt,
          pearlAchievedAt: status.pearlAchievedAt,
        },
        rewards: {
          totalRvEarned: currentRv,
          totalBenefitsEarned,
          levelProgress: rewards?.levelProgress || [],
        },
        lastUpdated: status.lastUpdated,
      };
    }));
    
    // Summary statistics
    const summary = {
      totalUsers: achievements.length,
      byLevel: {
        NONE: achievements.filter(a => a.salary.currentLevel === 'NONE').length,
        STAR: achievements.filter(a => a.salary.currentLevel === 'STAR').length,
        RUBY: achievements.filter(a => a.salary.currentLevel === 'RUBY').length,
        PEARL: achievements.filter(a => a.salary.currentLevel === 'PEARL').length,
      },
      recentAchievements: achievements
        .filter(a => a.salary.starAchievedAt || a.salary.rubyAchievedAt || a.salary.pearlAchievedAt)
        .sort((a, b) => {
          const aDate = a.salary.pearlAchievedAt || a.salary.rubyAchievedAt || a.salary.starAchievedAt;
          const bDate = b.salary.pearlAchievedAt || b.salary.rubyAchievedAt || b.salary.starAchievedAt;
          return new Date(bDate) - new Date(aDate);
        })
        .slice(0, 10),
    };
    
    res.json({ success: true, data: { achievements, summary } });
  } catch (err) { next(err); }
};

module.exports = {
  getMyStatus, getMyRewards,
  getAdminPlans, updateAdminPlan, getAdminUserStatuses, getAdminAchievements,
  checkAndUpgradeLevel, checkAndUpdateRewards,
};
