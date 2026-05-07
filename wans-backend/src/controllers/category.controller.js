const Category = require('../models/Category');
const Product = require('../models/Product');

// GET /api/categories - Get all categories with product counts
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .lean();

    // Get product counts for each category (case-insensitive match)
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await Product.countDocuments({ 
          category: { $regex: new RegExp(`^${category.key}$`, 'i') }
        });
        return { ...category, productCount: count };
      })
    );

    res.json({ success: true, data: categoriesWithCounts });
  } catch (err) {
    next(err);
  }
};

// GET /api/categories/:id - Get single category
const getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// POST /api/categories - Create category (Admin only)
const createCategory = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const categoryData = {
      name: req.body.name,
      key: req.body.key,
      description: req.body.description || '',
      order: req.body.order || 0,
    };
    
    // If image was uploaded, save the path
    if (req.file) {
      categoryData.image = `/uploads/categories/${req.file.filename}`;
    }

    const category = await Category.create(categoryData);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// PUT /api/categories/:id - Update category (Admin only)
const updateCategory = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    // Build update data - only include fields that should be updated
    const updateData = {
      name: req.body.name,
      description: req.body.description,
      order: req.body.order,
    };
    
    // Only update image if a new file was uploaded
    if (req.file) {
      updateData.image = `/uploads/categories/${req.file.filename}`;
    }
    // If existingImage is provided and no new file, keep the existing image
    else if (req.body.existingImage) {
      updateData.image = req.body.existingImage;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/categories/:id - Delete category (Admin only)
const deleteCategory = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
