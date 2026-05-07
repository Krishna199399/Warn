import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Save, X } from 'lucide-react';
import { categoriesApi } from '../../api/categories.api';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import ImageUploader from '../../components/admin/ImageUploader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    image: '',
    description: '',
    order: 0,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load categories');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setImageFile(null);
      setFormData({
        name: category.name,
        key: category.key,
        image: category.image,
        description: category.description || '',
        order: category.order || 0,
      });
    } else {
      setEditingCategory(null);
      setImageFile(null);
      setFormData({
        name: '',
        key: '',
        image: '',
        description: '',
        order: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setImageFile(null);
    setFormData({
      name: '',
      key: '',
      image: '',
      description: '',
      order: 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const fd = new FormData();
      fd.append('name', formData.name.trim());
      fd.append('key', formData.key.trim().toUpperCase());
      fd.append('description', formData.description.trim());
      fd.append('order', formData.order);
      
      // Only append image if a new file is selected
      if (imageFile) {
        fd.append('image', imageFile);
      }
      // If editing and no new file, keep the existing image path
      else if (editingCategory && formData.image) {
        fd.append('existingImage', formData.image);
      }
      
      if (editingCategory) {
        await categoriesApi.update(editingCategory._id, fd);
        toast.success('Category updated successfully');
      } else {
        await categoriesApi.create(fd);
        toast.success('Category created successfully');
      }
      
      loadCategories();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save category');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await categoriesApi.delete(id);
      toast.success('Category deleted successfully');
      loadCategories();
    } catch (error) {
      toast.error('Failed to delete category');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage product categories and their images
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category._id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Category Image */}
                <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                    </div>
                  )}
                </div>

                {/* Category Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{category.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Key: {category.key}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {category.productCount || 0} products
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Order: {category.order}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenDialog(category)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(category._id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Fertilizers"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="key">Category Key *</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                  placeholder="e.g., FERTILIZERS"
                  required
                  disabled={!!editingCategory}
                />
                <p className="text-xs text-muted-foreground">
                  Uppercase, no spaces. Used in product category field.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Category Image</Label>
              <ImageUploader
                value={imageFile}
                previewUrl={formData.image ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${formData.image}` : null}
                onChange={(file) => setImageFile(file)}
                onClear={() => setImageFile(null)}
              />
              <p className="text-xs text-muted-foreground">
                Upload an image for this category (recommended: 400x400px)
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
