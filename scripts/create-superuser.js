#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// User schema (simplified version)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN', 'SUPERUSER'], default: 'USER' },
  defaultCurrency: { type: String, default: 'USD' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, ref: 'User', required: false },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function createSuperUser() {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in .env.local');
      console.log('📝 Please run: node setup-env.js first');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if any SUPERUSER already exists
    const existingSuperUser = await User.findOne({ role: 'SUPERUSER' });
    if (existingSuperUser) {
      console.log('⚠️  SUPERUSER already exists:', existingSuperUser.email);
      console.log('💡 Use this account to create other users');
      process.exit(0);
    }

    // Get user input
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (query) => new Promise(resolve => rl.question(query, resolve));

    console.log('\n🔐 Creating SUPERUSER account...\n');
    
    const name = await question('Enter full name: ');
    const email = await question('Enter email: ');
    const password = await question('Enter password (min 6 characters): ');
    const currency = await question('Default currency (USD): ') || 'USD';

    rl.close();

    // Validation
    if (!name || !email || !password) {
      console.error('❌ All fields are required');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.error('❌ User with this email already exists');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create SUPERUSER
    const superUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      role: 'SUPERUSER',
      defaultCurrency: currency.toUpperCase(),
      isActive: true,
    });

    await superUser.save();

    console.log('\n✅ SUPERUSER created successfully!');
    console.log('📧 Email:', superUser.email);
    console.log('👤 Name:', superUser.name);
    console.log('🔑 Role:', superUser.role);
    console.log('💰 Currency:', superUser.defaultCurrency);
    console.log('\n🚀 You can now login with these credentials');
    console.log('💡 Use this account to create ADMIN and USER accounts');

  } catch (error) {
    console.error('❌ Error creating SUPERUSER:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createSuperUser();
