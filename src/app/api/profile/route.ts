import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);

    const userProfile = await User.findById(user.userId).select('-password');
    
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: userProfile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    const body = await request.json();
    
    const {
      name,
      email,
      phone,
      location,
      bio,
      jobTitle,
      avatar,
      preferences
    } = body;

    // Validation
    if (name && name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: user.userId }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already taken' },
          { status: 400 }
        );
      }
    }

    // Prepare update object
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (phone !== undefined) updateData.phone = phone;
    if (location !== undefined) updateData.location = location;
    if (bio !== undefined) updateData.bio = bio;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (preferences !== undefined) updateData.preferences = preferences;

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      updateData,
      { 
        new: true, 
        runValidators: true,
        select: '-password'
      }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
