#!/usr/bin/env node
// scripts/hash-password.js - CORRECTED VERSION
// Generates a password hash that is compatible with the server's auth handler.

const crypto = require('crypto');

const password = process.argv[2];

if (!password) {
  console.error('ERROR: Please provide a password as an argument.');
  console.error("Usage: node scripts/hash-password.js 'YourPasswordHere'");
  process.exit(1);
}

// This salt MUST match the one used in src/handlers/auth.ts
const salt = 'default-salt';

// This logic now matches the server-side hashing logic exactly.
const hash = crypto.createHash('sha256').update(password + salt).digest('hex');

console.log(hash);
