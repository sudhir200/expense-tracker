'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useFamily } from '@/hooks/useFamily';
import { Users, Plus, UserPlus, Home, Heart } from 'lucide-react';

export default function FamilySetup() {
  const { family, loading, hasFamily, createFamily, joinFamily } = useFamily();
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create family form state
  const [familyName, setFamilyName] = useState('');
  const [familyDescription, setFamilyDescription] = useState('');
  const [familyCurrency, setFamilyCurrency] = useState('USD');

  // Join family form state
  const [inviteCode, setInviteCode] = useState('');

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createFamily({
        name: familyName.trim(),
        description: familyDescription.trim() || undefined,
        currency: familyCurrency,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create family');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await joinFamily(inviteCode.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join family');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (hasFamily && family) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <span>Welcome to {family.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span>{family.members.length} family members</span>
            </div>
            
            {family.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {family.description}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card className="border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Add Family Income</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Contribute to the family budget
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Family Expenses</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Track shared household costs
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {mode === 'choice' && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Heart className="h-6 w-6 text-red-500" />
              <span>Family Budget Setup</span>
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your family's finances together
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setMode('create')}
              className="w-full flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Family</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setMode('join')}
              className="w-full flex items-center justify-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Join Existing Family</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {mode === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle>Create Family</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Set up your family budget management
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Family Name *
                </label>
                <Input
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="e.g., The Smith Family"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <Input
                  value={familyDescription}
                  onChange={(e) => setFamilyDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Currency
                </label>
                <select
                  value={familyCurrency}
                  onChange={(e) => setFamilyCurrency(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="NPR">NPR - Nepalese Rupee</option>
                </select>
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode('choice')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !familyName.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? 'Creating...' : 'Create Family'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {mode === 'join' && (
        <Card>
          <CardHeader>
            <CardTitle>Join Family</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Enter the invite code to join an existing family
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinFamily} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invite Code *
                </label>
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter 16-character code"
                  maxLength={16}
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode('choice')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !inviteCode.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? 'Joining...' : 'Join Family'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
