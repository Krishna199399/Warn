const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:      { type: String, required: true },
  due:        { type: Date, required: true },
  priority:   { type: String, enum: ['High','Medium','Low'], default: 'Medium' },
  status:     { type: String, enum: ['Pending','Completed','Overdue'], default: 'Pending' },
  type:       { type: String, enum: ['Field Visit','Feedback','Demo','Report','Follow-up','Collection','Other'], default: 'Other' },
  notes:      { type: String, default: '' },
}, { timestamps: true });

taskSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
