import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Expense from '@/models/Expense';
import { ExpenseFilters } from '@/types/expense';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter object
    const filters: any = {};

    // Date range filter
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      filters.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Category filter
    const categories = searchParams.get('categories');
    if (categories) {
      filters.category = { $in: categories.split(',') };
    }

    // Payment method filter
    const paymentMethods = searchParams.get('paymentMethods');
    if (paymentMethods) {
      filters.paymentMethod = { $in: paymentMethods.split(',') };
    }

    // Amount range filter
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    if (minAmount || maxAmount) {
      filters.amount = {};
      if (minAmount) filters.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filters.amount.$lte = parseFloat(maxAmount);
    }

    // Search filter
    const search = searchParams.get('search');
    if (search) {
      filters.description = { $regex: search, $options: 'i' };
    }

    // Sort options
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

    const expenses = await Expense.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Expense.countDocuments(filters);

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { amount, category, description, date, paymentMethod } = body;

    // Validation
    if (!amount || !category || !description || !date || !paymentMethod) {
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

    const validPaymentMethods = ['Cash', 'Card', 'UPI', 'Bank Transfer'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    const expense = new Expense({
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(date),
      paymentMethod,
    });

    await expense.save();

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
