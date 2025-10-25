'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface FamilyIncome {
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
  source: string;
  description: string;
  date: string;
  frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';
  isRecurring: boolean;
  nextOccurrence?: string;
  contributedBy: {
    _id: string;
    name: string;
    email: string;
  };
  allocation: {
    toFamily: number;
    toPersonal: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface UseFamilyIncomeOptions {
  page?: number;
  limit?: number;
  source?: string;
  startDate?: string;
  endDate?: string;
}

interface UseFamilyIncomeReturn {
  income: FamilyIncome[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  refetch: () => void;
  addFamilyIncome: (income: {
    amount: number;
    currency: string;
    source: string;
    description: string;
    date: string;
    frequency?: string;
    isRecurring?: boolean;
    allocation?: {
      toFamily: number;
      toPersonal: number;
    };
  }) => Promise<void>;
}

export function useFamilyIncome(options: UseFamilyIncomeOptions = {}): UseFamilyIncomeReturn {
  const [income, setIncome] = useState<FamilyIncome[]>([]);
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
    if (options.startDate) params.set('startDate', options.startDate);
    if (options.endDate) params.set('endDate', options.endDate);

    return params.toString();
  }, [
    options.page,
    options.limit,
    options.source,
    options.startDate,
    options.endDate,
  ]);

  const fetchFamilyIncome = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = buildQueryParams();
      const response = await api.get(`/api/family/income?${queryParams}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // User is not part of any family
          setIncome([]);
          setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
          return;
        }
        throw new Error('Failed to fetch family income');
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

  const addFamilyIncome = useCallback(async (incomeData: {
    amount: number;
    currency: string;
    source: string;
    description: string;
    date: string;
    frequency?: string;
    isRecurring?: boolean;
    allocation?: {
      toFamily: number;
      toPersonal: number;
    };
  }) => {
    try {
      const response = await api.post('/api/family/income', incomeData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add family income');
      }

      await fetchFamilyIncome(); // Refetch to update the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add family income');
    }
  }, [fetchFamilyIncome]);

  useEffect(() => {
    fetchFamilyIncome();
  }, [fetchFamilyIncome]);

  return {
    income,
    loading,
    error,
    pagination,
    refetch: fetchFamilyIncome,
    addFamilyIncome,
  };
}
