'use client';

import React from 'react';
import { Expense, Category } from '@/types/expense';
import { formatDate } from '@/lib/utils';
import { formatExpenseAmountWithCachedDbRates } from '@/lib/currency';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2, CreditCard, Banknote, Smartphone, Building } from 'lucide-react';

interface ExpenseItemProps {
  expense: Expense;
  categories: Category[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

const paymentMethodIcons = {
  Cash: Banknote,
  Card: CreditCard,
  Wallet: Smartphone,
  'Bank Transfer': Building,
};

export default function ExpenseItem({ expense, categories, onEdit, onDelete }: ExpenseItemProps) {
  const { currency: userCurrency } = useSettings();
  const category = categories.find((cat) => cat.name === expense.category);
  const PaymentIcon = paymentMethodIcons[expense.paymentMethod];

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4 flex-1">
        {/* Category Badge */}
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: category?.color || '#C9CBCF' }}
          title={expense.category}
        />
        
        {/* Expense Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {expense.description}
            </h3>
            <span className="text-lg font-semibold text-gray-900 dark:text-white ml-4">
              {formatExpenseAmountWithCachedDbRates(expense.amount, expense.currency, userCurrency.code as any)}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center">
              <span className="mr-1">{category?.icon || '🏷️'}</span>
              <span
                className="inline-block w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: category?.color || '#C9CBCF' }}
              />
              {expense.category}
            </span>
            
            <span className="inline-flex items-center">
              <PaymentIcon className="w-3 h-3 mr-1" />
              {expense.paymentMethod}
            </span>
            
            <span>{formatDate(expense.date)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 ml-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(expense)}
          className="h-8 w-8 text-gray-500 hover:text-blue-600"
        >
          <Edit className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(expense)}
          className="h-8 w-8 text-gray-500 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
