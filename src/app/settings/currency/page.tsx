'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettings } from '@/contexts/SettingsContext';
import { getCurrencyList, Currency } from '@/lib/currency';
import { api } from '@/lib/api';
import { 
  DollarSign, 
  Edit2, 
  Save, 
  X, 
  Plus, 
  ArrowLeft,
  RefreshCw,
  Globe,
  TrendingUp,
  AlertCircle,
  Check
} from 'lucide-react';
import Link from 'next/link';

interface ExchangeRate {
  _id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: Date;
  isUserDefined: boolean;
}

export default function CurrencyManagementPage() {
  const { currency: currentCurrency, setCurrency } = useSettings();
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency.code);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [editRateValue, setEditRateValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [addingCustomRate, setAddingCustomRate] = useState(false);
  const [customRateForm, setCustomRateForm] = useState({
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    rate: '',
  });

  const currencies = getCurrencyList();

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/exchange-rates');
      if (response.ok) {
        const data = await response.json();
        setExchangeRates(data);
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setError('Failed to fetch exchange rates');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrency = async () => {
    try {
      setSaving(true);
      setCurrency(selectedCurrency);
      setSuccess('Default currency updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to update currency');
    } finally {
      setSaving(false);
    }
  };

  const handleEditRate = (rateId: string, currentRate: number) => {
    setEditingRate(rateId);
    setEditRateValue(currentRate.toString());
  };

  const handleSaveRate = async (fromCurrency: string, toCurrency: string) => {
    try {
      setSaving(true);
      const response = await api.post('/api/exchange-rates', {
        fromCurrency,
        toCurrency,
        rate: parseFloat(editRateValue),
      });

      if (response.ok) {
        await fetchExchangeRates();
        setEditingRate(null);
        setEditRateValue('');
        setSuccess('Exchange rate updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update exchange rate');
      }
    } catch (error) {
      setError('Failed to update exchange rate');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingRate(null);
    setEditRateValue('');
  };

  const handleAddCustomRate = async () => {
    try {
      setSaving(true);
      const response = await api.post('/api/exchange-rates', {
        fromCurrency: customRateForm.fromCurrency,
        toCurrency: customRateForm.toCurrency,
        rate: parseFloat(customRateForm.rate),
      });

      if (response.ok) {
        await fetchExchangeRates();
        setAddingCustomRate(false);
        setCustomRateForm({
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          rate: '',
        });
        setSuccess('Custom exchange rate added successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add custom exchange rate');
      }
    } catch (error) {
      setError('Failed to add custom exchange rate');
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshRates = async () => {
    try {
      setSaving(true);
      // This would typically call an API to refresh rates from external sources
      await fetchExchangeRates();
      setSuccess('Exchange rates refreshed!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to refresh exchange rates');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number, currencyCode: string): string => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (!currency) return `${currencyCode} ${amount.toFixed(2)}`;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  const getExchangeRatesByBase = (baseCurrency: string) => {
    return exchangeRates.filter(rate => rate.fromCurrency === baseCurrency);
  };

  return (
    <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Settings</span>
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Currency Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your default currency and exchange rates for accurate conversions
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-green-800 dark:text-green-200">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Default Currency Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Default Currency</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Default Currency
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Preview</h4>
                <div className="space-y-1">
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Small amount:</span> {formatCurrency(12.34, selectedCurrency)}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Large amount:</span> {formatCurrency(1234567.89, selectedCurrency)}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSaveCurrency}
                disabled={selectedCurrency === currentCurrency.code || saving}
                className="w-full"
              >
                {saving ? 'Saving...' : 'Save Default Currency'}
              </Button>
            </CardContent>
          </Card>

          {/* Currency Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Currency Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {exchangeRates.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Exchange Rates</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {exchangeRates.filter(rate => rate.isUserDefined).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Custom Rates</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exchange Rates Management */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Exchange Rates</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefreshRates}
                    disabled={saving}
                    className="flex items-center space-x-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Refresh</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setAddingCustomRate(true)}
                    className="flex items-center space-x-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Custom</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {/* USD Base Rates */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">USD Base Rates</h4>
                    {getExchangeRatesByBase('USD').map((rate) => {
                      const rateId = `${rate.fromCurrency}-${rate.toCurrency}`;
                      const isEditing = editingRate === rateId;
                      
                      return (
                        <div key={rateId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-sm">
                              1 {rate.fromCurrency} = 
                            </span>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.0001"
                                value={editRateValue}
                                onChange={(e) => setEditRateValue(e.target.value)}
                                className="w-24 h-8 text-sm"
                              />
                            ) : (
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {rate.rate.toFixed(4)}
                              </span>
                            )}
                            <span className="font-medium text-sm">{rate.toCurrency}</span>
                            {rate.isUserDefined && (
                              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                Custom
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveRate(rate.fromCurrency, rate.toCurrency)}
                                  disabled={saving}
                                  className="h-8 px-2"
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="h-8 px-2"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditRate(rateId, rate.rate)}
                                className="h-8 px-2"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Custom Rate Form */}
                  {addingCustomRate && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Add Custom Rate</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">From</label>
                            <select
                              value={customRateForm.fromCurrency}
                              onChange={(e) => setCustomRateForm(prev => ({ ...prev, fromCurrency: e.target.value }))}
                              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              {currencies.map(currency => (
                                <option key={currency.code} value={currency.code}>{currency.code}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">To</label>
                            <select
                              value={customRateForm.toCurrency}
                              onChange={(e) => setCustomRateForm(prev => ({ ...prev, toCurrency: e.target.value }))}
                              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              {currencies.map(currency => (
                                <option key={currency.code} value={currency.code}>{currency.code}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Exchange Rate</label>
                          <Input
                            type="number"
                            step="0.0001"
                            value={customRateForm.rate}
                            onChange={(e) => setCustomRateForm(prev => ({ ...prev, rate: e.target.value }))}
                            placeholder="Enter rate (e.g., 1.2345)"
                            className="text-sm"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={handleAddCustomRate}
                            disabled={!customRateForm.rate || saving}
                            className="flex-1"
                          >
                            {saving ? 'Adding...' : 'Add Rate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAddingCustomRate(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Currency Management Help</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Default Currency</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your default currency is used for displaying amounts throughout the application. 
                All amounts will be converted to this currency for consistency.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Exchange Rates</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exchange rates are used to convert between different currencies. You can edit existing rates 
                or add custom rates for currencies not automatically supported.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Custom Rates</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Custom rates allow you to set specific exchange rates for currency pairs. 
                These will override the default rates for more accurate conversions.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Rate Updates</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exchange rates are updated periodically. You can manually refresh rates or 
                set custom rates that won't be automatically updated.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
