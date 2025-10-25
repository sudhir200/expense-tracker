import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Family from '@/models/Family';
import UserFamily from '@/models/UserFamily';
import { requireAuth } from '@/lib/auth';
import { randomBytes } from 'crypto';

// POST /api/families/[id]/invite - Generate invite code for family
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    const familyId = params.id;

    // Check if user has permission to invite members
    const userFamily = await UserFamily.findOne({
      userId: user.userId,
      familyId: familyId,
      isActive: true
    });

    if (!userFamily) {
      return NextResponse.json(
        { error: 'You are not a member of this family' },
        { status: 404 }
      );
    }

    if (userFamily.role !== 'head' && !userFamily.permissions.canManageMembers) {
      return NextResponse.json(
        { error: 'You do not have permission to invite members' },
        { status: 403 }
      );
    }

    // Find the family
    const family = await Family.findById(familyId);
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      );
    }

    // Generate unique invite code
    const inviteCode = randomBytes(8).toString('hex').toUpperCase();
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Deactivate old invite codes
    family.inviteCodes.forEach((code: any) => {
      code.isActive = false;
    });

    // Add new invite code
    family.inviteCodes.push({
      code: inviteCode,
      expiresAt: expiresAt,
      createdBy: user.userId,
      isActive: true
    });

    await family.save();

    return NextResponse.json({
      inviteCode,
      expiresAt,
      message: 'Invite code generated successfully'
    });
  } catch (error) {
    console.error('Error generating invite code:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to generate invite code' },
      { status: 500 }
    );
  }
}
