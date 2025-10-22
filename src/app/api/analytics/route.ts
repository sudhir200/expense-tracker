import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Expense from '@/models/Expense';
import Budget from '@/models/Budget';
import { getStartOfMonth, getEndOfMonth } from '@/lib/utils';
import { DEFAULT_CATEGORY_COLORS } from '@/lib/chartConfig';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const [year, monthNum] = month.split('-').map(Number);
    const currentMonth = new Date(year, monthNum - 1);

    const startOfMonth = getStartOfMonth(currentMonth);
    const endOfMonth = getEndOfMonth(currentMonth);

    // Total expenses for current month
    const totalExpensesResult = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalExpenses = totalExpensesResult[0]?.total || 0;
    const expenseCount = totalExpensesResult[0]?.count || 0;

    // Category distribution
    const categoryDistribution = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
        },
      },
      {
        $sort: { amount: -1 },
      },
    ]);

    const categoryDistributionWithColors = categoryDistribution.map((item, index) => ({
      category: item._id,
      amount: item.amount,
      color: DEFAULT_CATEGORY_COLORS[item._id as keyof typeof DEFAULT_CATEGORY_COLORS] || 
             `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
    }));

    // Monthly comparison (last 6 months)
    const monthlyComparison = await Expense.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(year, monthNum - 7, 1),
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          amount: { $sum: '$amount' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    const monthlyComparisonFormatted = monthlyComparison.map((item) => ({
      month: new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      amount: item.amount,
    }));

    // Daily trend for current month
    const dailyTrend = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          amount: { $sum: '$amount' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const dailyTrendFormatted = dailyTrend.map((item) => ({
      date: item._id,
      amount: item.amount,
    }));

    // Top 5 spending categories
    const topCategories = categoryDistributionWithColors.slice(0, 5);

    // Recent transactions (last 10)
    const recentTransactions = await Expense.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Budget progress
    const budgets = await Budget.find({
      month: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const budgetProgress = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await Expense.aggregate([
          {
            $match: {
              category: budget.category,
              date: { $gte: startOfMonth, $lte: endOfMonth },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]);

        const spentAmount = spent[0]?.total || 0;
        const percentage = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;

        return {
          category: budget.category,
          spent: spentAmount,
          budget: budget.amount,
          percentage: Math.min(percentage, 100),
        };
      })
    );

    // Calculate monthly budget remaining
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const monthlyBudgetRemaining = totalBudget - totalExpenses;

    const analyticsData = {
      totalExpenses,
      monthlyBudgetRemaining,
      expenseCount,
      categoryDistribution: categoryDistributionWithColors,
      monthlyComparison: monthlyComparisonFormatted,
      dailyTrend: dailyTrendFormatted,
      topCategories,
      recentTransactions,
      budgetProgress,
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
