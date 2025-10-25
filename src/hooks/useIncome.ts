'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Income {
  _id: string;
  userId: string;
  familyId?: string;
  type: 'personal' | 'family';
  amount: number;
  currency: string;
  source: string;
  description: string;
  date: string;
  frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';
  isRecurring: boolean;
  nextOccurrence?: string;
  contributedBy?: string;
  allocation?: {
    toFamily: number;
    toPersonal: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface UseIncomeOptions {
  page?: number;
  limit?: number;
  source?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
}

interface UseIncomeReturn {
  income: Income[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  refetch: () => void;
  createIncome: (income: Omit<Income, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateIncome: (id: string, income: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
}

export function useIncome(options: UseIncomeOptions = {}): UseIncomeReturn {
  const [income, setIncome] = useState<Income[]>([]);
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
    if (options.source) params.set('source', options.source);
    if (options.frequency) params.set('frequency', options.frequency);
    if (options.startDate) params.set('startDate', options.startDate);
    if (options.endDate) params.set('endDate', options.endDate);

    return params.toString();
  }, [
    options.page,
    options.limit,
    options.source,
    options.frequency,
    options.startDate,
    options.endDate,
  ]);

  const fetchIncome = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = buildQueryParams();
      const response = await api.get(`/api/income?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch income');
      }
      
      const data = await response.json();
      setIncome(data.income);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  const createIncome = useCallback(async (incomeData: Omit<Income, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await api.post('/api/income', incomeData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create income');
      }

      await fetchIncome(); // Refetch to update the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create income');
    }
  }, [fetchIncome]);

  const updateIncome = useCallback(async (id: string, incomeData: Partial<Income>) => {
    try {
      const response = await api.put(`/api/income/${id}`, incomeData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update income');
      }

      await fetchIncome(); // Refetch to update the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update income');
    }
  }, [fetchIncome]);

  const deleteIncome = useCallback(async (id: string) => {
    try {
      const response = await api.delete(`/api/income/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete income');
      }

      await fetchIncome(); // Refetch to update the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete income');
    }
  }, [fetchIncome]);

  useEffect(() => {
    fetchIncome();
  }, [fetchIncome]);

  return {
    income,
    loading,
    error,
    pagination,
    refetch: fetchIncome,
    createIncome,
    updateIncome,
    deleteIncome,
  };
}
