'use client';

import { useState, useEffect, useCallback } from 'react';
import { Expense, ExpenseFilters } from '@/types/expense';

interface UseExpensesOptions {
  filters?: ExpenseFilters;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  refetch: () => void;
  createExpense: (expense: Omit<Expense, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export function useExpenses(options: UseExpensesOptions = {}): UseExpensesReturn {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    
    if (options.page) params.set('page', options.page.toString());
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.sortBy) params.set('sortBy', options.sortBy);
    if (options.sortOrder) params.set('sortOrder', options.sortOrder);

    if (options.filters) {
      const { dateRange, categories, paymentMethods, amountRange, search } = options.filters;
      
      if (dateRange) {
        params.set('startDate', dateRange.start.toISOString());
        params.set('endDate', dateRange.end.toISOString());
      }
      
      if (categories && categories.length > 0) {
        params.set('categories', categories.join(','));
      }
      
      if (paymentMethods && paymentMethods.length > 0) {
        params.set('paymentMethods', paymentMethods.join(','));
      }
      
      if (amountRange) {
        if (amountRange.min) params.set('minAmount', amountRange.min.toString());
        if (amountRange.max) params.set('maxAmount', amountRange.max.toString());
      }
      
      if (search) params.set('search', search);
    }

    return params.toString();
  }, [
    options.page,
    options.limit,
    options.sortBy,
    options.sortOrder,
    options.filters?.dateRange?.start,
    options.filters?.dateRange?.end,
    options.filters?.categories,
    options.filters?.paymentMethods,
    options.filters?.amountRange?.min,
    options.filters?.amountRange?.max,
    options.filters?.search,
  ]);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = buildQueryParams();
      const response = await fetch(`/api/expenses?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      
      const data = await response.json();
      setExpenses(data.expenses);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  const createExpense = useCallback(async (expense: Omit<Expense, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expense),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create expense');
      }

      await fetchExpenses(); // Refetch to update the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create expense');
    }
  }, [fetchExpenses]);

  const updateExpense = useCallback(async (id: string, expense: Partial<Expense>) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expense),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update expense');
      }

      await fetchExpenses(); // Refetch to update the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update expense');
    }
  }, [fetchExpenses]);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete expense');
      }

      await fetchExpenses(); // Refetch to update the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  }, [fetchExpenses]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    pagination,
    refetch: fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
