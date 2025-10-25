'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Category } from '@/types/expense';

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  onCategoryAdded?: () => void;
  required?: boolean;
  className?: string;
}

export default function CategorySelector({ 
  value, 
  onChange, 
  onCategoryAdded, 
  required = false,
  className = ""
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    color: '#3B82F6',
  });
  const [newCategoryLoading, setNewCategoryLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryForm.name.trim()) {
      return;
    }

    try {
      setNewCategoryLoading(true);
      
      const response = await api.post('/api/categories', {
        name: newCategoryForm.name.trim(),
        color: newCategoryForm.color,
      });

      if (response.ok) {
        const newCategory = await response.json();
        
        // Update categories list
        setCategories(prev => [...prev, newCategory]);
        
        // Select the new category
        onChange(newCategory.name);
        
        // Reset form
        setNewCategoryForm({ name: '', color: '#3B82F6' });
        setIsAddingCategory(false);
        
        // Notify parent component
        onCategoryAdded?.();
      }
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setNewCategoryLoading(false);
    }
  };

  const handleCancelAddCategory = () => {
    setIsAddingCategory(false);
    setNewCategoryForm({ name: '', color: '#3B82F6' });
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Category {required && '*'}
        </label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsAddingCategory(true)}
          className="flex items-center space-x-1"
        >
          <Plus className="h-3 w-3" />
          <span>Add</span>
        </Button>
      </div>

      {/* Add Category Form */}
      {isAddingCategory && (
        <div className="mb-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
          <form onSubmit={handleCreateCategory} className="space-y-3">
            <div className="flex space-x-2">
              <Input
                type="text"
                value={newCategoryForm.name}
                onChange={(e) => setNewCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Category name"
                className="flex-1"
                required
              />
              <input
                type="color"
                value={newCategoryForm.color}
                onChange={(e) => setNewCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                title="Category color"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                type="submit"
                size="sm"
                disabled={!newCategoryForm.name.trim() || newCategoryLoading}
                className="flex-1"
              >
                {newCategoryLoading ? 'Creating...' : 'Create Category'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCancelAddCategory}
                disabled={newCategoryLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Category Select */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        required={required}
      >
        <option value="">Select category</option>
        {categories.map((category) => (
          <option key={category._id} value={category.name}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}
