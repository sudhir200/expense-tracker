'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnalyticsData } from '@/types/expense';
import { api } from '@/lib/api';
import { useRefreshAnalytics } from './useRefreshAnalytics';

interface UseAnalyticsOptions {
  month?: string; // Format: YYYY-MM
  currency?: string; // Currency code for conversion
}

interface UseAnalyticsReturn {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { registerRefreshCallback } = useRefreshAnalytics();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (options.month) {
        params.set('month', options.month);
      }
      if (options.currency) {
        params.set('currency', options.currency);
      }
      
      const response = await api.get(`/api/analytics?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [options.month, options.currency]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Register for refresh events
  useEffect(() => {
    const cleanup = registerRefreshCallback(fetchAnalytics);
    return cleanup;
  }, [registerRefreshCallback, fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}
