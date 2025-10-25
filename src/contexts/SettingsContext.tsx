'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Currency, CurrencyCode, DEFAULT_CURRENCY, getCurrencyByCode } from '@/lib/currency';

type Theme = 'light' | 'dark' | 'system';

type SettingsContextType = {
  // Currency settings
  currency: Currency;
  setCurrency: (currencyCode: CurrencyCode) => void;
  
  // Theme settings
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  toggleTheme: () => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Helper function to get system theme preference
const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  // Currency state - start with default to prevent hydration mismatch
  const [currency, setCurrencyState] = useState<Currency>(getCurrencyByCode(DEFAULT_CURRENCY));

  // Theme state - start with system to prevent hydration mismatch
  const [theme, setThemeState] = useState<Theme>('system');

  // Initialize from localStorage after component mounts
  useEffect(() => {
    setMounted(true);
    
    // Load saved currency
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency) {
      setCurrencyState(getCurrencyByCode(savedCurrency));
    }
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  // Determine if dark mode is active
  const isDark = mounted && (theme === 'system' 
    ? getSystemTheme() === 'dark'
    : theme === 'dark');

  // Apply theme class to html element
  useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark');
    
    // Apply the current theme
    if (theme === 'system') {
      const systemTheme = getSystemTheme();
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme, mounted]);

  const setCurrency = (currencyCode: CurrencyCode) => {
    const newCurrency = getCurrencyByCode(currencyCode);
    setCurrencyState(newCurrency);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredCurrency', newCurrency.code);
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        currency, 
        setCurrency,
        theme,
        setTheme,
        isDark,
        toggleTheme
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
