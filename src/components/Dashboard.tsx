'use client';

import React, { useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import PieChart from '@/components/charts/PieChart';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import DoughnutChart from '@/components/charts/DoughnutChart';
import { formatDate } from '@/lib/utils';
import { formatCurrency, formatExpenseAmountWithCachedDbRates } from '@/lib/currency';
import { useSettings } from '@/contexts/SettingsContext';
import { api } from '@/lib/api';
import { Category } from '@/types/expense';
import { TrendingUp, TrendingDown, DollarSign, Receipt, Target, PiggyBank, Wallet } from 'lucide-react';

interface DashboardProps {
  month?: string;
}

export default function Dashboard({ month }: DashboardProps) {
  const { currency } = useSettings();
  const { data, loading, error } = useAnalytics({ 
    month, 
    currency: currency.code 
  });
  
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories for emoji display
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/categories');
        if (response.ok) {
          const categoriesData = await response.json();
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Helper function to get category emoji
  const getCategoryEmoji = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.icon || '🏷️';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2" />
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Error loading dashboard data</div>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  // Prepare chart data
  const categoryPieData = {
    labels: data.categoryDistribution.map((item) => item.category),
    datasets: [
      {
        data: data.categoryDistribution.map((item) => item.amount),
        backgroundColor: data.categoryDistribution.map((item) => item.color),
        borderColor: data.categoryDistribution.map((item) => item.color),
        borderWidth: 2,
      },
    ],
  };

  const monthlyBarData = {
    labels: data.monthlyComparison.map((item) => item.month),
    datasets: [
      {
        label: 'Monthly Spending',
        data: data.monthlyComparison.map((item) => item.amount),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const dailyLineData = {
    labels: data.dailyTrend.map((item) => new Date(item.date).getDate().toString()),
    datasets: [
      {
        label: 'Daily Spending',
        data: data.dailyTrend.map((item) => item.amount),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const topCategoriesBarData = {
    labels: data.topCategories.map((item) => item.category),
    datasets: [
      {
        label: 'Amount Spent',
        data: data.topCategories.map((item) => item.amount),
        backgroundColor: data.topCategories.map((item) => item.color + '80'),
        borderColor: data.topCategories.map((item) => item.color),
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Income
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(data.totalIncome, currency.code)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(data.totalExpenses, currency.code)}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Net Income
                </p>
                <p className={`text-2xl font-bold ${data.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(data.netIncome, currency.code)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${data.netIncome >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                {data.netIncome >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Savings Rate
                </p>
                <p className={`text-2xl font-bold ${data.savingsRate >= 20 ? 'text-green-600 dark:text-green-400' : data.savingsRate >= 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                  {data.savingsRate.toFixed(1)}%
                </p>
              </div>
              <div className={`p-3 rounded-full ${data.savingsRate >= 20 ? 'bg-green-100 dark:bg-green-900' : data.savingsRate >= 0 ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-red-100 dark:bg-red-900'}`}>
                <PiggyBank className={`w-6 h-6 ${data.savingsRate >= 20 ? 'text-green-600 dark:text-green-400' : data.savingsRate >= 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Transactions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.expenseCount + data.incomeCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {data.incomeCount} income, {data.expenseCount} expenses
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <PieChart data={categoryPieData} title="" />
            </div>
          </CardContent>
        </Card>

        {/* Monthly Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <BarChart data={monthlyBarData} title="" />
            </div>
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <LineChart data={dailyLineData} title="" />
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <BarChart data={topCategoriesBarData} title="" horizontal />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentTransactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getCategoryEmoji(transaction.category)} {transaction.category} • {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    -{formatExpenseAmountWithCachedDbRates(transaction.amount, transaction.currency, currency.code)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Income */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentIncome && data.recentIncome.length > 0 ? (
                data.recentIncome.map((income, index) => (
                  <div
                    key={income._id || index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {income.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {income.source} • {formatDate(income.date)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      +{formatExpenseAmountWithCachedDbRates(income.amount, income.currency, currency.code)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No income recorded yet</p>
                  <p className="text-sm">Add income in Settings to track your earnings</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      {data.budgetProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.budgetProgress.map((budget) => (
                <div key={budget.category} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {budget.category}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatCurrency(budget.spent, currency.code)} / {formatCurrency(budget.budget, currency.code)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        budget.percentage > 90
                          ? 'bg-red-500'
                          : budget.percentage > 75
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {budget.percentage.toFixed(1)}% used
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
