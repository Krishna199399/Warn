const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  // References
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true,
    index: true
  },
  advisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },

  // Scheduling
  scheduledDate: {
    type: Date,
    required: true,
    index: true
  },
  completedDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'MISSED', 'RESCHEDULED'],
    default: 'PENDING',
    index: true
  },

  // Visit Data (filled during visit)
  productUsageStatus: {
    type: String,
    enum: ['NOT_STARTED', 'IN_USE', 'COMPLETED', 'ISSUES'],
    default: null
  },
  remainingQuantity: {
    type: Number,
    default: null
  },
  farmerFeedback: {
    type: String,
    default: ''
  },
  cropCondition: {
    type: String,
    default: ''
  },
  issuesReported: [{
    type: String
  }],
  nextPurchaseNeed: {
    type: String,
    default: ''
  },
  nextPurchaseDate: {
    type: Date,
    default: null
  },

  // Photos (optional)
  photos: [{
    type: String
  }],

  // Metadata
  notes: {
    type: String,
    default: ''
  },
  rescheduledFrom: {
    type: Date
  },
  rescheduledReason: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for performance
visitSchema.index({ advisorId: 1, scheduledDate: 1 });
visitSchema.index({ farmerId: 1, createdAt: -1 });
visitSchema.index({ status: 1, scheduledDate: 1 });

// Virtual for checking if overdue
visitSchema.virtual('isOverdue').get(function() {
  if (this.status === 'PENDING' && this.scheduledDate < new Date()) {
    return true;
  }
  return false;
});

// Method to mark as completed
visitSchema.methods.markCompleted = function(visitData) {
  this.status = 'COMPLETED';
  this.completedDate = new Date();
  this.productUsageStatus = visitData.productUsageStatus;
  this.remainingQuantity = visitData.remainingQuantity;
  this.farmerFeedback = visitData.farmerFeedback;
  this.cropCondition = visitData.cropCondition;
  this.issuesReported = visitData.issuesReported || [];
  this.nextPurchaseNeed = visitData.nextPurchaseNeed;
  this.nextPurchaseDate = visitData.nextPurchaseDate;
  this.photos = visitData.photos || [];
  this.notes = visitData.notes || '';
  return this.save();
};

// Method to reschedule
visitSchema.methods.reschedule = function(newDate, reason) {
  this.rescheduledFrom = this.scheduledDate;
  this.scheduledDate = newDate;
  this.status = 'RESCHEDULED';
  this.rescheduledReason = reason;
  return this.save();
};

// Static method to mark missed visits
visitSchema.statics.markMissedVisits = async function() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  return this.updateMany(
    {
      status: 'PENDING',
      scheduledDate: { $lt: yesterday }
    },
    {
      status: 'MISSED'
    }
  );
};

module.exports = mongoose.model('Visit', visitSchema);
