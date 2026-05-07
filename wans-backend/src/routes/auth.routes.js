const express = require('express');
const router  = express.Router();
const { login, refresh, logout, getMe, register, registerEmployee, updateMyProfile, changePassword, deleteMyAccount } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { loginSchema, registerSchema, changePasswordSchema } = require('../schemas/auth.schema');

// 🔒 SECURITY: Validation applied to auth endpoints
router.post('/register', validate(registerSchema), register);
router.post('/register-employee', validate(registerSchema), registerEmployee);
router.post('/login',    validate(loginSchema), login);
router.post('/refresh',  refresh);
router.post('/logout',   protect, logout);
router.get('/me',        protect, getMe);
router.put('/profile',   protect, updateMyProfile);
router.put('/change-password', protect, validate(changePasswordSchema), changePassword);
router.delete('/delete-account', protect, deleteMyAccount);

module.exports = router;
