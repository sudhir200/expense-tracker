'use client';

import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { formatCurrency, getCurrencyList } from '@/lib/currency';
import { 
  Shield,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface UserAnalytics {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  analytics: {
    totalExpenses: number;
    totalIncome: number;
    netIncome: number;
    expenseCount: number;
    incomeCount: number;
  };
}

interface SystemTotals {
  totalExpenses: number;
  totalIncome: number;
  totalUsers: number;
  totalTransactions: number;
}

interface AdminAnalyticsData {
  month: string;
  currency: string;
  systemTotals: SystemTotals;
  userAnalytics: UserAnalytics[];
}

export default function AdminAnalyticsPage() {
  const { isAdminOrHigher } = usePermissions();
  const { currency: userCurrency } = useSettings();
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [currency, setCurrency] = useState(userCurrency.code);
  
  const currencies = getCurrencyList();

  // Redirect if not authorized
  if (!isAdminOrHigher) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/analytics?month=${month}&currency=${currency}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await api.get(`/api/admin/analytics?userId=${userId}&month=${month}&currency=${currency}`);
      if (response.ok) {
        const userData = await response.json();
        setSelectedUser({
          user: userData.user,
          analytics: userData.analytics
        });
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [month, currency]);

  // Update currency when user's settings change
  useEffect(() => {
    setCurrency(userCurrency.code);
  }, [userCurrency.code]);

  const getSavingsRate = (income: number, expenses: number) => {
    if (income === 0) return 0;
    return ((income - expenses) / income) * 100;
  };

  const getPerformanceColor = (netIncome: number) => {
    if (netIncome > 0) return 'text-green-600 dark:text-green-400';
    if (netIncome < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getPerformanceIcon = (netIncome: number) => {
    if (netIncome > 0) return <TrendingUp className="h-4 w-4" />;
    if (netIncome < 0) return <TrendingDown className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  return (
    <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Overview of user financial data and system performance
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      ) : !data ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No data available</p>
        </div>
      ) : (
        <>
          {/* System Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data.systemTotals.totalUsers}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(data.systemTotals.totalIncome, currency)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(data.systemTotals.totalExpenses, currency)}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net System</p>
                    <p className={`text-2xl font-bold ${getPerformanceColor(data.systemTotals.totalIncome - data.systemTotals.totalExpenses)}`}>
                      {formatCurrency(data.systemTotals.totalIncome - data.systemTotals.totalExpenses, currency)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Analytics Table */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>User Financial Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Income</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Expenses</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Net</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Savings Rate</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Transactions</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.userAnalytics.map((userAnalytic) => {
                      const savingsRate = getSavingsRate(userAnalytic.analytics.totalIncome, userAnalytic.analytics.totalExpenses);
                      return (
                        <tr key={userAnalytic.user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{userAnalytic.user.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{userAnalytic.user.email}</div>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                userAnalytic.user.role === 'ADMIN' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {userAnalytic.user.role}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right text-green-600 dark:text-green-400 font-medium">
                            {formatCurrency(userAnalytic.analytics.totalIncome, currency)}
                          </td>
                          <td className="py-4 px-4 text-right text-red-600 dark:text-red-400 font-medium">
                            {formatCurrency(userAnalytic.analytics.totalExpenses, currency)}
                          </td>
                          <td className={`py-4 px-4 text-right font-medium ${getPerformanceColor(userAnalytic.analytics.netIncome)}`}>
                            <div className="flex items-center justify-end space-x-1">
                              {getPerformanceIcon(userAnalytic.analytics.netIncome)}
                              <span>{formatCurrency(userAnalytic.analytics.netIncome, currency)}</span>
                            </div>
                          </td>
                          <td className={`py-4 px-4 text-right font-medium ${
                            savingsRate > 20 ? 'text-green-600 dark:text-green-400' :
                            savingsRate > 0 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {savingsRate.toFixed(1)}%
                          </td>
                          <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-400">
                            {userAnalytic.analytics.expenseCount + userAnalytic.analytics.incomeCount}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fetchUserDetails(userAnalytic.user.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* User Detail Modal */}
          {selectedUser && (
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="h-5 w-5" />
                    <span>Detailed View: {selectedUser.user.name}</span>
                  </CardTitle>
                  <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Income</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(selectedUser.analytics.totalIncome, currency)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {selectedUser.analytics.incomeCount} transactions
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(selectedUser.analytics.totalExpenses, currency)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {selectedUser.analytics.expenseCount} transactions
                    </p>
                  </div>
                  
                  <div className={`text-center p-4 rounded-lg ${
                    selectedUser.analytics.netIncome > 0 
                      ? 'bg-blue-50 dark:bg-blue-900/20' 
                      : 'bg-gray-50 dark:bg-gray-900/20'
                  }`}>
                    <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Net Income</p>
                    <p className={`text-xl font-bold ${getPerformanceColor(selectedUser.analytics.netIncome)}`}>
                      {formatCurrency(selectedUser.analytics.netIncome, currency)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {getSavingsRate(selectedUser.analytics.totalIncome, selectedUser.analytics.totalExpenses).toFixed(1)}% savings rate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
