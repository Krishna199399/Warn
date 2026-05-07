const jwt   = require('jsonwebtoken');
const User  = require('../models/User');
const { notifyNewUserRegistration } = require('../services/notification.service');
const { generateEmployeeCode, isValidEmployeeCode } = require('../utils/generateEmployeeCode');

// Roles that can self-register
const SELF_REGISTER_ROLES = ['ADVISOR','WHOLESALE','MINI_STOCK','CUSTOMER'];

// Employee roles that require approval
const EMPLOYEE_ROLES = ['STATE_HEAD', 'ZONAL_MANAGER', 'AREA_MANAGER', 'DO_MANAGER', 'ADVISOR'];

// Auto-generate unique advisor code: ADV + 5 digits
const generateAdvisorCode = async () => {
  const last = await User.findOne({ advisorCode: { $ne: null } }).sort({ createdAt: -1 }).lean();
  const lastNum = last?.advisorCode ? parseInt(last.advisorCode.replace('ADV',''), 10) : 100;
  const next = String(lastNum + 1).padStart(5, '0');
  return `ADV${next}`;
};

const signAccess   = (id) => jwt.sign({ id }, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_EXPIRES_IN });
const signRefresh  = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body; // identifier can be email, phone, or employee code
    if (!identifier || !password) return res.status(400).json({ success: false, error: 'Email/Phone/Employee Code and password required' });

    let user;

    // Check if identifier is an employee code (format: PREFIX-YEAR-NUMBER)
    if (isValidEmployeeCode(identifier)) {
      user = await User.findOne({ employeeCode: identifier.toUpperCase() });
    } else {
      // Try to find user by email or phone
      user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { phone: identifier }
        ]
      });
    }
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Check registration status for employees
    if (EMPLOYEE_ROLES.includes(user.role)) {
      if (user.registrationStatus === 'pending') {
        return res.status(403).json({ 
          success: false, 
          error: 'Your registration is pending admin approval. You will receive your employee code once approved.' 
        });
      }
      if (user.registrationStatus === 'rejected') {
        const reason = user.rejectionReason ? ` Reason: ${user.rejectionReason}` : '';
        return res.status(403).json({ 
          success: false, 
          error: `Your registration was rejected.${reason} You cannot reapply.` 
        });
      }
    }
    
    // Check approval status (legacy status field)
    if (user.status === 'PENDING') {
      return res.status(403).json({ success: false, error: 'Your account is pending approval. Please wait for admin confirmation.' });
    }
    if (user.status === 'REJECTED') {
      return res.status(403).json({ success: false, error: 'Your account registration was rejected. Please contact support.' });
    }
    if (user.status === 'INACTIVE') {
      return res.status(403).json({ success: false, error: 'Your account has been deactivated. Please contact support.' });
    }
    if (user.status === 'TERMINATED') {
      return res.status(403).json({ success: false, error: 'Your account has been terminated. Please contact HR.' });
    }
    if (user.status === 'SELF_DELETED') {
      return res.status(403).json({ success: false, error: 'This account has been deleted.' });
    }

    const accessToken  = signAccess(user._id);
    const refreshToken = signRefresh(user._id);

    // Store refresh token + update lastLoginAt
    await user.constructor.findByIdAndUpdate(user._id, { refreshToken, lastLoginAt: new Date() });

    // Set refresh token as httpOnly cookie (7 days)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { accessToken, user: user.toSafeObject() } });
  } catch (err) { next(err); }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ success: false, error: 'No refresh token' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    const accessToken = signAccess(user._id);
    res.json({ success: true, data: { accessToken } });
  } catch (err) { next(err); }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, data: { message: 'Logged out' } });
  } catch (err) { next(err); }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, data: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, phone, password, role, referralCode, shopName, location } = req.body;

    // Validate role
    if (!SELF_REGISTER_ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: `Role '${role}' cannot self-register. Contact your admin.` });
    }
    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, error: 'Name, phone, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    // Check duplicate phone
    const exists = await User.findOne({ phone });
    if (exists) return res.status(400).json({ success: false, error: 'Phone number already registered' });

    // Generate email from phone (internal use only)
    const email = `${phone}@wans.local`;

    // ─── ADVISOR ASSIGNMENT LOGIC ─────────────────────────────────────────────
    let parentId = null;
    let assignmentMethod = 'none';

    if (role === 'ADVISOR') {
      // Priority 1: Referral code (advisor code or phone)
      if (referralCode?.trim()) {
        const parent = await User.findOne({
          $or: [
            { advisorCode: referralCode.toUpperCase(), role: 'DO_MANAGER', status: 'APPROVED' },
            { phone: referralCode, role: 'DO_MANAGER', status: 'APPROVED' },
          ],
        });
        if (parent) {
          parentId = parent._id;
          assignmentMethod = 'referral';
        }
      }

      // Priority 2: Admin assignment (no parent assigned, admin will assign manually)
      if (!parentId) {
        assignmentMethod = 'admin_queue';
      }
    }

    // Generate advisor code for ADVISOR role
    const advisorCode = role === 'ADVISOR' ? await generateAdvisorCode() : null;

    // Build avatar initials
    const nameParts = name.trim().split(' ');
    const avatar = nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

    // Determine initial status
    // Only CUSTOMER is auto-approved
    // WHOLESALE, MINI_STOCK, and ADVISOR need approval
    const initialStatus = (role === 'CUSTOMER') ? 'APPROVED' : 'PENDING';

    const newUser = await User.create({
      name, email, phone, password, role,
      avatar, parentId, advisorCode, shopName, location,
      status: initialStatus,
      roleHistory: [{ role, from: new Date(), to: null }],
    });

    // Notify admins about new registration if pending approval
    if (initialStatus === 'PENDING') {
      await notifyNewUserRegistration(newUser);
    }

    // Issue tokens only if approved
    if (initialStatus === 'APPROVED') {
      const accessToken  = signAccess(newUser._id);
      const refreshToken = signRefresh(newUser._id);
      await User.findByIdAndUpdate(newUser._id, { refreshToken });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge:   7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        success: true,
        data: { accessToken, user: newUser.toSafeObject() },
        message: `✅ Account created! ${advisorCode ? 'Your Advisor Code: ' + advisorCode : ''}`,
      });
    }

    // For PENDING status (Advisors)
    res.status(201).json({
      success: true,
      data: { user: newUser.toSafeObject() },
      message: `✅ Registration successful! ${advisorCode ? 'Your Advisor Code: ' + advisorCode + '. ' : ''}Your account is pending approval. You'll receive a notification once approved.`,
      assignmentMethod,
    });
  } catch (err) { next(err); }
};

// PUT /api/auth/profile — update own profile (name, email, phone, upiId)
const updateMyProfile = async (req, res, next) => {
  try {
    const { name, email, phone, upiId } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();
    if (phone) {
      // Check if phone is already taken by another user
      const existing = await User.findOne({ phone, _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Phone number already in use' });
      }
      updates.phone = phone.trim();
    }
    // Allow Wholesale and Mini Stock to set their UPI ID
    if (upiId !== undefined) {
      updates.upiId = upiId ? upiId.trim() : null;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, data: user.toSafeObject(), message: 'Profile updated successfully' });
  } catch (err) { next(err); }
};

// PUT /api/auth/change-password — change own password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
};

// DELETE /api/auth/delete-account — self-delete (requires password confirmation)
const deleteMyAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required to delete your account' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect password' });
    }

    // Soft-delete: change status, clear token
    user.status = 'SELF_DELETED';
    user.terminatedAt = new Date();
    user.terminationReason = 'Self-deleted by user';
    user.refreshToken = null;
    await user.save();

    // Reassign farmers if advisor
    if (user.role === 'ADVISOR') {
      const { reassignFarmersFromAdvisor } = require('../controllers/farmer.controller');
      await reassignFarmersFromAdvisor(user._id);
    }

    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) { next(err); }
};

// POST /api/auth/register-employee — Employee self-registration (requires approval)
const registerEmployee = async (req, res, next) => {
  try {
    const { name, email, phone, password, appliedRole, state, district, address } = req.body;

    // Validate employee role
    if (!EMPLOYEE_ROLES.includes(appliedRole)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid role. Allowed roles: ${EMPLOYEE_ROLES.join(', ')}` 
      });
    }

    // Validate required fields
    if (!name || !email || !phone || !password || !appliedRole) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, phone, password, and role are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 6 characters' 
      });
    }

    // Check duplicate email
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // Check duplicate phone
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number already registered' 
      });
    }

    // Build avatar initials
    const nameParts = name.trim().split(' ');
    const avatar = nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

    // Create user with pending status
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role: appliedRole, // Set role immediately (will be used for employee code generation)
      appliedRole,
      state: state?.trim() || '',
      region: district?.trim() || '',
      avatar,
      status: 'PENDING', // Legacy status field
      registrationStatus: 'pending', // New employee registration status
      appliedAt: new Date(),
      roleHistory: [{ role: appliedRole, from: new Date(), to: null }],
    });

    // Notify admins about new employee registration
    await notifyNewUserRegistration(newUser);

    res.status(201).json({
      success: true,
      data: { 
        applicationId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        appliedRole: newUser.appliedRole,
        appliedAt: newUser.appliedAt,
      },
      message: `✅ Registration submitted successfully! Your application is pending admin approval. You will receive your employee code once approved.`,
    });
  } catch (err) { next(err); }
};

module.exports = { login, refresh, logout, getMe, register, registerEmployee, updateMyProfile, changePassword, deleteMyAccount };
