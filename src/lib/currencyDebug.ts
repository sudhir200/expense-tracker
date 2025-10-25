// Debug utility for currency conversion issues
import { convertCurrency, formatCurrency, EXCHANGE_RATES } from './currency';

export function debugCurrencyConversion(
  amount: number,
  fromCurrency: string,
  toCurrency: string
) {
  console.group('Currency Conversion Debug');
  console.log('Original amount:', amount, fromCurrency);
  console.log('Target currency:', toCurrency);
  console.log('Exchange rates:', EXCHANGE_RATES);
  
  if (fromCurrency in EXCHANGE_RATES && toCurrency in EXCHANGE_RATES) {
    const converted = convertCurrency(amount, fromCurrency as any, toCurrency as any);
    console.log('Converted amount:', converted);
    console.log('Formatted result:', formatCurrency(converted, toCurrency as any));
    
    // Test reverse conversion
    const reverse = convertCurrency(converted, toCurrency as any, fromCurrency as any);
    console.log('Reverse conversion (should match original):', reverse);
    
    // Calculate expected conversion manually
    const usdAmount = amount / EXCHANGE_RATES[fromCurrency as keyof typeof EXCHANGE_RATES];
    const expected = usdAmount * EXCHANGE_RATES[toCurrency as keyof typeof EXCHANGE_RATES];
    console.log('Manual calculation:', expected);
    
    if (Math.abs(converted - expected) > 0.01) {
      console.error('Conversion mismatch!');
    }
  } else {
    console.error('Invalid currency codes');
  }
  
  console.groupEnd();
  
  return convertCurrency(amount, fromCurrency as any, toCurrency as any);
}

// Test common conversions
export function testCurrencyConversions() {
  console.log('=== Currency Conversion Tests ===');
  
  // Test USD to NPR
  debugCurrencyConversion(100, 'USD', 'NPR');
  
  // Test NPR to USD  
  debugCurrencyConversion(13200, 'NPR', 'USD');
  
  // Test USD to INR
  debugCurrencyConversion(100, 'USD', 'INR');
  
  // Test INR to USD
  debugCurrencyConversion(8300, 'INR', 'USD');
}
