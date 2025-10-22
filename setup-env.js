#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envContent = `# MongoDB Connection String
# For local MongoDB (install MongoDB locally first):
MONGODB_URI=mongodb://localhost:27017/expense-tracker

# For MongoDB Atlas (replace with your connection string):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker

# Note: Make sure to:
# 1. Install MongoDB locally OR create a MongoDB Atlas account
# 2. Replace the connection string above with your actual MongoDB URI
# 3. Restart the development server after creating this file
`;

const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
  console.log('📝 Please edit .env.local with your MongoDB connection string');
  console.log('🔄 Then restart the development server with: npm run dev');
} else {
  console.log('⚠️  .env.local already exists');
}
