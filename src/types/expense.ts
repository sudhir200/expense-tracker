export interface Expense {
  _id?: string;
  userId?: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Category {
  _id?: string;
  userId?: string;
  name: string;
  color: string;
  icon?: string;
  isDefault: boolean;
}

export interface Budget {
  _id?: string;
  userId?: string;
  category: string;
  amount: number;
  month: Date;
}

export interface ExpenseFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  categories?: string[];
  paymentMethods?: string[];
  amountRange?: {
    min?: number;
    max?: number;
  };
  search?: string;
}

export interface AnalyticsData {
  totalExpenses: number;
  monthlyBudgetRemaining: number;
  expenseCount: number;
  categoryDistribution: { category: string; amount: number; color: string }[];
  monthlyComparison: { month: string; amount: number }[];
  dailyTrend: { date: string; amount: number }[];
  topCategories: { category: string; amount: number; color: string }[];
  recentTransactions: Expense[];
  budgetProgress: { category: string; spent: number; budget: number; percentage: number }[];
}
