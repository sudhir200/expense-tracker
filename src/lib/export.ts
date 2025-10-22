import { Expense } from '@/types/expense';
import { formatCurrency, formatDate } from './utils';

export function exportToCSV(expenses: Expense[], filename: string = 'expenses.csv') {
  const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Method'];
  
  const csvContent = [
    headers.join(','),
    ...expenses.map(expense => [
      formatDate(expense.date),
      `"${expense.description}"`,
      expense.category,
      expense.amount.toFixed(2),
      expense.paymentMethod
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportToJSON(expenses: Expense[], filename: string = 'expenses.json') {
  const jsonContent = JSON.stringify(expenses, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function generateExpenseReport(expenses: Expense[]): string {
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const paymentMethodTotals = expenses.reduce((acc, expense) => {
    acc[expense.paymentMethod] = (acc[expense.paymentMethod] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const report = `
EXPENSE REPORT
Generated on: ${new Date().toLocaleDateString()}

SUMMARY
Total Expenses: ${formatCurrency(totalAmount)}
Number of Transactions: ${expenses.length}
Average Transaction: ${formatCurrency(totalAmount / expenses.length)}

BREAKDOWN BY CATEGORY
${Object.entries(categoryTotals)
  .sort(([,a], [,b]) => b - a)
  .map(([category, amount]) => `${category}: ${formatCurrency(amount)}`)
  .join('\n')}

BREAKDOWN BY PAYMENT METHOD
${Object.entries(paymentMethodTotals)
  .sort(([,a], [,b]) => b - a)
  .map(([method, amount]) => `${method}: ${formatCurrency(amount)}`)
  .join('\n')}

RECENT TRANSACTIONS
${expenses
  .slice(0, 10)
  .map(expense => `${formatDate(expense.date)} - ${expense.description} - ${formatCurrency(expense.amount)}`)
  .join('\n')}
  `;

  return report;
}
