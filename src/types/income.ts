export interface Income {
  _id?: string;
  userId?: string;
  amount: number;
  currency: string;
  source: string;
  description: string;
  date: Date;
  frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';
  isRecurring: boolean;
  nextOccurrence?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExchangeRate {
  _id?: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: Date;
  isUserDefined: boolean;
}

export interface IncomeFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  sources?: string[];
  frequencies?: string[];
  amountRange?: {
    min?: number;
    max?: number;
  };
  search?: string;
}
