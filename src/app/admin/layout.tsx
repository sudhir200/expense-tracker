'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Shield } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdminOrHigher } = usePermissions();

  if (!isAdminOrHigher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need ADMIN or SUPERUSER privileges to access this section.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
