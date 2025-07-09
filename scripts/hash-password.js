#!/usr/bin/env node
// scripts/hash-password.js
// Generates a password hash that is compatible with the server's auth handler.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const password = process.argv[2];

if (!password) {
  console.error('ERROR: Please provide a password as an argument.');
  console.error("Usage: node scripts/hash-password.js 'YourPasswordHere'");
  process.exit(1);
}

// First try to load salt from environment or wrangler secret
const envSalt = process.env.PASSWORD_SALT;

// Next, try to read salt from .env file if it exists
let dotEnvSalt = null;
try {
  if (fs.existsSync(path.join(__dirname, '../.env'))) {
    const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
    const match = envContent.match(/PASSWORD_SALT=(.+)/);
    if (match && match[1]) {
      dotEnvSalt = match[1].trim();
    }
  }
} catch (err) {
  // Silently continue if .env file can't be read
}

// Finally, fall back to the default salt for backward compatibility
// This matches the value in src/handlers/auth.ts
const salt = envSalt || dotEnvSalt || 'default-salt';

// Hash the password using the same algorithm as the server
const hash = crypto.createHash('sha256').update(password + salt).digest('hex');

console.log(hash);

// Output information about which salt was used (without revealing the actual salt value)
if (envSalt) {
  console.log('\nUsed salt from environment variable');
} else if (dotEnvSalt) {
  console.log('\nUsed salt from .env file');
} else {
  console.log('\nWARNING: Used default salt. For better security, set PASSWORD_SALT environment variable.');
  console.log('You can add PASSWORD_SALT to .env file or use:');
  console.log('  npx wrangler secret put PASSWORD_SALT');
}