/**
 * 🔒 SECURITY: Resource-level authorization middleware
 * Ensures users can only access their own resources
 */

const Order = require('../models/Order');
const User = require('../models/User');
const Inventory = require('../models/Inventory');

/**
 * Verify user owns the order
 */
exports.authorizeOrderAccess = async (req, res, next) => {
  try {
    const orderId = req.params.id || req.body.orderId;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Admin can access all orders
    if (req.user.role === 'ADMIN') {
      req.order = order;
      return next();
    }

    // Buyer can access their own orders
    if (order.buyerId.toString() === req.user._id.toString()) {
      req.order = order;
      return next();
    }

    // Seller can access orders they're selling
    if (order.sellerId.toString() === req.user._id.toString()) {
      req.order = order;
      return next();
    }

    // Unauthorized
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: You do not have access to this order'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authorization check failed',
      message: error.message
    });
  }
};

/**
 * Verify user owns the inventory
 */
exports.authorizeInventoryAccess = async (req, res, next) => {
  try {
    const inventoryId = req.params.id;
    
    if (!inventoryId) {
      return res.status(400).json({
        success: false,
        error: 'Inventory ID is required'
      });
    }

    const inventory = await Inventory.findById(inventoryId);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory not found'
      });
    }

    // Admin can access all inventory
    if (req.user.role === 'ADMIN') {
      req.inventory = inventory;
      return next();
    }

    // Owner can access their own inventory
    if (inventory.ownerId.toString() === req.user._id.toString()) {
      req.inventory = inventory;
      return next();
    }

    // Unauthorized
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: You do not have access to this inventory'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authorization check failed',
      message: error.message
    });
  }
};

/**
 * Verify user can access another user's profile
 */
exports.authorizeUserAccess = async (req, res, next) => {
  try {
    const userId = req.params.id || req.params.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Admin can access all users
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Users can access their own profile
    if (userId === req.user._id.toString()) {
      return next();
    }

    // Managers can access their subordinates
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if requesting user is in the target user's hierarchy
    if (targetUser.parentId && targetUser.parentId.toString() === req.user._id.toString()) {
      return next();
    }

    // Unauthorized
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: You do not have access to this user'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authorization check failed',
      message: error.message
    });
  }
};

/**
 * Verify user can modify resource (stricter than read access)
 */
exports.authorizeResourceModification = (resourceType) => {
  return async (req, res, next) => {
    try {
      // Only admin and resource owner can modify
      if (req.user.role === 'ADMIN') {
        return next();
      }

      const resourceId = req.params.id;
      let resource;

      switch (resourceType) {
        case 'order':
          resource = await Order.findById(resourceId);
          if (resource && resource.buyerId.toString() === req.user._id.toString()) {
            return next();
          }
          break;
        
        case 'inventory':
          resource = await Inventory.findById(resourceId);
          if (resource && resource.ownerId.toString() === req.user._id.toString()) {
            return next();
          }
          break;
        
        case 'user':
          if (resourceId === req.user._id.toString()) {
            return next();
          }
          break;
        
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid resource type'
          });
      }

      return res.status(403).json({
        success: false,
        error: 'Unauthorized: You cannot modify this resource'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed',
        message: error.message
      });
    }
  };
};
