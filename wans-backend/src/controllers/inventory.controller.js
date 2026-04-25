const Inventory = require('../models/Inventory');
const StockTransfer = require('../models/StockTransfer');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');

// ─── GET MY INVENTORY ─────────────────────────────────────────────────────────
const getMyInventory = async (req, res, next) => {
  try {
    let inv = await Inventory.findOne({ ownerId: req.user._id })
      .populate('items.productId', 'name sku category unit price image brand').lean();
    
    // Create inventory if doesn't exist
    if (!inv) {
      inv = await Inventory.create({
        ownerId: req.user._id,
        ownerRole: req.user.role,
        items: [],
      });
      inv = await Inventory.findById(inv._id)
        .populate('items.productId', 'name sku category unit price image brand').lean();
    }
    
    res.json({ success: true, data: inv });
  } catch (err) { next(err); }
};

// ─── ADD STOCK FROM COMPANY (WHOLESALE ONLY) ──────────────────────────────────
const addStockFromCompany = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    
    if (req.user.role !== 'WHOLESALE') {
      return res.status(403).json({ success: false, error: 'Only Wholesale can add stock from company' });
    }
    
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, error: 'Product and valid quantity required' });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Find or create inventory
      let inv = await Inventory.findOne({ ownerId: req.user._id }).session(session);
      if (!inv) {
        inv = await Inventory.create([{
          ownerId: req.user._id,
          ownerRole: req.user.role,
          items: [],
        }], { session });
        inv = inv[0];
      }
      
      // Find existing item or add new
      const itemIndex = inv.items.findIndex(i => i.productId.toString() === productId);
      if (itemIndex >= 0) {
        inv.items[itemIndex].received += quantity;
        inv.items[itemIndex].current += quantity;
        inv.items[itemIndex].lastUpdated = new Date();
      } else {
        inv.items.push({
          productId,
          received: quantity,
          dispatched: 0,
          current: quantity,
          minLevel: 10,
          lastUpdated: new Date(),
        });
      }
      
      await inv.save({ session });
      
      // Record transfer
      await StockTransfer.create([{
        fromUserId: req.user._id, // Company represented by wholesale user
        toUserId: req.user._id,
        productId,
        quantity,
        transferType: 'COMPANY_TO_WHOLESALE',
        status: 'COMPLETED',
        notes: 'Stock added from company',
      }], { session });
      
      await session.commitTransaction();
      
      const updated = await Inventory.findById(inv._id)
        .populate('items.productId', 'name sku category unit price image brand');
      
      res.json({ success: true, data: updated, message: 'Stock added successfully' });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) { next(err); }
};

// ─── TRANSFER STOCK TO MINI STOCK (WHOLESALE ONLY) ────────────────────────────
const transferToMiniStock = async (req, res, next) => {
  try {
    const { miniStockId, productId, quantity } = req.body;
    
    if (req.user.role !== 'WHOLESALE') {
      return res.status(403).json({ success: false, error: 'Only Wholesale can transfer to Mini Stock' });
    }
    
    if (!miniStockId || !productId || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, error: 'Mini Stock, Product, and valid quantity required' });
    }
    
    // Validate mini stock user
    const miniStock = await User.findById(miniStockId);
    if (!miniStock || miniStock.role !== 'MINI_STOCK') {
      return res.status(404).json({ success: false, error: 'Mini Stock user not found' });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Check wholesale inventory
      const wholesaleInv = await Inventory.findOne({ ownerId: req.user._id }).session(session);
      if (!wholesaleInv) {
        throw new Error('Wholesale inventory not found');
      }
      
      const itemIndex = wholesaleInv.items.findIndex(i => i.productId.toString() === productId);
      if (itemIndex < 0 || wholesaleInv.items[itemIndex].current < quantity) {
        throw new Error('Insufficient stock');
      }
      
      // Deduct from wholesale
      wholesaleInv.items[itemIndex].dispatched += quantity;
      wholesaleInv.items[itemIndex].current -= quantity;
      wholesaleInv.items[itemIndex].lastUpdated = new Date();
      await wholesaleInv.save({ session });
      
      // Add to mini stock
      let miniStockInv = await Inventory.findOne({ ownerId: miniStockId }).session(session);
      if (!miniStockInv) {
        miniStockInv = await Inventory.create([{
          ownerId: miniStockId,
          ownerRole: 'MINI_STOCK',
          items: [],
        }], { session });
        miniStockInv = miniStockInv[0];
      }
      
      const miniItemIndex = miniStockInv.items.findIndex(i => i.productId.toString() === productId);
      if (miniItemIndex >= 0) {
        miniStockInv.items[miniItemIndex].received += quantity;
        miniStockInv.items[miniItemIndex].current += quantity;
        miniStockInv.items[miniItemIndex].lastUpdated = new Date();
      } else {
        miniStockInv.items.push({
          productId,
          received: quantity,
          dispatched: 0,
          current: quantity,
          minLevel: 10,
          lastUpdated: new Date(),
        });
      }
      
      await miniStockInv.save({ session });
      
      // Record transfer
      await StockTransfer.create([{
        fromUserId: req.user._id,
        toUserId: miniStockId,
        productId,
        quantity,
        transferType: 'WHOLESALE_TO_MINISTOCK',
        status: 'COMPLETED',
      }], { session });
      
      await session.commitTransaction();
      
      const updated = await Inventory.findById(wholesaleInv._id)
        .populate('items.productId', 'name sku category unit price image brand');
      
      res.json({ success: true, data: updated, message: 'Stock transferred successfully' });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) { next(err); }
};

// ─── GET TRANSFER HISTORY ──────────────────────────────────────────────────────
const getTransferHistory = async (req, res, next) => {
  try {
    const transfers = await StockTransfer.find({
      $or: [
        { fromUserId: req.user._id },
        { toUserId: req.user._id },
      ],
    })
      .populate('fromUserId', 'name role')
      .populate('toUserId', 'name role')
      .populate('productId', 'name sku category unit')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    res.json({ success: true, data: transfers });
  } catch (err) { next(err); }
};

// ─── GET ALL MINI STOCK USERS (FOR WHOLESALE) ─────────────────────────────────
const getMiniStockUsers = async (req, res, next) => {
  try {
    if (req.user.role !== 'WHOLESALE') {
      return res.status(403).json({ success: false, error: 'Only Wholesale can view Mini Stock users' });
    }
    
    const miniStocks = await User.find({ role: 'MINI_STOCK', status: 'APPROVED' })
      .select('name email phone shopName')
      .sort({ name: 1 })
      .lean();
    
    res.json({ success: true, data: miniStocks });
  } catch (err) { next(err); }
};

module.exports = {
  getMyInventory,
  addStockFromCompany,
  transferToMiniStock,
  getTransferHistory,
  getMiniStockUsers,
};
