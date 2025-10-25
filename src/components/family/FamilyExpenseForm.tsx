'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import EmojiPicker from '@/components/ui/EmojiPicker';
import { useFamily } from '@/hooks/useFamily';
import { X, Receipt, DollarSign, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Category } from '@/types/expense';

interface FamilyExpenseFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function FamilyExpenseForm({ onClose, onSuccess }: FamilyExpenseFormProps) {
  const { family } = useFamily();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // New category modal state (same as ExpenseForm)
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    color: '#3B82F6',
    icon: '📦',
  });
  const [newCategoryLoading, setNewCategoryLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    currency: family?.currency || 'USD',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Card',
    splitEqually: true,
    splitBetween: [] as { userId: string; amount: number; name: string }[],
  });

  // Fetch categories from database
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      if (response.ok) {
        const data = await response.json();
        // API returns categories directly, not wrapped in an object
        setCategories(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch categories:', response.status);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Category management functions (same as ExpenseForm)
  const categoryOptions = categories.map((cat) => ({
    value: cat.name,
    label: `${cat.icon || '🏷️'} ${cat.name}`,
  }));

  const categoryOptionsWithAdd = [
    ...categoryOptions,
    { value: '__add_new__', label: '➕ Add New Category' }
  ];

  const handleCategoryChange = (value: string) => {
    if (value === '__add_new__') {
      setIsNewCategoryModalOpen(true);
    } else {
      handleInputChange('category', value);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryForm.name.trim()) {
      return;
    }

    try {
      setNewCategoryLoading(true);
      
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategoryForm),
      });

      if (response.ok) {
        const newCategory = await response.json();
        
        // Update categories list
        setCategories(prev => [...prev, newCategory]);
        
        // Set the new category as selected
        setFormData(prev => ({ ...prev, category: newCategory.name }));
        
        // Reset form and close modal
        setNewCategoryForm({ name: '', color: '#3B82F6', icon: '📦' });
        setIsNewCategoryModalOpen(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      setError('Failed to create category');
    } finally {
      setNewCategoryLoading(false);
    }
  };

  const handleNewCategoryInputChange = (field: string, value: string) => {
    setNewCategoryForm(prev => ({ ...prev, [field]: value }));
  };

  React.useEffect(() => {
    if (family && formData.splitEqually) {
      const amount = parseFloat(formData.amount) || 0;
      const perPerson = amount / family.members.length;
      
      setFormData(prev => ({
        ...prev,
        splitBetween: family.members.map(member => ({
          userId: member.userId._id,
          amount: perPerson,
          name: member.userId.name,
        }))
      }));
    }
  }, [family, formData.amount, formData.splitEqually]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSplitAmountChange = (userId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setFormData(prev => ({
      ...prev,
      splitBetween: prev.splitBetween.map(split => 
        split.userId === userId ? { ...split, amount: numAmount } : split
      )
    }));
  };

  const validateForm = () => {
    const amount = parseFloat(formData.amount);

    if (!formData.amount || !formData.category || !formData.description || !formData.date) {
      return 'All required fields must be filled';
    }

    if (amount <= 0) {
      return 'Amount must be greater than 0';
    }

    if (formData.splitBetween.length > 0) {
      const totalSplit = formData.splitBetween.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(totalSplit - amount) > 0.01) {
        return 'Split amounts must equal total expense amount';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post('/api/family/expenses', {
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        category: formData.category,
        description: formData.description,
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        splitBetween: formData.splitBetween.map(split => ({
          userId: split.userId,
          amount: split.amount,
          settled: false,
        })),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add family expense');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add family expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = parseFloat(formData.amount) || 0;
  const totalSplit = formData.splitBetween.reduce((sum, split) => sum + split.amount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-red-600" />
              <span>Add Family Expense</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                  className="pl-10"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="NPR">NPR - Nepalese Rupee</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <Select
                id="category"
                options={categoryOptionsWithAdd}
                placeholder="Select a category"
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <Input
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of expense"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Wallet">Digital Wallet</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            {/* Split Options */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Split Between Family Members
              </h3>
              
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="splitEqually"
                  checked={formData.splitEqually}
                  onChange={(e) => handleInputChange('splitEqually', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="splitEqually" className="text-sm text-gray-700 dark:text-gray-300">
                  Split equally between all family members
                </label>
              </div>

              {family && (
                <div className="space-y-2">
                  {family.members.map((member) => {
                    const split = formData.splitBetween.find(s => s.userId === member.userId._id);
                    return (
                      <div key={member.userId._id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm font-medium">{member.userId.name}</span>
                        <div className="w-24">
                          <Input
                            type="number"
                            value={split?.amount.toFixed(2) || '0.00'}
                            onChange={(e) => handleSplitAmountChange(member.userId._id, e.target.value)}
                            step="0.01"
                            min="0"
                            disabled={formData.splitEqually}
                            className="text-right text-sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Split Summary */}
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Total Amount:</span>
                  <span className="font-medium">{formData.currency} {totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Split:</span>
                  <span className={`font-medium ${Math.abs(totalSplit - totalAmount) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                    {formData.currency} {totalSplit.toFixed(2)}
                  </span>
                </div>
                {Math.abs(totalSplit - totalAmount) > 0.01 && (
                  <div className="text-xs text-red-600 mt-1">
                    Split amounts must equal total expense
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Adding...' : 'Add Expense'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* New Category Modal (same as ExpenseForm) */}
      <Modal
        isOpen={isNewCategoryModalOpen}
        onClose={() => setIsNewCategoryModalOpen(false)}
        title="➕ Add New Category"
        size="sm"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category Name
            </label>
            <Input
              type="text"
              value={newCategoryForm.name}
              onChange={(e) => handleNewCategoryInputChange('name', e.target.value)}
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
                value={newCategoryForm.color}
                onChange={(e) => handleNewCategoryInputChange('color', e.target.value)}
                className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
              />
              <Input
                type="text"
                value={newCategoryForm.color}
                onChange={(e) => handleNewCategoryInputChange('color', e.target.value)}
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
              value={newCategoryForm.icon}
              onChange={(emoji) => handleNewCategoryInputChange('icon', emoji)}
              placeholder="📦"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={newCategoryLoading} className="flex-1">
              {newCategoryLoading ? 'Creating...' : 'Create Category'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewCategoryModalOpen(false)}
              disabled={newCategoryLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
