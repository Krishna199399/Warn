const Notification = require('../models/Notification');

// Create a notification for a user (internal helper)
const createNotification = async (userId, { type, title, message, data }) => {
  return Notification.create({ userId, type, title, message, data });
};

// Create notifications for multiple users
const createBulkNotifications = async (userIds, { type, title, message, data }) => {
  const docs = userIds.map(userId => ({ userId, type, title, message, data }));
  return Notification.insertMany(docs);
};

// GET /api/notifications — user's notifications (latest 50)
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) { next(err); }
};

// PUT /api/notifications/read-all — mark all as read
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// PUT /api/notifications/:id/read — mark single as read
const markRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markAllRead, markRead, createNotification, createBulkNotifications };
