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

// Define schemas
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN', 'SUPERUSER'], default: 'USER' },
  defaultCurrency: { type: String, default: 'USD' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

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

const User = mongoose.model('User', UserSchema);
const Expense = mongoose.model('Expense', ExpenseSchema);
const Income = mongoose.model('Income', IncomeSchema);
const Budget = mongoose.model('Budget', BudgetSchema);

async function clearUserData() {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in .env.local');
      console.log('📝 Please run: node setup-env.js first');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get user input
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (query) => new Promise(resolve => rl.question(query, resolve));

    console.log('\n📊 Clear User Financial Data');
    console.log('Choose an option:');
    console.log('1. Clear data for specific user (by email)');
    console.log('2. Clear data for all users');
    console.log('3. List users and their data counts');
    console.log('4. Exit');

    const choice = await question('\nEnter your choice (1-4): ');

    if (choice === '4') {
      console.log('👋 Goodbye!');
      rl.close();
      process.exit(0);
    }

    if (choice === '3') {
      // List users and their data
      const users = await User.find({}).select('_id email name role');
      
      console.log('\n👥 Users and their data:');
      console.log('━'.repeat(80));
      
      for (const user of users) {
        const expenseCount = await Expense.countDocuments({ userId: user._id.toString() });
        const incomeCount = await Income.countDocuments({ userId: user._id.toString() });
        const budgetCount = await Budget.countDocuments({ userId: user._id.toString() });
        
        console.log(`📧 ${user.email} (${user.name}) - ${user.role}`);
        console.log(`   💰 ${expenseCount} expenses, ${incomeCount} income, ${budgetCount} budgets`);
        console.log('');
      }
      
      rl.close();
      process.exit(0);
    }

    let targetUserId = null;
    let targetUserEmail = '';

    if (choice === '1') {
      // Clear data for specific user
      const email = await question('Enter user email: ');
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        console.log('❌ User not found');
        rl.close();
        process.exit(1);
      }
      
      targetUserId = user._id.toString();
      targetUserEmail = user.email;
      
      console.log(`\n👤 Found user: ${user.name} (${user.email}) - ${user.role}`);
      
    } else if (choice === '2') {
      // Clear data for all users
      console.log('\n⚠️  This will clear financial data for ALL users');
    } else {
      console.log('❌ Invalid choice');
      rl.close();
      process.exit(1);
    }

    // Get counts before deletion
    const query = targetUserId ? { userId: targetUserId } : {};
    const expenseCount = await Expense.countDocuments(query);
    const incomeCount = await Income.countDocuments(query);
    const budgetCount = await Budget.countDocuments(query);

    console.log(`\n📊 Data to be deleted:`);
    console.log(`   💸 ${expenseCount} expense records`);
    console.log(`   💰 ${incomeCount} income records`);
    console.log(`   📋 ${budgetCount} budget records`);

    if (targetUserId) {
      console.log(`\n🎯 Target: ${targetUserEmail}`);
    } else {
      console.log(`\n🎯 Target: ALL USERS`);
    }

    const confirmation = await question('\nType "CONFIRM DELETE" to proceed: ');
    rl.close();

    if (confirmation !== 'CONFIRM DELETE') {
      console.log('❌ Operation cancelled');
      process.exit(0);
    }

    console.log('\n🗑️  Deleting data...');

    // Delete data
    const expenseResult = await Expense.deleteMany(query);
    const incomeResult = await Income.deleteMany(query);
    const budgetResult = await Budget.deleteMany(query);

    console.log('\n✅ Data deletion completed!');
    console.log(`🗑️  Deleted ${expenseResult.deletedCount} expense records`);
    console.log(`🗑️  Deleted ${incomeResult.deletedCount} income records`);
    console.log(`🗑️  Deleted ${budgetResult.deletedCount} budget records`);

    if (targetUserId) {
      console.log(`\n🎯 Cleared data for: ${targetUserEmail}`);
    } else {
      console.log(`\n🎯 Cleared data for: ALL USERS`);
    }

    console.log('\n🚀 Dashboard and analytics will now show clean data!');

  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearUserData();
