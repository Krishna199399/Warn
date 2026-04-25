const User             = require('../models/User');
const Order            = require('../models/Order');
const Commission       = require('../models/Commission');
const PromotionRequest = require('../models/PromotionRequest');
const { buildHierarchySnapshot, calculateCommissions, getPerformanceStats } = require('./hierarchy.service');
const { 
  notifyPromotionRequest, 
  notifyPromotionParentApproved, 
  notifyPromotionRejected, 
  notifyPromotionApproved 
} = require('./notification.service');

const PROMOTION_CHAIN = ['ADVISOR','DO_MANAGER','AREA_MANAGER','ZONAL_MANAGER','STATE_HEAD'];

const PROMOTION_RULES = {
  ADVISOR:       { sales: 50000,   teamSize: 5   },
  DO_MANAGER:    { sales: 200000,  teamSize: 20  },
  AREA_MANAGER:  { sales: 500000,  teamSize: 50  },
  ZONAL_MANAGER: { sales: 1000000, teamSize: 100 },
};

const getNextRole = (role) => {
  const idx = PROMOTION_CHAIN.indexOf(role);
  if (idx === -1 || idx === PROMOTION_CHAIN.length - 1) return null;
  return PROMOTION_CHAIN[idx + 1];
};

/**
 * checkEligibility(userId, userRole)
 * Returns { eligible, stats, rule }
 */
const checkEligibility = async (userId, userRole) => {
  const rule = PROMOTION_RULES[userRole];
  if (!rule) return { eligible: false, stats: null, rule: null };

  const stats = await getPerformanceStats(userId);
  const eligible = stats.totalSales >= rule.sales && stats.teamSize >= rule.teamSize;
  return { eligible, stats, rule };
};

/**
 * requestPromotion(userId)
 * Step 1: Employee requests promotion (eligibility checked server-side)
 */
const requestPromotion = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const nextRole = getNextRole(user.role);
  if (!nextRole) throw new Error('Already at highest rank');

  // Check for existing active request
  const existing = await PromotionRequest.findOne({
    userId,
    status: { $in: ['REQUESTED','PARENT_APPROVED'] },
  });
  if (existing) throw new Error('You already have a pending promotion request');

  const { eligible, stats } = await checkEligibility(userId, user.role);
  if (!eligible) throw new Error('Eligibility criteria not met');

  const request = await PromotionRequest.create({
    userId,
    userRole: user.role,
    nextRole,
    parentId: user.parentId,
    status: 'REQUESTED',
    performanceSnapshot: {
      totalSales:      stats.totalSales,
      teamSize:        stats.teamSize,
      targetsAchieved: 0,
    },
  });

  // Notify user and parent
  await notifyPromotionRequest(request, user);

  return request;
};

/**
 * approveByParent(requestId, managerId, note)
 * Step 3: Direct manager approves
 */
const approveByParent = async (requestId, managerId, note = '') => {
  const req = await PromotionRequest.findById(requestId);
  if (!req) throw new Error('Request not found');
  if (req.status !== 'REQUESTED') throw new Error('Request is not awaiting parent approval');
  if (req.parentId?.toString() !== managerId.toString()) throw new Error('You are not the direct manager for this request');

  req.status     = 'PARENT_APPROVED';
  req.parentNote = note;
  await req.save();
  
  // Notify user and admins
  const user = await User.findById(req.userId);
  await notifyPromotionParentApproved(req, user);
  
  return req;
};

/**
 * rejectByParent(requestId, managerId, reason)
 */
const rejectByParent = async (requestId, managerId, reason = '') => {
  const req = await PromotionRequest.findById(requestId);
  if (!req) throw new Error('Request not found');
  if (req.parentId?.toString() !== managerId.toString()) throw new Error('Not authorized');

  req.status          = 'REJECTED';
  req.rejectedBy      = 'PARENT';
  req.rejectionReason = reason;
  await req.save();
  
  // Notify user
  const user = await User.findById(req.userId);
  await notifyPromotionRejected(req, user, 'manager');
  
  return req;
};

/**
 * approveByAdmin(requestId, adminId, note)
 * Step 4: Admin final approval → triggers hierarchy reassignment + role change
 */
const approveByAdmin = async (requestId, note = '') => {
  const req = await PromotionRequest.findById(requestId).populate('userId');
  if (!req) throw new Error('Request not found');
  if (req.status !== 'PARENT_APPROVED') throw new Error('Request not yet parent-approved');

  const user = await User.findById(req.userId);
  if (!user) throw new Error('Employee not found');

  // ── Hierarchy Reassignment ────────────────────────────────────────────────
  const currentParent = user.parentId
    ? await User.findById(user.parentId).select('parentId').lean()
    : null;
  const newParentId = currentParent?.parentId ?? null; // grandparent becomes new parent

  // ── Role History ──────────────────────────────────────────────────────────
  const now = new Date();
  const updatedHistory = user.roleHistory.map(h =>
    h.to == null ? { ...h.toObject(), to: now } : h.toObject()
  );
  updatedHistory.push({ role: req.nextRole, from: now, to: null });

  // ── Apply Promotion ───────────────────────────────────────────────────────
  user.role         = req.nextRole;
  user.parentId     = newParentId;   // ← key: parent skips one level
  user.previousRole = req.userRole;
  user.promotedAt   = now;
  user.isPromoted   = true;
  user.roleHistory  = updatedHistory;
  // advisorCode is preserved — NEVER deleted

  await user.save();

  // ── Update Request ────────────────────────────────────────────────────────
  req.status    = 'ADMIN_APPROVED';
  req.adminNote = note;
  req.promotedAt = now;
  await req.save();

  // Notify user about promotion
  await notifyPromotionApproved(req, user);

  return { request: req, user };
};

/**
 * rejectByAdmin(requestId, reason)
 */
const rejectByAdmin = async (requestId, reason = '') => {
  const req = await PromotionRequest.findById(requestId);
  if (!req) throw new Error('Request not found');

  req.status          = 'REJECTED';
  req.rejectedBy      = 'ADMIN';
  req.rejectionReason = reason;
  await req.save();
  
  // Notify user
  const user = await User.findById(req.userId);
  await notifyPromotionRejected(req, user, 'admin');
  
  return req;
};

module.exports = {
  PROMOTION_CHAIN,
  PROMOTION_RULES,
  getNextRole,
  checkEligibility,
  requestPromotion,
  approveByParent,
  rejectByParent,
  approveByAdmin,
  rejectByAdmin,
};
