import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserFamily from '@/models/UserFamily';
import { requireAuth } from '@/lib/auth';

// GET /api/families/[id]/user-relationship - Get user's relationship to a specific family
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    const familyId = params.id;

    // Get user's relationship to this family
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

    return NextResponse.json({
      userFamily,
      message: 'User family relationship retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user family relationship:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch user family relationship' },
      { status: 500 }
    );
  }
}
