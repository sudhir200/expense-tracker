'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { ExpenseFilters, Category } from '@/types/expense';
import { getDateRange } from '@/lib/utils';
import { Search, Filter, X, Calendar, DollarSign } from 'lucide-react';

interface FilterBarProps {
  categories: Category[];
  filters: ExpenseFilters;
  onFiltersChange: (filters: ExpenseFilters) => void;
  onClearFilters: () => void;
}

const dateRangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

const paymentMethodOptions = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
];

export default function FilterBar({
  categories,
  filters,
  onFiltersChange,
  onClearFilters,
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState<ExpenseFilters>(filters);
  const [selectedDateRange, setSelectedDateRange] = useState<string>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const categoryOptions = categories.map((cat) => ({
    value: cat.name,
    label: cat.name,
  }));

  const handleSearchChange = (search: string) => {
    const newFilters = { ...localFilters, search: search || undefined };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateRangeChange = (range: string) => {
    setSelectedDateRange(range);
    
    if (range !== 'custom') {
      const dateRange = getDateRange(range as 'today' | 'week' | 'month');
      const newFilters = { ...localFilters, dateRange };
      setLocalFilters(newFilters);
      onFiltersChange(newFilters);
    }
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      const dateRange = {
        start: new Date(customStartDate),
        end: new Date(customEndDate),
      };
      const newFilters = { ...localFilters, dateRange };
      setLocalFilters(newFilters);
      onFiltersChange(newFilters);
    }
  };

  const handleCategoryChange = (categories: string[]) => {
    const newFilters = {
      ...localFilters,
      categories: categories.length > 0 ? categories : undefined,
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePaymentMethodChange = (methods: string[]) => {
    const newFilters = {
      ...localFilters,
      paymentMethods: methods.length > 0 ? methods : undefined,
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleAmountRangeChange = (min?: number, max?: number) => {
    const amountRange = (min !== undefined || max !== undefined) ? { min, max } : undefined;
    const newFilters = { ...localFilters, amountRange };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = () => {
    return !!(
      localFilters.search ||
      localFilters.categories?.length ||
      localFilters.paymentMethods?.length ||
      localFilters.amountRange?.min ||
      localFilters.amountRange?.max ||
      localFilters.dateRange
    );
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search and Quick Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search expenses..."
                value={localFilters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <Select
                options={dateRangeOptions}
                value={selectedDateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="w-40"
              />
            </div>

            {/* Advanced Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Advanced
            </Button>

            {/* Clear Filters */}
            {hasActiveFilters() && (
              <Button
                variant="ghost"
                onClick={onClearFilters}
                className="flex items-center gap-2 text-gray-500"
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Custom Date Range */}
          {selectedDateRange === 'custom' && (
            <div className="flex gap-4 items-center">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-40"
              />
              <span className="text-gray-500">to</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-40"
              />
              <Button
                onClick={handleCustomDateChange}
                disabled={!customStartDate || !customEndDate}
                size="sm"
              >
                Apply
              </Button>
            </div>
          )}

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categories
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {categoryOptions.map((option) => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={localFilters.categories?.includes(option.value) || false}
                          onChange={(e) => {
                            const currentCategories = localFilters.categories || [];
                            const newCategories = e.target.checked
                              ? [...currentCategories, option.value]
                              : currentCategories.filter((cat) => cat !== option.value);
                            handleCategoryChange(newCategories);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Methods
                  </label>
                  <div className="space-y-2">
                    {paymentMethodOptions.map((option) => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={localFilters.paymentMethods?.includes(option.value) || false}
                          onChange={(e) => {
                            const currentMethods = localFilters.paymentMethods || [];
                            const newMethods = e.target.checked
                              ? [...currentMethods, option.value]
                              : currentMethods.filter((method) => method !== option.value);
                            handlePaymentMethodChange(newMethods);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Amount Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount Range
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <Input
                        type="number"
                        placeholder="Min"
                        value={localFilters.amountRange?.min || ''}
                        onChange={(e) => {
                          const min = e.target.value ? parseFloat(e.target.value) : undefined;
                          handleAmountRangeChange(min, localFilters.amountRange?.max);
                        }}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={localFilters.amountRange?.max || ''}
                        onChange={(e) => {
                          const max = e.target.value ? parseFloat(e.target.value) : undefined;
                          handleAmountRangeChange(localFilters.amountRange?.min, max);
                        }}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters() && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {localFilters.search && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Search: {localFilters.search}
                </span>
              )}
              {localFilters.categories?.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  {category}
                </span>
              ))}
              {localFilters.paymentMethods?.map((method) => (
                <span
                  key={method}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                >
                  {method}
                </span>
              ))}
              {(localFilters.amountRange?.min || localFilters.amountRange?.max) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  ${localFilters.amountRange?.min || 0} - ${localFilters.amountRange?.max || '∞'}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
