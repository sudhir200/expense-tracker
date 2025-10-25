#!/usr/bin/env node

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found');
    console.log('📝 Please run: node setup-env.js first');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
}

loadEnv();

// Define schemas (simplified versions)
const ExpenseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
}, { timestamps: true });

const IncomeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  source: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  frequency: { type: String, required: true },
  isRecurring: { type: Boolean, default: false },
}, { timestamps: true });

const BudgetSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  period: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
}, { timestamps: true });

const Expense = mongoose.model('Expense', ExpenseSchema);
const Income = mongoose.model('Income', IncomeSchema);
const Budget = mongoose.model('Budget', BudgetSchema);

async function clearData() {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in .env.local');
      console.log('📝 Please run: node setup-env.js first');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get confirmation from user
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (query) => new Promise(resolve => rl.question(query, resolve));

    console.log('\n⚠️  WARNING: This will delete ALL financial data!');
    console.log('📊 This includes:');
    console.log('   • All expense records');
    console.log('   • All income records');
    console.log('   • All budget records');
    console.log('   • Analytics will be reset');
    console.log('   • Dashboard will show no data');
    console.log('\n🔒 User accounts will NOT be affected');

    const confirmation = await question('\nAre you sure you want to continue? Type "DELETE ALL DATA" to confirm: ');
    
    rl.close();

    if (confirmation !== 'DELETE ALL DATA') {
      console.log('❌ Operation cancelled');
      process.exit(0);
    }

    console.log('\n🗑️  Starting data deletion...');

    // Get counts before deletion
    const expenseCount = await Expense.countDocuments();
    const incomeCount = await Income.countDocuments();
    const budgetCount = await Budget.countDocuments();

    console.log(`📊 Found ${expenseCount} expenses, ${incomeCount} income records, ${budgetCount} budgets`);

    // Delete all data
    const expenseResult = await Expense.deleteMany({});
    const incomeResult = await Income.deleteMany({});
    const budgetResult = await Budget.deleteMany({});

    console.log('\n✅ Data deletion completed!');
    console.log(`🗑️  Deleted ${expenseResult.deletedCount} expense records`);
    console.log(`🗑️  Deleted ${incomeResult.deletedCount} income records`);
    console.log(`🗑️  Deleted ${budgetResult.deletedCount} budget records`);

    console.log('\n🎯 Results:');
    console.log('   • Dashboard will now show empty state');
    console.log('   • Analytics will show no data');
    console.log('   • All expense/income lists will be empty');
    console.log('   • User accounts remain intact');

    console.log('\n🚀 You can now start fresh with new data!');

  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearData();
