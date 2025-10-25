'use client';

import React from 'react';
import CommandPalette from '@/components/CommandPalette';
import { useCommandPalette } from '@/hooks/useCommandPalette';

interface CommandPaletteProviderProps {
  children: React.ReactNode;
}

export default function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const { isOpen, closePalette } = useCommandPalette();

  return (
    <>
      {children}
      <CommandPalette isOpen={isOpen} onClose={closePalette} />
    </>
  );
}
