'use client';

import React, { useState, useEffect } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ExpenseForm from '@/components/expense/ExpenseForm';
import ExpenseList from '@/components/expense/ExpenseList';
import FilterBar from '@/components/FilterBar';
import { Expense, Category, ExpenseFilters } from '@/types/expense';
import { Plus } from 'lucide-react';

export default function ExpensesPage() {
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const {
    expenses,
    loading,
    error,
    pagination,
    refetch,
    createExpense,
    updateExpense,
    deleteExpense,
  } = useExpenses({ filters, page: 1, limit: 20 });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleAddExpense = async (expense: Omit<Expense, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setFormLoading(true);
      await createExpense(expense);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditExpense = async (expense: Omit<Expense, '_id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingExpense?._id) return;

    try {
      setFormLoading(true);
      await updateExpense(editingExpense._id, expense);
      setIsEditModalOpen(false);
      setEditingExpense(null);
    } catch (error) {
      console.error('Error updating expense:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingExpense(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Expenses
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and track all your expenses
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <FilterBar
          categories={categories}
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Expenses List */}
      <div className="space-y-6">
        {/* Summary */}
        {!loading && expenses.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <span>
                Showing {expenses.length} of {pagination.total} expenses
              </span>
              <span>
                Total: $
                {expenses
                  .reduce((sum, expense) => sum + expense.amount, 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* List */}
        <ExpenseList
          expenses={expenses}
          categories={categories}
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDeleteExpense}
        />

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => {
                  // Handle previous page
                }}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.pages}
                onClick={() => {
                  // Handle next page
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        title="Add New Expense"
        size="md"
      >
        <ExpenseForm
          categories={categories}
          onSubmit={handleAddExpense}
          onCancel={handleCloseAddModal}
          loading={formLoading}
        />
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Edit Expense"
        size="md"
      >
        {editingExpense && (
          <ExpenseForm
            expense={editingExpense}
            categories={categories}
            onSubmit={handleEditExpense}
            onCancel={handleCloseEditModal}
            loading={formLoading}
          />
        )}
      </Modal>
    </div>
  );
}
