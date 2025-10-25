import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

// GET /api/profile/notifications - Get notification preferences
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);

    const userRecord = await User.findById(user.userId).select('notificationPreferences');
    
    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Default notification preferences if not set
    const defaultPreferences = {
      emailNotifications: true,
      pushNotifications: false,
      weeklyReports: true,
      budgetAlerts: true,
      familyUpdates: true,
      expenseReminders: false,
    };

    const preferences = userRecord.notificationPreferences || defaultPreferences;

    return NextResponse.json({
      preferences
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/profile/notifications - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    const body = await request.json();
    
    const {
      emailNotifications,
      pushNotifications,
      weeklyReports,
      budgetAlerts,
      familyUpdates,
      expenseReminders,
    } = body;

    // Validate preferences (all should be boolean)
    const preferences = {
      emailNotifications: Boolean(emailNotifications),
      pushNotifications: Boolean(pushNotifications),
      weeklyReports: Boolean(weeklyReports),
      budgetAlerts: Boolean(budgetAlerts),
      familyUpdates: Boolean(familyUpdates),
      expenseReminders: Boolean(expenseReminders),
    };

    // Update user notification preferences
    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { 
        notificationPreferences: preferences,
        notificationPreferencesUpdatedAt: new Date()
      },
      { 
        new: true, 
        runValidators: true,
        select: 'notificationPreferences'
      }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Notification preferences updated successfully',
      preferences: updatedUser.notificationPreferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
