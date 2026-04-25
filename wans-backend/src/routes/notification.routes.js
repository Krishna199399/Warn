const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getNotifications, markAllRead, markRead } = require('../controllers/notification.controller');

router.get('/',          protect, getNotifications);
router.put('/read-all',  protect, markAllRead);
router.put('/:id/read',  protect, markRead);

module.exports = router;
