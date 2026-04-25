const User = require('../models/User');
const { getSubtreeIds, getPerformanceStats } = require('../services/hierarchy.service');
const { notifyUserApproved, notifyUserRejected, notifyNewUserRegistration, notifyWelcome } = require('../services/notification.service');

// GET /api/users  — paginated, filterable by role
// ADMIN: sees all users | Managers: scoped to their own subtree
const getUsers = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role)   filter.role   = role;
    if (status) filter.status = status;

    // Non-admin managers can only see their own downline
    if (req.user.role !== 'ADMIN') {
      const subtreeIds = await getSubtreeIds(req.user._id);
      
      // If filtering by a specific role, check if it's the user's own role
      // In that case, show peers (users with same parentId)
      if (role && role === req.user.role && req.user.parentId) {
        // Get peers (siblings in hierarchy)
        const peers = await User.find({ 
          parentId: req.user.parentId,
          role: req.user.role 
        }).select('_id').lean();
        
        const peerIds = peers.map(p => p._id);
        filter._id = { $in: [...subtreeIds, ...peerIds] };
      } else {
        filter._id = { $in: subtreeIds };
      }
    }

    const users = await User.find(filter)
      .select('-password -refreshToken')
      .populate('parentId', 'name role region advisorCode phone')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await User.countDocuments(filter);
    res.json({ success: true, data: users, total, page: Number(page) });
  } catch (err) { next(err); }
};

// GET /api/users/:id
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken')
      .populate('parentId', 'name role region');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// POST /api/users  — Admin creates new user
const createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, data: user.toSafeObject() });
  } catch (err) { next(err); }
};

// PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    // Never allow password or role to be updated here — use dedicated routes
    const { password, refreshToken, role, ...safe } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, safe, { new: true, runValidators: true })
      .select('-password -refreshToken');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// DELETE /api/users/:id  — soft delete
const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { status: 'Inactive' });
    res.json({ success: true, data: { message: 'User deactivated' } });
  } catch (err) { next(err); }
};

// GET /api/users/:id/downline  — entire subtree with performance data
const getDownline = async (req, res, next) => {
  try {
    const ids   = await getSubtreeIds(req.params.id);
    const users = await User.find({ _id: { $in: ids } })
      .select('-password -refreshToken')
      .populate('parentId', 'name role')
      .lean();
    
    // Enrich each user with their performance stats
    const enriched = await Promise.all(users.map(async (user) => {
      const stats = await getPerformanceStats(user._id);
      return {
        ...user,
        totalSales: stats.totalSales || 0,
        totalOrders: stats.totalOrders || 0,
        teamSize: stats.teamSize || 0,
      };
    }));
    
    res.json({ success: true, data: enriched, total: enriched.length });
  } catch (err) { next(err); }
};

// GET /api/users/:id/performance
const getUserPerformance = async (req, res, next) => {
  try {
    const stats = await getPerformanceStats(req.params.id);
    
    // Prevent caching - always fetch fresh data
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};

// GET /api/hierarchy/tree  — full tree or subtree
const getHierarchyTree = async (req, res, next) => {
  try {
    const rootId = req.query.rootId || null;
    // Return all users with parentId populated so frontend builds tree
    const filter = { 
      role: { $nin: ['WHOLESALE','MINI_STOCK'] },
      status: 'APPROVED' // Only show approved users
    };
    const users  = await User.find(filter)
      .select('-password -refreshToken')
      .populate('parentId', 'name role')
      .lean();
    
    console.log(`📊 Hierarchy query returned ${users.length} users`);
    
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

// GET /api/users/pending  — get all pending users for approval
const getPendingUsers = async (req, res, next) => {
  try {
    const users = await User.find({ status: 'PENDING' })
      .select('-password -refreshToken')
      .populate('parentId', 'name role region')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

// PUT /api/users/:id/approve  — approve user
const approveUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'APPROVED' },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');
    
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    // Send approval and welcome notifications
    await notifyUserApproved(user);
    await notifyWelcome(user._id);
    
    res.json({ success: true, data: user, message: 'User approved successfully' });
  } catch (err) { next(err); }
};

// PUT /api/users/:id/reject  — reject user
const rejectUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'REJECTED' },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');
    
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    // Send rejection notification
    await notifyUserRejected(user, reason);
    
    res.json({ success: true, data: user, message: 'User rejected' });
  } catch (err) { next(err); }
};

// PUT /api/users/:id/assign-parent  — manually assign parent (admin only)
const assignParent = async (req, res, next) => {
  try {
    const { parentId } = req.body;
    
    // Validate parent exists and is a DO_MANAGER
    const parent = await User.findById(parentId);
    if (!parent) return res.status(404).json({ success: false, error: 'Parent user not found' });
    if (parent.role !== 'DO_MANAGER') {
      return res.status(400).json({ success: false, error: 'Parent must be a DO Manager' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        parentId,
        region: parent.region || '',
        state: parent.state || ''
      },
      { new: true, runValidators: true }
    ).select('-password -refreshToken').populate('parentId', 'name role region');
    
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    res.json({ success: true, data: user, message: 'Parent assigned successfully' });
  } catch (err) { next(err); }
};

// GET /api/users/validate-advisor/:code  — validate advisor code for POS
const validateAdvisorCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const user = await User.findOne({ 
      advisorCode: code, 
      role: 'ADVISOR',
      status: 'APPROVED'
    }).select('_id name advisorCode role');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Invalid advisor code' });
    }
    
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

module.exports = { 
  getUsers, getUser, createUser, updateUser, deleteUser, 
  getDownline, getUserPerformance, getHierarchyTree,
  getPendingUsers, approveUser, rejectUser, assignParent,
  validateAdvisorCode
};
