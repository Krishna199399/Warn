const mongoose = require('mongoose');

const inventoryLineSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  received:    { type: Number, default: 0 },
  dispatched:  { type: Number, default: 0 },
  current:     { type: Number, default: 0 },
  minLevel:    { type: Number, default: 10 },
  lastUpdated: { type: Date, default: Date.now },
}, { _id: false });

const inventorySchema = new mongoose.Schema({
  ownerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  ownerRole:{ type: String, enum: ['WHOLESALE','MINI_STOCK'], required: true },
  items:    [inventoryLineSchema],
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
