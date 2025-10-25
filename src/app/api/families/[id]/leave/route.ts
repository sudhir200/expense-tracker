import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Family from '@/models/Family';
import UserFamily from '@/models/UserFamily';
import { requireAuth } from '@/lib/auth';

// DELETE /api/families/[id]/leave - Leave a family
export async function DELETE(
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

    // Check if user is the family head
    if (userFamily.role === 'head') {
      // Check if there are other members
      const otherMembers = await UserFamily.countDocuments({
        familyId: familyId,
        userId: { $ne: user.userId },
        isActive: true
      });

      if (otherMembers > 0) {
        return NextResponse.json(
          { error: 'Family head cannot leave while there are other members. Transfer headship first or remove all members.' },
          { status: 400 }
        );
      }
    }

    // Remove user from family members array
    const family = await Family.findById(familyId);
    if (family) {
      family.members = family.members.filter(
        (member: any) => member.userId.toString() !== user.userId
      );
      await family.save();
    }

    // Deactivate UserFamily relationship
    userFamily.isActive = false;
    await userFamily.save();

    // If this was the primary family, set another family as primary
    if (userFamily.isPrimary) {
      const nextFamily = await UserFamily.findOne({
        userId: user.userId,
        isActive: true,
        _id: { $ne: userFamily._id }
      });

      if (nextFamily) {
        nextFamily.isPrimary = true;
        await nextFamily.save();
      }
    }

    return NextResponse.json({
      message: 'Successfully left the family'
    });
  } catch (error) {
    console.error('Error leaving family:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to leave family' },
      { status: 500 }
    );
  }
}
