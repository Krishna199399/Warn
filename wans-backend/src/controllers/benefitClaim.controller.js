const BenefitClaim = require('../models/BenefitClaim');
const UserRewardProgress = require('../models/UserRewardProgress');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/benefit-claims/create
// Employee creates a claim for an earned benefit
// ─────────────────────────────────────────────────────────────────────────────
exports.createClaim = async (req, res, next) => {
  try {
    const { salaryLevel, benefitName } = req.body;

    if (!salaryLevel || !benefitName) {
      return res.status(400).json({
        success: false,
        error: 'Salary level and benefit name are required',
      });
    }

    // Verify the benefit is actually earned
    const progress = await UserRewardProgress.findOne({ userId: req.user._id });
    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'No reward progress found',
      });
    }

    const levelProgress = progress.levelProgress.find(l => l.salaryLevel === salaryLevel);
    if (!levelProgress) {
      return res.status(404).json({
        success: false,
        error: `${salaryLevel} level not found`,
      });
    }

    const benefit = levelProgress.benefits.find(b => b.name === benefitName);
    if (!benefit) {
      return res.status(404).json({
        success: false,
        error: `Benefit "${benefitName}" not found`,
      });
    }

    if (!benefit.earned) {
      return res.status(400).json({
        success: false,
        error: 'This benefit has not been earned yet',
      });
    }

    // Check if claim already exists
    const existingClaim = await BenefitClaim.findOne({
      userId: req.user._id,
      salaryLevel,
      benefitName,
    });

    if (existingClaim) {
      return res.status(400).json({
        success: false,
        error: 'Claim already exists for this benefit',
        claim: existingClaim,
      });
    }

    // Create new claim
    const claim = await BenefitClaim.create({
      userId: req.user._id,
      salaryLevel,
      benefitName,
      benefitAmount: benefit.rvTarget || benefit.rvPointsTarget,
      rvEarnedAt: benefit.earnedAt,
      claimStatus: 'PENDING',
    });

    // Populate user details
    await claim.populate('userId', 'name email phone role employeeCode shopName');

    res.status(201).json({
      success: true,
      message: 'Benefit claim submitted successfully',
      data: claim,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/benefit-claims/my-claims
// Get all claims for the logged-in user
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyClaims = async (req, res, next) => {
  try {
    const claims = await BenefitClaim.find({ userId: req.user._id })
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: claims,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/benefit-claims/admin/all
// Admin: Get all benefit claims with filters
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllClaims = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    const { status, role, level } = req.query;
    const filter = {};

    if (status) filter.claimStatus = status;
    if (level) filter.salaryLevel = level;

    const claims = await BenefitClaim.find(filter)
      .populate('userId', 'name email phone role employeeCode shopName')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });

    // Filter by role if specified
    let filteredClaims = claims;
    if (role) {
      filteredClaims = claims.filter(c => c.userId?.role === role);
    }

    // Summary statistics
    const summary = {
      total: filteredClaims.length,
      pending: filteredClaims.filter(c => c.claimStatus === 'PENDING').length,
      approved: filteredClaims.filter(c => c.claimStatus === 'APPROVED').length,
      paid: filteredClaims.filter(c => c.claimStatus === 'PAID').length,
      rejected: filteredClaims.filter(c => c.claimStatus === 'REJECTED').length,
      totalAmount: filteredClaims.reduce((sum, c) => sum + c.benefitAmount, 0),
      pendingAmount: filteredClaims
        .filter(c => c.claimStatus === 'PENDING')
        .reduce((sum, c) => sum + c.benefitAmount, 0),
    };

    res.json({
      success: true,
      data: filteredClaims,
      summary,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/benefit-claims/admin/:id/approve
// Admin: Approve a benefit claim
// ─────────────────────────────────────────────────────────────────────────────
exports.approveClaim = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    const { adminNotes } = req.body;

    const claim = await BenefitClaim.findById(req.params.id)
      .populate('userId', 'name email phone role advisorCode');

    if (!claim) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found',
      });
    }

    if (claim.claimStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Cannot approve claim with status: ${claim.claimStatus}`,
      });
    }

    claim.claimStatus = 'APPROVED';
    claim.processedBy = req.user._id;
    claim.processedAt = new Date();
    if (adminNotes) claim.adminNotes = adminNotes;

    await claim.save();
    await claim.populate('processedBy', 'name email');

    res.json({
      success: true,
      message: 'Claim approved successfully',
      data: claim,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/benefit-claims/admin/:id/mark-paid
// Admin: Mark a claim as paid
// ─────────────────────────────────────────────────────────────────────────────
exports.markAsPaid = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    const { paymentMethod, referenceId, notes } = req.body;

    const claim = await BenefitClaim.findById(req.params.id)
      .populate('userId', 'name email phone role employeeCode');

    if (!claim) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found',
      });
    }

    if (claim.claimStatus === 'PAID') {
      return res.status(400).json({
        success: false,
        error: 'Claim is already marked as paid',
      });
    }

    claim.claimStatus = 'PAID';
    claim.processedBy = req.user._id;
    claim.processedAt = new Date();
    claim.paymentDetails = {
      method: paymentMethod || 'BANK_TRANSFER',
      referenceId: referenceId || null,
      paidAt: new Date(),
      notes: notes || null,
    };

    await claim.save();
    await claim.populate('processedBy', 'name email');

    res.json({
      success: true,
      message: 'Claim marked as paid successfully',
      data: claim,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/benefit-claims/admin/:id/reject
// Admin: Reject a benefit claim
// ─────────────────────────────────────────────────────────────────────────────
exports.rejectClaim = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    const { adminNotes } = req.body;

    if (!adminNotes) {
      return res.status(400).json({
        success: false,
        error: 'Admin notes are required when rejecting a claim',
      });
    }

    const claim = await BenefitClaim.findById(req.params.id)
      .populate('userId', 'name email phone role employeeCode');

    if (!claim) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found',
      });
    }

    claim.claimStatus = 'REJECTED';
    claim.processedBy = req.user._id;
    claim.processedAt = new Date();
    claim.adminNotes = adminNotes;

    await claim.save();
    await claim.populate('processedBy', 'name email');

    res.json({
      success: true,
      message: 'Claim rejected',
      data: claim,
    });
  } catch (err) {
    next(err);
  }
};
