import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireRole } from '@/lib/auth';
import { canManageUser } from '@/lib/rbac';

// GET /api/admin/users/[id] - Get specific user details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Require ADMIN or higher role
    const currentUser = requireRole(request, 'ADMIN');

    const user = await User.findById(params.id).select('-password').lean();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if current user can view this user
    if (currentUser.role === 'ADMIN' && (user as any).role !== 'USER') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Transform user to ensure consistent ID format
    const { _id, ...userWithoutId } = user as any;
    const userWithId = {
      ...userWithoutId,
      id: _id.toString()
    };
    
    return NextResponse.json({ user: userWithId });
  } catch (error) {
    console.error('Error fetching user:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user (deactivate/activate, update role)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Require ADMIN or higher role
    const currentUser = requireRole(request, 'ADMIN');

    const body = await request.json();
    const { isActive, role, name, defaultCurrency } = body;

    const user = await User.findById(params.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if current user can manage this user
    if (!canManageUser(currentUser.role, user.role)) {
      return NextResponse.json(
        { error: 'You cannot manage this user' },
        { status: 403 }
      );
    }

    // Update allowed fields
    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (defaultCurrency) {
      user.defaultCurrency = defaultCurrency;
    }

    // Role changes (only SUPERUSER can change roles)
    if (role && currentUser.role === 'SUPERUSER') {
      if (['USER', 'ADMIN'].includes(role)) {
        user.role = role;
      }
    }

    await user.save();

    // Return updated user data (without password)
    const userData = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      defaultCurrency: user.defaultCurrency,
      isActive: user.isActive,
      createdBy: user.createdBy,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({
      message: 'User updated successfully',
      user: userData,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user (SUPERUSER only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Require SUPERUSER role for deletion
    const currentUser = requireRole(request, 'SUPERUSER');

    const user = await User.findById(params.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Cannot delete SUPERUSER accounts
    if (user.role === 'SUPERUSER') {
      return NextResponse.json(
        { error: 'Cannot delete SUPERUSER accounts' },
        { status: 403 }
      );
    }

    // Cannot delete yourself
    if (user._id.toString() === currentUser.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      );
    }

    await User.findByIdAndDelete(params.id);

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
