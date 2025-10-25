'use client';

import React, { useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import PieChart from '@/components/charts/PieChart';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import DoughnutChart from '@/components/charts/DoughnutChart';
import { formatDate } from '@/lib/utils';
import { formatCurrency, formatExpenseAmountWithCachedDbRates } from '@/lib/currency';
import { useSettings } from '@/contexts/SettingsContext';
import { CHART_COLORS } from '@/lib/chartConfig';
import { TrendingUp, TrendingDown, DollarSign, Receipt, Target, Calendar } from 'lucide-react';

// Helper functions to transform analytics data to chart format
const transformToPieChartData = (categoryData: any[]) => ({
  labels: categoryData.map(item => item.category),
  datasets: [{
    data: categoryData.map(item => item.amount),
    backgroundColor: categoryData.map((item, index) => item.color || CHART_COLORS[index % CHART_COLORS.length]),
    borderColor: categoryData.map((item, index) => item.color || CHART_COLORS[index % CHART_COLORS.length]),
    borderWidth: 1,
  }]
});

const transformToBarChartData = (monthlyData: any[]) => ({
  labels: monthlyData.map(item => item.month),
  datasets: [{
    label: 'Monthly Expenses',
    data: monthlyData.map(item => item.amount),
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
    borderColor: 'rgba(59, 130, 246, 1)',
    borderWidth: 1,
  }]
});

const transformToLineChartData = (dailyData: any[]) => ({
  labels: dailyData.map(item => item.date),
  datasets: [{
    label: 'Daily Expenses',
    data: dailyData.map(item => item.amount),
    borderColor: 'rgba(34, 197, 94, 1)',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    tension: 0.4,
    fill: true,
  }]
});

const transformToDoughnutChartData = (categoryData: any[]) => ({
  labels: categoryData.map(item => item.category),
  datasets: [{
    data: categoryData.map(item => item.amount),
    backgroundColor: categoryData.map((item, index) => item.color || CHART_COLORS[index % CHART_COLORS.length]),
    borderColor: categoryData.map((item, index) => item.color || CHART_COLORS[index % CHART_COLORS.length]),
    borderWidth: 1,
    cutout: '60%',
  }]
});

export default function AnalyticsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const { data, loading, error } = useAnalytics({ month: selectedMonth });
  const { currency } = useSettings();

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 dark:bg-gray-600 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-300 dark:bg-gray-600 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">Error loading analytics</p>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed insights into your spending patterns
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(data.totalExpenses, currency.code)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                  {data.expenseCount}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Receipt className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Average Transaction
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(data.expenseCount > 0 ? data.totalExpenses / data.expenseCount : 0, currency.code)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Budget Status
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.monthlyBudgetRemaining >= 0 ? (
                    <span className="text-green-600 dark:text-green-400">
                      {formatCurrency(data.monthlyBudgetRemaining, currency.code)}
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">
                      -{formatCurrency(Math.abs(data.monthlyBudgetRemaining), currency.code)}
                    </span>
                  )}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                {data.monthlyBudgetRemaining >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
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
            <PieChart data={transformToPieChartData(data.categoryDistribution)} />
          </CardContent>
        </Card>

        {/* Monthly Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={transformToBarChartData(data.monthlyComparison)} />
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={transformToLineChartData(data.dailyTrend)} />
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <DoughnutChart data={transformToDoughnutChartData(data.topCategories)} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentTransactions.slice(0, 10).map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: '#3B82F6' }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      🏷️ {transaction.category} • {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatExpenseAmountWithCachedDbRates(transaction.amount, transaction.currency, currency.code)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{budget.percentage.toFixed(1)}% used</span>
                    <span>
                      {budget.percentage > 100 
                        ? `${formatCurrency(budget.spent - budget.budget, currency.code)} over budget`
                        : `${formatCurrency(budget.budget - budget.spent, currency.code)} remaining`
                      }
                    </span>
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
