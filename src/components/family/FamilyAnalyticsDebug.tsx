'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFamily } from '@/hooks/useFamily';
import { useFamilyIncome } from '@/hooks/useFamilyIncome';
import { useFamilyExpenses } from '@/hooks/useFamilyExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Users, 
  DollarSign,
  X,
  RefreshCw
} from 'lucide-react';

interface FamilyAnalyticsDebugProps {
  onClose: () => void;
}

export default function FamilyAnalyticsDebug({ onClose }: FamilyAnalyticsDebugProps) {
  const { user } = useAuth();
  const { family, loading: familyLoading, hasFamily } = useFamily();
  const { income: familyIncome, loading: incomeLoading, error: incomeError } = useFamilyIncome({ limit: 10 });
  const { expenses: familyExpenses, loading: expensesLoading, error: expensesError } = useFamilyExpenses({ limit: 10 });
  
  const [apiTests, setApiTests] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const runApiTests = async () => {
    setTesting(true);
    const tests = [];

    // Test 1: Check user authentication
    tests.push({
      name: 'User Authentication',
      status: user ? 'success' : 'error',
      message: user ? `Logged in as ${user.name} (${user.role})` : 'Not authenticated',
      details: user ? { userId: (user as any).userId, role: user.role } : null
    });

    // Test 2: Check family membership
    tests.push({
      name: 'Family Membership',
      status: hasFamily ? 'success' : 'warning',
      message: hasFamily ? `Member of family: ${family?.name}` : 'Not part of any family',
      details: family ? { 
        familyId: family._id, 
        memberCount: family.members?.length,
        currency: family.currency 
      } : null
    });

    // Test 3: Family Income API
    try {
      const incomeResponse = await api.get('/api/family/income?limit=5');
      if (incomeResponse.ok) {
        const incomeData = await incomeResponse.json();
        tests.push({
          name: 'Family Income API',
          status: 'success',
          message: `Fetched ${incomeData.income?.length || 0} income records`,
          details: incomeData
        });
      } else {
        const errorData = await incomeResponse.json();
        tests.push({
          name: 'Family Income API',
          status: 'error',
          message: `HTTP ${incomeResponse.status}: ${errorData.error}`,
          details: errorData
        });
      }
    } catch (error) {
      tests.push({
        name: 'Family Income API',
        status: 'error',
        message: `Network error: ${error}`,
        details: null
      });
    }

    // Test 4: Family Expenses API
    try {
      const expensesResponse = await api.get('/api/family/expenses?limit=5');
      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json();
        tests.push({
          name: 'Family Expenses API',
          status: 'success',
          message: `Fetched ${expensesData.expenses?.length || 0} expense records`,
          details: expensesData
        });
      } else {
        const errorData = await expensesResponse.json();
        tests.push({
          name: 'Family Expenses API',
          status: 'error',
          message: `HTTP ${expensesResponse.status}: ${errorData.error}`,
          details: errorData
        });
      }
    } catch (error) {
      tests.push({
        name: 'Family Expenses API',
        status: 'error',
        message: `Network error: ${error}`,
        details: null
      });
    }

    // Test 5: Check user permissions
    if (family && user) {
      const member = family.members?.find(m => m.userId._id === (user as any).userId);
      tests.push({
        name: 'Family Permissions',
        status: member ? 'success' : 'warning',
        message: member ? 'User is a family member with permissions' : 'User not found in family members',
        details: member ? {
          role: member.role,
          permissions: member.permissions,
          joinedAt: member.joinedAt
        } : null
      });
    }

    setApiTests(tests);
    setTesting(false);
  };

  useEffect(() => {
    runApiTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <span>Family Analytics Debug</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={runApiTests}
                disabled={testing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
                <span>Refresh Tests</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current State Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Family Status</p>
                    <p className={`text-lg font-bold ${hasFamily ? 'text-green-600' : 'text-red-600'}`}>
                      {hasFamily ? 'Connected' : 'Not Connected'}
                    </p>
                  </div>
                  <Users className={`h-8 w-8 ${hasFamily ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Income Records</p>
                    <p className="text-lg font-bold text-blue-600">
                      {familyIncome.length}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Expense Records</p>
                    <p className="text-lg font-bold text-purple-600">
                      {familyExpenses.length}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>API Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiTests.map((test, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}>
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(test.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{test.name}</h4>
                          <span className="text-xs text-gray-500 uppercase">{test.status}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{test.message}</p>
                        {test.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer">View Details</summary>
                            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(test.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hook States */}
          <Card>
            <CardHeader>
              <CardTitle>Hook States</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Family Hook</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Loading:</strong> {familyLoading ? 'Yes' : 'No'}</p>
                    <p><strong>Has Family:</strong> {hasFamily ? 'Yes' : 'No'}</p>
                    <p><strong>Family Name:</strong> {family?.name || 'N/A'}</p>
                    <p><strong>Members:</strong> {family?.members?.length || 0}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Income Hook</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Loading:</strong> {incomeLoading ? 'Yes' : 'No'}</p>
                    <p><strong>Error:</strong> {incomeError || 'None'}</p>
                    <p><strong>Records:</strong> {familyIncome.length}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Expenses Hook</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Loading:</strong> {expensesLoading ? 'Yes' : 'No'}</p>
                    <p><strong>Error:</strong> {expensesError || 'None'}</p>
                    <p><strong>Records:</strong> {familyExpenses.length}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">User Context</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
                    <p><strong>Role:</strong> {user?.role || 'N/A'}</p>
                    <p><strong>User ID:</strong> {(user as any)?.userId || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!hasFamily && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>No Family:</strong> You need to create or join a family to use analytics. 
                      Go to the Family page to set up your family.
                    </p>
                  </div>
                )}
                
                {hasFamily && familyIncome.length === 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>No Income Data:</strong> Add some family income records to see meaningful analytics.
                    </p>
                  </div>
                )}
                
                {hasFamily && familyExpenses.length === 0 && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      <strong>No Expense Data:</strong> Add some family expenses to see spending analytics.
                    </p>
                  </div>
                )}

                {apiTests.some(test => test.status === 'error') && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <strong>API Errors:</strong> Some API calls are failing. Check your network connection and ensure you have proper permissions.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
