const Task = require('../models/Task');
const User = require('../models/User');
const { notifyTaskAssigned } = require('../services/notification.service');

const getMyTasks = async (req, res, next) => {
  try {
    // Auto-mark overdue tasks
    await Task.updateMany(
      { assignedTo: req.user._id, status: 'Pending', due: { $lt: new Date() } },
      { status: 'Overdue' }
    );
    const tasks = await Task.find({ assignedTo: req.user._id }).sort({ due: 1 }).lean();
    res.json({ success: true, data: tasks });
  } catch (err) { next(err); }
};

const createTask = async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, assignedTo: req.user._id });
    
    // Notify the assignee
    const assignee = await User.findById(task.assignedTo);
    if (assignee) {
      await notifyTaskAssigned(task, assignee);
    }
    
    res.status(201).json({ success: true, data: task });
  } catch (err) { next(err); }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, assignedTo: req.user._id },
      req.body, { new: true }
    );
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};

const deleteTask = async (req, res, next) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, assignedTo: req.user._id });
    res.json({ success: true, data: { message: 'Task deleted' } });
  } catch (err) { next(err); }
};

module.exports = { getMyTasks, createTask, updateTask, deleteTask };
