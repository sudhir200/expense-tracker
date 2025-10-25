'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import EmojiPicker from '@/components/ui/EmojiPicker';
import { api } from '@/lib/api';
import { Category } from '@/types/expense';
import { 
  Plus,
  Edit,
  Trash2,
  Tag,
  Palette,
  Search,
  Grid,
  List,
  MoreHorizontal
} from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    icon: '📦',
  });

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      color: '#3B82F6',
      icon: '📦',
    });
    setError(null);
  };

  // Create category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setFormLoading(true);
      setError(null);
      
      const response = await api.post('/api/categories', formData);
      
      if (response.ok) {
        const newCategory = await response.json();
        setCategories(prev => [...prev, newCategory]);
        setIsCreateModalOpen(false);
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      setError('Failed to create category');
    } finally {
      setFormLoading(false);
    }
  };

  // Edit category
  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategory || !formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setFormLoading(true);
      setError(null);
      
      const response = await api.put(`/api/categories/${editingCategory._id}`, formData);
      
      if (response.ok) {
        const updatedCategory = await response.json();
        setCategories(prev => prev.map(cat => 
          cat._id === editingCategory._id ? updatedCategory : cat
        ));
        setIsEditModalOpen(false);
        setEditingCategory(null);
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      setError('Failed to update category');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      setFormLoading(true);
      setError(null);
      
      const response = await api.delete(`/api/categories/${deletingCategory._id}`);
      
      if (response.ok) {
        setCategories(prev => prev.filter(cat => cat._id !== deletingCategory._id));
        setIsDeleteModalOpen(false);
        setDeletingCategory(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Failed to delete category');
    } finally {
      setFormLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon || '📦',
    });
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  // Close modals
  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setEditingCategory(null);
    setDeletingCategory(null);
    resetForm();
  };

  return (
    <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🏷️ Categories</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your expense and income categories
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>➕ Add Category</span>
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* View mode toggle */}
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Categories display */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading categories...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No categories found' : 'No categories yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create your first category to get started'
            }
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              ➕ Add Category
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Grid view */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCategories.map((category) => (
                <Card key={category._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: category.color }}
                        >
                          {category.icon || '📦'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {category.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {category.color}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(category)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(category)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List view */}
          {viewMode === 'list' && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-white">Category</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-white">Color</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-white">Icon</th>
                        <th className="text-right py-3 px-6 font-medium text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCategories.map((category) => (
                        <tr key={category._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                                style={{ backgroundColor: category.color }}
                              >
                                {category.icon || '📦'}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {category.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: category.color }}
                              ></div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {category.color}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-lg">{category.icon || '📦'}</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteModal(category)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create Category Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeModals}
        title="➕ Create Category"
        size="sm"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Groceries, Gas, Entertainment"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
              />
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon (Emoji)
            </label>
            <EmojiPicker
              value={formData.icon}
              onChange={(emoji) => handleInputChange('icon', emoji)}
              placeholder="📦"
            />
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={formLoading} className="flex-1">
              {formLoading ? 'Creating...' : 'Create Category'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeModals}
              disabled={formLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeModals}
        title="✏️ Edit Category"
        size="sm"
      >
        <form onSubmit={handleEditCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Groceries, Gas, Entertainment"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
              />
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon (Emoji)
            </label>
            <EmojiPicker
              value={formData.icon}
              onChange={(emoji) => handleInputChange('icon', emoji)}
              placeholder="📦"
            />
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={formLoading} className="flex-1">
              {formLoading ? 'Updating...' : 'Update Category'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeModals}
              disabled={formLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        title="🗑️ Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete the category "{deletingCategory?.name}"? 
            This action cannot be undone.
          </p>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleDeleteCategory}
              disabled={formLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {formLoading ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeModals}
              disabled={formLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
