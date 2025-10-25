import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Expense from '@/models/Expense';
import Income from '@/models/Income';
import { requireRole } from '@/lib/auth';
import { convertCurrency } from '@/lib/currency';

// GET /api/admin/analytics - Get user-wise financial analytics (ADMIN and SUPERUSER)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Require ADMIN or higher role
    const currentUser = requireRole(request, 'ADMIN');

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const displayCurrency = searchParams.get('currency') || 'USD';

    const [year, monthNum] = month.split('-').map(Number);
    const startOfMonth = new Date(year, monthNum - 1, 1);
    const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999);

    // If userId is specified, get data for that user only
    if (userId) {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Check permissions - ADMIN can only view USER data
      if (currentUser.role === 'ADMIN' && user.role !== 'USER') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Get user's expenses and income for the month
      const expenses = await Expense.find({
        userId: userId,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });

      const incomes = await Income.find({
        userId: userId,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });

      // Calculate totals with currency conversion
      let totalExpenses = 0;
      let totalIncome = 0;

      expenses.forEach(expense => {
        const convertedAmount = convertCurrency(
          expense.amount,
          expense.currency as any,
          displayCurrency as any
        );
        totalExpenses += convertedAmount;
      });

      incomes.forEach(income => {
        const convertedAmount = convertCurrency(
          income.amount,
          income.currency as any,
          displayCurrency as any
        );
        totalIncome += convertedAmount;
      });

      const netIncome = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

      return NextResponse.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        analytics: {
          month,
          currency: displayCurrency,
          totalExpenses,
          totalIncome,
          netIncome,
          savingsRate,
          expenseCount: expenses.length,
          incomeCount: incomes.length,
        },
      });
    }

    // Get overview of all users (summary data)
    const userFilter: any = {};
    
    // ADMIN can only see USER accounts
    if (currentUser.role === 'ADMIN') {
      userFilter.role = 'USER';
    }

    const users = await User.find(userFilter).select('-password').lean();
    
    const userAnalytics = await Promise.all(
      users.map(async (user) => {
        const expenses = await Expense.find({
          userId: user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        });

        const incomes = await Income.find({
          userId: user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        });

        // Calculate totals with currency conversion
        let totalExpenses = 0;
        let totalIncome = 0;

        expenses.forEach(expense => {
          const convertedAmount = convertCurrency(
            expense.amount,
            expense.currency as any,
            displayCurrency as any
          );
          totalExpenses += convertedAmount;
        });

        incomes.forEach(income => {
          const convertedAmount = convertCurrency(
            income.amount,
            income.currency as any,
            displayCurrency as any
          );
          totalIncome += convertedAmount;
        });

        const netIncome = totalIncome - totalExpenses;

        return {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          },
          analytics: {
            totalExpenses,
            totalIncome,
            netIncome,
            expenseCount: expenses.length,
            incomeCount: incomes.length,
          },
        };
      })
    );

    // Calculate system totals
    const systemTotals = userAnalytics.reduce(
      (acc, userAnalytic) => {
        acc.totalExpenses += userAnalytic.analytics.totalExpenses;
        acc.totalIncome += userAnalytic.analytics.totalIncome;
        acc.totalUsers += 1;
        acc.totalTransactions += userAnalytic.analytics.expenseCount + userAnalytic.analytics.incomeCount;
        return acc;
      },
      { totalExpenses: 0, totalIncome: 0, totalUsers: 0, totalTransactions: 0 }
    );

    return NextResponse.json({
      month,
      currency: displayCurrency,
      systemTotals,
      userAnalytics,
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
