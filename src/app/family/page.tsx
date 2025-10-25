'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFamily } from '@/hooks/useFamily';
import { useFamilyIncome } from '@/hooks/useFamilyIncome';
import { useFamilyExpenses } from '@/hooks/useFamilyExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/rbac';
import FamilySetup from '@/components/family/FamilySetup';
import FamilyIncomeForm from '@/components/family/FamilyIncomeForm';
import FamilyExpenseForm from '@/components/family/FamilyExpenseForm';
import FamilyAnalytics from '@/components/family/FamilyAnalytics';
import FamilyAnalyticsDebug from '@/components/family/FamilyAnalyticsDebug';
import FamilyMemberManager from '@/components/family/FamilyMemberManager';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Share2, 
  Settings,
  Copy,
  Check,
  Receipt,
  PieChart,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { api } from '@/lib/api';

export default function FamilyPage() {
  const { user } = useAuth();
  const { family, loading, hasFamily, createInviteCode } = useFamily();
  const { income: familyIncome, refetch: refetchIncome } = useFamilyIncome({ limit: 5 });
  const { expenses: familyExpenses, refetch: refetchExpenses } = useFamilyExpenses({ limit: 5 });
  
  // Check if user can create income
  const canCreateIncome = user ? hasPermission(user.role, 'income', 'create') : false;
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [familyStatus, setFamilyStatus] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Check family status
  const checkFamilyStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await api.get('/api/family/check-user');
      if (response.ok) {
        const status = await response.json();
        setFamilyStatus(status);
      }
    } catch (error) {
      console.error('Error checking family status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Auto-assign user to family
  const autoAssignToFamily = async () => {
    try {
      setCheckingStatus(true);
      const response = await api.post('/api/family/check-user', {
        action: 'auto_assign'
      });
      if (response.ok) {
        const result = await response.json();
        setFamilyStatus(result);
        // Refresh the page data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error auto-assigning to family:', error);
    } finally {
      setCheckingStatus(false);
    }
  };
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAnalyticsDebug, setShowAnalyticsDebug] = useState(false);
  const [showMemberManager, setShowMemberManager] = useState(false);

  const handleCreateInvite = async () => {
    try {
      const result = await createInviteCode();
      setInviteCode(result.code);
      setShowInviteCode(true);
    } catch (error) {
      console.error('Failed to create invite code:', error);
    }
  };

  const handleCopyCode = async () => {
    if (inviteCode) {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!hasFamily) {
    return (
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Family Budget Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organize your family's income and expenses together
          </p>
        </div>

        {/* Family Status Checker */}
        <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  🔍 Family Status Checker
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                  Having trouble adding family expenses? Check your family assignment status.
                </p>
                {familyStatus && (
                  <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Status: {familyStatus.status}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {familyStatus.message}
                    </p>
                    {familyStatus.suggestion && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                        💡 {familyStatus.suggestion}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={checkFamilyStatus}
                  disabled={checkingStatus}
                  variant="outline"
                  size="sm"
                >
                  {checkingStatus ? 'Checking...' : 'Check Status'}
                </Button>
                {familyStatus?.status === 'NO_FAMILY' && familyStatus?.familyCount > 0 && (
                  <Button
                    onClick={autoAssignToFamily}
                    disabled={checkingStatus}
                    size="sm"
                  >
                    {checkingStatus ? 'Assigning...' : 'Auto-Assign to Family'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <FamilySetup />
      </div>
    );
  }

  if (!family) return null;

  // Calculate family totals
  const totalFamilyIncome = familyIncome.reduce((sum, income) => sum + income.allocation.toFamily, 0);
  const totalFamilyExpenses = familyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const familyCurrency = family.currency;

  const handleIncomeSuccess = () => {
    refetchIncome();
    setShowIncomeForm(false);
  };

  const handleExpenseSuccess = () => {
    refetchExpenses();
    setShowExpenseForm(false);
  };

  return (
    <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {family.name}
          </h1>
          {family.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {family.description}
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleCreateInvite}
            className="flex items-center space-x-2"
          >
            <Share2 className="h-4 w-4" />
            <span>Invite Member</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(true)}
            className="flex items-center space-x-2"
          >
            <PieChart className="h-4 w-4" />
            <span>Analytics</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnalyticsDebug(true)}
            className="flex items-center space-x-2 text-xs"
          >
            <AlertCircle className="h-3 w-3" />
            <span>Debug</span>
          </Button>
        </div>
      </div>

      {/* Invite Code Modal */}
      {showInviteCode && inviteCode && (
        <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  Family Invite Code
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Share this code with family members to invite them
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <code className="px-3 py-2 bg-white dark:bg-gray-800 rounded border text-lg font-mono">
                  {inviteCode}
                </code>
                <Button
                  size="sm"
                  onClick={handleCopyCode}
                  className="flex items-center space-x-1"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Family Members
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {family.members.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Family Income
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalFamilyIncome, familyCurrency as any)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Family Expenses
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalFamilyExpenses, familyCurrency as any)}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <Receipt className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Family Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Family Members</span>
              </div>
              <Button 
                size="sm" 
                onClick={() => setShowMemberManager(true)}
                className="flex items-center space-x-1"
              >
                <Settings className="h-4 w-4" />
                <span>Manage</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {family.members.map((member) => (
                <div key={member.userId._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {member.userId.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.userId.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {member.userId.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.role === 'head' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                        : member.role === 'adult'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Family Income */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Recent Family Income</span>
              </div>
              {canCreateIncome && (
                <Button 
                  size="sm" 
                  onClick={() => setShowIncomeForm(true)}
                  className="flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Income</span>
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {familyIncome.length > 0 ? (
                familyIncome.map((income) => (
                  <div key={income._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {income.description}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {income.source} • by {income.contributedBy.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600 dark:text-green-400">
                        +{formatCurrency(income.allocation.toFamily, income.currency as any)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(income.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No family income recorded yet</p>
                  <p className="text-sm">Start by adding income to the family budget</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Family Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5" />
                <span>Recent Family Expenses</span>
              </div>
              <Button 
                size="sm" 
                onClick={() => setShowExpenseForm(true)}
                className="flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Expense</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {familyExpenses.length > 0 ? (
                familyExpenses.map((expense) => (
                  <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {expense.description}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {expense.category} • by {expense.paidBy.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600 dark:text-red-400">
                        -{formatCurrency(expense.amount, expense.currency as any)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No family expenses recorded yet</p>
                  <p className="text-sm">Start by adding shared household costs</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-green-200 dark:border-green-800"
            onClick={() => setShowIncomeForm(true)}
          >
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full w-fit mx-auto mb-3">
                <Plus className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                Add Family Income
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Contribute to the family budget
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-red-200 dark:border-red-800"
            onClick={() => setShowExpenseForm(true)}
          >
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full w-fit mx-auto mb-3">
                <Receipt className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                Add Family Expense
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Record shared household costs
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-blue-200 dark:border-blue-800"
            onClick={() => setShowAnalytics(true)}
          >
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit mx-auto mb-3">
                <PieChart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                View Analytics
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Family spending insights
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {showIncomeForm && (
        <FamilyIncomeForm
          onClose={() => setShowIncomeForm(false)}
          onSuccess={handleIncomeSuccess}
        />
      )}

      {showExpenseForm && (
        <FamilyExpenseForm
          onClose={() => setShowExpenseForm(false)}
          onSuccess={handleExpenseSuccess}
        />
      )}

      {showAnalytics && (
        <FamilyAnalytics
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {showAnalyticsDebug && (
        <FamilyAnalyticsDebug
          onClose={() => setShowAnalyticsDebug(false)}
        />
      )}

      {showMemberManager && (
        <FamilyMemberManager
          onClose={() => setShowMemberManager(false)}
        />
      )}
    </div>
  );
}
