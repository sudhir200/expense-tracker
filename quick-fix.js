#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create .env.local with a working local MongoDB connection
const envContent = `# MongoDB Connection String
# Option 1: Local MongoDB (recommended for development)
MONGODB_URI=mongodb://127.0.0.1:27017/expense-tracker

# Option 2: If you have MongoDB Atlas, replace with your connection string:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker

# Note: If you don't have MongoDB installed locally, you can:
# 1. Install MongoDB: brew install mongodb-community (macOS)
# 2. Start MongoDB: brew services start mongodb-community
# 3. Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas
`;

const envPath = path.join(__dirname, '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env.local with local MongoDB connection');
  console.log('');
  console.log('🔧 To fix the database connection:');
  console.log('');
  console.log('Option 1 - Install MongoDB locally:');
  console.log('  brew install mongodb-community');
  console.log('  brew services start mongodb-community');
  console.log('');
  console.log('Option 2 - Use MongoDB Atlas (cloud):');
  console.log('  1. Go to https://www.mongodb.com/atlas');
  console.log('  2. Create free account and cluster');
  console.log('  3. Get connection string');
  console.log('  4. Replace MONGODB_URI in .env.local');
  console.log('');
  console.log('🚀 The app is running at: http://localhost:3000');
  console.log('📊 UI styling should now work properly!');
} catch (error) {
  console.log('⚠️  Please manually update .env.local');
}
