import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Income from '@/models/Income';
import Family from '@/models/Family';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

// GET /api/family/income - Get family income
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);

    // Find user's family
    const userDoc = await User.findById(user.userId);
    if (!userDoc?.familyId) {
      return NextResponse.json(
        { error: 'User is not part of any family' },
        { status: 404 }
      );
    }

    // Check family permissions
    const family = await Family.findById(userDoc.familyId);
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      );
    }

    const member = family.getMember(user.userId);
    if (!member?.permissions.canViewFamilyIncome) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view family income' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const source = searchParams.get('source');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query for family income
    const query: any = {
      familyId: userDoc.familyId,
      type: 'family',
    };

    if (source) {
      query.source = { $regex: source, $options: 'i' };
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
      .populate('userId', 'name email')
      .populate('contributedBy', 'name email')
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
    console.error('Error fetching family income:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family income' },
      { status: 500 }
    );
  }
}

// POST /api/family/income - Add income to family pool
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    const body = await request.json();
    const { 
      amount, 
      currency, 
      source, 
      description, 
      date, 
      frequency = 'one-time',
      isRecurring = false,
      allocation 
    } = body;

    // Validation
    if (!amount || !currency || !source || !description || !date) {
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

    // Find user's family
    const userDoc = await User.findById(user.userId);
    if (!userDoc?.familyId) {
      return NextResponse.json(
        { error: 'User is not part of any family' },
        { status: 404 }
      );
    }

    // Check family permissions
    const family = await Family.findById(userDoc.familyId);
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      );
    }

    const member = family.getMember(user.userId);
    if (!member?.permissions.canAddFamilyIncome) {
      return NextResponse.json(
        { error: 'Insufficient permissions to add family income' },
        { status: 403 }
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

    // Create family income
    const income = new Income({
      userId: user.userId,
      familyId: userDoc.familyId,
      type: 'family',
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      source,
      description,
      date: new Date(date),
      frequency,
      isRecurring,
      nextOccurrence,
      contributedBy: user.userId,
      allocation: allocation || {
        toFamily: parseFloat(amount),
        toPersonal: 0,
      },
    });

    await income.save();

    // Populate the response
    await income.populate('userId', 'name email');
    await income.populate('contributedBy', 'name email');

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    console.error('Error creating family income:', error);
    return NextResponse.json(
      { error: 'Failed to create family income' },
      { status: 500 }
    );
  }
}
