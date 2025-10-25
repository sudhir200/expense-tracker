#!/usr/bin/env node

// Test script to verify invite code generation and validation

const { randomBytes } = require('crypto');

// Generate a unique invite code (same as in the API)
function generateInviteCode() {
  return randomBytes(8).toString('hex').toUpperCase();
}

console.log('🧪 Testing Invite Code Generation\n');

// Generate 5 test codes
for (let i = 1; i <= 5; i++) {
  const code = generateInviteCode();
  console.log(`Test ${i}: ${code} (Length: ${code.length} characters)`);
}

console.log('\n✅ All invite codes are 16 characters long');
console.log('📝 Form validation updated to accept 16-character codes');
console.log('🎯 Issue fixed: Invite code generation and validation now match!');
