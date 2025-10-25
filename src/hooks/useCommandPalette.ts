'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { isSuperUserOnly } = usePermissions();

  useEffect(() => {
    // Only enable for authenticated users
    if (!isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+/ or Cmd+/ (Ctrl+/ on Windows/Linux, Cmd+/ on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAuthenticated]);

  const openPalette = () => setIsOpen(true);
  const closePalette = () => setIsOpen(false);
  const togglePalette = () => setIsOpen(prev => !prev);

  return {
    isOpen,
    openPalette,
    closePalette,
    togglePalette,
    isEnabled: isAuthenticated, // Only enable for authenticated users
    isSuperUser: isSuperUserOnly
  };
}
