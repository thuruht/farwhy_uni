#!/usr/bin/env node
// scripts/hash-password.js
// Utility to generate password hash for ADMIN_PASSWORD_HASH secret

const crypto = require('crypto');

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

if (process.argv.length < 3) {
  console.log('Usage: node scripts/hash-password.js <password>');
  process.exit(1);
}

const password = process.argv[2];

// Node.js version using built-in crypto
const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log('Hashed password:', hash);
console.log('');
console.log('Set this as a secret with:');
console.log(`echo "${hash}" | npx wrangler secret put ADMIN_PASSWORD_HASH`);
