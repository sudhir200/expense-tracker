'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useIncome, Income } from '@/hooks/useIncome';
import { formatCurrency } from '@/lib/currency';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/rbac';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Filter,
  Settings,
  MoreHorizontal,
  CheckSquare,
  Tag,
  Archive
} from 'lucide-react';

export default function IncomePage() {
  const { currency } = useSettings();
  const { user } = useAuth();
  const { income, loading, error, createIncome, updateIncome, deleteIncome, refetch } = useIncome();
  
  // Check if user can create income
  const canCreateIncome = user ? hasPermission(user.role, 'income', 'create') : false;
  const canUpdateIncome = user ? hasPermission(user.role, 'income', 'update_own') : false;
  const canDeleteIncome = user ? hasPermission(user.role, 'income', 'delete_own') : false;
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Bulk operations state
  const [selectedIncomes, setSelectedIncomes] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isRefactorModalOpen, setIsRefactorModalOpen] = useState(false);
  
  // Refactor options state
  const [refactorType, setRefactorType] = useState<'source' | 'frequency' | 'allocation'>('source');
  const [refactorData, setRefactorData] = useState({
    oldValue: '',
    newValue: '',
    applyToAll: false
  });

  const [formData, setFormData] = useState({
    amount: '',
    currency: currency.code,
    source: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    frequency: 'monthly' as 'one-time' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly',
    isRecurring: false,
    type: 'personal' as 'personal' | 'family',
    toFamily: '',
    toPersonal: '',
  });

  const resetForm = () => {
    setFormData({
      amount: '',
      currency: currency.code,
      source: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      frequency: 'monthly',
      isRecurring: false,
      type: 'personal',
      toFamily: '',
      toPersonal: '',
    });
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      // Prepare allocation data
      const allocation = {
        toFamily: parseFloat(formData.toFamily) || 0,
        toPersonal: parseFloat(formData.toPersonal) || 0,
      };

      const incomeData = {
        ...formData,
        amount: parseFloat(formData.amount),
        allocation: (allocation.toFamily > 0 || allocation.toPersonal > 0) ? allocation : undefined,
      };

      if (editingIncome) {
        await updateIncome(editingIncome._id, incomeData);
        setIsEditModalOpen(false);
        setEditingIncome(null);
      } else {
        await createIncome(incomeData);
        setIsAddModalOpen(false);
      }
      resetForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save income');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (incomeItem: Income) => {
    setEditingIncome(incomeItem);
    setFormData({
      amount: incomeItem.amount.toString(),
      currency: incomeItem.currency,
      source: incomeItem.source,
      description: incomeItem.description,
      date: incomeItem.date.split('T')[0],
      frequency: incomeItem.frequency,
      isRecurring: incomeItem.isRecurring,
      type: incomeItem.type,
      toFamily: incomeItem.allocation?.toFamily?.toString() || '',
      toPersonal: incomeItem.allocation?.toPersonal?.toString() || '',
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this income record?')) {
      try {
        await deleteIncome(id);
      } catch (error) {
        console.error('Error deleting income:', error);
      }
    }
  };

  const filteredIncome = income.filter(item => {
    const matchesSearch = item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFrequency = !frequencyFilter || item.frequency === frequencyFilter;
    const matchesType = !typeFilter || item.type === typeFilter;
    return matchesSearch && matchesFrequency && matchesType;
  });

  const totalIncome = filteredIncome.reduce((sum, item) => sum + item.amount, 0);
  const recurringIncome = filteredIncome.filter(item => item.isRecurring);
  const monthlyRecurring = recurringIncome
    .filter(item => item.frequency === 'monthly')
    .reduce((sum, item) => sum + item.amount, 0);

  const getFrequencyBadgeColor = (frequency: string) => {
    switch (frequency) {
      case 'one-time': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'weekly': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'bi-weekly': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'monthly': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'quarterly': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'yearly': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Income Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track and manage your income sources
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Bulk Actions Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="flex items-center space-x-2"
            >
              <CheckSquare className="h-4 w-4" />
              <span>{showBulkActions ? 'Cancel Selection' : 'Bulk Actions'}</span>
            </Button>

            {/* Refactor Options */}
            <Button
              variant="outline"
              onClick={() => setIsRefactorModalOpen(true)}
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Refactor</span>
            </Button>

            {canCreateIncome && (
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddModalOpen(true);
                }}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Income</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalIncome, currency.code)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Recurring</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(monthlyRecurring, currency.code)}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Income Sources</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {filteredIncome.length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by source or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-40">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="personal">👤 Personal</option>
                <option value="family">👨‍👩‍👧‍👦 Family</option>
              </select>
            </div>
            <div className="sm:w-48">
              <select
                value={frequencyFilter}
                onChange={(e) => setFrequencyFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Frequencies</option>
                <option value="one-time">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {showBulkActions && selectedIncomes.length > 0 && (
        <Card className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedIncomes.length} income record{selectedIncomes.length !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIncomes([])}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-200 dark:border-blue-600 dark:hover:bg-blue-800"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkEditModalOpen(true)}
                  className="flex items-center space-x-1"
                >
                  <Edit className="h-3 w-3" />
                  <span>Bulk Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${selectedIncomes.length} income records?`)) {
                      // Handle bulk delete
                      selectedIncomes.forEach(id => deleteIncome(id));
                      setSelectedIncomes([]);
                    }
                  }}
                  className="flex items-center space-x-1 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete Selected</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Income Records</span>
            <Button variant="ghost" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading income...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : filteredIncome.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {canCreateIncome 
                  ? "No income records found" 
                  : "No income records available. Contact an administrator to add income records."
                }
              </p>
              {!canCreateIncome && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  You have read-only access to income data.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {showBulkActions && (
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white w-12">
                        <input
                          type="checkbox"
                          checked={selectedIncomes.length === filteredIncome.length && filteredIncome.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIncomes(filteredIncome.map(item => item._id));
                            } else {
                              setSelectedIncomes([]);
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                    )}
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Source</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Allocation</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Frequency</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncome.map((item) => (
                    <tr key={item._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      {showBulkActions && (
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            checked={selectedIncomes.includes(item._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIncomes(prev => [...prev, item._id]);
                              } else {
                                setSelectedIncomes(prev => prev.filter(id => id !== item._id));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{item.source}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.type === 'family' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {item.type === 'family' ? '👨‍👩‍👧‍👦 Family' : '👤 Personal'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(item.amount, item.currency)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {item.allocation && (item.allocation.toFamily > 0 || item.allocation.toPersonal > 0) ? (
                          <div className="text-sm">
                            {item.allocation.toFamily > 0 && (
                              <div className="text-blue-600 dark:text-blue-400">
                                👨‍👩‍👧‍👦 {formatCurrency(item.allocation.toFamily, item.currency)}
                              </div>
                            )}
                            {item.allocation.toPersonal > 0 && (
                              <div className="text-gray-600 dark:text-gray-400">
                                👤 {formatCurrency(item.allocation.toPersonal, item.currency)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No allocation</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyBadgeColor(item.frequency)}`}>
                            {item.frequency}
                          </span>
                          {item.isRecurring && (
                            <RefreshCw className="h-3 w-3 text-blue-600" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <div>{new Date(item.date).toLocaleDateString()}</div>
                          {item.isRecurring && item.nextOccurrence && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              Next: {new Date(item.nextOccurrence).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end space-x-2">
                          {canUpdateIncome && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeleteIncome && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item._id)}
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

      {/* Add/Edit Income Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingIncome(null);
          resetForm();
        }}
        title={editingIncome ? 'Edit Income' : 'Add Income'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-red-600 dark:text-red-400 text-sm">{formError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="INR">INR</option>
                <option value="NPR">NPR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Income Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'personal' | 'family' }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="personal">👤 Personal Income</option>
              <option value="family">👨‍👩‍👧‍👦 Family Income</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Personal income is for your individual use, family income is shared with family members
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Source
            </label>
            <Input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
              placeholder="e.g., Salary, Freelance, Investment"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the income"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="one-time">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* Allocation Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                💰 Budget Allocation (Optional)
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Specify how this income should be allocated between family and personal budgets
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  👨‍👩‍👧‍👦 Family Allocation
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.toFamily}
                  onChange={(e) => setFormData(prev => ({ ...prev, toFamily: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  👤 Personal Allocation
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.toPersonal}
                  onChange={(e) => setFormData(prev => ({ ...prev, toPersonal: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Allocation Summary */}
            {(parseFloat(formData.toFamily) > 0 || parseFloat(formData.toPersonal) > 0) && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <div className="text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Total Allocated:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {formatCurrency((parseFloat(formData.toFamily) || 0) + (parseFloat(formData.toPersonal) || 0), formData.currency)}
                    </span>
                  </div>
                  {parseFloat(formData.amount) > 0 && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                      <span className={`font-medium ${
                        (parseFloat(formData.amount) - (parseFloat(formData.toFamily) || 0) - (parseFloat(formData.toPersonal) || 0)) >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(parseFloat(formData.amount) - (parseFloat(formData.toFamily) || 0) - (parseFloat(formData.toPersonal) || 0), formData.currency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="isRecurring" className="text-sm text-gray-700 dark:text-gray-300">
              This is a recurring income
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={formLoading} className="flex-1">
              {formLoading ? 'Saving...' : editingIncome ? 'Update Income' : 'Add Income'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setEditingIncome(null);
                resetForm();
              }}
              disabled={formLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Refactor Modal */}
      <Modal
        isOpen={isRefactorModalOpen}
        onClose={() => setIsRefactorModalOpen(false)}
        title="Refactor Income Data"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Refactor Type
            </label>
            <select
              value={refactorType}
              onChange={(e) => setRefactorType(e.target.value as 'source' | 'frequency' | 'allocation')}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="source">Income Source</option>
              <option value="frequency">Payment Frequency</option>
              <option value="allocation">Family Allocation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {refactorType === 'source' ? 'Old Source Name' : 
               refactorType === 'frequency' ? 'Old Frequency' : 'Old Allocation Type'}
            </label>
            <Input
              type="text"
              value={refactorData.oldValue}
              onChange={(e) => setRefactorData(prev => ({ ...prev, oldValue: e.target.value }))}
              placeholder={refactorType === 'source' ? 'e.g., Salary' : 
                          refactorType === 'frequency' ? 'e.g., monthly' : 'e.g., personal'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {refactorType === 'source' ? 'New Source Name' : 
               refactorType === 'frequency' ? 'New Frequency' : 'New Allocation Type'}
            </label>
            {refactorType === 'frequency' ? (
              <select
                value={refactorData.newValue}
                onChange={(e) => setRefactorData(prev => ({ ...prev, newValue: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select frequency</option>
                <option value="one-time">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            ) : (
              <Input
                type="text"
                value={refactorData.newValue}
                onChange={(e) => setRefactorData(prev => ({ ...prev, newValue: e.target.value }))}
                placeholder={refactorType === 'source' ? 'e.g., Primary Job' : 'e.g., family'}
              />
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="applyToAll"
              checked={refactorData.applyToAll}
              onChange={(e) => setRefactorData(prev => ({ ...prev, applyToAll: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="applyToAll" className="text-sm text-gray-700 dark:text-gray-300">
              Apply to all matching records (not just selected)
            </label>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
            <div className="flex items-start">
              <Tag className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">Refactor Preview:</p>
                <p>This will update all income records where {refactorType} matches "{refactorData.oldValue}" to "{refactorData.newValue}"</p>
                {refactorData.applyToAll && (
                  <p className="mt-1 text-yellow-700 dark:text-yellow-300">
                    ⚠️ This will affect ALL matching records in your account, not just the selected ones.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                // Handle refactor logic here
                console.log('Refactoring:', refactorType, refactorData);
                setIsRefactorModalOpen(false);
              }}
              disabled={!refactorData.oldValue || !refactorData.newValue}
              className="flex-1"
            >
              Apply Refactor
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsRefactorModalOpen(false);
                setRefactorData({ oldValue: '', newValue: '', applyToAll: false });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Edit Modal */}
      <Modal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        title={`Bulk Edit ${selectedIncomes.length} Income Records`}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Changes will be applied to {selectedIncomes.length} selected income records. 
              Leave fields empty to keep existing values.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source
              </label>
              <Input
                type="text"
                placeholder="Leave empty to keep existing"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency
              </label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">Keep existing</option>
                <option value="one-time">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">Keep existing</option>
                <option value="personal">Personal</option>
                <option value="family">Family</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">Keep existing</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="NPR">NPR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (append to existing)
            </label>
            <Input
              type="text"
              placeholder="Text to append to existing descriptions"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                // Handle bulk edit logic here
                console.log('Bulk editing:', selectedIncomes);
                setIsBulkEditModalOpen(false);
                setSelectedIncomes([]);
              }}
              className="flex-1"
            >
              Apply Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsBulkEditModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
