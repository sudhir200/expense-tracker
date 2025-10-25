#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expensetracker';

// User schema (simplified for script)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  defaultCurrency: { type: String, default: 'USD' },
  role: { type: String, enum: ['USER', 'ADMIN', 'SUPERUSER'], default: 'USER' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Category schema (simplified for script)
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, required: true },
  icon: { type: String },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

// Default categories
const DEFAULT_CATEGORIES = [
  { name: 'Groceries', color: '#FF6384', icon: '🛒', isDefault: true },
  { name: 'Transport', color: '#36A2EB', icon: '🚗', isDefault: true },
  { name: 'Entertainment', color: '#FFCE56', icon: '🎬', isDefault: true },
  { name: 'Utilities', color: '#4BC0C0', icon: '🏠', isDefault: true },
  { name: 'Healthcare', color: '#9966FF', icon: '🏥', isDefault: true },
  { name: 'Dining', color: '#FF9F40', icon: '🍽️', isDefault: true },
  { name: 'Shopping', color: '#FF6384', icon: '🛍️', isDefault: true },
  { name: 'Education', color: '#C9CBCF', icon: '📚', isDefault: true },
];

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function setupFreshDatabase() {
  try {
    console.log('🚀 Fresh Database Setup for Expense Tracker');
    console.log('============================================\n');

    // Ask for confirmation
    const confirm = await askQuestion('⚠️  This will DELETE ALL DATA in your database. Continue? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('❌ Setup cancelled.');
      process.exit(0);
    }

    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (collectionNames.length > 0) {
      console.log(`\n📋 Found ${collectionNames.length} collections to remove:`);
      collectionNames.forEach(name => console.log(`   - ${name}`));

      // Drop all collections
      console.log('\n🗑️  Removing all collections...');
      for (const collectionName of collectionNames) {
        try {
          await mongoose.connection.db.dropCollection(collectionName);
          console.log(`   ✅ Removed: ${collectionName}`);
        } catch (error) {
          if (!error.message.includes('ns not found')) {
            console.log(`   ❌ Error removing ${collectionName}:`, error.message);
          }
        }
      }
    } else {
      console.log('\n📋 Database is already empty');
    }

    // Create models
    const User = mongoose.model('User', UserSchema);
    const Category = mongoose.model('Category', CategorySchema);

    // Ask for super user details
    console.log('\n👤 Setting up Super User account...');
    const superUserName = await askQuestion('Enter Super User name (default: Super Admin): ') || 'Super Admin';
    const superUserEmail = await askQuestion('Enter Super User email (default: admin@expensetracker.com): ') || 'admin@expensetracker.com';
    const superUserPassword = await askQuestion('Enter Super User password (default: admin123): ') || 'admin123';

    // Create super user
    const hashedPassword = await bcrypt.hash(superUserPassword, 12);
    const superUser = new User({
      name: superUserName,
      email: superUserEmail,
      password: hashedPassword,
      role: 'SUPERUSER',
      defaultCurrency: 'USD',
      isActive: true
    });

    await superUser.save();
    console.log(`✅ Created SUPERUSER: ${superUserEmail}`);

    // Ask if they want a test user
    const createTestUser = await askQuestion('\nCreate a test user account? (yes/no): ');
    
    if (createTestUser.toLowerCase() === 'yes' || createTestUser.toLowerCase() === 'y') {
      const testUserPassword = await bcrypt.hash('test123', 12);
      const testUser = new User({
        name: 'Test User',
        email: 'test@expensetracker.com',
        password: testUserPassword,
        role: 'USER',
        defaultCurrency: 'USD',
        isActive: true
      });

      await testUser.save();
      console.log('✅ Created TEST USER: test@expensetracker.com');
    }

    // Create default categories
    console.log('\n🏷️  Creating default categories...');
    for (const categoryData of DEFAULT_CATEGORIES) {
      const category = new Category(categoryData);
      await category.save();
      console.log(`   ✅ ${categoryData.icon} ${categoryData.name}`);
    }

    console.log('\n🎉 Fresh database setup completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ SUPERUSER ACCOUNT                                       │');
    console.log(`│ Email: ${superUserEmail.padEnd(48)} │`);
    console.log(`│ Password: ${superUserPassword.padEnd(44)} │`);
    console.log('└─────────────────────────────────────────────────────────┘');

    if (createTestUser.toLowerCase() === 'yes' || createTestUser.toLowerCase() === 'y') {
      console.log('┌─────────────────────────────────────────────────────────┐');
      console.log('│ TEST USER ACCOUNT                                       │');
      console.log('│ Email: test@expensetracker.com                         │');
      console.log('│ Password: test123                                       │');
      console.log('└─────────────────────────────────────────────────────────┘');
    }

    console.log('\n🚀 Your expense tracker is ready to use!');
    console.log('   Start the app with: npm run dev');
    console.log('   Visit: http://localhost:3000');

  } catch (error) {
    console.error('\n❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Setup interrupted by user');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the setup
setupFreshDatabase();
