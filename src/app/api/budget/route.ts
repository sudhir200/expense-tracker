import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Budget from '@/models/Budget';
import { getStartOfMonth } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const [year, monthNum] = month.split('-').map(Number);
    const currentMonth = new Date(year, monthNum - 1);
    const startOfMonth = getStartOfMonth(currentMonth);

    const budgets = await Budget.find({
      month: startOfMonth,
    }).lean();

    return NextResponse.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { category, amount, month } = body;

    // Validation
    if (!category || !amount || !month) {
      return NextResponse.json(
        { error: 'Category, amount, and month are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const budgetMonth = new Date(month);
    const startOfMonth = getStartOfMonth(budgetMonth);

    // Check if budget already exists for this category and month
    const existingBudget = await Budget.findOne({
      category,
      month: startOfMonth,
    });

    if (existingBudget) {
      // Update existing budget
      existingBudget.amount = parseFloat(amount);
      await existingBudget.save();
      return NextResponse.json(existingBudget);
    } else {
      // Create new budget
      const budget = new Budget({
        category,
        amount: parseFloat(amount),
        month: startOfMonth,
      });

      await budget.save();
      return NextResponse.json(budget, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating/updating budget:', error);
    return NextResponse.json(
      { error: 'Failed to create/update budget' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { budgets } = body;

    if (!Array.isArray(budgets)) {
      return NextResponse.json(
        { error: 'Budgets must be an array' },
        { status: 400 }
      );
    }

    const updatedBudgets = [];

    for (const budgetData of budgets) {
      const { category, amount, month } = budgetData;

      if (!category || !amount || !month) {
        continue; // Skip invalid entries
      }

      const budgetMonth = new Date(month);
      const startOfMonth = getStartOfMonth(budgetMonth);

      const existingBudget = await Budget.findOne({
        category,
        month: startOfMonth,
      });

      if (existingBudget) {
        existingBudget.amount = parseFloat(amount);
        await existingBudget.save();
        updatedBudgets.push(existingBudget);
      } else {
        const newBudget = new Budget({
          category,
          amount: parseFloat(amount),
          month: startOfMonth,
        });
        await newBudget.save();
        updatedBudgets.push(newBudget);
      }
    }

    return NextResponse.json({
      message: 'Budgets updated successfully',
      budgets: updatedBudgets,
    });
  } catch (error) {
    console.error('Error updating budgets:', error);
    return NextResponse.json(
      { error: 'Failed to update budgets' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const month = searchParams.get('month');

    if (!category || !month) {
      return NextResponse.json(
        { error: 'Category and month are required' },
        { status: 400 }
      );
    }

    const budgetMonth = new Date(month);
    const startOfMonth = getStartOfMonth(budgetMonth);

    const deletedBudget = await Budget.findOneAndDelete({
      category,
      month: startOfMonth,
    });

    if (!deletedBudget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    );
  }
}
