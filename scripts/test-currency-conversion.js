#!/usr/bin/env node

// Simple test script to verify currency conversions are working correctly

const EXCHANGE_RATES = {
  USD: 1.0,      // Base currency
  EUR: 0.92,     // 1 USD = 0.92 EUR
  GBP: 0.77,     // 1 USD = 0.77 GBP
  JPY: 149.0,    // 1 USD = 149 JPY
  INR: 83.5,     // 1 USD = 83.5 INR
  NPR: 133.5,    // 1 USD = 133.5 NPR
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
    // Converting from USD to another currency: multiply by rate
    result = amount * rates[toCurrency];
  } else if (toCurrency === 'USD') {
    // Converting from another currency to USD: divide by rate
    result = amount / rates[fromCurrency];
  } else {
    // Converting between two non-USD currencies: go through USD
    const usdAmount = amount / rates[fromCurrency];
    result = usdAmount * rates[toCurrency];
  }
  
  return Math.round(result * 100) / 100;
}

console.log('🧪 Testing Currency Conversions\n');

// Test cases
const testCases = [
  { amount: 100, from: 'USD', to: 'EUR', expected: '92.00' },
  { amount: 100, from: 'USD', to: 'GBP', expected: '77.00' },
  { amount: 100, from: 'USD', to: 'JPY', expected: '14900.00' },
  { amount: 100, from: 'USD', to: 'INR', expected: '8350.00' },
  
  { amount: 92, from: 'EUR', to: 'USD', expected: '100.00' },
  { amount: 77, from: 'GBP', to: 'USD', expected: '100.00' },
  { amount: 14900, from: 'JPY', to: 'USD', expected: '100.00' },
  { amount: 8350, from: 'INR', to: 'USD', expected: '100.00' },
  
  { amount: 100, from: 'EUR', to: 'GBP', expected: '83.70' },
  { amount: 100, from: 'GBP', to: 'EUR', expected: '119.48' },
  { amount: 1000, from: 'INR', to: 'NPR', expected: '1598.80' },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = convertCurrency(test.amount, test.from, test.to);
  const resultStr = result.toFixed(2);
  const isCorrect = Math.abs(parseFloat(resultStr) - parseFloat(test.expected)) < 0.01;
  
  console.log(`Test ${index + 1}: ${test.amount} ${test.from} → ${test.to}`);
  console.log(`  Expected: ${test.expected}`);
  console.log(`  Got:      ${resultStr}`);
  console.log(`  Status:   ${isCorrect ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  if (isCorrect) {
    passed++;
  } else {
    failed++;
  }
});

console.log(`📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All currency conversion tests passed!');
} else {
  console.log('⚠️  Some tests failed. Check the conversion logic.');
}

// Test round-trip conversions
console.log('\n🔄 Testing Round-trip Conversions:');
const roundTripTests = [
  { amount: 100, currency1: 'USD', currency2: 'EUR' },
  { amount: 1000, currency1: 'GBP', currency2: 'JPY' },
  { amount: 5000, currency1: 'INR', currency2: 'NPR' },
];

roundTripTests.forEach((test, index) => {
  const step1 = convertCurrency(test.amount, test.currency1, test.currency2);
  const step2 = convertCurrency(step1, test.currency2, test.currency1);
  const difference = Math.abs(test.amount - step2);
  const isAccurate = difference < 0.01;
  
  console.log(`Round-trip ${index + 1}: ${test.amount} ${test.currency1} → ${test.currency2} → ${test.currency1}`);
  console.log(`  Original: ${test.amount}`);
  console.log(`  Final:    ${step2.toFixed(2)}`);
  console.log(`  Diff:     ${difference.toFixed(4)}`);
  console.log(`  Status:   ${isAccurate ? '✅ ACCURATE' : '❌ INACCURATE'}`);
  console.log('');
});
