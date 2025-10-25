import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Family from '@/models/Family';
import UserFamily from '@/models/UserFamily';
import { requireAuth } from '@/lib/auth';

// GET /api/families/[id] - Get family details
export async function GET(
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
        { status: 403 }
      );
    }

    // Get family details with populated member data
    const family = await Family.findById(familyId)
      .populate({
        path: 'members.userId',
        select: 'name email'
      });

    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      family,
      message: 'Family details retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching family details:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch family details' },
      { status: 500 }
    );
  }
}
