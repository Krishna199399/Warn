const PayoutBatch  = require('../models/PayoutBatch');
const PayoutRecord = require('../models/PayoutRecord');
const BankDetails  = require('../models/BankDetails');
const User         = require('../models/User');
const {
  generateRpMidBatch, generateRpEndBatch,
  generateIvMidBatch, generateIvEndBatch,
  generateSalaryBatch,
  generateAdvisorSalaryBatch,
  generateEmployeeSalaryBatch,
  generateMiniStockCommissionBatch,
  generateWholesaleCommissionBatch,
} = require('../services/payout.service');
const { createNotification } = require('./notification.controller');

// ─────────────────────────────────────────────────────────────────────────────
// BANK DETAILS (Employee self-service)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/payouts/bank-details
const getMyBankDetails = async (req, res, next) => {
  try {
    const bank = await BankDetails.findOne({ userId: req.user._id }).lean();
    res.json({ success: true, data: bank || null });
  } catch (err) { next(err); }
};

// POST /api/payouts/bank-details  (create or update)
const upsertMyBankDetails = async (req, res, next) => {
  try {
    const {
      accountHolderName, bankName, accountNumber, ifscCode,
      branchName, accountType, upiId, address, city, state, pincode,
    } = req.body;

    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      return res.status(400).json({ success: false, error: 'Account holder name, bank name, account number and IFSC are required' });
    }

    const bank = await BankDetails.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        accountHolderName: accountHolderName.trim(),
        bankName:          bankName.trim(),
        accountNumber:     accountNumber.trim(),
        ifscCode:          ifscCode.trim().toUpperCase(),
        branchName:        branchName?.trim() || '',
        accountType:       accountType || 'SAVINGS',
        upiId:             upiId?.trim() || '',
        address:           address?.trim() || '',
        city:              city?.trim() || '',
        state:             state?.trim() || '',
        pincode:           pincode?.trim() || '',
        isVerified:        false,  // reset verification on update
        verifiedBy:        null,
        verifiedAt:        null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: bank, message: 'Bank details saved successfully' });
  } catch (err) { next(err); }
};

// PUT /api/payouts/admin/bank/:userId/verify  (Admin verify)
const verifyBankDetails = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Admin only' });
    const bank = await BankDetails.findOneAndUpdate(
      { userId: req.params.userId },
      { isVerified: true, verifiedBy: req.user._id, verifiedAt: new Date() },
      { new: true }
    );
    if (!bank) return res.status(404).json({ success: false, error: 'Bank details not found' });
    res.json({ success: true, data: bank });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYOUT BATCHES (Admin)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/payouts/batches
const getBatches = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Admin only' });
    const { type, status, month, year } = req.query;
    const query = {};
    if (type)   query.type   = type;
    if (status) query.status = status;
    if (month && year) {
      const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      query.batchId = { $regex: `${MONTHS[parseInt(month)-1]}-${year}` };
    }
    const batches = await PayoutBatch.find(query).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: batches });
  } catch (err) { next(err); }
};

// GET /api/payouts/batches/:id
const getBatchDetail = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Admin only' });
    const batch   = await PayoutBatch.findById(req.params.id).lean();
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });

    const records = await PayoutRecord.find({ batchId: batch._id })
      .populate('userId', 'name role employeeCode email phone')
      .sort({ status: 1, createdAt: 1 })
      .lean();

    res.json({ success: true, data: { batch, records } });
  } catch (err) { next(err); }
};

// POST /api/payouts/batches/generate  — manual trigger
const generateBatch = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Admin only' });
    const { type, forDate } = req.body;
    const date = forDate ? new Date(forDate) : new Date();
    let batch;
    if (type === 'RP_MID')  batch = await generateRpMidBatch(date);
    if (type === 'RP_END')  batch = await generateRpEndBatch(date);
    if (type === 'IV_MID')  batch = await generateIvMidBatch(date);
    if (type === 'IV_END')  batch = await generateIvEndBatch(date);
    if (type === 'SALARY')  batch = await generateSalaryBatch(date);
    if (type === 'ADVISOR_SALARY') batch = await generateAdvisorSalaryBatch(date);
    if (type === 'EMPLOYEE_SALARY') batch = await generateEmployeeSalaryBatch(date);
    if (type === 'MINISTOCK_COMMISSION') batch = await generateMiniStockCommissionBatch(date);
    if (type === 'WHOLESALE_COMMISSION') batch = await generateWholesaleCommissionBatch(date);
    if (!type) return res.status(400).json({ success: false, error: 'type is required (RP_MID | RP_END | IV_MID | IV_END | SALARY | ADVISOR_SALARY | EMPLOYEE_SALARY | MINISTOCK_COMMISSION | WHOLESALE_COMMISSION)' });

    if (!batch) return res.status(409).json({ success: false, error: 'Batch already exists or no eligible employees' });
    res.json({ success: true, data: batch, message: 'Batch generated successfully' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// MARK PAID
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/payouts/batches/:batchId/pay-one
const payOne = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Admin only' });
    const { recordId, utrNumber, remarks } = req.body;
    if (!recordId) return res.status(400).json({ success: false, error: 'recordId required' });

    const record = await PayoutRecord.findOneAndUpdate(
      { _id: recordId, batchId: req.params.batchId, status: { $in: ['PENDING', 'FAILED'] } },
      { status: 'PAID', paidAt: new Date(), paidBy: req.user._id, utrNumber: utrNumber || '', remarks: remarks || '' },
      { new: true }
    );
    if (!record) return res.status(404).json({ success: false, error: 'Record not found or already paid' });

    // Update batch counters
    const allRecords = await PayoutRecord.find({ batchId: req.params.batchId }).lean();
    const paidCount  = allRecords.filter(r => r.status === 'PAID').length;
    const failedCount= allRecords.filter(r => r.status === 'FAILED').length;
    const allDone    = allRecords.every(r => r.status === 'PAID' || r.status === 'FAILED');
    await PayoutBatch.findByIdAndUpdate(req.params.batchId, {
      paidCount,
      failedCount,
      status: allDone ? (failedCount > 0 ? 'PARTIAL' : 'COMPLETED') : 'PROCESSING',
      processedAt: allDone ? new Date() : undefined,
    });

    // Notify employee
    await createNotification(record.userId, {
      type:    'PAYOUT',
      title:   `Payment Processed`,
      message: `Your ${record.type} payment of ₹${record.amount.toLocaleString('en-IN')} has been processed. UTR: ${utrNumber || 'N/A'}`,
      data:    { type: record.type, amount: record.amount, utrNumber },
    });

    res.json({ success: true, data: record, message: 'Marked as paid' });
  } catch (err) { next(err); }
};

// POST /api/payouts/batches/:batchId/pay-all
const payAll = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Admin only' });
    const now = new Date();
    const result = await PayoutRecord.updateMany(
      { batchId: req.params.batchId, status: 'PENDING' },
      { status: 'PAID', paidAt: now, paidBy: req.user._id, remarks: 'Bulk payment' }
    );

    const allRecords = await PayoutRecord.find({ batchId: req.params.batchId }).lean();
    const paidCount  = allRecords.filter(r => r.status === 'PAID').length;
    const failedCount= allRecords.filter(r => r.status === 'FAILED').length;
    await PayoutBatch.findByIdAndUpdate(req.params.batchId, {
      paidCount, failedCount, status: failedCount > 0 ? 'PARTIAL' : 'COMPLETED', processedAt: now,
    });

    // Notify all employees in batch
    const pendingRecords = allRecords.filter(r => r.status === 'PAID');
    for (const r of pendingRecords) {
      await createNotification(r.userId, {
        type: 'PAYOUT', title: 'Payment Processed',
        message: `Your ${r.type} payment of ₹${r.amount.toLocaleString('en-IN')} has been processed.`,
        data: { type: r.type, amount: r.amount },
      });
    }

    res.json({ success: true, message: `${result.modifiedCount} records marked as paid` });
  } catch (err) { next(err); }
};

// GET /api/payouts/batches/:batchId/export  — CSV
const exportBatch = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Admin only' });
    const batch   = await PayoutBatch.findById(req.params.batchId).lean();
    if (!batch) return res.status(404).json({ success: false, error: 'Not found' });

    const records = await PayoutRecord.find({ batchId: batch._id })
      .populate('userId', 'name role employeeCode')
      .lean();

    const header = 'Name,Role,Account Holder,Bank Name,Account Number,IFSC,Branch,Amount,Type,Status,UTR\n';
    const rows   = records.map(r => {
      const b = r.bankSnapshot || {};
      const name = r.userId?.name || '';
      return [
        name, r.role,
        b.accountHolderName || '', b.bankName || '',
        b.accountNumber || '', b.ifscCode || '', b.branchName || '',
        r.amount, r.type, r.status, r.utrNumber || '',
      ].join(',');
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${batch.batchId}.csv"`);
    res.send(header + rows);
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE — My Payouts
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/payouts/my-payouts
const getMyPayouts = async (req, res, next) => {
  try {
    const records = await PayoutRecord.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const totalPaid   = records.filter(r => r.status === 'PAID').reduce((s, r) => s + r.amount, 0);
    const totalPending= records.filter(r => r.status === 'PENDING').reduce((s, r) => s + r.amount, 0);

    res.json({ success: true, data: { records, totalPaid, totalPending } });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Summary dashboard
// ─────────────────────────────────────────────────────────────────────────────
const getPayoutSummary = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Admin only' });

    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();

    const [pendingBatches, thisMonthBatches, bankMissing] = await Promise.all([
      PayoutBatch.find({ status: { $in: ['PENDING', 'PROCESSING'] } }).lean(),
      PayoutBatch.find({
        periodStart: { $gte: new Date(y, m, 1) },
        periodEnd:   { $lte: new Date(y, m + 1, 0) },
      }).lean(),
      PayoutRecord.countDocuments({ hasBankDetails: false, status: 'PENDING' }),
    ]);

    // Get list of users missing bank details
    const usersWithoutBank = await User.find({
      _id: { $nin: await BankDetails.distinct('userId') },
      role: { $in: ['ADVISOR', 'AREA_MANAGER', 'DO_MANAGER', 'WHOLESALE', 'MINI_STOCK'] },
      isActive: true,
    })
    .select('name email phone role')
    .lean();

    const pendingTotal = pendingBatches.reduce((s, b) => s + b.totalAmount, 0);
    const paidTotal    = thisMonthBatches
      .filter(b => b.status === 'COMPLETED' || b.status === 'PARTIAL')
      .reduce((s, b) => s + b.totalAmount, 0);

    // Next payout dates
    const lastDay = new Date(y, m + 1, 0).getDate();
    const today   = now.getDate();
    const next15  = today < 15
      ? new Date(y, m, 15).toLocaleDateString('en-IN')
      : new Date(y, m + 1, 15).toLocaleDateString('en-IN');
    const nextEnd = new Date(y, m + 1, 0).toLocaleDateString('en-IN');

    res.json({
      success: true,
      data: {
        pendingBatches,
        pendingTotal,
        paidThisMonth: paidTotal,
        bankDetailsMissing: usersWithoutBank.length,
        missingBankDetailsUsers: usersWithoutBank,
        schedule: { nextRpMid: next15, nextMonthEnd: nextEnd },
        thisMonthBatches,
      },
    });
  } catch (err) { next(err); }
};

module.exports = {
  getMyBankDetails, upsertMyBankDetails, verifyBankDetails,
  getBatches, getBatchDetail, generateBatch,
  payOne, payAll, exportBatch,
  getMyPayouts, getPayoutSummary,
};
