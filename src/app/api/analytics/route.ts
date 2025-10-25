import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Expense from '@/models/Expense';
import Budget from '@/models/Budget';
import Income from '@/models/Income';
import { getStartOfMonth, getEndOfMonth } from '@/lib/utils';
import { DEFAULT_CATEGORY_COLORS } from '@/lib/chartConfig';
import { requireAuth, requirePermission } from '@/lib/auth';
import { convertCurrency } from '@/lib/currency';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Require authentication and expense read permission
    const user = requirePermission(request, 'expense', 'read_own');

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const displayCurrency = searchParams.get('currency') || 'USD'; // Get preferred currency
    const [year, monthNum] = month.split('-').map(Number);
    const currentMonth = new Date(year, monthNum - 1);

    const startOfMonth = getStartOfMonth(currentMonth);
    const endOfMonth = getEndOfMonth(currentMonth);

    // Get all expenses for current month (need individual records for currency conversion)
    const expenses = await Expense.find({
      userId: user.userId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Calculate total expenses with currency conversion
    let totalExpenses = 0;
    expenses.forEach(expense => {
      const convertedAmount = convertCurrency(
        expense.amount,
        expense.currency as any,
        displayCurrency as any
      );
      totalExpenses += convertedAmount;
    });

    const expenseCount = expenses.length;

    // Get all income for current month (need individual records for currency conversion)
    const incomes = await Income.find({
      userId: user.userId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Calculate total income with currency conversion
    let totalIncome = 0;
    incomes.forEach(income => {
      const convertedAmount = convertCurrency(
        income.amount,
        income.currency as any,
        displayCurrency as any
      );
      totalIncome += convertedAmount;
    });

    const incomeCount = incomes.length;

    // Category distribution with currency conversion
    const categoryMap = new Map<string, number>();
    expenses.forEach(expense => {
      const convertedAmount = convertCurrency(
        expense.amount,
        expense.currency as any,
        displayCurrency as any
      );
      const currentAmount = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, currentAmount + convertedAmount);
    });

    const categoryDistributionWithColors = Array.from(categoryMap.entries())
      .map(([category, amount], index) => ({
        category,
        amount,
        color: DEFAULT_CATEGORY_COLORS[category as keyof typeof DEFAULT_CATEGORY_COLORS] || 
               `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
      }))
      .sort((a, b) => b.amount - a.amount);

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

    // Income source distribution
    const incomeSourceDistribution = await Income.aggregate([
      {
        $match: {
          userId: user.userId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$source',
          amount: { $sum: '$amount' },
        },
      },
      {
        $sort: { amount: -1 },
      },
    ]);

    const incomeSourceDistributionWithColors = incomeSourceDistribution.map((item, index) => ({
      source: item._id,
      amount: item.amount,
      color: `hsl(${(index * 137.5 + 180) % 360}, 70%, 50%)`, // Different hue range for income
    }));

    // Recent transactions (last 10 expenses)
    const recentTransactions = await Expense.find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Recent income (last 5)
    const recentIncome = await Income.find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Budget progress
    const budgets = await Budget.find({
      userId: user.userId,
      month: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const budgetProgress = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await Expense.aggregate([
          {
            $match: {
              userId: user.userId,
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

    // Calculate monthly budget remaining and net income
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const monthlyBudgetRemaining = totalBudget - totalExpenses;
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    const analyticsData = {
      // Expense data
      totalExpenses,
      expenseCount,
      categoryDistribution: categoryDistributionWithColors,
      topCategories,
      recentTransactions,
      
      // Income data
      totalIncome,
      incomeCount,
      incomeSourceDistribution: incomeSourceDistributionWithColors,
      recentIncome,
      
      // Combined metrics
      netIncome,
      savingsRate,
      monthlyBudgetRemaining,
      
      // Trends
      monthlyComparison: monthlyComparisonFormatted,
      dailyTrend: dailyTrendFormatted,
      
      // Budget
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
