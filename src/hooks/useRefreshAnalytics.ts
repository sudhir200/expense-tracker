'use client';

import { useCallback } from 'react';

// Global event emitter for analytics refresh
const analyticsRefreshCallbacks = new Set<() => void>();

export function useRefreshAnalytics() {
  const refreshAnalytics = useCallback(() => {
    // Trigger all registered analytics refresh callbacks
    analyticsRefreshCallbacks.forEach(callback => callback());
  }, []);

  const registerRefreshCallback = useCallback((callback: () => void) => {
    analyticsRefreshCallbacks.add(callback);
    
    // Return cleanup function
    return () => {
      analyticsRefreshCallbacks.delete(callback);
    };
  }, []);

  return {
    refreshAnalytics,
    registerRefreshCallback,
  };
}
