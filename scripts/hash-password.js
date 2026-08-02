#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const password = process.argv[2];
if (!password) {
  console.error('ERROR: Please provide a password as an argument.');
  console.error("Usage: node scripts/hash-password.js 'YourPasswordHere'");
  process.exit(1);
}
const envSalt = process.env.PASSWORD_SALT;
let dotEnvSalt = null;
try {
  if (fs.existsSync(path.join(__dirname, '../.env'))) {
    const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
    const match = envContent.match(/PASSWORD_SALT=(.+)/);
    if (match && match[1]) {
      dotEnvSalt = match[1].trim();
    }
  }
} catch (err) {}
const salt = envSalt || dotEnvSalt || 'default-salt';
const hash = crypto
  .createHash('sha256')
  .update(password + salt)
  .digest('hex');
console.log(hash);
if (envSalt) {
  console.log('\nUsed salt from environment variable');
} else if (dotEnvSalt) {
  console.log('\nUsed salt from .env file');
} else {
  console.log(
    '\nWARNING: Used default salt. For better security, set PASSWORD_SALT environment variable.'
  );
  console.log('You can add PASSWORD_SALT to .env file or use:');
  console.log('  npx wrangler secret put PASSWORD_SALT');
}
