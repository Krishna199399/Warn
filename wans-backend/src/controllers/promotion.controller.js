const promotionService = require('../services/promotion.service');
const PromotionRequest = require('../models/PromotionRequest');

// POST /api/promotions/request
const requestPromotion = async (req, res, next) => {
  try {
    const request = await promotionService.requestPromotion(req.user._id);
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// GET /api/promotions/my
const getMyRequest = async (req, res, next) => {
  try {
    const request = await PromotionRequest.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: request });
  } catch (err) { next(err); }
};

// GET /api/promotions/pending  — requests awaiting this manager's approval
const getPendingForManager = async (req, res, next) => {
  try {
    const requests = await PromotionRequest.find({ parentId: req.user._id, status: 'REQUESTED' })
      .populate('userId', 'name role advisorCode region');
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
};

// GET /api/promotions/pending/admin
const getPendingAdmin = async (req, res, next) => {
  try {
    const requests = await PromotionRequest.find({ status: 'PARENT_APPROVED' })
      .populate('userId', 'name role advisorCode region')
      .populate('parentId', 'name');
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
};

// GET /api/promotions/all  — admin only
const getAllRequests = async (req, res, next) => {
  try {
    const requests = await PromotionRequest.find({})
      .populate('userId', 'name role advisorCode')
      .populate('parentId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
};

// POST /api/promotions/:id/approve-parent
const approveByParent = async (req, res, next) => {
  try {
    const { note } = req.body;
    const result   = await promotionService.approveByParent(req.params.id, req.user._id, note);
    res.json({ success: true, data: result, message: 'Approved and forwarded to Admin' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// POST /api/promotions/:id/reject-parent
const rejectByParent = async (req, res, next) => {
  try {
    const result = await promotionService.rejectByParent(req.params.id, req.user._id, req.body.reason);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// POST /api/promotions/:id/approve-admin
const approveByAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Admin only' });
    const { note } = req.body;
    const result   = await promotionService.approveByAdmin(req.params.id, note);
    res.json({
      success: true,
      data: result,
      message: `🎉 Promoted to ${result.user.role.replace(/_/g,' ')}`,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// POST /api/promotions/:id/reject-admin
const rejectByAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Admin only' });
    const result = await promotionService.rejectByAdmin(req.params.id, req.body.reason);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

module.exports = {
  requestPromotion, getMyRequest, getPendingForManager,
  getPendingAdmin, getAllRequests,
  approveByParent, rejectByParent, approveByAdmin, rejectByAdmin,
};
