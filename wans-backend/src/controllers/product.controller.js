const path      = require('path');
const fs        = require('fs');
const Product   = require('../models/Product');

const uploadDir = path.join(__dirname, '../../uploads/products');

// ─── helpers ──────────────────────────────────────────────────────────────────
function deleteFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
}

function parseTagsFromBody(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(t => t.trim()).filter(Boolean);
  return raw.split(',').map(t => t.trim()).filter(Boolean);
}

// Fields visible to admins only
const ADMIN_ONLY_FIELDS = ['rp', 'sv', 'rv', 'iv', 'wholesalePrice', 'miniStockPrice', 'wholesaleMargin', 'miniStockMargin'];

function stripSensitiveFields(productObj, isAdmin) {
  if (isAdmin) return productObj;
  const cleaned = { ...productObj };
  ADMIN_ONLY_FIELDS.forEach(f => delete cleaned[f]);
  return cleaned;
}

// ─── GET /api/products ────────────────────────────────────────────────────────
exports.getAllProducts = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    const { category, status, q, includeDeleted } = req.query;
    const filter = { isDeleted: false }; // Exclude deleted products by default
    
    // Admin can optionally include deleted products
    if (isAdmin && includeDeleted === 'true') {
      delete filter.isDeleted;
    }
    
    if (category && category !== 'All') filter.category = category;
    if (status   && status   !== 'All') filter.status   = status;
    if (q) filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { sku:  { $regex: q, $options: 'i' } },
      { brand:{ $regex: q, $options: 'i' } },
    ];

    const products = await Product.find(filter).sort({ name: 1 }).lean();
    const data = products.map(p => stripSensitiveFields(p, isAdmin));
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /api/products/:id ────────────────────────────────────────────────────
exports.getProduct = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    const filter = { _id: req.params.id };
    
    // Non-admin users cannot see deleted products
    if (!isAdmin) {
      filter.isDeleted = false;
    }
    
    const product = await Product.findOne(filter).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: stripSensitiveFields(product, isAdmin) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /api/products ───────────────────────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const productData = {
      name:        req.body.name,
      sku:         req.body.sku,
      category:    req.body.category,
      unit:        req.body.unit || 'unit',
      unitQuantity: req.body.unitQuantity ? parseFloat(req.body.unitQuantity) : null,
      actualPrice: parseFloat(req.body.actualPrice),
      price:       parseFloat(req.body.price),
      taxRate:     req.body.taxRate ? parseFloat(req.body.taxRate) : 18,
      mrp:         req.body.mrp  ? parseFloat(req.body.mrp)  : 0,
      rp:          req.body.rp   ? parseFloat(req.body.rp)   : 0,
      sv:          req.body.sv   ? parseFloat(req.body.sv)   : 0,
      rv:          req.body.rv   ? parseFloat(req.body.rv)   : 0,
      iv:          req.body.iv   ? parseFloat(req.body.iv)   : 0,
      wholesalePrice: req.body.wholesalePrice ? parseFloat(req.body.wholesalePrice) : 0,
      miniStockPrice: req.body.miniStockPrice ? parseFloat(req.body.miniStockPrice) : 0,
      description: req.body.description || '',
      brand:       req.body.brand       || '',
      weight:      req.body.weight      || '',
      tags:        parseTagsFromBody(req.body.tags),
      ingredients: req.body.ingredients || '',
      howToUse:    req.body.howToUse    || '',
      benefits:    req.body.benefits    || '',
      dosage:      req.body.dosage      || '',
      disclaimer:  req.body.disclaimer  || '',
    };

    if (req.file) {
      productData.image = `/uploads/products/${req.file.filename}`;
    }

    const product = await Product.create(productData);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    // Clean up uploaded file on failure
    if (req.file) deleteFile(path.join(uploadDir, req.file.filename));

    // Friendly duplicate key message
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: `SKU "${req.body.sku}" already exists` });
    }
    res.status(400).json({ success: false, error: err.message });
  }
};

// ─── PUT /api/products/:id ────────────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    const updateData = {
      name:        req.body.name,
      sku:         req.body.sku,
      category:    req.body.category,
      unit:        req.body.unit || product.unit,
      unitQuantity: req.body.unitQuantity != null ? parseFloat(req.body.unitQuantity) : product.unitQuantity,
      actualPrice: parseFloat(req.body.actualPrice),
      price:       parseFloat(req.body.price),
      taxRate:     req.body.taxRate != null ? parseFloat(req.body.taxRate) : product.taxRate,
      mrp:         req.body.mrp != null ? parseFloat(req.body.mrp) : product.mrp,
      rp:          req.body.rp  != null ? parseFloat(req.body.rp)  : product.rp,
      sv:          req.body.sv  != null ? parseFloat(req.body.sv)  : product.sv,
      rv:          req.body.rv  != null ? parseFloat(req.body.rv)  : product.rv,
      iv:          req.body.iv  != null ? parseFloat(req.body.iv)  : product.iv,
      wholesalePrice: req.body.wholesalePrice != null ? parseFloat(req.body.wholesalePrice) : product.wholesalePrice,
      miniStockPrice: req.body.miniStockPrice != null ? parseFloat(req.body.miniStockPrice) : product.miniStockPrice,
      description: req.body.description ?? product.description,
      brand:       req.body.brand       ?? product.brand,
      weight:      req.body.weight      ?? product.weight,
      tags:        parseTagsFromBody(req.body.tags),
      ingredients: req.body.ingredients ?? product.ingredients,
      howToUse:    req.body.howToUse    ?? product.howToUse,
      benefits:    req.body.benefits    ?? product.benefits,
      dosage:      req.body.dosage      ?? product.dosage,
      disclaimer:  req.body.disclaimer  ?? product.disclaimer,
    };

    if (req.file) {
      // Delete old image
      if (product.image) {
        deleteFile(path.join(__dirname, '../../', product.image));
      }
      updateData.image = `/uploads/products/${req.file.filename}`;
    }

    // Handle clearImage flag
    if (req.body.clearImage === 'true') {
      if (product.image) {
        deleteFile(path.join(__dirname, '../../', product.image));
      }
      updateData.image = null;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    if (req.file) deleteFile(path.join(uploadDir, req.file.filename));
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: `SKU "${req.body.sku}" already exists` });
    }
    res.status(400).json({ success: false, error: err.message });
  }
};

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const Inventory = require('../models/Inventory');
    
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    
    // ── CRITICAL: Check if any inventory has stock of this product ──────────────
    const inventoriesWithStock = await Inventory.find({
      'items.productId': req.params.id,
      'items.current': { $gt: 0 }
    }).populate('ownerId', 'name role shopName');
    
    if (inventoriesWithStock.length > 0) {
      // Build detailed error message showing who has stock
      const stockHolders = inventoriesWithStock.map(inv => {
        const item = inv.items.find(i => i.productId.toString() === req.params.id);
        const ownerName = inv.ownerId?.name || 'Unknown';
        const ownerRole = inv.ownerId?.role || 'Unknown';
        const shopName = inv.ownerId?.shopName ? ` (${inv.ownerId.shopName})` : '';
        return `${ownerName}${shopName} [${ownerRole}]: ${item.current} units`;
      });
      
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete product with existing stock',
        message: `This product cannot be deleted because the following users still have stock:\n\n${stockHolders.join('\n')}\n\nPlease ensure all stock is sold or transferred before deleting this product.`,
        stockHolders: inventoriesWithStock.map(inv => {
          const item = inv.items.find(i => i.productId.toString() === req.params.id);
          return {
            ownerId: inv.ownerId?._id,
            ownerName: inv.ownerId?.name,
            ownerRole: inv.ownerId?.role,
            shopName: inv.ownerId?.shopName,
            currentStock: item.current
          };
        })
      });
    }
    
    // ── Safe to delete: No stock exists ──────────────────────────────────────────
    // Soft delete: mark as deleted instead of removing from database
    product.isDeleted = true;
    product.deletedAt = new Date();
    product.status = 'Out of Stock'; // Prevent any new sales
    await product.save();
    
    res.json({ 
      success: true, 
      data: { 
        message: 'Product deleted successfully',
        note: 'Product is archived and will no longer appear in listings'
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /api/products/:id/stock-check ────────────────────────────────────────
exports.checkProductStock = async (req, res) => {
  try {
    const Inventory = require('../models/Inventory');
    
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    
    // Check if any inventory has stock of this product
    const inventoriesWithStock = await Inventory.find({
      'items.productId': req.params.id,
      'items.current': { $gt: 0 }
    }).populate('ownerId', 'name role shopName email phone');
    
    const stockHolders = inventoriesWithStock.map(inv => {
      const item = inv.items.find(i => i.productId.toString() === req.params.id);
      return {
        ownerId: inv.ownerId?._id,
        ownerName: inv.ownerId?.name,
        ownerRole: inv.ownerId?.role,
        shopName: inv.ownerId?.shopName,
        email: inv.ownerId?.email,
        phone: inv.ownerId?.phone,
        currentStock: item.current,
        received: item.received,
        dispatched: item.dispatched
      };
    });
    
    const totalStock = stockHolders.reduce((sum, holder) => sum + holder.currentStock, 0);
    const canDelete = stockHolders.length === 0;
    
    res.json({ 
      success: true, 
      data: {
        productId: product._id,
        productName: product.name,
        productSku: product.sku,
        canDelete,
        totalStock,
        stockHoldersCount: stockHolders.length,
        stockHolders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
