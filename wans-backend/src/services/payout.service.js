const Commission  = require('../models/Commission');
const BankDetails = require('../models/BankDetails');
const PayoutBatch = require('../models/PayoutBatch');
const PayoutRecord= require('../models/PayoutRecord');
const UserSalaryStatus = require('../models/UserSalaryStatus');
const SalaryPlan  = require('../models/SalaryPlan');
const User        = require('../models/User');
const { createNotification, createBulkNotifications } = require('../controllers/notification.controller');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Get bank details from KYC or fallback to BankDetails model */
async function getBankDetailsForUser(userId) {
  // Try KYC first
  const user = await User.findById(userId).select('kyc').lean();
  if (user?.kyc?.accountNumber && user?.kyc?.ifscCode) {
    return {
      accountHolderName: user.kyc.accountHolderName,
      bankName:          user.kyc.bankName,
      accountNumber:     user.kyc.accountNumber,
      ifscCode:          user.kyc.ifscCode,
      branchName:        user.kyc.branchName,
      accountType:       user.kyc.accountType,
      upiId:             null,
      address:           user.kyc.currentAddress,
      city:              user.kyc.currentCity,
      state:             user.kyc.currentState,
      pincode:           user.kyc.currentPinCode,
    };
  }
  
  // Fallback to old BankDetails model
  return await BankDetails.findOne({ userId }).lean();
}

/** Last day of a given month */
function lastDayOf(year, month) {
  return new Date(year, month + 1, 0);   // month is 0-indexed
}

/** Zero-padded month name abbreviation */
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function batchId(type, date) {
  return `${type}-${MONTHS[date.getMonth()]}-${date.getFullYear()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate RP Mid-Month Batch (runs on 15th)
// Period: 1st → 14th of current month
// Who:    All Advisors
// ─────────────────────────────────────────────────────────────────────────────
async function generateRpMidBatch(forDate = new Date()) {
  const y = forDate.getFullYear(), m = forDate.getMonth();
  const periodStart = new Date(y, m, 1);
  const periodEnd   = new Date(y, m, 14, 23, 59, 59);
  const id = batchId('RP-MID', forDate);

  if (await PayoutBatch.findOne({ batchId: id })) {
    console.log(`⚠️  Batch ${id} already exists — skipping`);
    return null;
  }

  // All approved advisors
  const advisors = await User.find({ role: 'ADVISOR', status: 'APPROVED' }).lean();
  const records  = [];
  let   total    = 0;

  for (const advisor of advisors) {
    // RP commissions in period
    const agg = await Commission.aggregate([
      { $match: {
          userId: advisor._id,
          type:   'RP',
          date:   { $gte: periodStart, $lte: periodEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const amount = agg[0]?.total || 0;
    if (amount <= 0) continue;

    const bank = await getBankDetailsForUser(advisor._id);
    records.push({
      userId:   advisor._id,
      role:     advisor.role,
      type:     'RP',
      amount,
      periodStart,
      periodEnd,
      hasBankDetails: !!bank,
      bankSnapshot: bank ? {
        accountHolderName: bank.accountHolderName,
        bankName:          bank.bankName,
        accountNumber:     bank.accountNumber,
        ifscCode:          bank.ifscCode,
        branchName:        bank.branchName,
        accountType:       bank.accountType,
        upiId:             bank.upiId,
        address:           bank.address,
        city:              bank.city,
        state:             bank.state,
        pincode:           bank.pincode,
      } : null,
    });
    total += amount;
  }

  if (records.length === 0) {
    console.log(`ℹ️  No RP amounts found for ${id}`);
    return null;
  }

  const batch = await PayoutBatch.create({
    batchId: id,
    type:    'RP_MID',
    periodStart,
    periodEnd,
    scheduledDate:  new Date(y, m, 15),
    totalAmount:    total,
    totalEmployees: records.length,
    createdBy:      'SYSTEM',
  });

  const insertedRecords = records.map(r => ({ ...r, batchId: batch._id }));
  await PayoutRecord.insertMany(insertedRecords);

  // Notify all admins
  const admins = await User.find({ role: 'ADMIN' }).lean();
  await createBulkNotifications(
    admins.map(a => a._id),
    {
      type:    'PAYOUT',
      title:   `RP Mid-Month Payout Ready`,
      message: `${records.length} advisors · Total ₹${total.toLocaleString('en-IN')} — due 15th`,
      data:    { batchId: batch._id, type: 'RP_MID' },
    }
  );

  console.log(`✅ Batch ${id} created — ₹${total} for ${records.length} advisors`);
  return batch;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate RP End-Month Batch (runs on last day)
// Period: 15th → last day of current month
// ─────────────────────────────────────────────────────────────────────────────
async function generateRpEndBatch(forDate = new Date()) {
  const y = forDate.getFullYear(), m = forDate.getMonth();
  const periodStart = new Date(y, m, 15);
  const periodEnd   = lastDayOf(y, m);
  periodEnd.setHours(23, 59, 59);
  const id = batchId('RP-END', forDate);

  if (await PayoutBatch.findOne({ batchId: id })) {
    console.log(`⚠️  Batch ${id} already exists`);
    return null;
  }

  const advisors = await User.find({ role: 'ADVISOR', status: 'APPROVED' }).lean();
  const records  = [];
  let   total    = 0;

  for (const advisor of advisors) {
    const agg = await Commission.aggregate([
      { $match: { userId: advisor._id, type: 'RP', date: { $gte: periodStart, $lte: periodEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const amount = agg[0]?.total || 0;
    if (amount <= 0) continue;

    const bank = await getBankDetailsForUser(advisor._id);
    records.push({
      userId: advisor._id, role: advisor.role, type: 'RP', amount, periodStart, periodEnd,
      hasBankDetails: !!bank,
      bankSnapshot: bank ? { accountHolderName: bank.accountHolderName, bankName: bank.bankName,
        accountNumber: bank.accountNumber, ifscCode: bank.ifscCode, branchName: bank.branchName,
        accountType: bank.accountType, upiId: bank.upiId, address: bank.address,
        city: bank.city, state: bank.state, pincode: bank.pincode } : null,
    });
    total += amount;
  }

  if (records.length === 0) return null;

  const batch = await PayoutBatch.create({
    batchId: id, type: 'RP_END', periodStart, periodEnd,
    scheduledDate: lastDayOf(y, m), totalAmount: total, totalEmployees: records.length, createdBy: 'SYSTEM',
  });
  await PayoutRecord.insertMany(records.map(r => ({ ...r, batchId: batch._id })));

  const admins = await User.find({ role: 'ADMIN' }).lean();
  await createBulkNotifications(admins.map(a => a._id), {
    type: 'PAYOUT', title: 'RP End-Month Payout Ready',
    message: `${records.length} advisors · Total ₹${total.toLocaleString('en-IN')}`,
    data: { batchId: batch._id, type: 'RP_END' },
  });

  console.log(`✅ Batch ${id} created — ₹${total}`);
  return batch;
}

// ─────────────────────────────────────────────────────────────────────────────
// IV Batch helpers
// ─────────────────────────────────────────────────────────────────────────────
const IV_ROLES = ['DO_MANAGER', 'AREA_MANAGER', 'ZONAL_MANAGER', 'STATE_HEAD'];

async function _buildIvRecords(periodStart, periodEnd) {
  const managers = await User.find({ role: { $in: IV_ROLES }, status: 'APPROVED' }).lean();
  const records  = [];
  let   total    = 0;

  for (const mgr of managers) {
    const agg = await Commission.aggregate([
      { $match: {
          userId: mgr._id,
          type:   'IV',
          date:   { $gte: periodStart, $lte: periodEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const amount = agg[0]?.total || 0;
    if (amount <= 0) continue;

    const bank = await getBankDetailsForUser(mgr._id);
    records.push({
      userId: mgr._id,
      role:   mgr.role,
      type:   'IV',
      amount,
      periodStart,
      periodEnd,
      hasBankDetails: !!bank,
      bankSnapshot: bank ? {
        accountHolderName: bank.accountHolderName,
        bankName:          bank.bankName,
        accountNumber:     bank.accountNumber,
        ifscCode:          bank.ifscCode,
        branchName:        bank.branchName,
        accountType:       bank.accountType,
        upiId:             bank.upiId,
        address:           bank.address,
        city:              bank.city,
        state:             bank.state,
        pincode:           bank.pincode,
      } : null,
    });
    total += amount;
  }
  return { records, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate IV Mid-Month Batch (runs on 15th)
// Period: 1st → 14th of current month
// Who:    DO_MANAGER, AREA_MANAGER, ZONAL_MANAGER, STATE_HEAD
// ─────────────────────────────────────────────────────────────────────────────
async function generateIvMidBatch(forDate = new Date()) {
  const y = forDate.getFullYear(), m = forDate.getMonth();
  const periodStart = new Date(y, m, 1);
  const periodEnd   = new Date(y, m, 14, 23, 59, 59);
  const id = batchId('IV-MID', forDate);

  if (await PayoutBatch.findOne({ batchId: id })) {
    console.log(`⚠️  Batch ${id} already exists — skipping`);
    return null;
  }

  const { records, total } = await _buildIvRecords(periodStart, periodEnd);

  if (records.length === 0) {
    console.log(`ℹ️  No IV amounts found for ${id}`);
    return null;
  }

  const batch = await PayoutBatch.create({
    batchId: id,
    type:    'IV_MID',
    periodStart,
    periodEnd,
    scheduledDate:  new Date(y, m, 15),
    totalAmount:    total,
    totalEmployees: records.length,
    createdBy:      'SYSTEM',
  });

  await PayoutRecord.insertMany(records.map(r => ({ ...r, batchId: batch._id })));

  const admins = await User.find({ role: 'ADMIN' }).lean();
  await createBulkNotifications(
    admins.map(a => a._id),
    {
      type:    'PAYOUT',
      title:   'IV Mid-Month Payout Ready',
      message: `${records.length} managers · Total ₹${total.toLocaleString('en-IN')} — due 15th`,
      data:    { batchId: batch._id, type: 'IV_MID' },
    }
  );

  console.log(`✅ Batch ${id} created — ₹${total} for ${records.length} managers`);
  return batch;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate IV End-Month Batch (runs on last day)
// Period: 15th → last day of current month
// ─────────────────────────────────────────────────────────────────────────────
async function generateIvEndBatch(forDate = new Date()) {
  const y = forDate.getFullYear(), m = forDate.getMonth();
  const periodStart = new Date(y, m, 15);
  const periodEnd   = lastDayOf(y, m);
  periodEnd.setHours(23, 59, 59);
  const id = batchId('IV-END', forDate);

  if (await PayoutBatch.findOne({ batchId: id })) {
    console.log(`⚠️  Batch ${id} already exists — skipping`);
    return null;
  }

  const { records, total } = await _buildIvRecords(periodStart, periodEnd);

  if (records.length === 0) {
    console.log(`ℹ️  No IV amounts found for ${id}`);
    return null;
  }

  const batch = await PayoutBatch.create({
    batchId: id,
    type:    'IV_END',
    periodStart,
    periodEnd,
    scheduledDate:  lastDayOf(y, m),
    totalAmount:    total,
    totalEmployees: records.length,
    createdBy:      'SYSTEM',
  });

  await PayoutRecord.insertMany(records.map(r => ({ ...r, batchId: batch._id })));

  const admins = await User.find({ role: 'ADMIN' }).lean();
  await createBulkNotifications(
    admins.map(a => a._id),
    {
      type:    'PAYOUT',
      title:   'IV End-Month Payout Ready',
      message: `${records.length} managers · Total ₹${total.toLocaleString('en-IN')}`,
      data:    { batchId: batch._id, type: 'IV_END' },
    }
  );

  console.log(`✅ Batch ${id} created — ₹${total} for ${records.length} managers`);
  return batch;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate Role-Specific Monthly Salary Batch (runs on last day)
// Who: Employees of specific role who have a salary level (STAR/RUBY/PEARL) with monthlySalaryAmount > 0
// ─────────────────────────────────────────────────────────────────────────────
async function generateRoleSpecificSalaryBatch(role, forDate = new Date()) {
  const y = forDate.getFullYear(), m = forDate.getMonth();
  const periodStart = new Date(y, m, 1);
  const periodEnd   = lastDayOf(y, m);
  periodEnd.setHours(23, 59, 59);
  
  // Create role-specific batch ID
  const rolePrefix = role === 'ADVISOR' ? 'ADVISOR-SALARY' : 
                    role === 'AREA_MANAGER' || role === 'DO_MANAGER' || role === 'ZONAL_MANAGER' || role === 'STATE_HEAD' ? 'EMPLOYEE-SALARY' :
                    'SALARY';
  const id = batchId(rolePrefix, forDate);

  if (await PayoutBatch.findOne({ batchId: id })) {
    console.log(`⚠️  Batch ${id} already exists`);
    return null;
  }

  // Filter employees by role and salary status
  const statuses = await UserSalaryStatus.find({
    role: role,
    currentLevel: { $in: ['STAR', 'RUBY', 'PEARL'] },
  }).lean();

  const records = [];
  let   total   = 0;

  for (const status of statuses) {
    const plan = await SalaryPlan.findOne({
      role:  status.role,
      level: status.currentLevel,
      isActive: true,
    }).lean();

    if (!plan || !plan.monthlySalaryAmount || plan.monthlySalaryAmount <= 0) continue;

    const user = await User.findById(status.userId).lean();
    if (!user || user.status !== 'APPROVED') continue;

    const bank = await getBankDetailsForUser(status.userId);
    records.push({
      userId: status.userId, role: status.role, type: rolePrefix.replace('-', '_'),
      amount: plan.monthlySalaryAmount, periodStart, periodEnd,
      hasBankDetails: !!bank,
      bankSnapshot: bank ? { accountHolderName: bank.accountHolderName, bankName: bank.bankName,
        accountNumber: bank.accountNumber, ifscCode: bank.ifscCode, branchName: bank.branchName,
        accountType: bank.accountType, upiId: bank.upiId, address: bank.address,
        city: bank.city, state: bank.state, pincode: bank.pincode } : null,
    });
    total += plan.monthlySalaryAmount;
  }

  if (records.length === 0) {
    console.log(`ℹ️  No salary-eligible ${role} employees for ${id}`);
    return null;
  }

  const batch = await PayoutBatch.create({
    batchId: id, type: rolePrefix.replace('-', '_'), periodStart, periodEnd,
    scheduledDate: lastDayOf(y, m), totalAmount: total, totalEmployees: records.length, createdBy: 'SYSTEM',
  });
  await PayoutRecord.insertMany(records.map(r => ({ ...r, batchId: batch._id })));

  const admins = await User.find({ role: 'ADMIN' }).lean();
  await createBulkNotifications(admins.map(a => a._id), {
    type: 'PAYOUT', title: `${role} Monthly Salary Payout Ready`,
    message: `${records.length} ${role.toLowerCase()} employees · Total ₹${total.toLocaleString('en-IN')}`,
    data: { batchId: batch._id, type: rolePrefix.replace('-', '_') },
  });

  console.log(`✅ Salary batch ${id} — ₹${total} for ${records.length} ${role} employees`);
  return batch;
}

// Specific functions for each role
async function generateAdvisorSalaryBatch(forDate = new Date()) {
  return generateRoleSpecificSalaryBatch('ADVISOR', forDate);
}

async function generateEmployeeSalaryBatch(forDate = new Date()) {
  // This will handle all management roles (AREA_MANAGER, DO_MANAGER, etc.)
  const y = forDate.getFullYear(), m = forDate.getMonth();
  const periodStart = new Date(y, m, 1);
  const periodEnd   = lastDayOf(y, m);
  periodEnd.setHours(23, 59, 59);
  const id = batchId('EMPLOYEE-SALARY', forDate);

  if (await PayoutBatch.findOne({ batchId: id })) {
    console.log(`⚠️  Batch ${id} already exists`);
    return null;
  }

  // All management roles with salary status
  const managementRoles = ['AREA_MANAGER', 'DO_MANAGER', 'ZONAL_MANAGER', 'STATE_HEAD'];
  const statuses = await UserSalaryStatus.find({
    role: { $in: managementRoles },
    currentLevel: { $in: ['STAR', 'RUBY', 'PEARL'] },
  }).lean();

  const records = [];
  let   total   = 0;

  for (const status of statuses) {
    const plan = await SalaryPlan.findOne({
      role:  status.role,
      level: status.currentLevel,
      isActive: true,
    }).lean();

    if (!plan || !plan.monthlySalaryAmount || plan.monthlySalaryAmount <= 0) continue;

    const user = await User.findById(status.userId).lean();
    if (!user || user.status !== 'APPROVED') continue;

    const bank = await getBankDetailsForUser(status.userId);
    records.push({
      userId: status.userId, role: status.role, type: 'EMPLOYEE_SALARY',
      amount: plan.monthlySalaryAmount, periodStart, periodEnd,
      hasBankDetails: !!bank,
      bankSnapshot: bank ? { accountHolderName: bank.accountHolderName, bankName: bank.bankName,
        accountNumber: bank.accountNumber, ifscCode: bank.ifscCode, branchName: bank.branchName,
        accountType: bank.accountType, upiId: bank.upiId, address: bank.address,
        city: bank.city, state: bank.state, pincode: bank.pincode } : null,
    });
    total += plan.monthlySalaryAmount;
  }

  if (records.length === 0) {
    console.log(`ℹ️  No salary-eligible management employees for ${id}`);
    return null;
  }

  const batch = await PayoutBatch.create({
    batchId: id, type: 'EMPLOYEE_SALARY', periodStart, periodEnd,
    scheduledDate: lastDayOf(y, m), totalAmount: total, totalEmployees: records.length, createdBy: 'SYSTEM',
  });
  await PayoutRecord.insertMany(records.map(r => ({ ...r, batchId: batch._id })));

  const admins = await User.find({ role: 'ADMIN' }).lean();
  await createBulkNotifications(admins.map(a => a._id), {
    type: 'PAYOUT', title: 'Employee Monthly Salary Payout Ready',
    message: `${records.length} management employees · Total ₹${total.toLocaleString('en-IN')}`,
    data: { batchId: batch._id, type: 'EMPLOYEE_SALARY' },
  });

  console.log(`✅ Employee salary batch ${id} — ₹${total} for ${records.length} management employees`);
  return batch;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate Monthly Salary Batch (runs on last day) - LEGACY - includes all roles
// Who: All employees who have a salary level (STAR/RUBY/PEARL) with monthlySalaryAmount > 0
// ─────────────────────────────────────────────────────────────────────────────
async function generateSalaryBatch(forDate = new Date()) {
  const y = forDate.getFullYear(), m = forDate.getMonth();
  const periodStart = new Date(y, m, 1);
  const periodEnd   = lastDayOf(y, m);
  periodEnd.setHours(23, 59, 59);
  const id = batchId('SALARY', forDate);

  if (await PayoutBatch.findOne({ batchId: id })) {
    console.log(`⚠️  Batch ${id} already exists`);
    return null;
  }

  // All employees with salary status
  const statuses = await UserSalaryStatus.find({
    currentLevel: { $in: ['STAR', 'RUBY', 'PEARL'] },
  }).lean();

  const records = [];
  let   total   = 0;

  for (const status of statuses) {
    const plan = await SalaryPlan.findOne({
      role:  status.role,
      level: status.currentLevel,
      isActive: true,
    }).lean();

    if (!plan || !plan.monthlySalaryAmount || plan.monthlySalaryAmount <= 0) continue;

    const user = await User.findById(status.userId).lean();
    if (!user || user.status !== 'APPROVED') continue;

    const bank = await getBankDetailsForUser(status.userId);
    records.push({
      userId: status.userId, role: status.role, type: 'SALARY',
      amount: plan.monthlySalaryAmount, periodStart, periodEnd,
      hasBankDetails: !!bank,
      bankSnapshot: bank ? { accountHolderName: bank.accountHolderName, bankName: bank.bankName,
        accountNumber: bank.accountNumber, ifscCode: bank.ifscCode, branchName: bank.branchName,
        accountType: bank.accountType, upiId: bank.upiId, address: bank.address,
        city: bank.city, state: bank.state, pincode: bank.pincode } : null,
    });
    total += plan.monthlySalaryAmount;
  }

  if (records.length === 0) {
    console.log(`ℹ️  No salary-eligible employees for ${id}`);
    return null;
  }

  const batch = await PayoutBatch.create({
    batchId: id, type: 'SALARY', periodStart, periodEnd,
    scheduledDate: lastDayOf(y, m), totalAmount: total, totalEmployees: records.length, createdBy: 'SYSTEM',
  });
  await PayoutRecord.insertMany(records.map(r => ({ ...r, batchId: batch._id })));

  const admins = await User.find({ role: 'ADMIN' }).lean();
  await createBulkNotifications(admins.map(a => a._id), {
    type: 'PAYOUT', title: 'Monthly Salary Payout Ready',
    message: `${records.length} employees · Total ₹${total.toLocaleString('en-IN')}`,
    data: { batchId: batch._id, type: 'SALARY' },
  });

  console.log(`✅ Salary batch ${id} — ₹${total} for ${records.length} employees`);
  return batch;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate Mini Stock Commission Batch (runs on last day)
// Period: Full month
// Who: All MINI_STOCK users who earned commission from orders
// ─────────────────────────────────────────────────────────────────────────────
async function generateMiniStockCommissionBatch(forDate = new Date()) {
  const Order = require('../models/Order');
  
  const y = forDate.getFullYear(), m = forDate.getMonth();
  const periodStart = new Date(y, m, 1);
  const periodEnd   = lastDayOf(y, m);
  periodEnd.setHours(23, 59, 59);
  const id = batchId('MINISTOCK', forDate);

  if (await PayoutBatch.findOne({ batchId: id })) {
    console.log(`⚠️  Batch ${id} already exists — skipping`);
    return null;
  }

  // Aggregate commission earnings for MINI_STOCK users from orders
  const commissionAgg = await Order.aggregate([
    {
      $match: {
        buyerType: 'MINI_STOCK',
        'buyerCommission.type': 'MINISTOCK_MARGIN',
        'buyerCommission.recorded': true,
        deliveredAt: { $gte: periodStart, $lte: periodEnd },
        status: 'DELIVERED'
      }
    },
    {
      $group: {
        _id: '$buyerId',
        totalCommission: { $sum: '$buyerCommission.totalAmount' }
      }
    }
  ]);

  const records = [];
  let total = 0;

  for (const comm of commissionAgg) {
    if (comm.totalCommission <= 0) continue;

    const user = await User.findById(comm._id).lean();
    if (!user || user.status !== 'APPROVED' || user.role !== 'MINI_STOCK') continue;

    const bank = await getBankDetailsForUser(comm._id);
    records.push({
      userId: comm._id,
      role: user.role,
      type: 'MINISTOCK_COMMISSION',
      amount: comm.totalCommission,
      periodStart,
      periodEnd,
      hasBankDetails: !!bank,
      bankSnapshot: bank ? {
        accountHolderName: bank.accountHolderName,
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        ifscCode: bank.ifscCode,
        branchName: bank.branchName,
        accountType: bank.accountType,
        upiId: bank.upiId,
        address: bank.address,
        city: bank.city,
        state: bank.state,
        pincode: bank.pincode,
      } : null,
    });
    total += comm.totalCommission;
  }

  if (records.length === 0) {
    console.log(`ℹ️  No Mini Stock commission found for ${id}`);
    return null;
  }

  const batch = await PayoutBatch.create({
    batchId: id,
    type: 'MINISTOCK_COMMISSION',
    periodStart,
    periodEnd,
    scheduledDate: lastDayOf(y, m),
    totalAmount: total,
    totalEmployees: records.length,
    createdBy: 'SYSTEM',
  });

  await PayoutRecord.insertMany(records.map(r => ({ ...r, batchId: batch._id })));

  const admins = await User.find({ role: 'ADMIN' }).lean();
  await createBulkNotifications(
    admins.map(a => a._id),
    {
      type: 'PAYOUT',
      title: 'Mini Stock Commission Payout Ready',
      message: `${records.length} mini stock users · Total ₹${total.toLocaleString('en-IN')}`,
      data: { batchId: batch._id, type: 'MINISTOCK_COMMISSION' },
    }
  );

  console.log(`✅ Batch ${id} created — ₹${total} for ${records.length} mini stock users`);
  return batch;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate Wholesale Commission Batch (runs on last day)
// Period: Full month
// Who: All WHOLESALE users who earned commission from orders
// ─────────────────────────────────────────────────────────────────────────────
async function generateWholesaleCommissionBatch(forDate = new Date()) {
  const Order = require('../models/Order');
  
  const y = forDate.getFullYear(), m = forDate.getMonth();
  const periodStart = new Date(y, m, 1);
  const periodEnd   = lastDayOf(y, m);
  periodEnd.setHours(23, 59, 59);
  const id = batchId('WHOLESALE', forDate);

  if (await PayoutBatch.findOne({ batchId: id })) {
    console.log(`⚠️  Batch ${id} already exists — skipping`);
    return null;
  }

  // Aggregate commission earnings for WHOLESALE users from orders
  const commissionAgg = await Order.aggregate([
    {
      $match: {
        buyerType: 'WHOLESALE',
        'buyerCommission.type': 'WHOLESALE_MARGIN',
        'buyerCommission.recorded': true,
        deliveredAt: { $gte: periodStart, $lte: periodEnd },
        status: 'DELIVERED'
      }
    },
    {
      $group: {
        _id: '$buyerId',
        totalCommission: { $sum: '$buyerCommission.totalAmount' }
      }
    }
  ]);

  const records = [];
  let total = 0;

  for (const comm of commissionAgg) {
    if (comm.totalCommission <= 0) continue;

    const user = await User.findById(comm._id).lean();
    if (!user || user.status !== 'APPROVED' || user.role !== 'WHOLESALE') continue;

    const bank = await getBankDetailsForUser(comm._id);
    records.push({
      userId: comm._id,
      role: user.role,
      type: 'WHOLESALE_COMMISSION',
      amount: comm.totalCommission,
      periodStart,
      periodEnd,
      hasBankDetails: !!bank,
      bankSnapshot: bank ? {
        accountHolderName: bank.accountHolderName,
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        ifscCode: bank.ifscCode,
        branchName: bank.branchName,
        accountType: bank.accountType,
        upiId: bank.upiId,
        address: bank.address,
        city: bank.city,
        state: bank.state,
        pincode: bank.pincode,
      } : null,
    });
    total += comm.totalCommission;
  }

  if (records.length === 0) {
    console.log(`ℹ️  No Wholesale commission found for ${id}`);
    return null;
  }

  const batch = await PayoutBatch.create({
    batchId: id,
    type: 'WHOLESALE_COMMISSION',
    periodStart,
    periodEnd,
    scheduledDate: lastDayOf(y, m),
    totalAmount: total,
    totalEmployees: records.length,
    createdBy: 'SYSTEM',
  });

  await PayoutRecord.insertMany(records.map(r => ({ ...r, batchId: batch._id })));

  const admins = await User.find({ role: 'ADMIN' }).lean();
  await createBulkNotifications(
    admins.map(a => a._id),
    {
      type: 'PAYOUT',
      title: 'Wholesale Commission Payout Ready',
      message: `${records.length} wholesale users · Total ₹${total.toLocaleString('en-IN')}`,
      data: { batchId: batch._id, type: 'WHOLESALE_COMMISSION' },
    }
  );

  console.log(`✅ Batch ${id} created — ₹${total} for ${records.length} wholesale users`);
  return batch;
}

// ─────────────────────────────────────────────────────────────────────────────
// Called by cron — checks if today needs any batch creation
// ─────────────────────────────────────────────────────────────────────────────
async function runScheduledPayouts() {
  const now  = new Date();
  const day  = now.getDate();
  const last = lastDayOf(now.getFullYear(), now.getMonth()).getDate();

  if (day === 15) {
    console.log('📅 15th detected — generating RP Mid + IV Mid batches...');
    await generateRpMidBatch(now);
    await generateIvMidBatch(now);
  }
  if (day === last) {
    console.log('📅 Month-end detected — generating RP End + IV End + Salary + Commission batches...');
    await generateRpEndBatch(now);
    await generateIvEndBatch(now);
    await generateSalaryBatch(now);
    await generateMiniStockCommissionBatch(now);
    await generateWholesaleCommissionBatch(now);
  }
}

module.exports = {
  generateRpMidBatch,
  generateRpEndBatch,
  generateIvMidBatch,
  generateIvEndBatch,
  generateSalaryBatch,
  generateAdvisorSalaryBatch,
  generateEmployeeSalaryBatch,
  generateMiniStockCommissionBatch,
  generateWholesaleCommissionBatch,
  runScheduledPayouts,
};
