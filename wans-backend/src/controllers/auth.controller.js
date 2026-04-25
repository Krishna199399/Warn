const jwt   = require('jsonwebtoken');
const User  = require('../models/User');
const { notifyNewUserRegistration } = require('../services/notification.service');

// Roles that can self-register
const SELF_REGISTER_ROLES = ['ADVISOR','WHOLESALE','MINI_STOCK','CUSTOMER'];

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
    const { identifier, password } = req.body; // identifier can be email or phone
    if (!identifier || !password) return res.status(400).json({ success: false, error: 'Email/Phone and password required' });

    // Try to find user by email or phone
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Check approval status
    if (user.status === 'PENDING') {
      return res.status(403).json({ success: false, error: 'Your account is pending approval. Please wait for admin confirmation.' });
    }
    if (user.status === 'REJECTED') {
      return res.status(403).json({ success: false, error: 'Your account registration was rejected. Please contact support.' });
    }
    if (user.status === 'INACTIVE') {
      return res.status(403).json({ success: false, error: 'Your account has been deactivated. Please contact support.' });
    }

    const accessToken  = signAccess(user._id);
    const refreshToken = signRefresh(user._id);

    // Store refresh token (bypass pre-save hook with updateOne)
    await user.constructor.findByIdAndUpdate(user._id, { refreshToken });

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
    // WHOLESALE, MINI_STOCK, and CUSTOMER are auto-approved
    // ADVISOR needs approval
    const initialStatus = (role === 'WHOLESALE' || role === 'MINI_STOCK' || role === 'CUSTOMER') ? 'APPROVED' : 'PENDING';

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

module.exports = { login, refresh, logout, getMe, register };
