import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Income from '@/models/Income';
import { requirePermission } from '@/lib/auth';

// GET /api/income/[id] - Get specific income record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Require authentication and income read permission
    const user = requirePermission(request, 'income', 'read_own');

    const income = await Income.findOne({
      _id: params.id,
      userId: user.userId, // Ensure user can only access their own income
    });

    if (!income) {
      return NextResponse.json(
        { error: 'Income record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(income);
  } catch (error) {
    console.error('Error fetching income:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch income' },
      { status: 500 }
    );
  }
}

// PUT /api/income/[id] - Update income record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Require authentication and income update permission
    const user = requirePermission(request, 'income', 'update_own');

    const body = await request.json();
    const { amount, currency, source, description, date, frequency, isRecurring, type, allocation } = body;

    // Validation
    if (amount !== undefined && amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (frequency) {
      const validFrequencies = ['one-time', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'];
      if (!validFrequencies.includes(frequency)) {
        return NextResponse.json(
          { error: 'Invalid frequency' },
          { status: 400 }
        );
      }
    }

    // Validate type if provided
    if (type && !['personal', 'family'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be personal or family' },
        { status: 400 }
      );
    }

    // Find the income record
    const income = await Income.findOne({
      _id: params.id,
      userId: user.userId, // Ensure user can only update their own income
    });

    if (!income) {
      return NextResponse.json(
        { error: 'Income record not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (amount !== undefined) income.amount = parseFloat(amount);
    if (currency) income.currency = currency.toUpperCase();
    if (source) income.source = source;
    if (description) income.description = description;
    if (date) income.date = new Date(date);
    if (frequency) income.frequency = frequency;
    if (isRecurring !== undefined) income.isRecurring = isRecurring;
    if (type) income.type = type;
    if (allocation !== undefined) income.allocation = allocation;

    // Recalculate next occurrence for recurring income
    if (frequency && isRecurring && frequency !== 'one-time') {
      const incomeDate = income.date;
      let nextOccurrence = null;
      
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
      income.nextOccurrence = nextOccurrence;
    } else if (!isRecurring || frequency === 'one-time') {
      income.nextOccurrence = null;
    }

    await income.save();

    return NextResponse.json(income);
  } catch (error) {
    console.error('Error updating income:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update income' },
      { status: 500 }
    );
  }
}

// DELETE /api/income/[id] - Delete income record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Require authentication and income delete permission
    const user = requirePermission(request, 'income', 'delete_own');

    const income = await Income.findOne({
      _id: params.id,
      userId: user.userId, // Ensure user can only delete their own income
    });

    if (!income) {
      return NextResponse.json(
        { error: 'Income record not found' },
        { status: 404 }
      );
    }

    await Income.findByIdAndDelete(params.id);

    return NextResponse.json({
      message: 'Income record deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting income:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete income' },
      { status: 500 }
    );
  }
}
