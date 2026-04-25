const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/my',    protect, ctrl.getMyTasks);
router.post('/',     protect, ctrl.createTask);
router.put('/:id',   protect, ctrl.updateTask);
router.delete('/:id',protect, ctrl.deleteTask);

module.exports = router;
