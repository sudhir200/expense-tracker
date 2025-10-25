import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Family from '@/models/Family';
import UserFamily from '@/models/UserFamily';
import { requireAuth } from '@/lib/auth';

// GET /api/families - Get all families (for admin users or family selection)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    
    // Get all families with basic information
    const families = await Family.find({})
      .select('_id name description members.length createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Add member count to each family
    const familiesWithMemberCount = families.map(family => ({
      _id: family._id,
      name: family.name,
      description: family.description,
      memberCount: family.members?.length || 0,
      createdAt: family.createdAt
    }));

    return NextResponse.json({
      families: familiesWithMemberCount
    });
  } catch (error) {
    console.error('Error fetching families:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch families' },
      { status: 500 }
    );
  }
}

// POST /api/families - Create a new family
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    const body = await request.json();
    const { name, description, currency } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Family name is required' },
        { status: 400 }
      );
    }

    // Create the family
    const family = new Family({
      name: name.trim(),
      description: description?.trim() || '',
      currency: currency || 'USD',
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
        }
      }],
      settings: {
        allowPersonalExpenses: true,
        requireApprovalForLargeExpenses: false,
        largeExpenseThreshold: 1000,
        sharedCategories: [],
        personalCategories: [],
      },
      inviteCodes: []
    });

    await family.save();

    // Check if this is the user's first family
    const existingFamilies = await UserFamily.countDocuments({ 
      userId: user.userId, 
      isActive: true 
    });

    // Create UserFamily relationship
    const userFamily = new UserFamily({
      userId: user.userId,
      familyId: family._id,
      role: 'head',
      joinedAt: new Date(),
      isActive: true,
      isPrimary: existingFamilies === 0, // Set as primary if it's the first family
      permissions: {
        canViewFamilyIncome: true,
        canAddFamilyIncome: true,
        canViewFamilyExpenses: true,
        canAddFamilyExpenses: true,
        canManageMembers: true,
        canManageBudgets: true,
      }
    });

    await userFamily.save();

    return NextResponse.json({
      family,
      userFamily,
      message: 'Family created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating family:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create family' },
      { status: 500 }
    );
  }
}
