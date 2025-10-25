'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import { initializeCurrencyRates } from '@/lib/currency';
import AuthPage from '@/app/auth/page';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();

  // Initialize currency rates cache when app loads
  useEffect(() => {
    if (isAuthenticated) {
      initializeCurrencyRates();
    }
  }, [isAuthenticated]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and not on auth page, show auth page
  if (!isAuthenticated && pathname !== '/auth') {
    return <AuthPage />;
  }

  // If user is authenticated and on auth page, redirect to dashboard
  if (isAuthenticated && pathname === '/auth') {
    window.location.href = '/dashboard';
    return null;
  }

  // Show the main app content
  return <>{children}</>;
}
