import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Family from '@/models/Family';
import { requireAuth } from '@/lib/auth';

// GET /api/family/check-user - Check user's family status and fix if needed
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    
    // Get user document
    const userDoc = await User.findById(user.userId);
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has familyId
    if (userDoc.familyId) {
      // Verify the family still exists
      const family = await Family.findById(userDoc.familyId);
      if (family) {
        return NextResponse.json({
          status: 'OK',
          message: 'User is properly assigned to a family',
          familyId: userDoc.familyId,
          familyName: family.name,
          userRole: userDoc.familyRole || 'member'
        });
      } else {
        // Family doesn't exist, clear the familyId
        await User.findByIdAndUpdate(user.userId, {
          $unset: { familyId: 1, familyRole: 1 }
        });
        
        return NextResponse.json({
          status: 'FIXED',
          message: 'Removed reference to non-existent family',
          action: 'cleared_invalid_family_reference'
        });
      }
    }

    // User has no familyId, check if they should be in a family
    // Look for families where this user is a member
    const familiesWithUser = await Family.find({
      'members.userId': user.userId
    });

    if (familiesWithUser.length > 0) {
      // User is in a family but their user document doesn't reflect it
      const family = familiesWithUser[0]; // Take the first one
      const member = family.members.find((m: any) => m.userId.toString() === user.userId);
      
      // Update user document
      await User.findByIdAndUpdate(user.userId, {
        familyId: family._id,
        familyRole: member?.role || 'member'
      });

      return NextResponse.json({
        status: 'FIXED',
        message: 'Updated user document with correct family assignment',
        familyId: family._id,
        familyName: family.name,
        userRole: member?.role || 'member',
        action: 'updated_user_family_reference'
      });
    }

    // Check if any families exist
    const familyCount = await Family.countDocuments();
    
    return NextResponse.json({
      status: 'NO_FAMILY',
      message: familyCount === 0 
        ? 'No families exist yet. Create a family first.'
        : 'User is not part of any family. Join or create a family.',
      familyCount,
      suggestion: familyCount === 0 
        ? 'Go to Family page and create a new family'
        : 'Go to Family page and join an existing family or create a new one'
    });

  } catch (error) {
    console.error('Error checking user family status:', error);
    return NextResponse.json(
      { error: 'Failed to check user family status' },
      { status: 500 }
    );
  }
}

// POST /api/family/check-user - Force fix user family assignment
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    const body = await request.json();
    const { action } = body;

    if (action === 'auto_assign') {
      // Auto-assign user to the first available family
      const firstFamily = await Family.findOne();
      
      if (!firstFamily) {
        return NextResponse.json(
          { error: 'No families available for auto-assignment' },
          { status: 404 }
        );
      }

      // Add user to the family as a member
      const userDoc = await User.findById(user.userId);
      if (!userDoc) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Check if user is already in the family
      const existingMember = firstFamily.members.find(
        (m: any) => m.userId.toString() === user.userId
      );

      if (!existingMember) {
        // Add user to family members
        firstFamily.members.push({
          userId: user.userId,
          name: userDoc.name,
          email: userDoc.email,
          role: 'member',
          joinedAt: new Date(),
          permissions: {
            canViewExpenses: true,
            canAddPersonalExpenses: true,
            canAddFamilyExpenses: true,
            canManageMembers: false,
            canManageBudgets: false,
          },
        });
        
        await firstFamily.save();
      }

      // Update user document
      await User.findByIdAndUpdate(user.userId, {
        familyId: firstFamily._id,
        familyRole: existingMember?.role || 'member'
      });

      return NextResponse.json({
        status: 'SUCCESS',
        message: 'User successfully assigned to family',
        familyId: firstFamily._id,
        familyName: firstFamily.name,
        userRole: existingMember?.role || 'member'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error fixing user family assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fix user family assignment' },
      { status: 500 }
    );
  }
}
