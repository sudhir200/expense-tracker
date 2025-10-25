'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface FamilyMember {
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  role: 'head' | 'adult' | 'child';
  joinedAt: string;
  permissions: {
    canViewFamilyIncome: boolean;
    canAddFamilyIncome: boolean;
    canViewFamilyExpenses: boolean;
    canAddFamilyExpenses: boolean;
    canManageMembers: boolean;
    canManageBudgets: boolean;
  };
}

export interface Family {
  _id: string;
  name: string;
  description?: string;
  currency: string;
  createdBy: string;
  members: FamilyMember[];
  settings: {
    allowPersonalExpenses: boolean;
    requireApprovalForLargeExpenses: boolean;
    largeExpenseThreshold: number;
    sharedCategories: string[];
    personalCategories: string[];
  };
  inviteCodes: {
    code: string;
    expiresAt: string;
    createdBy: string;
    isActive: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface UseFamilyReturn {
  family: Family | null;
  loading: boolean;
  error: string | null;
  hasFamily: boolean;
  isHead: boolean;
  canManageFamily: boolean;
  refetch: () => void;
  createFamily: (data: { name: string; description?: string; currency?: string }) => Promise<void>;
  updateFamily: (data: Partial<Family>) => Promise<void>;
  createInviteCode: () => Promise<{ code: string; expiresAt: string; familyName: string }>;
  joinFamily: (code: string) => Promise<void>;
}

export function useFamily(): UseFamilyReturn {
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFamily = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/family');
      
      if (response.status === 404) {
        // User is not part of any family
        setFamily(null);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch family');
      }
      
      const data = await response.json();
      setFamily(data);
    } catch (err) {
      if (err instanceof Error && err.message.includes('not part of any family')) {
        setFamily(null);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createFamily = useCallback(async (data: { name: string; description?: string; currency?: string }) => {
    try {
      const response = await api.post('/api/family', data);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create family');
      }

      await fetchFamily(); // Refetch to update the family data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create family');
    }
  }, [fetchFamily]);

  const updateFamily = useCallback(async (data: Partial<Family>) => {
    try {
      const response = await api.put('/api/family', data);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update family');
      }

      await fetchFamily(); // Refetch to update the family data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update family');
    }
  }, [fetchFamily]);

  const createInviteCode = useCallback(async () => {
    try {
      const response = await api.post('/api/family/invite');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create invite code');
      }

      const data = await response.json();
      await fetchFamily(); // Refetch to update invite codes
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create invite code');
    }
  }, [fetchFamily]);

  const joinFamily = useCallback(async (code: string) => {
    try {
      const response = await api.put('/api/family/invite', { code });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join family');
      }

      await fetchFamily(); // Refetch to update the family data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to join family');
    }
  }, [fetchFamily]);

  useEffect(() => {
    fetchFamily();
  }, [fetchFamily]);

  // Helper computed properties
  const hasFamily = family !== null;
  
  const isHead = family ? family.members.some(
    member => member.role === 'head' && member.userId._id === family.createdBy
  ) : false;
  
  const canManageFamily = family ? family.members.some(
    member => member.role === 'head' || member.permissions.canManageMembers
  ) : false;

  return {
    family,
    loading,
    error,
    hasFamily,
    isHead,
    canManageFamily,
    refetch: fetchFamily,
    createFamily,
    updateFamily,
    createInviteCode,
    joinFamily,
  };
}
