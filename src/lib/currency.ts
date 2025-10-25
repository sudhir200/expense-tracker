// Supported currencies with their symbols and formatting options
export type Currency = {
  code: string;
  name: string;
  symbol: string;
  decimalDigits: number;
  symbolOnLeft: boolean;
  spaceBetweenAmountAndSymbol: boolean;
  decimalSeparator: string;
  thousandsSeparator: string;
};

export const CURRENCIES: Record<string, Currency> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimalDigits: 2,
    symbolOnLeft: true,
    spaceBetweenAmountAndSymbol: false,
    decimalSeparator: '.',
    thousandsSeparator: ','
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimalDigits: 2,
    symbolOnLeft: true,
    spaceBetweenAmountAndSymbol: true,
    decimalSeparator: ',',
    thousandsSeparator: '.'
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimalDigits: 2,
    symbolOnLeft: true,
    spaceBetweenAmountAndSymbol: false,
    decimalSeparator: '.',
    thousandsSeparator: ','
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    decimalDigits: 0,
    symbolOnLeft: true,
    spaceBetweenAmountAndSymbol: false,
    decimalSeparator: '',
    thousandsSeparator: ','
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    decimalDigits: 2,
    symbolOnLeft: true,
    spaceBetweenAmountAndSymbol: false,
    decimalSeparator: '.',
    thousandsSeparator: ','
  },
  NPR: {
    code: 'NPR',
    name: 'Nepalese Rupee',
    symbol: 'Rs',
    decimalDigits: 2,
    symbolOnLeft: true,
    spaceBetweenAmountAndSymbol: true,
    decimalSeparator: '.',
    thousandsSeparator: ','
  },
  // Add more currencies as needed
};

export type CurrencyCode = keyof typeof CURRENCIES;

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

// Hard-coded exchange rates (as of October 2024 for demo purposes)
// In a real app, you'd fetch these from an API like exchangerate-api.com
// These rates represent: 1 USD = X units of target currency
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,      // Base currency
  EUR: 0.92,     // 1 USD = 0.92 EUR (updated Oct 2024)
  GBP: 0.77,     // 1 USD = 0.77 GBP (updated Oct 2024)
  JPY: 149.0,    // 1 USD = 149 JPY (updated Oct 2024)
  INR: 83.5,     // 1 USD = 83.5 INR (updated Oct 2024)
  NPR: 140,    // 1 USD = 133.5 NPR (updated Oct 2024)
};

// Convert amount from one currency to another
export function convertCurrency(
  amount: number, 
  fromCurrency: CurrencyCode, 
  toCurrency: CurrencyCode,
  customRates?: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Use custom rates if provided, otherwise fall back to hardcoded rates
  const rates = customRates || EXCHANGE_RATES;
  
  // Validate rates exist
  if (!rates[fromCurrency] || !rates[toCurrency]) {
    console.warn('Missing exchange rate for', fromCurrency, 'or', toCurrency);
    return amount; // Return original amount if rates missing
  }
  
  // Since our rates are "1 USD = X units of currency", we need to:
  // 1. Convert FROM currency to USD: divide by the rate
  // 2. Convert FROM USD to TO currency: multiply by the rate
  
  let result: number;
  
  if (fromCurrency === 'USD') {
    // Converting from USD to another currency: multiply by rate
    result = amount * rates[toCurrency];
  } else if (toCurrency === 'USD') {
    // Converting from another currency to USD: divide by rate
    result = amount / rates[fromCurrency];
  } else {
    // Converting between two non-USD currencies: go through USD
    const usdAmount = amount / rates[fromCurrency]; // Convert to USD first
    result = usdAmount * rates[toCurrency]; // Then convert to target currency
  }
  
  // Round to avoid floating point precision issues
  result = Math.round(result * 100) / 100;
  
  // Debug logging for suspicious conversions
  if (result > amount * 1000 || result < amount / 1000) {
    console.warn('Suspicious conversion:', amount, fromCurrency, '->', result, toCurrency, 'rates:', rates[fromCurrency], rates[toCurrency]);
  }
  
  return result;
}

// Cache for database rates to avoid repeated API calls
let cachedDbRates: Record<string, number> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch exchange rates from database with caching
async function fetchDbRates(): Promise<Record<string, number>> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (cachedDbRates && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedDbRates;
  }
  
  try {
    const response = await fetch('/api/exchange-rates');
    if (response.ok) {
      const dbRates = await response.json();
      const rateMap: Record<string, number> = {};
      
      // Build rate map from database rates
      dbRates.forEach((rate: any) => {
        // Store both directions for easier lookup
        rateMap[`${rate.fromCurrency}-${rate.toCurrency}`] = rate.rate;
        // Calculate reverse rate
        if (rate.rate > 0) {
          rateMap[`${rate.toCurrency}-${rate.fromCurrency}`] = 1 / rate.rate;
        }
      });
      
      // Cache the rates
      cachedDbRates = rateMap;
      cacheTimestamp = now;
      
      return rateMap;
    }
  } catch (error) {
    console.warn('Failed to fetch database rates:', error);
  }
  
  // Return empty object if fetch fails
  return {};
}

// Async version that fetches rates from database
export async function convertCurrencyWithDbRates(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;
  
  try {
    const dbRates = await fetchDbRates();
    
    // Try direct conversion first
    const directKey = `${fromCurrency}-${toCurrency}`;
    if (dbRates[directKey]) {
      const result = amount * dbRates[directKey];
      return Math.round(result * 100) / 100;
    }
    
    // Try conversion through USD
    const toUsdKey = `${fromCurrency}-USD`;
    const fromUsdKey = `USD-${toCurrency}`;
    
    if (dbRates[toUsdKey] && dbRates[fromUsdKey]) {
      const usdAmount = amount * dbRates[toUsdKey];
      const result = usdAmount * dbRates[fromUsdKey];
      return Math.round(result * 100) / 100;
    }
    
    // If no database rates found, fall back to hardcoded rates
    console.warn(`No database rate found for ${fromCurrency} to ${toCurrency}, using hardcoded rates`);
  } catch (error) {
    console.warn('Failed to use database rates, using hardcoded rates:', error);
  }
  
  // Fall back to hardcoded rates
  return convertCurrency(amount, fromCurrency, toCurrency);
}

export function formatCurrency(amount: number, currencyCode: CurrencyCode = DEFAULT_CURRENCY): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY];
  
  // Format the number with proper separators
  const parts = amount.toFixed(currency.decimalDigits).split('.');
  let formattedAmount = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);
  
  if (currency.decimalDigits > 0 && parts[1]) {
    formattedAmount += currency.decimalSeparator + parts[1];
  }
  
  // Add currency symbol
  if (currency.symbolOnLeft) {
    return currency.symbol + (currency.spaceBetweenAmountAndSymbol ? ' ' : '') + formattedAmount;
  } else {
    return formattedAmount + (currency.spaceBetweenAmountAndSymbol ? ' ' : '') + currency.symbol;
  }
}

export function getCurrencyByCode(code: string): Currency {
  return CURRENCIES[code as CurrencyCode] || CURRENCIES[DEFAULT_CURRENCY];
}

export function getCurrencyList(): Currency[] {
  return Object.values(CURRENCIES);
}

// Format expense amount with proper currency conversion and display
export function formatExpenseAmount(
  amount: number, 
  expenseCurrency: CurrencyCode, 
  displayCurrency: CurrencyCode
): string {
  const convertedAmount = convertCurrency(amount, expenseCurrency, displayCurrency);
  return formatCurrency(convertedAmount, displayCurrency);
}

// Simple format function without validation (for cases where we trust the data)
export function formatExpenseAmountSimple(
  amount: number, 
  expenseCurrency: CurrencyCode, 
  displayCurrency: CurrencyCode
): string {
  if (expenseCurrency === displayCurrency) {
    return formatCurrency(amount, displayCurrency);
  }
  
  const convertedAmount = convertCurrency(amount, expenseCurrency, displayCurrency);
  const originalFormatted = formatCurrency(amount, expenseCurrency);
  const convertedFormatted = formatCurrency(convertedAmount, displayCurrency);
  
  return `${convertedFormatted} (${originalFormatted})`;
}

// Async version that uses database rates for formatting
export async function formatExpenseAmountWithDbRates(
  amount: number, 
  expenseCurrency: CurrencyCode, 
  displayCurrency: CurrencyCode
): Promise<string> {
  if (expenseCurrency === displayCurrency) {
    return formatCurrency(amount, displayCurrency);
  }
  
  const convertedAmount = await convertCurrencyWithDbRates(amount, expenseCurrency, displayCurrency);
  const originalFormatted = formatCurrency(amount, expenseCurrency);
  const convertedFormatted = formatCurrency(convertedAmount, displayCurrency);
  
  return `${convertedFormatted} (${originalFormatted})`;
}

// Synchronous version that tries to use cached database rates, falls back to hardcoded
export function formatExpenseAmountWithCachedDbRates(
  amount: number, 
  expenseCurrency: CurrencyCode, 
  displayCurrency: CurrencyCode
): string {
  // Handle missing or invalid currency
  if (!expenseCurrency || typeof expenseCurrency !== 'string') {
    console.warn('Missing or invalid expense currency, using display currency:', expenseCurrency);
    return formatCurrency(amount, displayCurrency);
  }

  if (expenseCurrency === displayCurrency) {
    return formatCurrency(amount, displayCurrency);
  }
  
  // Try to use cached database rates if available
  let convertedAmount: number;
  
  if (cachedDbRates) {
    const directKey = `${expenseCurrency}-${displayCurrency}`;
    if (cachedDbRates[directKey]) {
      convertedAmount = amount * cachedDbRates[directKey];
    } else {
      // Try conversion through USD with cached rates
      const toUsdKey = `${expenseCurrency}-USD`;
      const fromUsdKey = `USD-${displayCurrency}`;
      
      if (cachedDbRates[toUsdKey] && cachedDbRates[fromUsdKey]) {
        const usdAmount = amount * cachedDbRates[toUsdKey];
        convertedAmount = usdAmount * cachedDbRates[fromUsdKey];
      } else {
        // Fall back to hardcoded rates
        convertedAmount = convertCurrency(amount, expenseCurrency, displayCurrency);
      }
    }
  } else {
    // No cached rates, use hardcoded
    convertedAmount = convertCurrency(amount, expenseCurrency, displayCurrency);
  }
  
  convertedAmount = Math.round(convertedAmount * 100) / 100;
  
  const originalFormatted = formatCurrency(amount, expenseCurrency);
  const convertedFormatted = formatCurrency(convertedAmount, displayCurrency);
  
  return `${convertedFormatted} (${originalFormatted})`;
}

// Initialize database rates cache (call this when the app loads)
export async function initializeCurrencyRates(): Promise<void> {
  try {
    await fetchDbRates();
    console.log('Currency rates cache initialized');
  } catch (error) {
    console.warn('Failed to initialize currency rates cache:', error);
  }
}

// Clear the cache (useful for forcing a refresh)
export function clearCurrencyRatesCache(): void {
  cachedDbRates = null;
  cacheTimestamp = 0;
}

// Format expense amount with conversion indicator if currencies differ
// Validate if a conversion result seems reasonable
export function isReasonableConversion(
  originalAmount: number,
  convertedAmount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): boolean {
  // Same currency should be identical
  if (fromCurrency === toCurrency) {
    return Math.abs(originalAmount - convertedAmount) < 0.01;
  }
  
  // Basic sanity checks
  if (convertedAmount <= 0 || !isFinite(convertedAmount) || isNaN(convertedAmount)) {
    return false;
  }
  
  // Check for extreme ratios (likely errors)
  const ratio = convertedAmount / originalAmount;
  
  // Define reasonable ranges based on actual exchange rates
  let maxRatio: number;
  let minRatio: number;
  
  if (toCurrency === 'JPY' || fromCurrency === 'JPY') {
    // JPY conversions can have large ratios (e.g., 1 USD = 149 JPY)
    maxRatio = 200;
    minRatio = 1 / 200;
  } else if (toCurrency === 'INR' || fromCurrency === 'INR' || 
             toCurrency === 'NPR' || fromCurrency === 'NPR') {
    // INR/NPR conversions can have larger ratios (e.g., 1 USD = 83.5 INR)
    maxRatio = 150;
    minRatio = 1 / 150;
  } else {
    // Most other currency pairs have smaller ratios
    maxRatio = 5;
    minRatio = 1 / 5;
  }
  
  // Allow for some margin of error
  return ratio >= minRatio * 0.5 && ratio <= maxRatio * 2;
}

export function formatExpenseAmountWithIndicator(
  amount: number, 
  expenseCurrency: CurrencyCode, 
  displayCurrency: CurrencyCode
): string {
  // Handle invalid amounts
  if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
    return formatCurrency(0, displayCurrency);
  }
  
  // Handle extremely large amounts (likely data errors)
  if (amount > 10000000) {
    console.warn('Extremely large amount detected:', amount, 'from', expenseCurrency, 'to', displayCurrency);
    return formatCurrency(amount, expenseCurrency) + ' (amount too large)';
  }
  
  // Ensure currencies are valid
  const fromCurrency = CURRENCIES[expenseCurrency] ? expenseCurrency : DEFAULT_CURRENCY;
  const toCurrency = CURRENCIES[displayCurrency] ? displayCurrency : DEFAULT_CURRENCY;
  
  if (fromCurrency === toCurrency) {
    return formatCurrency(amount, toCurrency);
  }
  
  const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);
  
  // Validate conversion result - only flag truly problematic conversions
  if (!isReasonableConversion(amount, convertedAmount, fromCurrency, toCurrency)) {
    console.warn('Unreasonable conversion result:', amount, fromCurrency, '->', convertedAmount, toCurrency);
    // For debugging, still show the conversion but with a warning
    const originalFormatted = formatCurrency(amount, fromCurrency);
    const convertedFormatted = formatCurrency(convertedAmount, toCurrency);
    return `${convertedFormatted} (${originalFormatted} - check rate)`;
  }
  
  const originalFormatted = formatCurrency(amount, fromCurrency);
  const convertedFormatted = formatCurrency(convertedAmount, toCurrency);
  
  return `${convertedFormatted} (${originalFormatted})`;
}
