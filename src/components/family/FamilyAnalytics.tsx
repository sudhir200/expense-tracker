'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFamily } from '@/hooks/useFamily';
import { useFamilyIncome } from '@/hooks/useFamilyIncome';
import { formatCurrency } from '@/lib/currency';
import { api } from '@/lib/api';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  PieChart,
  Calendar,
  Target,
  X
} from 'lucide-react';

interface FamilyAnalyticsProps {
  onClose: () => void;
}

interface FamilyExpense {
  _id: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  paidBy: {
    _id: string;
    name: string;
  };
}

interface AnalyticsData {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  savingsRate: number;
  categoryBreakdown: { category: string; amount: number; count: number }[];
  memberContributions: { userId: string; name: string; income: number; expenses: number }[];
  monthlyTrend: { month: string; income: number; expenses: number }[];
}

export default function FamilyAnalytics({ onClose }: FamilyAnalyticsProps) {
  const { family } = useFamily();
  const { income: familyIncome } = useFamilyIncome({ limit: 100 });
  const [familyExpenses, setFamilyExpenses] = useState<FamilyExpense[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  useEffect(() => {
    fetchFamilyExpenses();
  }, []);

  useEffect(() => {
    if (familyIncome.length > 0 || familyExpenses.length > 0) {
      calculateAnalytics();
    }
  }, [familyIncome, familyExpenses, selectedPeriod]);

  const fetchFamilyExpenses = async () => {
    try {
      console.log('Fetching family expenses for analytics...');
      const response = await api.get('/api/family/expenses?limit=100');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Family expenses fetched:', data);
        setFamilyExpenses(data.expenses || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch family expenses:', errorData);
        
        if (response.status === 404) {
          // User not in family or no expenses
          setFamilyExpenses([]);
        } else if (response.status === 403) {
          setError('You do not have permission to view family expenses');
        } else {
          setError(errorData.error || 'Failed to fetch family expenses');
        }
      }
    } catch (error) {
      console.error('Network error fetching family expenses:', error);
      setError('Network error: Unable to fetch family expenses');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = () => {
    if (!family) {
      console.log('No family data available for analytics');
      return;
    }

    console.log('Calculating analytics with:', {
      family: family.name,
      incomeCount: familyIncome.length,
      expenseCount: familyExpenses.length,
      selectedPeriod
    });

    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of current month

    switch (selectedPeriod) {
      case 'current-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last-3-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case 'last-6-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Filter data by selected period
    const filteredIncome = familyIncome.filter(income => {
      const incomeDate = new Date(income.date);
      return incomeDate >= startDate && incomeDate <= endDate;
    });

    const filteredExpenses = familyExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    // Calculate totals
    const totalIncome = filteredIncome.reduce((sum, income) => sum + income.allocation.toFamily, 0);
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Category breakdown
    const categoryMap = new Map<string, { amount: number; count: number }>();
    filteredExpenses.forEach(expense => {
      const existing = categoryMap.get(expense.category) || { amount: 0, count: 0 };
      categoryMap.set(expense.category, {
        amount: existing.amount + expense.amount,
        count: existing.count + 1
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount);

    // Member contributions
    const memberMap = new Map<string, { name: string; income: number; expenses: number }>();
    
    // Initialize with all family members
    family.members.forEach(member => {
      memberMap.set(member.userId._id, {
        name: member.userId.name,
        income: 0,
        expenses: 0
      });
    });

    // Add income contributions
    filteredIncome.forEach(income => {
      const existing = memberMap.get(income.contributedBy._id);
      if (existing) {
        existing.income += income.allocation.toFamily;
      }
    });

    // Add expense contributions
    filteredExpenses.forEach(expense => {
      const existing = memberMap.get(expense.paidBy._id);
      if (existing) {
        existing.expenses += expense.amount;
      }
    });

    const memberContributions = Array.from(memberMap.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.income - a.income);

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthIncome = familyIncome
        .filter(income => {
          const incomeDate = new Date(income.date);
          return incomeDate >= monthDate && incomeDate <= monthEnd;
        })
        .reduce((sum, income) => sum + income.allocation.toFamily, 0);

      const monthExpenses = familyExpenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= monthDate && expenseDate <= monthEnd;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      monthlyTrend.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: monthIncome,
        expenses: monthExpenses
      });
    }

    const analyticsData = {
      totalIncome,
      totalExpenses,
      netIncome,
      savingsRate,
      categoryBreakdown,
      memberContributions,
      monthlyTrend
    };

    console.log('Analytics calculated:', analyticsData);
    setAnalytics(analyticsData);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-gray-600 dark:text-gray-400">Loading family analytics...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-600 dark:text-red-400">Analytics Error</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">{error}</p>
              <div className="flex gap-3">
                <Button onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetchFamilyExpenses();
                }} className="flex-1">
                  Retry
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics || !family) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>No Data Available</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                {!family ? 'No family data found. Please ensure you are part of a family.' : 'No analytics data available yet.'}
              </p>
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currency = family.currency;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              <span>Family Analytics</span>
            </CardTitle>
            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="current-month">Current Month</option>
                <option value="last-month">Last Month</option>
                <option value="last-3-months">Last 3 Months</option>
                <option value="last-6-months">Last 6 Months</option>
              </select>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Income</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(analytics.totalIncome, currency as any)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(analytics.totalExpenses, currency as any)}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Net Income</p>
                    <p className={`text-xl font-bold ${analytics.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(analytics.netIncome, currency as any)}
                    </p>
                  </div>
                  <DollarSign className={`h-8 w-8 ${analytics.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Savings Rate</p>
                    <p className={`text-xl font-bold ${analytics.savingsRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {analytics.savingsRate.toFixed(1)}%
                    </p>
                  </div>
                  <Target className={`h-8 w-8 ${analytics.savingsRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.categoryBreakdown.slice(0, 5).map((category, index) => {
                    const percentage = analytics.totalExpenses > 0 ? (category.amount / analytics.totalExpenses) * 100 : 0;
                    return (
                      <div key={category.category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                          />
                          <span className="text-sm font-medium">{category.category}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(category.amount, currency as any)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Member Contributions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Member Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.memberContributions.map((member, index) => (
                    <div key={member.userId} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-sm text-gray-500">
                          Net: {formatCurrency(member.income - member.expenses, currency as any)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Income: </span>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {formatCurrency(member.income, currency as any)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Expenses: </span>
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {formatCurrency(member.expenses, currency as any)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">6-Month Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.monthlyTrend.map((month, index) => (
                  <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{month.month}</span>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Income</div>
                        <div className="text-green-600 dark:text-green-400 font-medium">
                          {formatCurrency(month.income, currency as any)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Expenses</div>
                        <div className="text-red-600 dark:text-red-400 font-medium">
                          {formatCurrency(month.expenses, currency as any)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Net</div>
                        <div className={`font-medium ${(month.income - month.expenses) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(month.income - month.expenses, currency as any)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Family Financial Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Top Spending Category
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300">
                    {analytics.categoryBreakdown[0]?.category || 'No expenses yet'} - {' '}
                    {analytics.categoryBreakdown[0] ? formatCurrency(analytics.categoryBreakdown[0].amount, currency as any) : 'N/A'}
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                    Top Income Contributor
                  </h4>
                  <p className="text-green-700 dark:text-green-300">
                    {analytics.memberContributions[0]?.name || 'No contributions yet'} - {' '}
                    {analytics.memberContributions[0] ? formatCurrency(analytics.memberContributions[0].income, currency as any) : 'N/A'}
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                    Average Monthly Expenses
                  </h4>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    {formatCurrency(analytics.monthlyTrend.reduce((sum, month) => sum + month.expenses, 0) / analytics.monthlyTrend.length, currency as any)}
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                    Family Members
                  </h4>
                  <p className="text-purple-700 dark:text-purple-300">
                    {family.members.length} active members contributing to family budget
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
