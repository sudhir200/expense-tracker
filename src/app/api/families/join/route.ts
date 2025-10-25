import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Family from '@/models/Family';
import UserFamily from '@/models/UserFamily';
import { requireAuth } from '@/lib/auth';

// POST /api/families/join - Join a family using invite code
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    const body = await request.json();
    const { inviteCode } = body;

    // Validation
    if (!inviteCode || !inviteCode.trim()) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    // Find family with the invite code
    const family = await Family.findOne({
      'inviteCodes.code': inviteCode.trim(),
      'inviteCodes.isActive': true,
      'inviteCodes.expiresAt': { $gt: new Date() }
    });

    if (!family) {
      return NextResponse.json(
        { error: 'Invalid or expired invite code' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMembership = await UserFamily.findOne({
      userId: user.userId,
      familyId: family._id,
      isActive: true
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this family' },
        { status: 400 }
      );
    }

    // Check if this is the user's first family
    const existingFamilies = await UserFamily.countDocuments({ 
      userId: user.userId, 
      isActive: true 
    });

    // Add user to family members array
    family.members.push({
      userId: user.userId,
      role: 'adult', // Default role for joined members
      joinedAt: new Date(),
      permissions: {
        canViewFamilyIncome: true,
        canAddFamilyIncome: true,
        canViewFamilyExpenses: true,
        canAddFamilyExpenses: true,
        canManageMembers: false,
        canManageBudgets: false,
      }
    });

    await family.save();

    // Create UserFamily relationship
    const userFamily = new UserFamily({
      userId: user.userId,
      familyId: family._id,
      role: 'adult',
      joinedAt: new Date(),
      isActive: true,
      isPrimary: existingFamilies === 0, // Set as primary if it's the first family
      permissions: {
        canViewFamilyIncome: true,
        canAddFamilyIncome: true,
        canViewFamilyExpenses: true,
        canAddFamilyExpenses: true,
        canManageMembers: false,
        canManageBudgets: false,
      }
    });

    await userFamily.save();

    return NextResponse.json({
      family: {
        _id: family._id,
        name: family.name,
        description: family.description,
        currency: family.currency
      },
      userFamily,
      message: 'Successfully joined family'
    }, { status: 201 });
  } catch (error) {
    console.error('Error joining family:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to join family' },
      { status: 500 }
    );
  }
}
