export interface Expense {
  _id?: string;
  userId?: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: Date;
  paymentMethod: 'Cash' | 'Card' | 'Wallet' | 'Bank Transfer';
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
  // Expense data
  totalExpenses: number;
  expenseCount: number;
  categoryDistribution: { category: string; amount: number; color: string }[];
  topCategories: { category: string; amount: number; color: string }[];
  recentTransactions: Expense[];
  
  // Income data
  totalIncome: number;
  incomeCount: number;
  incomeSourceDistribution: { source: string; amount: number; color: string }[];
  recentIncome: any[]; // Income type from income.ts
  
  // Combined metrics
  netIncome: number;
  savingsRate: number;
  monthlyBudgetRemaining: number;
  
  // Trends
  monthlyComparison: { month: string; amount: number }[];
  dailyTrend: { date: string; amount: number }[];
  
  // Budget
  budgetProgress: { category: string; spent: number; budget: number; percentage: number }[];
}
