import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Note: formatCurrency has been moved to /lib/currency.ts for proper multi-currency support
// Import { formatCurrency } from '@/lib/currency' instead of using this function

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateForInput(date: Date | string): string {
  return new Date(date).toISOString().split('T')[0];
}

export function getMonthName(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
}

export function getStartOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getEndOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

export function getEndOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + 6;
  return new Date(d.setDate(diff));
}

export function getDateRange(period: 'today' | 'week' | 'month' | 'custom'): { start: Date; end: Date } {
  const now = new Date();
  
  switch (period) {
    case 'today':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
      };
    case 'week':
      return {
        start: getStartOfWeek(now),
        end: getEndOfWeek(now),
      };
    case 'month':
      return {
        start: getStartOfMonth(now),
        end: getEndOfMonth(now),
      };
    default:
      return {
        start: getStartOfMonth(now),
        end: getEndOfMonth(now),
      };
  }
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
