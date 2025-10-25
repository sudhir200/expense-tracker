'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFamily } from '@/hooks/useFamily';
import { api } from '@/lib/api';
import { 
  Users, 
  Crown, 
  User, 
  Baby, 
  Settings, 
  Trash2, 
  X,
  Check,
  AlertTriangle
} from 'lucide-react';

interface FamilyMemberManagerProps {
  onClose: () => void;
}

export default function FamilyMemberManager({ onClose }: FamilyMemberManagerProps) {
  const { family, refetch } = useFamily();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  if (!family) return null;

  const handleRoleChange = async (userId: string, newRole: 'head' | 'adult' | 'child') => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.put(`/api/family/members/${userId}`, {
        role: newRole,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update member role');
      }

      await refetch();
      setEditingMember(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member role');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.delete(`/api/family/members/${userId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove member');
      }

      await refetch();
      setConfirmRemove(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'head':
        return <Crown className="h-4 w-4 text-purple-600" />;
      case 'adult':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'child':
        return <Baby className="h-4 w-4 text-green-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'head':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200';
      case 'adult':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200';
      case 'child':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Check if current user can manage family members
  // For now, we'll assume the user can manage if they are the head or have manage permissions
  const currentUserMember = family.members.find(member => 
    member.permissions.canManageMembers || member.role === 'head'
  );
  const canManageMembers = !!currentUserMember;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Manage Family Members</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {family.members.map((member) => (
              <div key={member.userId._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
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
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Role Display/Editor */}
                    {editingMember === member.userId._id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          defaultValue={member.role}
                          onChange={(e) => handleRoleChange(member.userId._id, e.target.value as any)}
                          disabled={loading}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                        >
                          <option value="head">Head</option>
                          <option value="adult">Adult</option>
                          <option value="child">Child</option>
                        </select>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingMember(null)}
                          disabled={loading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                          {getRoleIcon(member.role)}
                          <span>{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</span>
                        </div>
                        
                        {canManageMembers && (
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingMember(member.userId._id)}
                              disabled={loading}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                            
                            {member.role !== 'head' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmRemove(member.userId._id)}
                                disabled={loading}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Permissions Display */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Permissions:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center space-x-1 ${member.permissions.canViewFamilyIncome ? 'text-green-600' : 'text-gray-400'}`}>
                      <Check className="h-3 w-3" />
                      <span>View Income</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${member.permissions.canAddFamilyIncome ? 'text-green-600' : 'text-gray-400'}`}>
                      <Check className="h-3 w-3" />
                      <span>Add Income</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${member.permissions.canViewFamilyExpenses ? 'text-green-600' : 'text-gray-400'}`}>
                      <Check className="h-3 w-3" />
                      <span>View Expenses</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${member.permissions.canAddFamilyExpenses ? 'text-green-600' : 'text-gray-400'}`}>
                      <Check className="h-3 w-3" />
                      <span>Add Expenses</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${member.permissions.canManageMembers ? 'text-green-600' : 'text-gray-400'}`}>
                      <Check className="h-3 w-3" />
                      <span>Manage Members</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${member.permissions.canManageBudgets ? 'text-green-600' : 'text-gray-400'}`}>
                      <Check className="h-3 w-3" />
                      <span>Manage Budgets</span>
                    </div>
                  </div>
                </div>

                {/* Confirm Remove Dialog */}
                {confirmRemove === member.userId._id && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-red-600 dark:text-red-400 font-medium text-sm">
                        Remove {member.userId.name}?
                      </span>
                    </div>
                    <p className="text-red-600 dark:text-red-400 text-xs mb-3">
                      This action cannot be undone. They will need a new invite to rejoin.
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmRemove(null)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRemoveMember(member.userId._id)}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {loading ? 'Removing...' : 'Remove'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Role Descriptions */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Role Descriptions:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <Crown className="h-4 w-4 text-purple-600 mt-0.5" />
                <div>
                  <span className="font-medium text-purple-600">Head:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    Full access to all family features and member management
                  </span>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <User className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <span className="font-medium text-blue-600">Adult:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    Can add income and expenses, view all family financial data
                  </span>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Baby className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <span className="font-medium text-green-600">Child:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    Limited access, can view expenses but cannot add income
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
