'use client';

import React, { useState } from 'react';
import { Expense, Category } from '@/types/expense';
import ExpenseItem from './ExpenseItem';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[];
  loading?: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function ExpenseList({
  expenses,
  categories,
  loading = false,
  onEdit,
  onDelete,
}: ExpenseListProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      setDeleting(true);
      await onDelete(expenseToDelete._id!);
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setExpenseToDelete(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse"
          >
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
              </div>
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <Trash2 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No expenses found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Start by adding your first expense to track your spending.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {expenses.map((expense) => (
          <ExpenseItem
            key={expense._id}
            expense={expense}
            categories={categories}
            onEdit={onEdit}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        title="Delete Expense"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this expense? This action cannot be undone.
          </p>
          
          {expenseToDelete && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {expenseToDelete.description}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {expenseToDelete.category} • ${expenseToDelete.amount.toFixed(2)}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="flex-1"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={deleting}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
