const Visit = require('../models/Visit');
const Order = require('../models/Order');
const Farmer = require('../models/Farmer');
const User = require('../models/User');
const mongoose = require('mongoose');

// POST /api/visits - Create visit (auto after sale or manual)
const createVisit = async (req, res, next) => {
  try {
    const { farmerId, orderId, productId, scheduledDate, notes } = req.body;

    // Validate required fields
    if (!farmerId || !orderId || !productId || !scheduledDate) {
      return res.status(400).json({
        success: false,
        error: 'Farmer, order, product, and scheduled date are required'
      });
    }

    // Verify order exists and belongs to advisor
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Create visit
    const visit = await Visit.create({
      farmerId,
      advisorId: req.user._id,
      orderId,
      productId,
      scheduledDate,
      notes: notes || '',
      status: 'PENDING'
    });

    const populated = await Visit.findById(visit._id)
      .populate('farmerId', 'name phone village')
      .populate('productId', 'name category')
      .populate('advisorId', 'name employeeCode');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Visit scheduled successfully'
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/visits/my - Advisor's all visits
const getMyVisits = async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;

    let filter = { advisorId: req.user._id };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }

    const visits = await Visit.find(filter)
      .populate('farmerId', 'name phone village')
      .populate('productId', 'name category')
      .populate('orderId', 'orderNumber total quantity')
      .sort({ scheduledDate: -1 })
      .lean();

    res.json({ success: true, data: visits });
  } catch (err) {
    next(err);
  }
};

// GET /api/visits/today - Today's visits
const getTodayVisits = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const visits = await Visit.find({
      advisorId: req.user._id,
      scheduledDate: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $in: ['PENDING', 'RESCHEDULED'] }
    })
      .populate('farmerId', 'name phone village')
      .populate('productId', 'name category')
      .populate('orderId', 'orderNumber total quantity')
      .sort({ scheduledDate: 1 })
      .lean();

    res.json({ success: true, data: visits });
  } catch (err) {
    next(err);
  }
};

// GET /api/visits/upcoming - Upcoming visits (next 30 days)
const getUpcomingVisits = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextMonth = new Date(today);
    nextMonth.setDate(nextMonth.getDate() + 30);

    const visits = await Visit.find({
      advisorId: req.user._id,
      scheduledDate: {
        $gte: today,
        $lte: nextMonth
      },
      status: { $in: ['PENDING', 'RESCHEDULED'] }
    })
      .populate('farmerId', 'name phone village')
      .populate('productId', 'name category')
      .populate('orderId', 'orderNumber total quantity')
      .sort({ scheduledDate: 1 })
      .lean();

    res.json({ success: true, data: visits });
  } catch (err) {
    next(err);
  }
};

// GET /api/visits/overdue - Overdue/missed visits
const getOverdueVisits = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const visits = await Visit.find({
      advisorId: req.user._id,
      scheduledDate: { $lt: today },
      status: { $in: ['PENDING', 'MISSED'] }
    })
      .populate('farmerId', 'name phone village')
      .populate('productId', 'name category')
      .populate('orderId', 'orderNumber total quantity')
      .sort({ scheduledDate: -1 })
      .lean();

    res.json({ success: true, data: visits });
  } catch (err) {
    next(err);
  }
};

// GET /api/visits/:id - Visit details
const getVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('farmerId', 'name phone village crop acres')
      .populate('productId', 'name category price')
      .populate('orderId', 'orderNumber total quantity createdAt')
      .populate('advisorId', 'name employeeCode email');

    if (!visit) {
      return res.status(404).json({ success: false, error: 'Visit not found' });
    }

    // Check if user has access
    if (visit.advisorId._id.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, data: visit });
  } catch (err) {
    next(err);
  }
};

// PUT /api/visits/:id/complete - Mark visit complete + submit form
const completeVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ success: false, error: 'Visit not found' });
    }

    // Check if advisor owns this visit
    if (visit.advisorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (visit.status === 'COMPLETED') {
      return res.status(400).json({ success: false, error: 'Visit already completed' });
    }

    const {
      productUsageStatus,
      remainingQuantity,
      farmerFeedback,
      cropCondition,
      issuesReported,
      nextPurchaseNeed,
      nextPurchaseDate,
      photos,
      notes
    } = req.body;

    // Validate required fields
    if (!productUsageStatus) {
      return res.status(400).json({
        success: false,
        error: 'Product usage status is required'
      });
    }

    await visit.markCompleted({
      productUsageStatus,
      remainingQuantity,
      farmerFeedback,
      cropCondition,
      issuesReported,
      nextPurchaseNeed,
      nextPurchaseDate,
      photos,
      notes
    });

    const populated = await Visit.findById(visit._id)
      .populate('farmerId', 'name phone village')
      .populate('productId', 'name category')
      .populate('orderId', 'orderNumber');

    res.json({
      success: true,
      data: populated,
      message: 'Visit completed successfully'
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/visits/:id/reschedule - Reschedule visit
const rescheduleVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ success: false, error: 'Visit not found' });
    }

    // Check if advisor owns this visit
    if (visit.advisorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (visit.status === 'COMPLETED') {
      return res.status(400).json({ success: false, error: 'Cannot reschedule completed visit' });
    }

    const { newDate, reason } = req.body;
    if (!newDate) {
      return res.status(400).json({ success: false, error: 'New date is required' });
    }

    await visit.reschedule(new Date(newDate), reason);

    const populated = await Visit.findById(visit._id)
      .populate('farmerId', 'name phone village')
      .populate('productId', 'name category');

    res.json({
      success: true,
      data: populated,
      message: 'Visit rescheduled successfully'
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/visits/:id - Cancel visit
const cancelVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ success: false, error: 'Visit not found' });
    }

    // Check if advisor owns this visit or is admin
    if (visit.advisorId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (visit.status === 'COMPLETED') {
      return res.status(400).json({ success: false, error: 'Cannot cancel completed visit' });
    }

    await Visit.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Visit cancelled successfully'
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/visits/farmer/:farmerId - Farmer visit history
const getFarmerVisits = async (req, res, next) => {
  try {
    const visits = await Visit.find({ farmerId: req.params.farmerId })
      .populate('advisorId', 'name employeeCode')
      .populate('productId', 'name category')
      .populate('orderId', 'orderNumber total')
      .sort({ scheduledDate: -1 })
      .lean();

    res.json({ success: true, data: visits });
  } catch (err) {
    next(err);
  }
};

// GET /api/visits/admin/stats - Admin statistics
const getAdminStats = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access only' });
    }

    const [
      totalVisits,
      completedVisits,
      pendingVisits,
      missedVisits,
      todayVisits
    ] = await Promise.all([
      Visit.countDocuments(),
      Visit.countDocuments({ status: 'COMPLETED' }),
      Visit.countDocuments({ status: 'PENDING' }),
      Visit.countDocuments({ status: 'MISSED' }),
      Visit.countDocuments({
        scheduledDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
    ]);

    const completionRate = totalVisits > 0
      ? ((completedVisits / totalVisits) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalVisits,
        completedVisits,
        pendingVisits,
        missedVisits,
        todayVisits,
        completionRate: parseFloat(completionRate)
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/visits/admin/advisors - Advisor performance
const getAdvisorPerformance = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access only' });
    }

    const performance = await Visit.aggregate([
      {
        $group: {
          _id: '$advisorId',
          totalVisits: { $sum: 1 },
          completedVisits: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
          },
          missedVisits: {
            $sum: { $cond: [{ $eq: ['$status', 'MISSED'] }, 1, 0] }
          },
          pendingVisits: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'advisor'
        }
      },
      {
        $unwind: '$advisor'
      },
      {
        $project: {
          advisorId: '$_id',
          advisorName: '$advisor.name',
          advisorCode: '$advisor.employeeCode',
          totalVisits: 1,
          completedVisits: 1,
          missedVisits: 1,
          pendingVisits: 1,
          completionRate: {
            $cond: [
              { $gt: ['$totalVisits', 0] },
              {
                $multiply: [
                  { $divide: ['$completedVisits', '$totalVisits'] },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      {
        $sort: { completionRate: -1 }
      }
    ]);

    res.json({ success: true, data: performance });
  } catch (err) {
    next(err);
  }
};

// GET /api/visits/admin/all - All visits (admin only)
const getAllVisitsAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access only' });
    }

    const { status, advisorId, startDate, endDate } = req.query;

    let filter = {};

    if (status) {
      filter.status = status;
    }

    if (advisorId) {
      filter.advisorId = advisorId;
    }

    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }

    const visits = await Visit.find(filter)
      .populate('farmerId', 'name phone village')
      .populate('productId', 'name category')
      .populate('orderId', 'orderNumber total quantity')
      .populate('advisorId', 'name employeeCode')
      .sort({ scheduledDate: -1 })
      .lean();

    res.json({ success: true, data: visits });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createVisit,
  getMyVisits,
  getTodayVisits,
  getUpcomingVisits,
  getOverdueVisits,
  getVisit,
  completeVisit,
  rescheduleVisit,
  cancelVisit,
  getFarmerVisits,
  getAdminStats,
  getAdvisorPerformance,
  getAllVisitsAdmin
};
