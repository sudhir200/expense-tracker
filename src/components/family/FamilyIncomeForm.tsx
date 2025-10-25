'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useFamilyIncome } from '@/hooks/useFamilyIncome';
import { useFamily } from '@/hooks/useFamily';
import { X, DollarSign, TrendingUp } from 'lucide-react';

interface FamilyIncomeFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function FamilyIncomeForm({ onClose, onSuccess }: FamilyIncomeFormProps) {
  const { addFamilyIncome } = useFamilyIncome();
  const { family } = useFamily();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    currency: family?.currency || 'USD',
    source: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    frequency: 'one-time',
    isRecurring: false,
    toFamily: '',
    toPersonal: '',
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-calculate allocation when amount changes
    if (field === 'amount' && value) {
      const amount = parseFloat(value as string);
      if (!isNaN(amount)) {
        setFormData(prev => ({
          ...prev,
          toFamily: prev.toFamily || amount.toString(),
          toPersonal: prev.toPersonal || '0',
        }));
      }
    }
  };

  const handleAllocationChange = (field: 'toFamily' | 'toPersonal', value: string) => {
    const amount = parseFloat(formData.amount) || 0;
    const newValue = parseFloat(value) || 0;
    
    if (field === 'toFamily') {
      const remaining = Math.max(0, amount - newValue);
      setFormData(prev => ({
        ...prev,
        toFamily: value,
        toPersonal: remaining.toString(),
      }));
    } else {
      const remaining = Math.max(0, amount - newValue);
      setFormData(prev => ({
        ...prev,
        toPersonal: value,
        toFamily: remaining.toString(),
      }));
    }
  };

  const validateForm = () => {
    const amount = parseFloat(formData.amount);
    const toFamily = parseFloat(formData.toFamily) || 0;
    const toPersonal = parseFloat(formData.toPersonal) || 0;

    if (!formData.amount || !formData.source || !formData.description || !formData.date) {
      return 'All required fields must be filled';
    }

    if (amount <= 0) {
      return 'Amount must be greater than 0';
    }

    if (Math.abs((toFamily + toPersonal) - amount) > 0.01) {
      return 'Family and personal allocation must equal total amount';
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
      await addFamilyIncome({
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        source: formData.source,
        description: formData.description,
        date: formData.date,
        frequency: formData.frequency as any,
        isRecurring: formData.isRecurring,
        allocation: {
          toFamily: parseFloat(formData.toFamily) || 0,
          toPersonal: parseFloat(formData.toPersonal) || 0,
        },
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add family income');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = parseFloat(formData.amount) || 0;
  const familyAmount = parseFloat(formData.toFamily) || 0;
  const personalAmount = parseFloat(formData.toPersonal) || 0;
  const allocationTotal = familyAmount + personalAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Add Family Income</span>
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

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Income Source *
              </label>
              <Input
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
                placeholder="e.g., Salary, Freelance, Business"
                required
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
                placeholder="Brief description of income"
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

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => handleInputChange('frequency', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="one-time">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {/* Recurring */}
            {formData.frequency !== 'one-time' && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isRecurring" className="text-sm text-gray-700 dark:text-gray-300">
                  This is a recurring income
                </label>
              </div>
            )}

            {/* Allocation */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Income Allocation
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    To Family Budget
                  </label>
                  <Input
                    type="number"
                    value={formData.toFamily}
                    onChange={(e) => handleAllocationChange('toFamily', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Keep Personal
                  </label>
                  <Input
                    type="number"
                    value={formData.toPersonal}
                    onChange={(e) => handleAllocationChange('toPersonal', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Allocation Summary */}
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Total Amount:</span>
                  <span className="font-medium">{formData.currency} {totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Allocated:</span>
                  <span className={`font-medium ${Math.abs(allocationTotal - totalAmount) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                    {formData.currency} {allocationTotal.toFixed(2)}
                  </span>
                </div>
                {Math.abs(allocationTotal - totalAmount) > 0.01 && (
                  <div className="text-xs text-red-600 mt-1">
                    Allocation must equal total amount
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
                {isSubmitting ? 'Adding...' : 'Add Income'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
