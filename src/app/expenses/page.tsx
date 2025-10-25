'use client';

import React, { useState, useEffect } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ExpenseForm from '@/components/expense/ExpenseForm';
import ExpenseList from '@/components/expense/ExpenseList';
import FilterBar from '@/components/FilterBar';
import { Expense, Category, ExpenseFilters } from '@/types/expense';
import { Plus, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency, convertCurrency } from '@/lib/currency';
import { exportToCSV, exportToJSON, generateExpenseReport } from '@/lib/export';

export default function ExpensesPage() {
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const { currency } = useSettings();

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

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showExportMenu]);

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

  // Export functions
  const handleExportCSV = () => {
    exportToCSV(expenses, `expenses-${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    exportToJSON(expenses, `expenses-${new Date().toISOString().split('T')[0]}.json`);
    setShowExportMenu(false);
  };

  const handleExportReport = () => {
    const report = generateExpenseReport(expenses, currency.code);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Calculate total in user's preferred currency
  const calculateTotal = () => {
    return expenses.reduce((sum, expense) => {
      const convertedAmount = convertCurrency(
        expense.amount, 
        expense.currency || 'USD', 
        currency.code
      );
      return sum + convertedAmount;
    }, 0);
  };

  return (
    <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="flex items-center gap-3">
          {/* Export Menu */}
          {expenses.length > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <div className="py-1">
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Export as CSV
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FileText className="w-4 h-4" />
                      Export as JSON
                    </button>
                    <button
                      onClick={handleExportReport}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FileText className="w-4 h-4" />
                      Generate Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        </div>
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
                Total: {formatCurrency(calculateTotal(), currency.code)}
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
          onCategoryAdded={() => {
            // Refresh categories when a new one is added
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
          }}
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
            onCategoryAdded={() => {
              // Refresh categories when a new one is added
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
            }}
          />
        )}
      </Modal>
    </div>
  );
}
