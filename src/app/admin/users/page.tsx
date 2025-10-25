'use client';

import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  UserCheck,
  UserX,
  Shield,
  Crown
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPERUSER';
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
}

interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  role: 'USER' | 'ADMIN';
  defaultCurrency: string;
}

export default function AdminUsersPage() {
  const { isAdminOrHigher, isSuperUser, canCreateUser, canManageUserAccount } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    defaultCurrency: 'USD',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched users data:', data.users);
        // Ensure each user has an ID
        const usersWithId = data.users.map((user: any) => ({
          ...user,
          id: user.id || user._id?.toString() || `temp-${Date.now()}-${Math.random()}`
        }));
        console.log('Users with ID:', usersWithId);
        setUsers(usersWithId);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      const response = await api.post('/api/admin/users', createForm);
      if (response.ok) {
        setIsCreateModalOpen(false);
        setCreateForm({
          name: '',
          email: '',
          password: '',
          role: 'USER',
          defaultCurrency: 'USD',
        });
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create user');
      }
    } catch (error) {
      setError('Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      setFormLoading(true);
      setError('');
      
      // Validate userId
      if (!userId || userId === 'undefined' || userId.startsWith('temp-')) {
        setError('Invalid user ID. Please refresh the page and try again.');
        return;
      }
      
      console.log('Updating user:', userId, updates);
      
      const response = await api.put(`/api/admin/users/${userId}`, updates);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Update successful:', result);
        fetchUsers();
        setIsEditModalOpen(false);
        setEditingUser(null);
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        setError(errorData.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/api/admin/users/${userId}`);
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPERUSER': return <Crown className="h-4 w-4 text-red-600" />;
      case 'ADMIN': return <Shield className="h-4 w-4 text-blue-600" />;
      default: return <Users className="h-4 w-4 text-green-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPERUSER': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'ADMIN': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  return (
    <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage user accounts and permissions
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => {
                console.log('Current users:', users);
                console.log('Users with IDs:', users.map(u => ({ id: u.id, name: u.name })));
              }}
              variant="outline"
              size="sm"
            >
              Debug Users
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add User</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Roles</option>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
                {isSuperUser && <option value="SUPERUSER">SUPERUSER</option>}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Users ({filteredUsers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Created</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(user.role)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user);
                              setIsEditModalOpen(true);
                              setError('');
                            }}
                            disabled={!canManageUserAccount(user.role)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateUser(user.id, { isActive: !user.isActive })}
                            disabled={!canManageUserAccount(user.role)}
                            className={user.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                          >
                            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          {isSuperUser && user.role !== 'SUPERUSER' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User"
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <Input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <Input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value as 'USER' | 'ADMIN' }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="USER">USER</option>
              {isSuperUser && <option value="ADMIN">ADMIN</option>}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Currency
            </label>
            <select
              value={createForm.defaultCurrency}
              onChange={(e) => setCreateForm(prev => ({ ...prev, defaultCurrency: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="NPR">NPR - Nepalese Rupee</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={formLoading} className="flex-1">
              {formLoading ? 'Creating...' : 'Create User'}
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

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit User"
          size="md"
        >
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <Input
                type="text"
                value={editingUser.name}
                onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={editingUser.isActive ? 'active' : 'inactive'}
                onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, isActive: e.target.value === 'active' }) : null)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {isSuperUser && editingUser.role !== 'SUPERUSER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, role: e.target.value as any }) : null)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  console.log('Edit button clicked, user ID:', editingUser.id, 'Full user:', editingUser);
                  handleUpdateUser(editingUser.id, editingUser);
                }}
                disabled={formLoading}
                className="flex-1"
              >
                {formLoading ? 'Updating...' : 'Update User'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setError('');
                }}
                disabled={formLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
