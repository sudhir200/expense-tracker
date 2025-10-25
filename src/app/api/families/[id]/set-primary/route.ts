import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserFamily from '@/models/UserFamily';
import { requireAuth } from '@/lib/auth';

// PUT /api/families/[id]/set-primary - Set a family as primary
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    const familyId = params.id;

    // Check if user is a member of this family
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

    // Remove primary flag from all other families for this user
    await UserFamily.updateMany(
      { userId: user.userId, _id: { $ne: userFamily._id } },
      { isPrimary: false }
    );

    // Set this family as primary
    userFamily.isPrimary = true;
    await userFamily.save();

    return NextResponse.json({
      message: 'Primary family updated successfully',
      userFamily
    });
  } catch (error) {
    console.error('Error setting primary family:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to set primary family' },
      { status: 500 }
    );
  }
}
