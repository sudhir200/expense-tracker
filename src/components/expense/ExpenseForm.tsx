'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import EmojiPicker from '@/components/ui/EmojiPicker';
import { Expense, Category } from '@/types/expense';
import { formatDateForInput } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import { getCurrencyList } from '@/lib/currency';
import { Plus } from 'lucide-react';

interface ExpenseFormProps {
  expense?: Expense;
  categories: Category[];
  onSubmit: (expense: Omit<Expense, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  onCategoryAdded?: () => void; // Callback to refresh categories
}

const paymentMethodOptions = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
  { value: 'Wallet', label: 'Wallet' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
];

export default function ExpenseForm({
  expense,
  categories,
  onSubmit,
  onCancel,
  loading = false,
  onCategoryAdded,
}: ExpenseFormProps) {
  const { currency: defaultCurrency } = useSettings();
  const currencies = getCurrencyList();
  
  const [formData, setFormData] = useState({
    amount: expense?.amount?.toString() || '',
    currency: expense?.currency || defaultCurrency.code,
    category: expense?.category || '',
    description: expense?.description || '',
    date: expense?.date ? formatDateForInput(expense.date) : formatDateForInput(new Date()),
    paymentMethod: expense?.paymentMethod || 'Cash',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // New category modal state
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    color: '#3B82F6',
    icon: '📦',
  });
  const [newCategoryLoading, setNewCategoryLoading] = useState(false);

  const categoryOptions = categories.map((cat) => ({
    value: cat.name,
    label: `${cat.icon || '🏷️'} ${cat.name}`,
  }));

  const currencyOptions = currencies.map((curr) => ({
    value: curr.code,
    label: `${curr.name} (${curr.symbol})`,
  }));

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        category: formData.category,
        description: formData.description.trim(),
        date: new Date(formData.date),
        paymentMethod: formData.paymentMethod as Expense['paymentMethod'],
      });
    } catch (error) {
      console.error('Error submitting expense:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Handle new category creation
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
        
        // Set the new category as selected
        setFormData(prev => ({ ...prev, category: newCategory.name }));
        
        // Reset form and close modal
        setNewCategoryForm({ name: '', color: '#3B82F6', icon: '📦' });
        setIsNewCategoryModalOpen(false);
        
        // Notify parent to refresh categories
        if (onCategoryAdded) {
          onCategoryAdded();
        }
      } else {
        const errorData = await response.json();
        console.error('Error creating category:', errorData.error);
      }
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setNewCategoryLoading(false);
    }
  };

  const handleNewCategoryInputChange = (field: string, value: string) => {
    setNewCategoryForm(prev => ({ ...prev, [field]: value }));
  };

  // Add "Add New Category" option to category options
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

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Amount
        </label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={formData.amount}
          onChange={(e) => handleInputChange('amount', e.target.value)}
          className={errors.amount ? 'border-red-500' : ''}
        />
        {errors.amount && (
          <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
        )}
      </div>

      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Currency
        </label>
        <Select
          id="currency"
          options={currencyOptions}
          placeholder="Select currency"
          value={formData.currency}
          onChange={(e) => handleInputChange('currency', e.target.value)}
          className={errors.currency ? 'border-red-500' : ''}
        />
        {errors.currency && (
          <p className="text-red-500 text-sm mt-1">{errors.currency}</p>
        )}
      </div>

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
          className={errors.category ? 'border-red-500' : ''}
        />
        {errors.category && (
          <p className="text-red-500 text-sm mt-1">{errors.category}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <Input
          id="description"
          type="text"
          placeholder="Enter description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date
        </label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => handleInputChange('date', e.target.value)}
          className={errors.date ? 'border-red-500' : ''}
        />
        {errors.date && (
          <p className="text-red-500 text-sm mt-1">{errors.date}</p>
        )}
      </div>

      <div>
        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Payment Method
        </label>
        <Select
          id="paymentMethod"
          options={paymentMethodOptions}
          value={formData.paymentMethod}
          onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
          className={errors.paymentMethod ? 'border-red-500' : ''}
        />
        {errors.paymentMethod && (
          <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : expense ? 'Update Expense' : 'Add Expense'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>

    {/* New Category Modal */}
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
    </>
  );
}
