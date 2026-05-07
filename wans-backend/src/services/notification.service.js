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

// Welcome notification for new users
const notifyWelcome = async (userId) => {
  await createNotification(userId, {
    type: 'SYSTEM',
    title: 'Welcome',
    message: 'Welcome to WANS — your agri network dashboard',
    data: null
  });
};

// Task assigned notification
const notifyTaskAssigned = async (task, assignee) => {
  await createNotification(assignee._id, {
    type: 'TASK',
    title: 'New Task Assigned',
    message: `You have been assigned: ${task.title}`,
    data: { taskId: task._id, title: task.title, dueDate: task.dueDate }
  });
};

// User registration notification (to admins)
const notifyNewUserRegistration = async (user) => {
  await notifyAdmins({
    type: 'SYSTEM',
    title: 'New User Registration',
    message: `${user.name} (${user.role}) has registered and is pending approval`,
    data: { userId: user._id, name: user.name, role: user.role }
  });
};

// User approved notification
const notifyUserApproved = async (user) => {
  await createNotification(user._id, {
    type: 'SYSTEM',
    title: 'Account Approved',
    message: 'Your account has been approved. You can now access all features.',
    data: null
  });
};

// User rejected notification
const notifyUserRejected = async (user, reason) => {
  await createNotification(user._id, {
    type: 'SYSTEM',
    title: 'Account Rejected',
    message: reason || 'Your account registration has been rejected.',
    data: null
  });
};

// KYC approved notification
const notifyKYCApproved = async (user) => {
  await createNotification(user._id, {
    type: 'SYSTEM',
    title: 'KYC Verified',
    message: 'Your KYC has been approved. You can now receive payments.',
    data: null
  });
};

// KYC rejected notification
const notifyKYCRejected = async (user, reason) => {
  await createNotification(user._id, {
    type: 'SYSTEM',
    title: 'KYC Rejected',
    message: `Your KYC was rejected: ${reason}. Please update and resubmit.`,
    data: { reason }
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
  notifyTaskAssigned,
  notifyNewUserRegistration,
  notifyUserApproved,
  notifyUserRejected,
  notifyWelcome,
  notifyKYCApproved,
  notifyKYCRejected,
};
