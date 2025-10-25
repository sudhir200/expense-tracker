'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { 
  Users, 
  Plus, 
  Settings, 
  Crown, 
  User, 
  Baby, 
  Calendar,
  DollarSign,
  Star,
  StarOff,
  LogOut,
  Edit,
  Trash2,
  Copy,
  Check,
  X
} from 'lucide-react';

interface UserFamily {
  _id: string;
  familyId: {
    _id: string;
    name: string;
    description?: string;
    currency: string;
    createdBy: string;
    members: any[];
    createdAt: string;
  };
  role: 'head' | 'adult' | 'child';
  joinedAt: string;
  isActive: boolean;
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

export default function FamiliesPage() {
  const [families, setFamilies] = useState<UserFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isBulkJoinModalOpen, setIsBulkJoinModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Create family form
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    currency: 'USD',
  });

  // Join family form
  const [joinForm, setJoinForm] = useState({
    inviteCode: '',
  });

  // Bulk join form
  const [bulkJoinForm, setBulkJoinForm] = useState({
    inviteCodes: [''], // Start with one empty code
  });

  const [bulkJoinResults, setBulkJoinResults] = useState<Array<{
    code: string;
    success: boolean;
    familyName?: string;
    error?: string;
  }>>([]);

  // Fetch user's families
  const fetchFamilies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/families/user-families');
      if (response.ok) {
        const data = await response.json();
        setFamilies(data.families || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch families');
      }
    } catch (err) {
      setError('Failed to fetch families');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, []);

  // Create new family
  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    try {
      setFormLoading(true);
      const response = await api.post('/api/families', createForm);
      
      if (response.ok) {
        setIsCreateModalOpen(false);
        setCreateForm({ name: '', description: '', currency: 'USD' });
        fetchFamilies();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create family');
      }
    } catch (err) {
      setError('Failed to create family');
    } finally {
      setFormLoading(false);
    }
  };

  // Join family with invite code
  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinForm.inviteCode.trim()) return;

    try {
      setFormLoading(true);
      const response = await api.post('/api/families/join', { inviteCode: joinForm.inviteCode });
      
      if (response.ok) {
        setIsJoinModalOpen(false);
        setJoinForm({ inviteCode: '' });
        fetchFamilies();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to join family');
      }
    } catch (err) {
      setError('Failed to join family');
    } finally {
      setFormLoading(false);
    }
  };

  // Bulk join families with multiple invite codes
  const handleBulkJoinFamilies = async (e: React.FormEvent) => {
    e.preventDefault();
    const validCodes = bulkJoinForm.inviteCodes.filter(code => code.trim());
    if (validCodes.length === 0) return;

    try {
      setFormLoading(true);
      setBulkJoinResults([]);
      
      const results = [];
      
      for (const code of validCodes) {
        try {
          const response = await api.post('/api/families/join', { inviteCode: code.trim() });
          
          if (response.ok) {
            const data = await response.json();
            results.push({
              code: code.trim(),
              success: true,
              familyName: data.family.name
            });
          } else {
            const errorData = await response.json();
            results.push({
              code: code.trim(),
              success: false,
              error: errorData.error || 'Failed to join family'
            });
          }
        } catch (err) {
          results.push({
            code: code.trim(),
            success: false,
            error: 'Network error'
          });
        }
      }
      
      setBulkJoinResults(results);
      
      // Refresh families list
      fetchFamilies();
      
      // If all successful, close modal after a delay
      if (results.every(r => r.success)) {
        setTimeout(() => {
          setIsBulkJoinModalOpen(false);
          setBulkJoinForm({ inviteCodes: [''] });
          setBulkJoinResults([]);
        }, 2000);
      }
    } catch (err) {
      setError('Failed to join families');
    } finally {
      setFormLoading(false);
    }
  };

  // Add new invite code input
  const addInviteCodeInput = () => {
    setBulkJoinForm(prev => ({
      inviteCodes: [...prev.inviteCodes, '']
    }));
  };

  // Remove invite code input
  const removeInviteCodeInput = (index: number) => {
    setBulkJoinForm(prev => ({
      inviteCodes: prev.inviteCodes.filter((_, i) => i !== index)
    }));
  };

  // Update invite code input
  const updateInviteCode = (index: number, value: string) => {
    setBulkJoinForm(prev => ({
      inviteCodes: prev.inviteCodes.map((code, i) => i === index ? value : code)
    }));
  };

  // Set primary family
  const setPrimaryFamily = async (familyId: string) => {
    try {
      const response = await api.put(`/api/families/${familyId}/set-primary`);
      if (response.ok) {
        fetchFamilies();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to set primary family');
      }
    } catch (err) {
      setError('Failed to set primary family');
    }
  };

  // Leave family
  const leaveFamily = async (familyId: string) => {
    if (!confirm('Are you sure you want to leave this family?')) return;

    try {
      const response = await api.delete(`/api/families/${familyId}/leave`);
      if (response.ok) {
        fetchFamilies();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to leave family');
      }
    } catch (err) {
      setError('Failed to leave family');
    }
  };

  // Generate invite code
  const generateInviteCode = async (familyId: string) => {
    try {
      const response = await api.post(`/api/families/${familyId}/invite`);
      if (response.ok) {
        const data = await response.json();
        copyToClipboard(data.inviteCode, familyId);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate invite code');
      }
    } catch (err) {
      setError('Failed to generate invite code');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, familyId: string) => {
    navigator.clipboard.writeText(text);
    setCopied(familyId);
    setTimeout(() => setCopied(null), 2000);
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

  return (
    <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">👨‍👩‍👧‍👦 My Families</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your family memberships and create new families
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsJoinModalOpen(true)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Join Family</span>
            </Button>
            <Button
              onClick={() => setIsBulkJoinModalOpen(true)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Join Multiple</span>
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Family</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Families list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading families...</p>
        </div>
      ) : families.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No families yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first family or join an existing one to get started
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Family
            </Button>
            <Button variant="outline" onClick={() => setIsJoinModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Join Family
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {families.map((userFamily) => (
            <Card key={userFamily._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <span>{userFamily.familyId.name}</span>
                    {userFamily.isPrimary && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(userFamily.role)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Family info */}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {userFamily.familyId.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">
                      {getRoleText(userFamily.role)}
                    </span>
                    <span className="text-sm font-medium">
                      {userFamily.familyId.currency}
                    </span>
                  </div>
                </div>

                {/* Members count */}
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>{userFamily.familyId.members.length} members</span>
                </div>

                {/* Joined date */}
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(userFamily.joinedAt).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {!userFamily.isPrimary && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPrimaryFamily(userFamily.familyId._id)}
                      className="flex items-center space-x-1"
                    >
                      <StarOff className="h-3 w-3" />
                      <span>Set Primary</span>
                    </Button>
                  )}
                  
                  {(userFamily.role === 'head' || userFamily.permissions.canManageMembers) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateInviteCode(userFamily.familyId._id)}
                      className="flex items-center space-x-1"
                    >
                      {copied === userFamily.familyId._id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>Invite</span>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.href = `/family/${userFamily.familyId._id}`}
                    className="flex items-center space-x-1"
                  >
                    <DollarSign className="h-3 w-3" />
                    <span>Manage</span>
                  </Button>

                  {userFamily.role !== 'head' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => leaveFamily(userFamily.familyId._id)}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                    >
                      <LogOut className="h-3 w-3" />
                      <span>Leave</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Family Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="👨‍👩‍👧‍👦 Create New Family"
        size="md"
      >
        <form onSubmit={handleCreateFamily} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Family Name *
            </label>
            <Input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., The Smith Family"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <Input
              type="text"
              value={createForm.description}
              onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of your family"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Currency
            </label>
            <select
              value={createForm.currency}
              onChange={(e) => setCreateForm(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="NPR">NPR - Nepalese Rupee</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={formLoading} className="flex-1">
              {formLoading ? 'Creating...' : 'Create Family'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Join Family Modal */}
      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title="🔗 Join Family"
        size="md"
      >
        <form onSubmit={handleJoinFamily} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invite Code *
            </label>
            <Input
              type="text"
              value={joinForm.inviteCode}
              onChange={(e) => setJoinForm(prev => ({ ...prev, inviteCode: e.target.value }))}
              placeholder="Enter the invite code from family member"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Ask a family member to generate an invite code for you
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={formLoading} className="flex-1">
              {formLoading ? 'Joining...' : 'Join Family'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsJoinModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Join Families Modal */}
      <Modal
        isOpen={isBulkJoinModalOpen}
        onClose={() => {
          setIsBulkJoinModalOpen(false);
          setBulkJoinForm({ inviteCodes: [''] });
          setBulkJoinResults([]);
        }}
        title="👨‍👩‍👧‍👦 Join Multiple Families"
        size="lg"
      >
        <form onSubmit={handleBulkJoinFamilies} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Invite Codes *
            </label>
            <div className="space-y-3">
              {bulkJoinForm.inviteCodes.map((code, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={code}
                    onChange={(e) => updateInviteCode(index, e.target.value)}
                    placeholder={`Invite code ${index + 1}`}
                    className="flex-1"
                  />
                  {bulkJoinForm.inviteCodes.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeInviteCodeInput(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addInviteCodeInput}
              className="mt-3 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Another Code</span>
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Enter multiple invite codes to join several families at once
            </p>
          </div>

          {/* Results Display */}
          {bulkJoinResults.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Join Results:
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {bulkJoinResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-md text-sm ${
                      result.success
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span className="font-mono">{result.code}</span>
                    </div>
                    <span>
                      {result.success 
                        ? `Joined ${result.familyName}` 
                        : result.error
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={formLoading} className="flex-1">
              {formLoading ? 'Joining Families...' : 'Join All Families'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsBulkJoinModalOpen(false);
                setBulkJoinForm({ inviteCodes: [''] });
                setBulkJoinResults([]);
              }}
              disabled={formLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
