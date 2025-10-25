'use client';

import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { 
  Shield, 
  Users, 
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPERUSER';
  isActive: boolean;
  createdAt: string;
}

export default function AdminDebugPage() {
  const { isAdminOrHigher, isSuperUser } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [error, setError] = useState('');

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching users...');
      const response = await api.get('/api/admin/users');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users fetched:', data);
        setUsers(data.users || []);
        
        addTestResult('Fetch Users', 'success', `Fetched ${data.users?.length || 0} users`);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch users:', errorData);
        setError(errorData.error || 'Failed to fetch users');
        addTestResult('Fetch Users', 'error', errorData.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Network error while fetching users');
      addTestResult('Fetch Users', 'error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const testUpdateUser = async (userId: string, updates: any) => {
    try {
      console.log('Testing user update:', userId, updates);
      
      const response = await api.put(`/api/admin/users/${userId}`, updates);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Update successful:', result);
        addTestResult('Update User', 'success', `Updated user ${userId}`);
        fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        addTestResult('Update User', 'error', errorData.error || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      addTestResult('Update User', 'error', 'Network error');
    }
  };

  const addTestResult = (test: string, status: 'success' | 'error' | 'warning', message: string) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
    setError('');
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Debug Console</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Debug admin user management functionality
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Debug Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={fetchUsers} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Users'}
            </Button>
            <Button onClick={clearResults} variant="outline">
              Clear Results
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Users ({users.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            ) : users.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-4">No users found</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === 'SUPERUSER' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            user.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {user.role}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testUpdateUser(user.id, { 
                            name: user.name + ' (Updated)',
                            isActive: user.isActive 
                          })}
                        >
                          Test Name Update
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testUpdateUser(user.id, { 
                            isActive: !user.isActive 
                          })}
                        >
                          Toggle Status
                        </Button>
                        {isSuperUser && user.role !== 'SUPERUSER' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testUpdateUser(user.id, { 
                              role: user.role === 'USER' ? 'ADMIN' : 'USER'
                            })}
                          >
                            Toggle Role
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Test Results ({testResults.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-4">No test results yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    result.status === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
                    result.status === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                    'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {result.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                      ) : result.status === 'error' ? (
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{result.test}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{result.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{result.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debug Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Current User Role:</strong> {isSuperUser ? 'SUPERUSER' : 'ADMIN'}</p>
              <p><strong>Can Manage Users:</strong> {isAdminOrHigher ? 'Yes' : 'No'}</p>
              <p><strong>Is Super User:</strong> {isSuperUser ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p><strong>API Base URL:</strong> {window.location.origin}</p>
              <p><strong>Auth Token:</strong> {localStorage.getItem('auth-token') ? 'Present' : 'Missing'}</p>
              <p><strong>Total Users:</strong> {users.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
