const express = require('express');
const router  = express.Router();
const { login, refresh, logout, getMe, register } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login',    login);
router.post('/refresh',  refresh);
router.post('/logout',   protect, logout);
router.get('/me',        protect, getMe);

module.exports = router;
