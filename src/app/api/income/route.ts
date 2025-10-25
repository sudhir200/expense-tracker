import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Income from '@/models/Income';
import { requireAuth, requirePermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Require authentication and income read permission
    const user = requirePermission(request, 'income', 'read_own');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const source = searchParams.get('source');
    const frequency = searchParams.get('frequency');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query - filter by user
    const query: any = {
      userId: user.userId,
    };
    
    if (source) {
      query.source = { $regex: source, $options: 'i' };
    }
    
    if (frequency) {
      query.frequency = frequency;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Get total count
    const total = await Income.countDocuments(query);

    // Get paginated results
    const income = await Income.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      income,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching income:', error);
    return NextResponse.json(
      { error: 'Failed to fetch income' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Require authentication and income create permission
    const user = requirePermission(request, 'income', 'create');

    const body = await request.json();
    console.log('Income creation request:', { 
      userId: user.userId, 
      body: { ...body, amount: typeof body.amount } 
    });
    
    const { amount, currency, source, description, date, frequency, isRecurring, type, allocation } = body;

    // Validation
    if (!amount || !currency || !source || !description || !date || !frequency) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const validFrequencies = ['one-time', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency' },
        { status: 400 }
      );
    }

    // Validate type if provided
    if (type && !['personal', 'family'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be personal or family' },
        { status: 400 }
      );
    }

    // Calculate next occurrence for recurring income
    let nextOccurrence = null;
    if (isRecurring && frequency !== 'one-time') {
      const incomeDate = new Date(date);
      switch (frequency) {
        case 'weekly':
          nextOccurrence = new Date(incomeDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'bi-weekly':
          nextOccurrence = new Date(incomeDate.getTime() + 14 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          nextOccurrence = new Date(incomeDate);
          nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
          break;
        case 'quarterly':
          nextOccurrence = new Date(incomeDate);
          nextOccurrence.setMonth(nextOccurrence.getMonth() + 3);
          break;
        case 'yearly':
          nextOccurrence = new Date(incomeDate);
          nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
          break;
      }
    }

    const income = new Income({
      userId: user.userId,
      type: type || 'personal',
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      source,
      description,
      date: new Date(date),
      frequency,
      isRecurring: isRecurring || false,
      nextOccurrence,
      allocation: allocation || undefined,
    });

    await income.save();

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    console.error('Error creating income:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Access denied')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { error: `Validation error: ${error.message}` },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create income', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
