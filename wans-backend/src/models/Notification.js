const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:     { type: String, enum: ['ORDER', 'COMMISSION', 'PROMOTION', 'TASK', 'MILESTONE', 'SYSTEM'], default: 'SYSTEM' },
  title:    { type: String, required: true },
  message:  { type: String, required: true },
  read:     { type: Boolean, default: false },
  data:     { type: mongoose.Schema.Types.Mixed, default: null },  // extra payload (orderId, etc.)
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
