import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Expense from '@/models/Expense';
import Family from '@/models/Family';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

// GET /api/family/expenses - Get family expenses
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
    if (!member?.permissions.canViewFamilyExpenses) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view family expenses' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query for family expenses
    const query: any = {
      familyId: userDoc.familyId,
      type: 'family',
    };

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Get total count
    const total = await Expense.countDocuments(query);

    // Get paginated results
    const expenses = await Expense.find(query)
      .populate('userId', 'name email')
      .populate('paidBy', 'name email')
      .populate('splitBetween.userId', 'name email')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

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
    console.error('Error fetching family expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family expenses' },
      { status: 500 }
    );
  }
}

// POST /api/family/expenses - Add family expense
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    const body = await request.json();
    const { 
      amount, 
      currency, 
      category, 
      description, 
      date, 
      paymentMethod,
      paidBy,
      splitBetween 
    } = body;

    // Validation
    if (!amount || !currency || !category || !description || !date || !paymentMethod) {
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
    
    // For admin users, allow them to work with any family
    // For regular users, they must be part of a family
    let familyId = userDoc?.familyId;
    
    if (!familyId) {
      // If user is admin/superuser, they can work with families even without being a member
      if (userDoc?.role === 'ADMIN' || userDoc?.role === 'SUPERUSER') {
        // For now, get the first available family or require familyId in request
        const { familyId: requestFamilyId } = body;
        if (requestFamilyId) {
          familyId = requestFamilyId;
        } else {
          // Get first available family for admin
          const firstFamily = await Family.findOne();
          if (firstFamily) {
            familyId = firstFamily._id;
          }
        }
      }
      
      if (!familyId) {
        // Check if any families exist at all
        const familyCount = await Family.countDocuments();
        if (familyCount === 0) {
          return NextResponse.json(
            { 
              error: 'No families exist yet. Please create a family first by going to the Family page.',
              code: 'NO_FAMILIES_EXIST'
            },
            { status: 404 }
          );
        } else {
          return NextResponse.json(
            { 
              error: 'You are not part of any family. Please join a family or create one first by going to the Family page.',
              code: 'USER_NOT_IN_FAMILY'
            },
            { status: 404 }
          );
        }
      }
    }

    // Check family permissions
    const family = await Family.findById(familyId);
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      );
    }

    const member = family.getMember(user.userId);
    // Allow admin users to bypass family permission checks
    if (!member?.permissions.canAddFamilyExpenses && userDoc?.role !== 'ADMIN' && userDoc?.role !== 'SUPERUSER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to add family expenses' },
        { status: 403 }
      );
    }

    // Check if approval is required for large expenses
    let approvalStatus = undefined;
    if (family.settings.requireApprovalForLargeExpenses && 
        amount >= family.settings.largeExpenseThreshold) {
      approvalStatus = family.isHead(user.userId) ? 'approved' : 'pending';
    }

    // Validate split amounts if provided
    if (splitBetween && splitBetween.length > 0) {
      const totalSplit = splitBetween.reduce((sum: number, split: any) => sum + split.amount, 0);
      if (Math.abs(totalSplit - amount) > 0.01) {
        return NextResponse.json(
          { error: 'Split amounts must equal total expense amount' },
          { status: 400 }
        );
      }

      // Validate that all split users are family members
      const familyMemberIds = family.members.map((m: any) => m.userId.toString());
      for (const split of splitBetween) {
        if (!familyMemberIds.includes(split.userId)) {
          return NextResponse.json(
            { error: 'Cannot split expense with non-family members' },
            { status: 400 }
          );
        }
      }
    }

    // Create family expense
    const expense = new Expense({
      userId: user.userId,
      familyId: userDoc.familyId,
      type: 'family',
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      category,
      description,
      date: new Date(date),
      paymentMethod,
      paidBy: paidBy || user.userId,
      splitBetween: splitBetween || [],
      approvalStatus,
      approvedBy: approvalStatus === 'approved' ? user.userId : undefined,
    });

    await expense.save();

    // Populate the response
    await expense.populate('userId', 'name email');
    await expense.populate('paidBy', 'name email');
    await expense.populate('splitBetween.userId', 'name email');

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating family expense:', error);
    return NextResponse.json(
      { error: 'Failed to create family expense' },
      { status: 500 }
    );
  }
}
