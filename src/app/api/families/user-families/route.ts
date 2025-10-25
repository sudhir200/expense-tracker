import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserFamily from '@/models/UserFamily';
import { requireAuth } from '@/lib/auth';

// GET /api/families/user-families - Get all families for the current user
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);

    // Get all families for this user with populated family data
    const userFamilies = await UserFamily.find({ 
      userId: user.userId, 
      isActive: true 
    })
    .populate({
      path: 'familyId',
      select: 'name description currency createdBy members createdAt',
      populate: {
        path: 'members.userId',
        select: 'name email'
      }
    })
    .sort({ isPrimary: -1, joinedAt: -1 }); // Primary family first, then by join date

    return NextResponse.json({
      families: userFamilies,
      count: userFamilies.length
    });
  } catch (error) {
    console.error('Error fetching user families:', error);
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
