import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Family from '@/models/Family';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import { randomBytes } from 'crypto';

// Generate a unique invite code
function generateInviteCode(): string {
  return randomBytes(8).toString('hex').toUpperCase();
}

// POST /api/family/invite - Create family invite code
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);

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

    // Check if user can manage members
    if (!family.canManageFamily(user.userId)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create invite codes' },
        { status: 403 }
      );
    }

    // Generate unique invite code
    let inviteCode: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      inviteCode = generateInviteCode();
      const existingCode = await Family.findOne({
        'inviteCodes.code': inviteCode,
        'inviteCodes.isActive': true,
      });
      
      if (!existingCode) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique invite code' },
        { status: 500 }
      );
    }

    // Add invite code to family
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    family.inviteCodes.push({
      code: inviteCode!,
      expiresAt,
      createdBy: user.userId,
      isActive: true,
    });

    await family.save();

    return NextResponse.json({
      code: inviteCode!,
      expiresAt,
      familyName: family.name,
    });
  } catch (error) {
    console.error('Error creating invite code:', error);
    return NextResponse.json(
      { error: 'Failed to create invite code' },
      { status: 500 }
    );
  }
}

// PUT /api/family/invite - Join family using invite code
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
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

    // Find family with the invite code
    const family = await Family.findOne({
      'inviteCodes.code': code.toUpperCase(),
      'inviteCodes.isActive': true,
      'inviteCodes.expiresAt': { $gt: new Date() },
    });

    if (!family) {
      return NextResponse.json(
        { error: 'Invalid or expired invite code' },
        { status: 404 }
      );
    }

    // Add user to family
    family.members.push({
      userId: user.userId,
      role: 'adult',
      joinedAt: new Date(),
      permissions: {
        canViewFamilyIncome: true,
        canAddFamilyIncome: true,
        canViewFamilyExpenses: true,
        canAddFamilyExpenses: true,
        canManageMembers: false,
        canManageBudgets: false,
      },
    });

    // Deactivate the used invite code
    const inviteCodeIndex = family.inviteCodes.findIndex(
      (invite: any) => invite.code === code.toUpperCase() && invite.isActive
    );
    
    if (inviteCodeIndex !== -1) {
      family.inviteCodes[inviteCodeIndex].isActive = false;
    }

    await family.save();

    // Update user's family information
    await User.findByIdAndUpdate(user.userId, {
      familyId: family._id,
      familyRole: 'adult',
    });

    return NextResponse.json({
      message: 'Successfully joined family',
      family: {
        id: family._id,
        name: family.name,
        memberCount: family.members.length,
      },
    });
  } catch (error) {
    console.error('Error joining family:', error);
    return NextResponse.json(
      { error: 'Failed to join family' },
      { status: 500 }
    );
  }
}
