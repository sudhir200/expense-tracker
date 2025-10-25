import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Family from '@/models/Family';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import { generateInviteCode } from '@/lib/utils';

// GET /api/family - Get user's family information
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);

    // Find user's family
    const family = await Family.findOne({
      'members.userId': user.userId,
    }).populate('members.userId', 'name email avatar');

    if (!family) {
      return NextResponse.json(
        { error: 'User is not part of any family' },
        { status: 404 }
      );
    }

    return NextResponse.json(family);
  } catch (error) {
    console.error('Error fetching family:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family information' },
      { status: 500 }
    );
  }
}

// POST /api/family - Create a new family
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    const body = await request.json();
    const { name, description, currency = 'USD' } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Family name is required' },
        { status: 400 }
      );
    }

    // Check if user is already part of a family
    const existingFamily = await Family.findOne({
      'members.userId': user.userId,
    });

    if (existingFamily) {
      return NextResponse.json(
        { error: 'User is already part of a family' },
        { status: 400 }
      );
    }

    // Create family
    const family = new Family({
      name: name.trim(),
      description: description?.trim(),
      currency: currency.toUpperCase(),
      createdBy: user.userId,
      members: [{
        userId: user.userId,
        role: 'head',
        joinedAt: new Date(),
        permissions: {
          canViewFamilyIncome: true,
          canAddFamilyIncome: true,
          canViewFamilyExpenses: true,
          canAddFamilyExpenses: true,
          canManageMembers: true,
          canManageBudgets: true,
        },
      }],
      settings: {
        allowPersonalExpenses: true,
        requireApprovalForLargeExpenses: false,
        largeExpenseThreshold: 1000,
        sharedCategories: ['Groceries', 'Utilities', 'Rent', 'Insurance', 'Healthcare'],
        personalCategories: ['Entertainment', 'Clothing', 'Personal Care', 'Hobbies'],
      },
      inviteCodes: [],
    });

    await family.save();

    // Update user's family information
    await User.findByIdAndUpdate(user.userId, {
      familyId: family._id,
      familyRole: 'head',
    });

    return NextResponse.json(family, { status: 201 });
  } catch (error) {
    console.error('Error creating family:', error);
    return NextResponse.json(
      { error: 'Failed to create family' },
      { status: 500 }
    );
  }
}

// PUT /api/family - Update family settings
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    const body = await request.json();

    // Find user's family
    const family = await Family.findOne({
      'members.userId': user.userId,
    });

    if (!family) {
      return NextResponse.json(
        { error: 'User is not part of any family' },
        { status: 404 }
      );
    }

    // Check if user can manage family
    if (!family.canManageFamily(user.userId)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to manage family' },
        { status: 403 }
      );
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'currency', 'settings'];
    const updates: any = {};

    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Validate currency if provided
    if (updates.currency) {
      updates.currency = updates.currency.toUpperCase();
    }

    const updatedFamily = await Family.findByIdAndUpdate(
      family._id,
      updates,
      { new: true, runValidators: true }
    ).populate('members.userId', 'name email avatar');

    return NextResponse.json(updatedFamily);
  } catch (error) {
    console.error('Error updating family:', error);
    return NextResponse.json(
      { error: 'Failed to update family' },
      { status: 500 }
    );
  }
}
