import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Category from '@/models/Category';
import Expense from '@/models/Expense';

// GET /api/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const category = await Category.findById(params.id);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, color, icon } = body;

    // Validation
    if (!name || !color) {
      return NextResponse.json(
        { error: 'Name and color are required' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await Category.findById(params.id);
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if another category with the same name exists (excluding current category)
    const duplicateCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: params.id }
    });

    if (duplicateCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
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

    // Prevent editing default categories' core properties
    if (existingCategory.isDefault) {
      return NextResponse.json(
        { error: 'Cannot modify default categories' },
        { status: 400 }
      );
    }

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      params.id,
      {
        name: name.trim(),
        color,
        icon: icon || '📦',
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Check if category exists
    const category = await Category.findById(params.id);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Prevent deleting default categories
    if (category.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default categories' },
        { status: 400 }
      );
    }

    // Check if category is being used by any expenses
    const expenseCount = await Expense.countDocuments({ category: category.name });
    
    if (expenseCount > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete category. It is being used by ${expenseCount} expense(s). Please reassign those expenses to another category first.` 
        },
        { status: 400 }
      );
    }

    // Delete the category
    await Category.findByIdAndDelete(params.id);

    return NextResponse.json({ 
      message: 'Category deleted successfully',
      deletedCategory: category 
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
