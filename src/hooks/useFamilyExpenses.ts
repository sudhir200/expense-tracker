'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface FamilyExpense {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  familyId: string;
  type: 'family';
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  paymentMethod: 'Cash' | 'Card' | 'Wallet' | 'Bank Transfer';
  paidBy: {
    _id: string;
    name: string;
    email: string;
  };
  splitBetween: {
    userId: {
      _id: string;
      name: string;
      email: string;
    };
    amount: number;
    settled: boolean;
  }[];
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface UseFamilyExpensesOptions {
  page?: number;
  limit?: number;
  category?: string;
  startDate?: string;
  endDate?: string;
}

interface UseFamilyExpensesReturn {
  expenses: FamilyExpense[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  refetch: () => void;
  addFamilyExpense: (expense: {
    amount: number;
    currency: string;
    category: string;
    description: string;
    date: string;
    paymentMethod: string;
    paidBy?: string;
    splitBetween?: {
      userId: string;
      amount: number;
      settled: boolean;
    }[];
  }) => Promise<void>;
}

export function useFamilyExpenses(options: UseFamilyExpensesOptions = {}): UseFamilyExpensesReturn {
  const [expenses, setExpenses] = useState<FamilyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    
    if (options.page) params.set('page', options.page.toString());
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.category) params.set('category', options.category);
    if (options.startDate) params.set('startDate', options.startDate);
    if (options.endDate) params.set('endDate', options.endDate);

    return params.toString();
  }, [
    options.page,
    options.limit,
    options.category,
    options.startDate,
    options.endDate,
  ]);

  const fetchFamilyExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = buildQueryParams();
      const response = await api.get(`/api/family/expenses?${queryParams}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // User is not part of any family
          setExpenses([]);
          setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
          return;
        }
        throw new Error('Failed to fetch family expenses');
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

  const addFamilyExpense = useCallback(async (expenseData: {
    amount: number;
    currency: string;
    category: string;
    description: string;
    date: string;
    paymentMethod: string;
    paidBy?: string;
    splitBetween?: {
      userId: string;
      amount: number;
      settled: boolean;
    }[];
  }) => {
    try {
      const response = await api.post('/api/family/expenses', expenseData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add family expense');
      }

      await fetchFamilyExpenses(); // Refetch to update the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add family expense');
    }
  }, [fetchFamilyExpenses]);

  useEffect(() => {
    fetchFamilyExpenses();
  }, [fetchFamilyExpenses]);

  return {
    expenses,
    loading,
    error,
    pagination,
    refetch: fetchFamilyExpenses,
    addFamilyExpense,
  };
}
