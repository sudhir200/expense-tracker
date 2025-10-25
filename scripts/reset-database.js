const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// Super users to create
const SUPER_USERS = [
  {
    name: 'Super Admin',
    email: 'admin@expensetracker.com',
    password: 'admin123',
    role: 'SUPERUSER',
    defaultCurrency: 'USD'
  },
  {
    name: 'Test User',
    email: 'test@expensetracker.com', 
    password: 'test123',
    role: 'USER',
    defaultCurrency: 'USD'
  }
];

async function resetDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log(`📋 Found ${collectionNames.length} collections:`, collectionNames);

    // Drop all collections
    console.log('🗑️  Dropping all collections...');
    for (const collectionName of collectionNames) {
      try {
        await mongoose.connection.db.dropCollection(collectionName);
        console.log(`   ✅ Dropped: ${collectionName}`);
      } catch (error) {
        if (error.message.includes('ns not found')) {
          console.log(`   ⚠️  Collection ${collectionName} doesn't exist, skipping`);
        } else {
          console.log(`   ❌ Error dropping ${collectionName}:`, error.message);
        }
      }
    }

    // Create models
    const User = mongoose.model('User', UserSchema);
    const Category = mongoose.model('Category', CategorySchema);

    // Create super users
    console.log('👤 Creating super users...');
    for (const userData of SUPER_USERS) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await user.save();
      console.log(`   ✅ Created ${userData.role}: ${userData.email} (password: ${userData.password})`);
    }

    // Create default categories
    console.log('🏷️  Creating default categories...');
    for (const categoryData of DEFAULT_CATEGORIES) {
      const category = new Category(categoryData);
      await category.save();
      console.log(`   ✅ Created category: ${categoryData.icon} ${categoryData.name}`);
    }

    console.log('\n🎉 Database reset completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ SUPERUSER                                               │');
    console.log('│ Email: admin@expensetracker.com                        │');
    console.log('│ Password: admin123                                      │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ TEST USER                                               │');
    console.log('│ Email: test@expensetracker.com                         │');
    console.log('│ Password: test123                                       │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('\n🚀 You can now start using the application with fresh data!');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the reset
resetDatabase();
