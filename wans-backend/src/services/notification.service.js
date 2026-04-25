const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Notification Service - Role-based notification system
 */

// Create notification for a single user
const createNotification = async (userId, { type, title, message, data = null }) => {
  try {
    return await Notification.create({ userId, type, title, message, data });
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Create notifications for multiple users
const createBulkNotifications = async (userIds, { type, title, message, data = null }) => {
  try {
    const docs = userIds.map(userId => ({ userId, type, title, message, data }));
    return await Notification.insertMany(docs);
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return [];
  }
};

// Notify user hierarchy (parent chain)
const notifyHierarchy = async (userId, { type, title, message, data = null, includeUser = false }) => {
  try {
    const user = await User.findById(userId).populate('parentId');
    if (!user) return [];

    const notifyIds = [];
    if (includeUser) notifyIds.push(userId);

    // Walk up the parent chain
    let current = user.parentId;
    while (current) {
      notifyIds.push(current._id);
      current = await User.findById(current._id).populate('parentId').then(u => u?.parentId);
    }

    return await createBulkNotifications(notifyIds, { type, title, message, data });
  } catch (error) {
    console.error('Error notifying hierarchy:', error);
    return [];
  }
};

// Notify all users with specific role(s)
const notifyByRole = async (roles, { type, title, message, data = null }) => {
  try {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const users = await User.find({ role: { $in: roleArray }, status: 'APPROVED' }).select('_id');
    const userIds = users.map(u => u._id);
    return await createBulkNotifications(userIds, { type, title, message, data });
  } catch (error) {
    console.error('Error notifying by role:', error);
    return [];
  }
};

// Notify admin users
const notifyAdmins = async ({ type, title, message, data = null }) => {
  return await notifyByRole('ADMIN', { type, title, message, data });
};

// Notify user's downline (all subordinates)
const notifyDownline = async (userId, { type, title, message, data = null }) => {
  try {
    const { getSubtreeIds } = require('./hierarchy.service');
    const subtreeIds = await getSubtreeIds(userId);
    return await createBulkNotifications(subtreeIds, { type, title, message, data });
  } catch (error) {
    console.error('Error notifying downline:', error);
    return [];
  }
};

// ===== SPECIFIC NOTIFICATION TRIGGERS =====

// New order notification
const notifyNewOrder = async (order, advisor) => {
  const orderAmount = order.total.toLocaleString('en-IN');
  
  // Notify the advisor
  await createNotification(advisor._id, {
    type: 'ORDER',
    title: 'New Order',
    message: `New order placed — ₹${orderAmount}`,
    data: { orderId: order._id, amount: order.total }
  });

  // Notify hierarchy (DO Manager, Area Manager, etc.)
  if (advisor.parentId) {
    await notifyHierarchy(advisor._id, {
      type: 'ORDER',
      title: 'New Order',
      message: `New order placed by ${advisor.name} — ₹${orderAmount}`,
      data: { orderId: order._id, advisorId: advisor._id, amount: order.total }
    });
  }
};

// Commission credited notification
const notifyCommission = async (commission, user) => {
  const amount = commission.amount.toLocaleString('en-IN');
  await createNotification(user._id, {
    type: 'COMMISSION',
    title: 'Commission',
    message: `Commission credited: ₹${amount} for ${commission.type.toLowerCase().replace('_', ' ')}`,
    data: { commissionId: commission._id, amount: commission.amount, type: commission.type }
  });
};

// Promotion request notifications
const notifyPromotionRequest = async (request, user) => {
  // Notify the user
  await createNotification(user._id, {
    type: 'PROMOTION',
    title: 'Promotion Request',
    message: `Your promotion request to ${request.nextRole.replace(/_/g, ' ')} has been submitted`,
    data: { requestId: request._id, nextRole: request.nextRole }
  });

  // Notify parent (DO Manager)
  if (request.parentId) {
    await createNotification(request.parentId, {
      type: 'PROMOTION',
      title: 'Promotion Request',
      message: `${user.name} requested promotion to ${request.nextRole.replace(/_/g, ' ')}`,
      data: { requestId: request._id, userId: user._id, nextRole: request.nextRole }
    });
  }
};

// Promotion approved by parent
const notifyPromotionParentApproved = async (request, user) => {
  // Notify the user
  await createNotification(user._id, {
    type: 'PROMOTION',
    title: 'Promotion Update',
    message: `Your manager approved your promotion request. Awaiting admin approval.`,
    data: { requestId: request._id }
  });

  // Notify all admins
  await notifyAdmins({
    type: 'PROMOTION',
    title: 'Promotion Approval Needed',
    message: `${user.name} promotion to ${request.nextRole.replace(/_/g, ' ')} needs admin approval`,
    data: { requestId: request._id, userId: user._id, nextRole: request.nextRole }
  });
};

// Promotion rejected
const notifyPromotionRejected = async (request, user, rejectedBy) => {
  await createNotification(user._id, {
    type: 'PROMOTION',
    title: 'Promotion Rejected',
    message: `Your promotion request was rejected by ${rejectedBy}. Reason: ${request.rejectionReason || 'Not specified'}`,
    data: { requestId: request._id }
  });
};

// Promotion approved by admin (final)
const notifyPromotionApproved = async (request, user) => {
  await createNotification(user._id, {
    type: 'PROMOTION',
    title: 'Promotion Approved! 🎉',
    message: `Congratulations! You've been promoted to ${user.role.replace(/_/g, ' ')}`,
    data: { requestId: request._id, newRole: user.role }
  });

  // Notify hierarchy about the promotion
  if (user.parentId) {
    await notifyHierarchy(user._id, {
      type: 'PROMOTION',
      title: 'Team Promotion',
      message: `${user.name} has been promoted to ${user.role.replace(/_/g, ' ')}`,
      data: { userId: user._id, newRole: user.role }
    });
  }
};

// Task assigned notification
const notifyTaskAssigned = async (task, assignee) => {
  await createNotification(assignee._id, {
    type: 'TASK',
    title: 'New Task',
    message: `New task assigned: ${task.title}`,
    data: { taskId: task._id, priority: task.priority, due: task.due }
  });
};

// Task due soon notification
const notifyTaskDueSoon = async (task, assignee) => {
  await createNotification(assignee._id, {
    type: 'TASK',
    title: 'Task Due Soon',
    message: `Task "${task.title}" is due soon`,
    data: { taskId: task._id, due: task.due }
  });
};

// Milestone achievement notification
const notifyMilestone = async (userId, milestone) => {
  await createNotification(userId, {
    type: 'MILESTONE',
    title: 'Milestone',
    message: milestone.message,
    data: milestone.data
  });
};

// User approval notifications
const notifyUserApproved = async (user) => {
  await createNotification(user._id, {
    type: 'SYSTEM',
    title: 'Account Approved',
    message: `Welcome to WANS! Your account has been approved. You can now access the system.`,
    data: { userId: user._id }
  });
};

const notifyUserRejected = async (user, reason) => {
  await createNotification(user._id, {
    type: 'SYSTEM',
    title: 'Account Rejected',
    message: `Your account registration was rejected. Reason: ${reason || 'Not specified'}`,
    data: { userId: user._id }
  });
};

// New user registration notification (to admins)
const notifyNewUserRegistration = async (user) => {
  await notifyAdmins({
    type: 'SYSTEM',
    title: 'New User Registration',
    message: `${user.name} (${user.role}) registered and needs approval`,
    data: { userId: user._id, role: user.role, email: user.email }
  });
};

// Welcome notification for new users
const notifyWelcome = async (userId) => {
  await createNotification(userId, {
    type: 'SYSTEM',
    title: 'Welcome',
    message: 'Welcome to WANS — your agri network dashboard',
    data: null
  });
};

module.exports = {
  createNotification,
  createBulkNotifications,
  notifyHierarchy,
  notifyByRole,
  notifyAdmins,
  notifyDownline,
  // Specific triggers
  notifyNewOrder,
  notifyCommission,
  notifyPromotionRequest,
  notifyPromotionParentApproved,
  notifyPromotionRejected,
  notifyPromotionApproved,
  notifyTaskAssigned,
  notifyTaskDueSoon,
  notifyMilestone,
  notifyUserApproved,
  notifyUserRejected,
  notifyNewUserRegistration,
  notifyWelcome,
};
