'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/rbac';
import FamilyIncomeForm from '@/components/family/FamilyIncomeForm';
import FamilyExpenseForm from '@/components/family/FamilyExpenseForm';
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
  ArrowLeft,
  Crown,
  User,
  Baby,
  Edit,
  Trash2
} from 'lucide-react';

interface FamilyData {
  _id: string;
  name: string;
  description?: string;
  currency: string;
  createdBy: string;
  members: Array<{
    userId: {
      _id: string;
      name: string;
      email: string;
    };
    role: 'head' | 'adult' | 'child';
    joinedAt: string;
    permissions: {
      canViewFamilyIncome: boolean;
      canAddFamilyIncome: boolean;
      canViewFamilyExpenses: boolean;
      canAddFamilyExpenses: boolean;
      canManageMembers: boolean;
      canManageBudgets: boolean;
    };
  }>;
  settings: {
    allowPersonalExpenses: boolean;
    requireApprovalForLargeExpenses: boolean;
    largeExpenseThreshold: number;
    sharedCategories: string[];
    personalCategories: string[];
  };
  createdAt: string;
}

interface UserFamilyData {
  _id: string;
  userId: string;
  role: 'head' | 'adult' | 'child';
  isPrimary: boolean;
  permissions: {
    canViewFamilyIncome: boolean;
    canAddFamilyIncome: boolean;
    canViewFamilyExpenses: boolean;
    canAddFamilyExpenses: boolean;
    canManageMembers: boolean;
    canManageBudgets: boolean;
  };
}

export default function FamilyDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [userFamily, setUserFamily] = useState<UserFamilyData | null>(null);
  
  // Check if user can create income globally
  const canCreateIncome = user ? hasPermission(user.role, 'income', 'create') : false;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch family data
  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch family details
      const familyResponse = await api.get(`/api/families/${params.id}`);
      if (!familyResponse.ok) {
        throw new Error('Family not found');
      }
      const familyData = await familyResponse.json();
      setFamily(familyData.family);

      // Fetch user's relationship to this family
      const userFamilyResponse = await api.get(`/api/families/${params.id}/user-relationship`);
      if (userFamilyResponse.ok) {
        const userFamilyData = await userFamilyResponse.json();
        setUserFamily(userFamilyData.userFamily);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load family data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyData();
  }, [params.id]);

  // Generate invite code
  const generateInviteCode = async () => {
    try {
      const response = await api.post(`/api/families/${params.id}/invite`);
      if (response.ok) {
        const data = await response.json();
        setInviteCode(data.inviteCode);
        setShowInviteCode(true);
        copyToClipboard(data.inviteCode);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate invite code');
      }
    } catch (err) {
      setError('Failed to generate invite code');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'head': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'adult': return <User className="h-4 w-4 text-blue-500" />;
      case 'child': return <Baby className="h-4 w-4 text-green-500" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'head': return 'Family Head';
      case 'adult': return 'Adult Member';
      case 'child': return 'Child Member';
      default: return 'Member';
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading family...</p>
        </div>
      </div>
    );
  }

  if (error || !family) {
    return (
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Family Not Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'The family you are looking for does not exist or you do not have access to it.'}
          </p>
          <Button onClick={() => window.location.href = '/families'}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Families
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/families'}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {family.name}
                </h1>
                {userFamily?.isPrimary && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    Primary Family
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {family.description || 'Family budget management'}
              </p>
              {userFamily && (
                <div className="flex items-center space-x-2 mt-2">
                  {getRoleIcon(userFamily.role)}
                  <span className="text-sm text-gray-500">
                    {getRoleText(userFamily.role)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            {userFamily?.permissions.canAddFamilyExpenses && (
              <Button
                onClick={() => setShowExpenseForm(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Receipt className="h-4 w-4" />
                <span>Add Expense</span>
              </Button>
            )}
            {userFamily?.permissions.canAddFamilyIncome && canCreateIncome && (
              <Button
                onClick={() => setShowIncomeForm(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Add Income</span>
              </Button>
            )}
            {(userFamily?.role === 'head' || userFamily?.permissions.canManageMembers) && (
              <Button
                onClick={generateInviteCode}
                className="flex items-center space-x-2"
              >
                <Share2 className="h-4 w-4" />
                <span>Invite Members</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: DollarSign },
              { id: 'members', name: 'Members', icon: Users },
              { id: 'analytics', name: 'Analytics', icon: PieChart },
              { id: 'settings', name: 'Settings', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Family Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Family Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{family.members.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Members</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{family.currency}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Default Currency</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Created</div>
                <div className="font-medium">{new Date(family.createdAt).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Placeholder */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Recent family transactions will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'members' && userFamily && family && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Family Members</span>
              </div>
              {(userFamily.role === 'head' || userFamily.permissions.canManageMembers) && (
                <Button
                  onClick={generateInviteCode}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Invite Member</span>
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {family.members.map((member, index) => (
                <div
                  key={member.userId._id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(member.role)}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {member.userId.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {member.userId.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {getRoleText(member.role)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                    {(userFamily.role === 'head' || userFamily.permissions.canManageMembers) && 
                     member.userId._id !== userFamily.userId && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {family.members.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No family members yet</p>
                <p className="text-sm">Invite members to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <Card>
          <CardHeader>
            <CardTitle>Family Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Family analytics and reports will appear here</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Family Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Family settings will be available here</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Code Modal */}
      {showInviteCode && inviteCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Family Invite Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Share this code with new members:
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-md font-mono text-lg text-center">
                    {inviteCode}
                  </div>
                  <Button
                    onClick={() => copyToClipboard(inviteCode)}
                    variant="outline"
                    size="sm"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This code expires in 7 days and can be used by anyone to join your family.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowInviteCode(false)}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Forms */}
      {showIncomeForm && (
        <FamilyIncomeForm
          onClose={() => setShowIncomeForm(false)}
          onSuccess={() => {
            setShowIncomeForm(false);
            // Refresh data if needed
          }}
        />
      )}

      {showExpenseForm && (
        <FamilyExpenseForm
          onClose={() => setShowExpenseForm(false)}
          onSuccess={() => {
            setShowExpenseForm(false);
            // Refresh data if needed
          }}
        />
      )}
    </div>
  );
}
