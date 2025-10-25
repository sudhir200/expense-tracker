import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ExchangeRate from '@/models/ExchangeRate';
import { EXCHANGE_RATES } from '@/lib/currency';

export async function GET() {
  try {
    await dbConnect();

    // Get all exchange rates from database
    const dbRates = await ExchangeRate.find({});
    
    // Create a map of existing rates
    const rateMap = new Map();
    dbRates.forEach(rate => {
      rateMap.set(`${rate.fromCurrency}-${rate.toCurrency}`, rate);
    });

    // Prepare response with all currency pairs
    const allRates = [];
    const currencies = Object.keys(EXCHANGE_RATES);
    
    for (const from of currencies) {
      for (const to of currencies) {
        if (from !== to) {
          const key = `${from}-${to}`;
          const dbRate = rateMap.get(key);
          
          if (dbRate) {
            allRates.push(dbRate);
          } else {
            // Calculate rate from hardcoded values
            // Since EXCHANGE_RATES are "1 USD = X units", we need to calculate properly
            let rate: number;
            
            if (from === 'USD') {
              // USD to other currency: use rate directly
              rate = EXCHANGE_RATES[to];
            } else if (to === 'USD') {
              // Other currency to USD: 1 / rate
              rate = 1 / EXCHANGE_RATES[from];
            } else {
              // Between two non-USD currencies: (1/from_rate) * to_rate
              rate = EXCHANGE_RATES[to] / EXCHANGE_RATES[from];
            }
            
            allRates.push({
              fromCurrency: from,
              toCurrency: to,
              rate: Math.round(rate * 1000000) / 1000000, // Round to 6 decimal places
              lastUpdated: new Date(),
              isUserDefined: false,
            });
          }
        }
      }
    }

    return NextResponse.json(allRates);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { fromCurrency, toCurrency, rate } = body;

    // Validation
    if (!fromCurrency || !toCurrency || !rate) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (rate <= 0) {
      return NextResponse.json(
        { error: 'Rate must be greater than 0' },
        { status: 400 }
      );
    }

    if (fromCurrency === toCurrency) {
      return NextResponse.json(
        { error: 'From and to currencies cannot be the same' },
        { status: 400 }
      );
    }

    // Update or create exchange rate
    const exchangeRate = await ExchangeRate.findOneAndUpdate(
      { fromCurrency: fromCurrency.toUpperCase(), toCurrency: toCurrency.toUpperCase() },
      {
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        rate: parseFloat(rate),
        lastUpdated: new Date(),
        isUserDefined: true,
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(exchangeRate, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating exchange rate:', error);
    return NextResponse.json(
      { error: 'Failed to save exchange rate' },
      { status: 500 }
    );
  }
}
