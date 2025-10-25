import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireRole, hashPassword } from '@/lib/auth';
import { canCreateUserWithRole } from '@/lib/rbac';

// GET /api/admin/users - List all users (ADMIN and SUPERUSER only)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Require ADMIN or higher role
    const currentUser = requireRole(request, 'ADMIN');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    
    // Role filter
    if (role && ['USER', 'ADMIN', 'SUPERUSER'].includes(role)) {
      filter.role = role;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // If current user is ADMIN, only show USER accounts
    if (currentUser.role === 'ADMIN') {
      filter.role = 'USER';
    }

    // Get users (exclude password)
    const usersData = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform users to ensure consistent ID format
    const users = usersData.map((user: any) => {
      const { _id, ...userWithoutId } = user;
      return {
        ...userWithoutId,
        id: _id.toString()
      };
    });

    // Get total count
    const total = await User.countDocuments(filter);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user (ADMIN can create USER, SUPERUSER can create ADMIN/USER)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Require ADMIN or higher role
    const currentUser = requireRole(request, 'ADMIN');

    const body = await request.json();
    const { email, password, name, role = 'USER', defaultCurrency = 'USD' } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if current user can create user with specified role
    if (!canCreateUserWithRole(currentUser.role, role)) {
      return NextResponse.json(
        { error: `You cannot create users with role: ${role}` },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      role,
      defaultCurrency,
      createdBy: currentUser.userId,
    });

    await user.save();

    // Return user data (without password)
    const userData = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      defaultCurrency: user.defaultCurrency,
      isActive: user.isActive,
      createdBy: user.createdBy,
      createdAt: user.createdAt,
    };

    return NextResponse.json({
      message: 'User created successfully',
      user: userData,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
