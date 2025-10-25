#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const registerPath = path.join(__dirname, '../src/app/api/auth/register/route.ts');

console.log('🔧 Temporarily modifying registration to allow first SUPERUSER...');

// Read the current registration file
let content = fs.readFileSync(registerPath, 'utf8');

// Add logic to make first user a SUPERUSER
const modifiedContent = content.replace(
  'const { email, password, name, defaultCurrency = \'USD\' } = body;',
  `const { email, password, name, defaultCurrency = 'USD', role } = body;

    // Check if this is the first user (make them SUPERUSER)
    const userCount = await User.countDocuments();
    const userRole = userCount === 0 ? 'SUPERUSER' : (role || 'USER');`
).replace(
  'const user = new User({',
  `const user = new User({`
).replace(
  'name: name.trim(),\n      defaultCurrency,',
  `name: name.trim(),
      role: userRole,
      defaultCurrency,`
);

// Write the modified content
fs.writeFileSync(registerPath, modifiedContent);

console.log('✅ Registration modified - first user will be SUPERUSER');
console.log('📝 Register your first account through the UI');
console.log('⚠️  Remember to run: node scripts/restore-registration.js after creating your account');

// Create restore script
const restoreScript = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const registerPath = path.join(__dirname, '../src/app/api/auth/register/route.ts');

console.log('🔄 Restoring original registration logic...');

// This will restore the original registration logic
// You should run this after creating your first SUPERUSER account

let content = fs.readFileSync(registerPath, 'utf8');

// Remove the first user logic
content = content.replace(
  /const \\{ email, password, name, defaultCurrency = 'USD', role \\} = body;[\\s\\S]*?const userRole = userCount === 0 \\? 'SUPERUSER' : \\(role \\|\\| 'USER'\\);/,
  "const { email, password, name, defaultCurrency = 'USD' } = body;"
).replace(
  /role: userRole,\\s*/,
  ''
);

fs.writeFileSync(registerPath, content);
console.log('✅ Registration restored to normal behavior');
`;

fs.writeFileSync(path.join(__dirname, 'restore-registration.js'), restoreScript);
fs.chmodSync(path.join(__dirname, 'restore-registration.js'), '755');

console.log('📄 Created restore script: scripts/restore-registration.js');
