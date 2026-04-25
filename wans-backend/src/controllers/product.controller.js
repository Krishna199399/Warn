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

// ─── GET /api/products ────────────────────────────────────────────────────────
exports.getAllProducts = async (req, res) => {
  try {
    const { category, status, q } = req.query;
    const filter = {};
    if (category && category !== 'All') filter.category = category;
    if (status   && status   !== 'All') filter.status   = status;
    if (q) filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { sku:  { $regex: q, $options: 'i' } },
      { brand:{ $regex: q, $options: 'i' } },
    ];

    const products = await Product.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, data: products, count: products.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /api/products/:id ────────────────────────────────────────────────────
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
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
      price:       parseFloat(req.body.price),
      description: req.body.description || '',
      brand:       req.body.brand       || '',
      weight:      req.body.weight      || '',
      tags:        parseTagsFromBody(req.body.tags),
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
      price:       parseFloat(req.body.price),
      description: req.body.description ?? product.description,
      brand:       req.body.brand       ?? product.brand,
      weight:      req.body.weight      ?? product.weight,
      tags:        parseTagsFromBody(req.body.tags),
    };

    if (req.file) {
      // Delete old image
      if (product.image) {
        deleteFile(path.join(__dirname, '../../', product.image));
      }
      updateData.image = `/uploads/products/${req.file.filename}`;
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
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    if (product.image) {
      deleteFile(path.join(__dirname, '../../', product.image));
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: { message: 'Product deleted successfully' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
