import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Category from '@/models/Category';
import { DEFAULT_CATEGORIES } from '@/lib/chartConfig';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Try to get user info, but don't require auth for getting categories
    let userId = null;
    try {
      const user = requireAuth(request);
      userId = user.userId;
    } catch (error) {
      // If auth fails, we'll show default categories only
    }

    // Get all categories, prioritizing default categories first
    const categories = await Category.find({})
      .sort({ isDefault: -1, name: 1 })
      .lean();

    // If no categories exist, initialize with default categories
    if (categories.length === 0 && userId) {
      const defaultCategoriesWithUserId = DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        userId: userId
      }));
      const defaultCategories = await Category.insertMany(defaultCategoriesWithUserId);
      return NextResponse.json(defaultCategories);
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Authenticate user
    const user = requireAuth(request);
    
    const body = await request.json();
    const { name, color, icon } = body;

    // Validation
    if (!name || !color) {
      return NextResponse.json(
        { error: 'Name and color are required' },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 400 }
      );
    }

    // Validate color format (hex color)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(color)) {
      return NextResponse.json(
        { error: 'Invalid color format. Please use hex color (e.g., #FF6384)' },
        { status: 400 }
      );
    }

    const category = new Category({
      userId: user.userId,
      name: name.trim(),
      color,
      icon: icon || '📦',
      isDefault: false,
    });

    await category.save();

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

// Initialize default categories endpoint
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    // Authenticate user
    const user = requireAuth(request);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'initialize') {
      // Check if default categories already exist
      const existingCategories = await Category.find({ isDefault: true });
      
      if (existingCategories.length === 0) {
        const defaultCategoriesWithUserId = DEFAULT_CATEGORIES.map(cat => ({
          ...cat,
          userId: user.userId
        }));
        const defaultCategories = await Category.insertMany(defaultCategoriesWithUserId);
        return NextResponse.json({
          message: 'Default categories initialized',
          categories: defaultCategories,
        });
      } else {
        return NextResponse.json({
          message: 'Default categories already exist',
          categories: existingCategories,
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error initializing categories:', error);
    return NextResponse.json(
      { error: 'Failed to initialize categories' },
      { status: 500 }
    );
  }
}
