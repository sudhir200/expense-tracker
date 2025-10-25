#!/usr/bin/env node

// Test the formatting functions to ensure they work without errors

// Mock the currency functions since we can't import TS directly
const EXCHANGE_RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.77,
  JPY: 149.0,
  INR: 83.5,
  NPR: 133.5,
};

const CURRENCIES = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimalDigits: 2, symbolOnLeft: true, spaceBetweenAmountAndSymbol: false, decimalSeparator: '.', thousandsSeparator: ',' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimalDigits: 2, symbolOnLeft: true, spaceBetweenAmountAndSymbol: true, decimalSeparator: ',', thousandsSeparator: '.' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', decimalDigits: 2, symbolOnLeft: true, spaceBetweenAmountAndSymbol: false, decimalSeparator: '.', thousandsSeparator: ',' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalDigits: 0, symbolOnLeft: true, spaceBetweenAmountAndSymbol: false, decimalSeparator: '', thousandsSeparator: ',' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalDigits: 2, symbolOnLeft: true, spaceBetweenAmountAndSymbol: false, decimalSeparator: '.', thousandsSeparator: ',' },
  NPR: { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs', decimalDigits: 2, symbolOnLeft: true, spaceBetweenAmountAndSymbol: true, decimalSeparator: '.', thousandsSeparator: ',' },
};

function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;
  
  const rates = EXCHANGE_RATES;
  
  if (!rates[fromCurrency] || !rates[toCurrency]) {
    console.warn('Missing exchange rate for', fromCurrency, 'or', toCurrency);
    return amount;
  }
  
  let result;
  
  if (fromCurrency === 'USD') {
    result = amount * rates[toCurrency];
  } else if (toCurrency === 'USD') {
    result = amount / rates[fromCurrency];
  } else {
    const usdAmount = amount / rates[fromCurrency];
    result = usdAmount * rates[toCurrency];
  }
  
  return Math.round(result * 100) / 100;
}

function formatCurrency(amount, currencyCode = 'USD') {
  const currency = CURRENCIES[currencyCode] || CURRENCIES['USD'];
  
  const parts = amount.toFixed(currency.decimalDigits).split('.');
  let formattedAmount = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);
  
  if (currency.decimalDigits > 0 && parts[1]) {
    formattedAmount += currency.decimalSeparator + parts[1];
  }
  
  if (currency.symbolOnLeft) {
    return currency.symbol + (currency.spaceBetweenAmountAndSymbol ? ' ' : '') + formattedAmount;
  } else {
    return formattedAmount + (currency.spaceBetweenAmountAndSymbol ? ' ' : '') + currency.symbol;
  }
}

function isReasonableConversion(originalAmount, convertedAmount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return Math.abs(originalAmount - convertedAmount) < 0.01;
  }
  
  if (convertedAmount <= 0 || !isFinite(convertedAmount) || isNaN(convertedAmount)) {
    return false;
  }
  
  const ratio = convertedAmount / originalAmount;
  
  let maxRatio, minRatio;
  
  if (toCurrency === 'JPY' || fromCurrency === 'JPY') {
    maxRatio = 200;
    minRatio = 1 / 200;
  } else if (toCurrency === 'INR' || fromCurrency === 'INR' || 
             toCurrency === 'NPR' || fromCurrency === 'NPR') {
    maxRatio = 150;
    minRatio = 1 / 150;
  } else {
    maxRatio = 5;
    minRatio = 1 / 5;
  }
  
  return ratio >= minRatio * 0.5 && ratio <= maxRatio * 2;
}

function formatExpenseAmountSimple(amount, expenseCurrency, displayCurrency) {
  if (expenseCurrency === displayCurrency) {
    return formatCurrency(amount, displayCurrency);
  }
  
  const convertedAmount = convertCurrency(amount, expenseCurrency, displayCurrency);
  const originalFormatted = formatCurrency(amount, expenseCurrency);
  const convertedFormatted = formatCurrency(convertedAmount, displayCurrency);
  
  return `${convertedFormatted} (${originalFormatted})`;
}

function formatExpenseAmountWithIndicator(amount, expenseCurrency, displayCurrency) {
  if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
    return formatCurrency(0, displayCurrency);
  }
  
  if (amount > 10000000) {
    console.warn('Extremely large amount detected:', amount, 'from', expenseCurrency, 'to', displayCurrency);
    return formatCurrency(amount, expenseCurrency) + ' (amount too large)';
  }
  
  const fromCurrency = CURRENCIES[expenseCurrency] ? expenseCurrency : 'USD';
  const toCurrency = CURRENCIES[displayCurrency] ? displayCurrency : 'USD';
  
  if (fromCurrency === toCurrency) {
    return formatCurrency(amount, toCurrency);
  }
  
  const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);
  
  if (!isReasonableConversion(amount, convertedAmount, fromCurrency, toCurrency)) {
    console.warn('Unreasonable conversion result:', amount, fromCurrency, '->', convertedAmount, toCurrency);
    const originalFormatted = formatCurrency(amount, fromCurrency);
    const convertedFormatted = formatCurrency(convertedAmount, toCurrency);
    return `${convertedFormatted} (${originalFormatted} - check rate)`;
  }
  
  const originalFormatted = formatCurrency(amount, fromCurrency);
  const convertedFormatted = formatCurrency(convertedAmount, toCurrency);
  
  return `${convertedFormatted} (${originalFormatted})`;
}

console.log('🧪 Testing Format Functions\n');

const testCases = [
  { amount: 100, from: 'USD', to: 'EUR' },
  { amount: 50, from: 'EUR', to: 'USD' },
  { amount: 1000, from: 'USD', to: 'JPY' },
  { amount: 5000, from: 'JPY', to: 'USD' },
  { amount: 100, from: 'USD', to: 'INR' },
  { amount: 1000, from: 'INR', to: 'NPR' },
  { amount: 100, from: 'USD', to: 'USD' }, // Same currency
];

console.log('📊 Simple Format Function:');
testCases.forEach((test, index) => {
  try {
    const result = formatExpenseAmountSimple(test.amount, test.from, test.to);
    console.log(`Test ${index + 1}: ${test.amount} ${test.from} → ${test.to}: ${result}`);
  } catch (error) {
    console.log(`Test ${index + 1}: ERROR - ${error.message}`);
  }
});

console.log('\n📊 With Indicator Format Function:');
testCases.forEach((test, index) => {
  try {
    const result = formatExpenseAmountWithIndicator(test.amount, test.from, test.to);
    console.log(`Test ${index + 1}: ${test.amount} ${test.from} → ${test.to}: ${result}`);
  } catch (error) {
    console.log(`Test ${index + 1}: ERROR - ${error.message}`);
  }
});

console.log('\n✅ All format function tests completed!');
