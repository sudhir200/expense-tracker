import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Expense from '@/models/Expense';
import Income from '@/models/Income';
import Budget from '@/models/Budget';
import Family from '@/models/Family';
import { requireAuth } from '@/lib/auth';

// GET /api/data/export - Export all user data
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json, csv
    const dataType = searchParams.get('type') || 'all'; // all, expenses, income, budgets

    // Get user profile
    const userProfile = await User.findById(user.userId).select('-password');
    
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const exportData: any = {
      exportedAt: new Date().toISOString(),
      user: {
        id: userProfile._id,
        name: userProfile.name,
        email: userProfile.email,
        defaultCurrency: userProfile.defaultCurrency,
        role: userProfile.role,
        createdAt: userProfile.createdAt,
        familyId: userProfile.familyId,
        familyRole: userProfile.familyRole,
      }
    };

    // Export expenses
    if (dataType === 'all' || dataType === 'expenses') {
      const expenses = await Expense.find({ userId: user.userId })
        .sort({ date: -1 })
        .lean();
      
      exportData.expenses = expenses.map(expense => ({
        id: expense._id,
        amount: expense.amount,
        currency: expense.currency,
        category: expense.category,
        description: expense.description,
        date: expense.date,
        paymentMethod: expense.paymentMethod,
        type: expense.type,
        familyId: expense.familyId,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      }));
    }

    // Export income
    if (dataType === 'all' || dataType === 'income') {
      const incomes = await Income.find({ userId: user.userId })
        .sort({ date: -1 })
        .lean();
      
      exportData.income = incomes.map(income => ({
        id: income._id,
        amount: income.amount,
        currency: income.currency,
        source: income.source,
        description: income.description,
        date: income.date,
        frequency: income.frequency,
        isRecurring: income.isRecurring,
        type: income.type,
        familyId: income.familyId,
        allocation: income.allocation,
        createdAt: income.createdAt,
        updatedAt: income.updatedAt,
      }));
    }

    // Export budgets
    if (dataType === 'all' || dataType === 'budgets') {
      const budgets = await Budget.find({ userId: user.userId })
        .sort({ month: -1 })
        .lean();
      
      exportData.budgets = budgets.map(budget => ({
        id: budget._id,
        category: budget.category,
        amount: budget.amount,
        spent: budget.spent,
        month: budget.month,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      }));
    }

    // Export family data (if user is part of a family)
    if ((dataType === 'all' || dataType === 'family') && userProfile.familyId) {
      const family = await Family.findById(userProfile.familyId)
        .populate('members.userId', 'name email')
        .lean();
      
      if (family) {
        const familyData = family as any;
        exportData.family = {
          id: familyData._id,
          name: familyData.name,
          description: familyData.description,
          currency: familyData.currency,
          memberCount: familyData.members.length,
          userRole: familyData.members.find((m: any) => m.userId._id.toString() === user.userId)?.role,
          joinedAt: familyData.members.find((m: any) => m.userId._id.toString() === user.userId)?.joinedAt,
          settings: familyData.settings,
        };
      }
    }

    // Add summary statistics
    exportData.summary = {
      totalExpenses: exportData.expenses?.length || 0,
      totalIncome: exportData.income?.length || 0,
      totalBudgets: exportData.budgets?.length || 0,
      totalExpenseAmount: exportData.expenses?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0,
      totalIncomeAmount: exportData.income?.reduce((sum: number, inc: any) => sum + inc.amount, 0) || 0,
      dateRange: {
        earliestExpense: exportData.expenses?.[exportData.expenses.length - 1]?.date,
        latestExpense: exportData.expenses?.[0]?.date,
        earliestIncome: exportData.income?.[exportData.income.length - 1]?.date,
        latestIncome: exportData.income?.[0]?.date,
      }
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(exportData, dataType);
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="expense-tracker-data-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Return JSON format
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="expense-tracker-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any, dataType: string): string {
  let csv = '';

  if (dataType === 'all' || dataType === 'expenses') {
    csv += 'EXPENSES\n';
    csv += 'ID,Amount,Currency,Category,Description,Date,Payment Method,Type,Created At\n';
    
    if (data.expenses) {
      data.expenses.forEach((expense: any) => {
        csv += `"${expense.id}","${expense.amount}","${expense.currency}","${expense.category}","${expense.description}","${expense.date}","${expense.paymentMethod}","${expense.type || 'personal'}","${expense.createdAt}"\n`;
      });
    }
    csv += '\n';
  }

  if (dataType === 'all' || dataType === 'income') {
    csv += 'INCOME\n';
    csv += 'ID,Amount,Currency,Source,Description,Date,Frequency,Is Recurring,Type,Created At\n';
    
    if (data.income) {
      data.income.forEach((income: any) => {
        csv += `"${income.id}","${income.amount}","${income.currency}","${income.source}","${income.description}","${income.date}","${income.frequency}","${income.isRecurring}","${income.type || 'personal'}","${income.createdAt}"\n`;
      });
    }
    csv += '\n';
  }

  if (dataType === 'all' || dataType === 'budgets') {
    csv += 'BUDGETS\n';
    csv += 'ID,Category,Amount,Spent,Month,Created At\n';
    
    if (data.budgets) {
      data.budgets.forEach((budget: any) => {
        csv += `"${budget.id}","${budget.category}","${budget.amount}","${budget.spent}","${budget.month}","${budget.createdAt}"\n`;
      });
    }
  }

  return csv;
}
