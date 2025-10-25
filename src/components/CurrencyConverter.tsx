'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { convertCurrency, formatCurrency, getCurrencyList, CurrencyCode } from '@/lib/currency';
import { ArrowRightLeft, Calculator } from 'lucide-react';

export default function CurrencyConverter() {
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>('USD');
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('EUR');
  const [result, setResult] = useState<number | null>(null);

  const currencies = getCurrencyList();

  const handleConvert = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setResult(null);
      return;
    }

    const converted = convertCurrency(numAmount, fromCurrency, toCurrency);
    setResult(converted);
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="h-5 w-5" />
          <span>Currency Converter</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="0"
            step="0.01"
          />
        </div>

        {/* From Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            From
          </label>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value as CurrencyCode)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name} ({currency.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwapCurrencies}
            className="flex items-center space-x-2"
          >
            <ArrowRightLeft className="h-4 w-4" />
            <span>Swap</span>
          </Button>
        </div>

        {/* To Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            To
          </label>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value as CurrencyCode)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name} ({currency.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Convert Button */}
        <Button onClick={handleConvert} className="w-full">
          Convert
        </Button>

        {/* Result */}
        {result !== null && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {formatCurrency(parseFloat(amount), fromCurrency)} =
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(result, toCurrency)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Exchange rate: 1 {fromCurrency} = {formatCurrency(convertCurrency(1, fromCurrency, toCurrency), toCurrency)}
              </div>
            </div>
          </div>
        )}

        {/* Exchange Rate Info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Rates are for demonstration purposes. In production, use live exchange rates.
        </div>
      </CardContent>
    </Card>
  );
}
