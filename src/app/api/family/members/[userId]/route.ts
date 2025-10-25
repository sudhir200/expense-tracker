import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Family from '@/models/Family';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

// PUT /api/family/members/[userId] - Update family member role and permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    const { userId: targetUserId } = params;
    const body = await request.json();
    const { role, permissions } = body;

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

    // Check if user can manage family members
    if (!family.canManageFamily(user.userId)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to manage family members' },
        { status: 403 }
      );
    }

    // Check if target user is a family member
    const targetMemberIndex = family.members.findIndex(
      (member: any) => member.userId.toString() === targetUserId
    );

    if (targetMemberIndex === -1) {
      return NextResponse.json(
        { error: 'User is not a member of this family' },
        { status: 404 }
      );
    }

    // Prevent changing the family head's role (unless it's the head themselves)
    const targetMember = family.members[targetMemberIndex];
    const isChangingHead = targetMember.role === 'head';
    const isHeadChangingThemselves = user.userId === targetUserId;

    if (isChangingHead && !isHeadChangingThemselves) {
      return NextResponse.json(
        { error: 'Cannot change the role of the family head' },
        { status: 403 }
      );
    }

    // Prevent non-heads from promoting someone to head
    const isPromotingToHead = role === 'head';
    const isCurrentUserHead = family.isHead(user.userId);

    if (isPromotingToHead && !isCurrentUserHead) {
      return NextResponse.json(
        { error: 'Only the family head can promote someone to head' },
        { status: 403 }
      );
    }

    // If promoting someone to head, demote current head to adult
    if (isPromotingToHead && !isHeadChangingThemselves) {
      const currentHeadIndex = family.members.findIndex(
        (member: any) => member.role === 'head'
      );
      
      if (currentHeadIndex !== -1) {
        family.members[currentHeadIndex].role = 'adult';
        family.members[currentHeadIndex].permissions = {
          canViewFamilyIncome: true,
          canAddFamilyIncome: true,
          canViewFamilyExpenses: true,
          canAddFamilyExpenses: true,
          canManageMembers: false,
          canManageBudgets: false,
        };

        // Update the previous head's user record
        await User.findByIdAndUpdate(family.members[currentHeadIndex].userId, {
          familyRole: 'adult',
        });
      }
    }

    // Update target member's role and permissions
    if (role) {
      family.members[targetMemberIndex].role = role;
    }

    if (permissions) {
      family.members[targetMemberIndex].permissions = {
        ...family.members[targetMemberIndex].permissions,
        ...permissions,
      };
    }

    // Set default permissions based on role
    if (role === 'head') {
      family.members[targetMemberIndex].permissions = {
        canViewFamilyIncome: true,
        canAddFamilyIncome: true,
        canViewFamilyExpenses: true,
        canAddFamilyExpenses: true,
        canManageMembers: true,
        canManageBudgets: true,
      };
    } else if (role === 'child') {
      family.members[targetMemberIndex].permissions = {
        canViewFamilyIncome: false,
        canAddFamilyIncome: false,
        canViewFamilyExpenses: true,
        canAddFamilyExpenses: false,
        canManageMembers: false,
        canManageBudgets: false,
      };
    }

    await family.save();

    // Update user's family role in their user record
    if (role) {
      await User.findByIdAndUpdate(targetUserId, {
        familyRole: role,
      });
    }

    // Return updated family with populated member data
    const updatedFamily = await Family.findById(family._id)
      .populate('members.userId', 'name email avatar');

    return NextResponse.json({
      message: 'Family member updated successfully',
      family: updatedFamily,
    });
  } catch (error) {
    console.error('Error updating family member:', error);
    return NextResponse.json(
      { error: 'Failed to update family member' },
      { status: 500 }
    );
  }
}

// DELETE /api/family/members/[userId] - Remove family member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    const { userId: targetUserId } = params;

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

    // Check if user can manage family members
    if (!family.canManageFamily(user.userId)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to manage family members' },
        { status: 403 }
      );
    }

    // Check if target user is a family member
    const targetMemberIndex = family.members.findIndex(
      (member: any) => member.userId.toString() === targetUserId
    );

    if (targetMemberIndex === -1) {
      return NextResponse.json(
        { error: 'User is not a member of this family' },
        { status: 404 }
      );
    }

    // Prevent removing the family head
    const targetMember = family.members[targetMemberIndex];
    if (targetMember.role === 'head') {
      return NextResponse.json(
        { error: 'Cannot remove the family head. Transfer headship first.' },
        { status: 403 }
      );
    }

    // Remove member from family
    family.members.splice(targetMemberIndex, 1);
    await family.save();

    // Update user's family information
    await User.findByIdAndUpdate(targetUserId, {
      $unset: {
        familyId: 1,
        familyRole: 1,
      },
    });

    return NextResponse.json({
      message: 'Family member removed successfully',
    });
  } catch (error) {
    console.error('Error removing family member:', error);
    return NextResponse.json(
      { error: 'Failed to remove family member' },
      { status: 500 }
    );
  }
}
