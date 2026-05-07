const User = require('../models/User');
const { getSubtreeIds, getPerformanceStats } = require('../services/hierarchy.service');
const { notifyUserApproved, notifyUserRejected, notifyNewUserRegistration, notifyWelcome } = require('../services/notification.service');
const { checkAndUpdateRewards } = require('./salary.controller');
const { reassignFarmersFromAdvisor } = require('./farmer.controller');
const { generateEmployeeCode } = require('../utils/generateEmployeeCode');

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
      .populate('parentId', 'name role region employeeCode phone')
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
    const user = await User.findByIdAndUpdate(req.params.id, safe, { returnDocument: 'after', runValidators: true })
      .select('-password -refreshToken');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// DELETE /api/users/:id  — soft delete
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    await User.findByIdAndUpdate(req.params.id, { status: 'Inactive' });

    // If deactivated user is an ADVISOR, reassign their farmers to DO Manager
    if (user.role === 'ADVISOR') {
      const count = await reassignFarmersFromAdvisor(user._id);
      console.log(`🔄 Deactivated advisor ${user.name}: ${count} farmers reassigned`);
    }

    res.json({ success: true, data: { message: 'User deactivated' } });
  } catch (err) { next(err); }
};

// GET /api/users/:id/downline  — entire subtree with performance data
const getDownline = async (req, res, next) => {
  try {
    let users;
    
    // If directOnly=true, get only direct reports (immediate children)
    if (req.query.directOnly === 'true') {
      users = await User.find({ parentId: req.params.id })
        .select('-password -refreshToken')
        .populate('parentId', 'name role')
        .lean();
    } else {
      // Get full subtree (all descendants)
      const ids = await getSubtreeIds(req.params.id);
      users = await User.find({ _id: { $in: ids } })
        .select('-password -refreshToken')
        .populate('parentId', 'name role')
        .lean();
    }
    
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
      .populate('parentId', 'name role region employeeCode')
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
      { returnDocument: 'after', runValidators: true }
    ).select('-password -refreshToken');
    
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    // Seed STAR reward progress immediately (Day 1 — reward unlock is one level ahead of salary)
    // This ensures the employee sees STAR rewards active from their very first login
    await checkAndUpdateRewards(user._id, user.role, 0);

    // If newly approved user is an ADVISOR, check if their parent DO Manager
    // is temporarily holding farmers (from a terminated advisor).
    // Reassign those farmers to this new advisor.
    if (user.role === 'ADVISOR' && user.parentId) {
      const Farmer = require('../models/Farmer');
      const heldFarmers = await Farmer.find({
        advisorId: user.parentId,
        assignmentSource: 'REASSIGNED',
      });

      if (heldFarmers.length > 0) {
        for (const farmer of heldFarmers) {
          farmer.previousAdvisors.push({
            advisorId: farmer.advisorId,
            from: farmer.assignedAt,
            to: new Date(),
            reason: 'ADMIN_REASSIGN',
          });
          farmer.advisorId = user._id;
          farmer.assignedAt = new Date();
          farmer.assignmentSource = 'POS_SALE';
          await farmer.save();
        }
        console.log(`🔄 ${heldFarmers.length} farmers reassigned from DO Manager to new advisor ${user.name} (${user.employeeCode})`);
      }
    }

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
      { returnDocument: 'after', runValidators: true }
    ).select('-password -refreshToken');
    
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    // Send rejection notification
    await notifyUserRejected(user, reason);

    // If rejected user is an ADVISOR, reassign their farmers
    if (user.role === 'ADVISOR') {
      await reassignFarmersFromAdvisor(user._id);
    }
    
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
      { returnDocument: 'after', runValidators: true }
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
      employeeCode: code, 
      role: 'ADVISOR',
      status: 'APPROVED'
    }).select('_id name employeeCode role');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Invalid advisor code' });
    }
    
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// PUT /api/users/:id/terminate — Admin fires an employee (permanent)
const terminateUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Termination reason is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (user.role === 'ADMIN') {
      return res.status(400).json({ success: false, error: 'Cannot terminate an admin account' });
    }

    if (['TERMINATED', 'SELF_DELETED'].includes(user.status)) {
      return res.status(400).json({ success: false, error: 'User is already terminated' });
    }

    user.status = 'TERMINATED';
    user.terminationReason = reason.trim();
    user.terminatedAt = new Date();
    user.terminatedBy = req.user._id;
    user.refreshToken = null;
    await user.save();

    // Reassign farmers if advisor
    if (user.role === 'ADVISOR') {
      await reassignFarmersFromAdvisor(user._id);
    }

    // Send notification to the terminated user
    try {
      const { notifyUserRejected } = require('../services/notification.service');
      await notifyUserRejected(user, `Account terminated: ${reason}`);
    } catch (_) {}

    const populated = await User.findById(user._id)
      .select('-password -refreshToken')
      .populate('terminatedBy', 'name role')
      .lean();

    res.json({ success: true, data: populated, message: 'Employee terminated successfully' });
  } catch (err) { next(err); }
};

// GET /api/users/:id/activity — Advisor/employee activity summary
const getUserActivity = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id)
      .select('-password -refreshToken')
      .lean();
    if (!targetUser) return res.status(404).json({ success: false, error: 'User not found' });

    const Commission = require('../models/Commission');
    const Order      = require('../models/Order');
    const Farmer     = require('../models/Farmer');
    const Inventory  = require('../models/Inventory');

    const userId = targetUser._id;

    // For stock shops, get orders where they are buyer OR seller
    // For advisors/employees, get orders where they are the advisor
    let orderMatchQuery;
    if (['WHOLESALE', 'MINI_STOCK'].includes(targetUser.role)) {
      orderMatchQuery = {
        $or: [
          { buyerId: userId },
          { sellerId: userId }
        ],
        status: { $ne: 'CANCELLED' }
      };
    } else {
      orderMatchQuery = {
        advisorId: userId,
        status: { $ne: 'CANCELLED' }
      };
    }

    // Orders placed/linked to this user
    const orderStats = await Order.aggregate([
      { $match: orderMatchQuery },
      { $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        lastOrderDate: { $max: '$createdAt' },
      }},
    ]);

    // Monthly order trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    let monthlyTrendQuery;
    if (['WHOLESALE', 'MINI_STOCK'].includes(targetUser.role)) {
      monthlyTrendQuery = {
        $or: [{ buyerId: userId }, { sellerId: userId }],
        status: { $ne: 'CANCELLED' },
        createdAt: { $gte: sixMonthsAgo }
      };
    } else {
      monthlyTrendQuery = {
        advisorId: userId,
        status: { $ne: 'CANCELLED' },
        createdAt: { $gte: sixMonthsAgo }
      };
    }
    
    const monthlyTrend = await Order.aggregate([
      { $match: monthlyTrendQuery },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: { $sum: '$total' },
      }},
      { $sort: { _id: 1 } },
    ]);

    // Commissions earned
    const commissionStats = await Commission.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      }},
    ]);

    // Farmers linked
    const farmerCount = await Farmer.countDocuments({ advisorId: userId });

    // Recent orders (last 10)
    let recentOrdersQuery;
    if (['WHOLESALE', 'MINI_STOCK'].includes(targetUser.role)) {
      recentOrdersQuery = {
        $or: [{ buyerId: userId }, { sellerId: userId }],
        status: { $ne: 'CANCELLED' }
      };
    } else {
      recentOrdersQuery = {
        advisorId: userId,
        status: { $ne: 'CANCELLED' }
      };
    }
    
    const recentOrders = await Order.find(recentOrdersQuery)
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('total createdAt customerName status productId')
      .lean();

    // Inventory data for stock shops (WHOLESALE, MINI_STOCK)
    let inventoryData = null;
    if (['WHOLESALE', 'MINI_STOCK'].includes(targetUser.role)) {
      const inventory = await Inventory.findOne({ ownerId: userId }).lean();
      if (inventory) {
        const totalProducts = inventory.items?.length || 0;
        const totalStock = inventory.items?.reduce((sum, item) => sum + (item.current || 0), 0) || 0;
        const lowStockItems = inventory.items?.filter(item => (item.current || 0) < 10).length || 0;
        
        inventoryData = {
          totalProducts,
          totalStock,
          lowStockItems,
        };
      }
    }

    res.json({
      success: true,
      data: {
        user: targetUser,
        orders: {
          total: orderStats[0]?.totalOrders || 0,
          revenue: orderStats[0]?.totalRevenue || 0,
          lastOrderDate: orderStats[0]?.lastOrderDate || null,
          monthlyTrend,
        },
        commissions: commissionStats,
        farmerCount,
        recentOrders,
        lastLoginAt: targetUser.lastLoginAt,
        inventory: inventoryData,
      },
    });
  } catch (err) { next(err); }
};

// POST /api/users/kyc — Submit/Update KYC details
const updateKYC = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const kycData = {
      fullName: req.body.fullName,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      fatherName: req.body.fatherName,
      panNumber: req.body.panNumber,
      aadhaarNumber: req.body.aadhaarNumber,
      accountHolderName: req.body.accountHolderName,
      bankName: req.body.bankName,
      accountNumber: req.body.accountNumber,
      ifscCode: req.body.ifscCode,
      branchName: req.body.branchName,
      accountType: req.body.accountType,
      currentAddress: req.body.currentAddress,
      currentCity: req.body.currentCity,
      currentState: req.body.currentState,
      currentPinCode: req.body.currentPinCode,
      permanentAddress: req.body.permanentAddress,
      permanentCity: req.body.permanentCity,
      permanentState: req.body.permanentState,
      permanentPinCode: req.body.permanentPinCode,
      status: 'PENDING',
      submittedAt: new Date(),
    };

    const user = await User.findByIdAndUpdate(
      userId,
      { kyc: kycData },
      { returnDocument: 'after', runValidators: true }
    ).select('-password -refreshToken');

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ 
      success: true, 
      data: user.kyc, 
      message: 'KYC details submitted successfully. Pending verification.' 
    });
  } catch (err) { next(err); }
};

// GET /api/users/kyc — Get own KYC details
// GET /api/users/:id/kyc — Get user's KYC details (admin only)
const getKYC = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user._id;
    
    // Only allow users to view their own KYC or admins to view any
    if (userId !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const user = await User.findById(userId).select('kyc').lean();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, data: user.kyc || {} });
  } catch (err) { next(err); }
};

// PUT /api/users/:id/kyc/approve — Admin approves KYC
const approveKYC = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    if (!user.kyc || !user.kyc.status) {
      return res.status(400).json({ success: false, error: 'No KYC data found for this user' });
    }
    
    if (user.kyc.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'KYC is not in pending status' });
    }
    
    user.kyc.status = 'VERIFIED';
    user.kyc.verifiedAt = new Date();
    user.kyc.verifiedBy = req.user._id;
    user.kyc.rejectionReason = null; // Clear any previous rejection reason
    
    await user.save();
    
    // Send notification to user about KYC approval
    try {
      const { notifyKYCApproved } = require('../services/notification.service');
      await notifyKYCApproved(user);
    } catch (notifError) {
      console.error('Failed to send KYC approval notification:', notifError);
    }
    
    res.json({ 
      success: true, 
      data: user.kyc, 
      message: 'KYC approved successfully' 
    });
  } catch (err) { next(err); }
};

// PUT /api/users/:id/kyc/reject — Admin rejects KYC
const rejectKYC = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Rejection reason is required' });
    }
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    if (!user.kyc || !user.kyc.status) {
      return res.status(400).json({ success: false, error: 'No KYC data found for this user' });
    }
    
    if (user.kyc.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'KYC is not in pending status' });
    }
    
    user.kyc.status = 'REJECTED';
    user.kyc.rejectionReason = reason.trim();
    user.kyc.verifiedAt = null;
    user.kyc.verifiedBy = null;
    
    await user.save();
    
    // Send notification to user about KYC rejection
    try {
      const { notifyKYCRejected } = require('../services/notification.service');
      await notifyKYCRejected(user, reason);
    } catch (notifError) {
      console.error('Failed to send KYC rejection notification:', notifError);
    }
    
    res.json({ 
      success: true, 
      data: user.kyc, 
      message: 'KYC rejected successfully' 
    });
  } catch (err) { next(err); }
};

// GET /api/users/wholesale-sellers — Get approved wholesale sellers (for MINI_STOCK users)
const getWholesaleSellers = async (req, res, next) => {
  try {
    // Only MINI_STOCK users can access this endpoint
    if (req.user.role !== 'MINI_STOCK') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only Mini Stock users can access wholesale sellers' 
      });
    }

    // Get all approved wholesale sellers
    const wholesaleSellers = await User.find({ 
      role: 'WHOLESALE', 
      status: 'APPROVED' 
    })
      .select('_id name phone upiId shopName')
      .lean();

    res.json({ 
      success: true, 
      data: wholesaleSellers,
      total: wholesaleSellers.length 
    });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// EMPLOYEE REGISTRATION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/users/employee-registrations/pending — Get all pending employee registrations
const getPendingEmployeeRegistrations = async (req, res, next) => {
  try {
    const pendingEmployees = await User.find({ 
      registrationStatus: 'pending',
      appliedRole: { $in: ['STATE_HEAD', 'ZONAL_MANAGER', 'AREA_MANAGER', 'DO_MANAGER', 'ADVISOR'] }
    })
      .select('-password -refreshToken')
      .sort({ appliedAt: -1 })
      .lean();

    res.json({ 
      success: true, 
      data: pendingEmployees,
      total: pendingEmployees.length 
    });
  } catch (err) { next(err); }
};

// POST /api/users/:id/employee-registrations/approve — Approve employee registration
const approveEmployeeRegistration = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { parentId } = req.body; // Accept parentId for hierarchy assignment
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if already approved
    if (user.status === 'APPROVED' || user.registrationStatus === 'approved') {
      return res.status(400).json({ 
        success: false, 
        error: 'User is already approved' 
      });
    }

    // Check if pending (support both old and new status fields)
    const isPending = user.registrationStatus === 'pending' || user.status === 'PENDING';
    if (!isPending) {
      return res.status(400).json({ 
        success: false, 
        error: 'Registration is not in pending status' 
      });
    }

    // Validate parent assignment based on role hierarchy
    // STATE_HEAD has no parent, all others require parent
    if (user.role !== 'STATE_HEAD') {
      if (!parentId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Parent assignment is required for this role' 
        });
      }

      // Validate parent exists and is approved
      const parent = await User.findById(parentId);
      if (!parent) {
        return res.status(404).json({ 
          success: false, 
          error: 'Parent user not found' 
        });
      }

      if (parent.status !== 'APPROVED' && parent.registrationStatus !== 'approved') {
        return res.status(400).json({ 
          success: false, 
          error: 'Parent user must be approved' 
        });
      }

      // Validate parent role matches hierarchy
      const roleHierarchy = {
        'ADVISOR': 'DO_MANAGER',
        'DO_MANAGER': 'AREA_MANAGER',
        'AREA_MANAGER': 'ZONAL_MANAGER',
        'ZONAL_MANAGER': 'STATE_HEAD',
      };

      const expectedParentRole = roleHierarchy[user.role];
      if (expectedParentRole && parent.role !== expectedParentRole) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid parent role. ${user.role} must report to ${expectedParentRole}` 
        });
      }

      // Assign parent and inherit region/state
      user.parentId = parentId;
      user.region = parent.region || user.region || '';
      user.state = parent.state || user.state || '';
    }

    // Generate unique employee code (only if not already assigned)
    let employeeCode = user.employeeCode;
    if (!employeeCode) {
      employeeCode = await generateEmployeeCode(user.role);
    }

    // Update user status
    user.registrationStatus = 'approved';
    user.status = 'APPROVED'; // Also update legacy status field
    user.employeeCode = employeeCode;
    user.approvedAt = new Date();
    user.approvedBy = req.user._id;
    await user.save();

    // Seed STAR reward progress immediately
    await checkAndUpdateRewards(user._id, user.role, 0);

    // Send approval and welcome notifications
    await notifyUserApproved(user);
    await notifyWelcome(user._id);

    const populated = await User.findById(user._id)
      .select('-password -refreshToken')
      .populate('approvedBy', 'name role')
      .populate('parentId', 'name role region')
      .lean();

    res.json({ 
      success: true, 
      data: populated,
      message: `Employee approved successfully. Employee Code: ${employeeCode}` 
    });
  } catch (err) { next(err); }
};

// POST /api/users/:id/employee-registrations/reject — Reject employee registration
const rejectEmployeeRegistration = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rejection reason is required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.registrationStatus !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: 'Registration is not in pending status' 
      });
    }

    // Update user status
    user.registrationStatus = 'rejected';
    user.status = 'REJECTED'; // Also update legacy status field
    user.rejectionReason = reason.trim();
    user.rejectedAt = new Date();
    user.rejectedBy = req.user._id;
    await user.save();

    // Send rejection notification
    await notifyUserRejected(user, reason);

    const populated = await User.findById(user._id)
      .select('-password -refreshToken')
      .populate('rejectedBy', 'name role')
      .lean();

    res.json({ 
      success: true, 
      data: populated,
      message: 'Employee registration rejected' 
    });
  } catch (err) { next(err); }
};

// GET /api/users/employee-registrations/stats — Get registration statistics
const getEmployeeRegistrationStats = async (req, res, next) => {
  try {
    const employeeRoles = ['STATE_HEAD', 'ZONAL_MANAGER', 'AREA_MANAGER', 'DO_MANAGER', 'ADVISOR'];

    const stats = await User.aggregate([
      { 
        $match: { 
          appliedRole: { $in: employeeRoles }
        }
      },
      {
        $group: {
          _id: '$registrationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format stats
    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    stats.forEach(stat => {
      if (stat._id) {
        formattedStats[stat._id] = stat.count;
        formattedStats.total += stat.count;
      }
    });

    // Get stats by role
    const roleStats = await User.aggregate([
      { 
        $match: { 
          appliedRole: { $in: employeeRoles }
        }
      },
      {
        $group: {
          _id: {
            role: '$appliedRole',
            status: '$registrationStatus'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format role stats
    const formattedRoleStats = {};
    employeeRoles.forEach(role => {
      formattedRoleStats[role] = { pending: 0, approved: 0, rejected: 0, total: 0 };
    });

    roleStats.forEach(stat => {
      const role = stat._id.role;
      const status = stat._id.status;
      if (role && status && formattedRoleStats[role]) {
        formattedRoleStats[role][status] = stat.count;
        formattedRoleStats[role].total += stat.count;
      }
    });

    res.json({ 
      success: true, 
      data: {
        overall: formattedStats,
        byRole: formattedRoleStats
      }
    });
  } catch (err) { next(err); }
};

// POST /api/users/employee-registrations/bulk-import — Bulk import existing employees
const bulkImportEmployees = async (req, res, next) => {
  try {
    const { employees } = req.body;

    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Employees array is required and must not be empty' 
      });
    }

    const results = {
      success: [],
      failed: [],
      total: employees.length
    };

    for (const emp of employees) {
      try {
        // Validate required fields
        if (!emp.name || !emp.email || !emp.phone || !emp.password || !emp.role) {
          results.failed.push({
            data: emp,
            error: 'Missing required fields (name, email, phone, password, role)'
          });
          continue;
        }

        // Validate role
        const employeeRoles = ['STATE_HEAD', 'ZONAL_MANAGER', 'AREA_MANAGER', 'DO_MANAGER', 'ADVISOR'];
        if (!employeeRoles.includes(emp.role)) {
          results.failed.push({
            data: emp,
            error: `Invalid role: ${emp.role}`
          });
          continue;
        }

        // Check duplicate email
        const emailExists = await User.findOne({ email: emp.email.toLowerCase() });
        if (emailExists) {
          results.failed.push({
            data: emp,
            error: 'Email already exists'
          });
          continue;
        }

        // Check duplicate phone
        const phoneExists = await User.findOne({ phone: emp.phone });
        if (phoneExists) {
          results.failed.push({
            data: emp,
            error: 'Phone number already exists'
          });
          continue;
        }

        // Generate employee code
        const employeeCode = await generateEmployeeCode(emp.role);

        // Build avatar initials
        const nameParts = emp.name.trim().split(' ');
        const avatar = nameParts.length >= 2
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : emp.name.slice(0, 2).toUpperCase();

        // Create user with approved status and employee code
        const newUser = await User.create({
          name: emp.name.trim(),
          email: emp.email.toLowerCase().trim(),
          phone: emp.phone.trim(),
          password: emp.password,
          role: emp.role,
          appliedRole: emp.role,
          state: emp.state?.trim() || '',
          region: emp.district?.trim() || '',
          avatar,
          status: 'APPROVED',
          registrationStatus: 'approved',
          employeeCode,
          appliedAt: new Date(),
          approvedAt: new Date(),
          approvedBy: req.user._id,
          roleHistory: [{ role: emp.role, from: new Date(), to: null }],
        });

        // Seed STAR reward progress
        await checkAndUpdateRewards(newUser._id, newUser.role, 0);

        results.success.push({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          employeeCode: newUser.employeeCode
        });

      } catch (error) {
        results.failed.push({
          data: emp,
          error: error.message
        });
      }
    }

    res.json({ 
      success: true, 
      data: results,
      message: `Bulk import completed. Success: ${results.success.length}, Failed: ${results.failed.length}` 
    });
  } catch (err) { next(err); }
};

module.exports = { 
  getUsers, getUser, createUser, updateUser, deleteUser, 
  getDownline, getUserPerformance, getHierarchyTree,
  getPendingUsers, approveUser, rejectUser, assignParent,
  validateAdvisorCode, terminateUser, getUserActivity,
  updateKYC, getKYC, approveKYC, rejectKYC,
  getWholesaleSellers,
  // Employee Registration Management
  getPendingEmployeeRegistrations,
  approveEmployeeRegistration,
  rejectEmployeeRegistration,
  getEmployeeRegistrationStats,
  bulkImportEmployees,
};
